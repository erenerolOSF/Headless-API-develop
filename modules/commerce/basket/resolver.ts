/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from "cookies";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { GraphQLContext, GraphQLDataSources } from "../../../types";
import { CommerceError } from "../errors";
import { Basket, getProductsFromOrderRes } from "./types";
import Dinero, { Currency } from "dinero.js";
import { calculateProductPrice } from "../product/resolver";
import { keysToCamel } from "./utils";
import { parseProductHit } from "../category/resolver";

export function toPrice(amount: number, currency: Currency, factor = Math.pow(10, 2)) {
    return Dinero({ amount: Math.round(amount * factor), currency });
}

@Resolver()
export class BasketResolver {
    @Mutation(() => Basket)
    async addToBasket(
        @Arg("productId") productId: string,
        @Arg("quantity") quantity: number,
        @Arg("siteId") siteId: string,
        @Arg("locale") locale: string,
        @Arg("ingredients") ingredients: string,
        @Arg("minOrderQty", { nullable: true }) minOrderQty: number,
        @Arg("maxOrderQty", { nullable: true }) maxOrderQty: number,
        @Ctx() { req, res, dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Basket> {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const selectedStoreId = cookies.get("session.selectedStoreId", { signed: true });

        if (!selectedStoreId) {
            throw new CommerceError("No store selected.", "NO_STORE_SELECTED");
        }

        const inventoryId = `${selectedStoreId}-inventory`;
        const priceBookId = `pricebook-${selectedStoreId}`;

        const product = await dataSources.CommerceAPIDataSource.getProduct(
            siteId,
            productId,
            user.accessToken,
            locale,
            inventoryId
        );

        /**
         *
         * Validating each ingredient
         * Get the initial ingredient groups that were configured in BM
         * Then compare them with the ones that were passed in the request by client side.
         * Client side sends the ingredient groups in the request which means the JSON could be modified by the client.
         */

        const serverSideIngredientGroups = product.c_ingredientGroups
            ? JSON.parse(product.c_ingredientGroups)
            : null;

        // we may have a product without ingredients like a beverage - no validation required
        if (serverSideIngredientGroups) {
            const serverSideIngredients = serverSideIngredientGroups.reduce((acc: any, group: any) => {
                return [...acc, ...group.items];
            }, []);

            const clientSideIngredients = JSON.parse(ingredients);

            const isValidIngredients = clientSideIngredients.every((ingredient: any) => {
                const serverSideIngredient = serverSideIngredients.find(
                    (serverSideIngredient: any) => serverSideIngredient.id === ingredient.id
                );

                if (!serverSideIngredient) return false;

                return (
                    ingredient.qty >= serverSideIngredient.min && ingredient.qty <= serverSideIngredient.max
                );
            });

            if (!isValidIngredients) {
                throw new CommerceError("Internal Server Error", "INTERNAL_SERVER_ERROR");
            }
        }

        const basketData = await dataSources.CommerceAPIDataSource.getCustomerBaskets(
            siteId,
            user.accessToken,
            user.customerId
        );

        const defaultViewType =
            product?.imageGroups.find((group: any) => group.viewType === "default")?.images[0] ?? null;

        if ("baskets" in basketData) {
            const { basketId } = basketData.baskets[0];

            const addToBasketResult = await dataSources.CommerceAPIDataSource.addItemToBasket(
                siteId,
                user.accessToken,
                productId,
                quantity,
                basketId,
                inventoryId,
                locale,
                defaultViewType ? defaultViewType.link : null,
                ingredients,
                minOrderQty,
                maxOrderQty
            );

            const { productItems, currency } = addToBasketResult;

            /*
             * since we allow product duplicates in cart,
             * when we add the same product multiple times to the cart
             * the product will be in cart multiple times with different lineItem ID's but with the same product ID
             * find method below needs to find the most recent product added to cart to apply price adjustment
             * without reversing the array it will find the first product in the cart that already has a price adjustment
             */
            const {
                c_ingredients,
                basePrice,
                itemId,
                itemText,
                quantity: lineItemQty,
            } = productItems.reverse().find((item: any) => item.productId === productId);

            const { totalPriceValue } = calculateProductPrice(
                currency,
                JSON.parse(c_ingredients),
                basePrice,
                lineItemQty
            );

            const basketAfterPriceAdjustment = await dataSources.ocapi.priceAdjustment(
                siteId,
                basketId,
                itemId,
                itemText,
                totalPriceValue
            ); // ocapi response object uses snake case, commerce api is camel case

            const camelCaseBasket = keysToCamel(basketAfterPriceAdjustment);

            return {
                ...camelCaseBasket,
                orderTotal: toPrice(camelCaseBasket.orderTotal, currency).toFormat(),
                taxTotal: toPrice(camelCaseBasket?.taxTotal ?? 0, currency).toFormat(),
                shippingTotal: toPrice(camelCaseBasket?.shippingTotal ?? 0, currency).toFormat(),
                productSubTotal: toPrice(camelCaseBasket.productSubTotal, currency).toFormat(),
                productItems: camelCaseBasket.productItems.map((element: any) => {
                    const parsedIngredients =
                        JSON.parse(element.cIngredients)?.filter((ingredient: any) => ingredient.qty > 0) ??
                        null;

                    return {
                        ...element,
                        ingredients: element.cIngredients,
                        price: toPrice(element.priceAfterItemDiscount, currency).toFormat(),
                        minQty: element.cMinQty,
                        maxQty: element.cMaxQty,
                        image: element.cImage,
                        ingredientsString:
                            parsedIngredients
                                ?.map((ingredient: any, index: number) => {
                                    return `${ingredient.name}: ${ingredient.qty}${
                                        index < parsedIngredients.length - 1 ? "," : ""
                                    }`;
                                })
                                ?.join(" ") ?? null,
                    };
                }),
            };
        }

        const { basketId: createBasketId } = await dataSources.CommerceAPIDataSource.createBasket(
            siteId,
            user.accessToken,
            locale,
            inventoryId,
            productId,
            quantity,
            defaultViewType ? defaultViewType.link : null,
            ingredients,
            minOrderQty,
            maxOrderQty
        );

        await dataSources.CommerceAPIDataSource.addPriceBookToBasket(siteId, createBasketId, priceBookId);

        const basketAfterPriceBookApplied = await dataSources.CommerceAPIDataSource.getCustomerBaskets(
            siteId,
            user.accessToken,
            user.customerId
        );

        const { productItems, currency, basketId } = basketAfterPriceBookApplied.baskets[0];

        const {
            c_ingredients,
            basePrice,
            quantity: lineItemQty,
            itemId,
            itemText,
        } = productItems.find(({ productId }: any) => productId === productId);

        const { totalPriceValue } = calculateProductPrice(
            currency,
            JSON.parse(c_ingredients),
            basePrice,
            lineItemQty
        );

        const basketAfterPriceAdjustment = await dataSources.ocapi.priceAdjustment(
            siteId,
            basketId,
            itemId,
            itemText,
            totalPriceValue
        );

        const camelCaseBasket = keysToCamel(basketAfterPriceAdjustment);

        return {
            ...camelCaseBasket,
            orderTotal: toPrice(camelCaseBasket?.orderTotal ?? 0, camelCaseBasket.currency).toFormat(),
            productSubTotal: toPrice(camelCaseBasket.productSubTotal, camelCaseBasket.currency).toFormat(),
            taxTotal: toPrice(camelCaseBasket?.taxTotal ?? 0, camelCaseBasket.currency).toFormat(),
            shippingTotal: toPrice(camelCaseBasket?.shippingTotal ?? 0, camelCaseBasket.currency).toFormat(),
            productItems: camelCaseBasket.productItems.map((element: any) => {
                const parsedIngredients =
                    JSON.parse(element.cIngredients)?.filter((ingredient: any) => ingredient.qty > 0) ?? null;

                return {
                    ...element,
                    ingredients: element.cIngredients,
                    price: toPrice(element.priceAfterItemDiscount, currency).toFormat(),
                    minQty: element.cMinQty,
                    maxQty: element.cMaxQty,
                    image: element.cImage,
                    ingredientsString:
                        parsedIngredients
                            ?.map((ingredient: any, index: number) => {
                                return `${ingredient.name}: ${ingredient.qty}${
                                    index < parsedIngredients.length - 1 ? "," : ""
                                }`;
                            })
                            ?.join(" ") ?? null,
                };
            }),
        };
    }

    @Query(() => getProductsFromOrderRes)
    async getProductsFromOrder(
        @Arg("siteId") siteId: string,
        @Arg("locale") locale: string,
        @Arg("orderNo") orderNo: string,
        @Ctx()
        { dataSources, user: { accessToken }, req, res }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<getProductsFromOrderRes> {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const selectedStoreId = cookies.get("session.selectedStoreId", { signed: true });

        if (!selectedStoreId) {
            throw new CommerceError("No store selected.", "NO_STORE_SELECTED");
        }

        const inventoryId = `${selectedStoreId}-inventory`;
        const pricebookId = selectedStoreId ? `pricebook-${selectedStoreId}` : undefined;

        const order = await dataSources.StripeCommerceAPIDataSource.getOrder(siteId, orderNo);

        const productItems = order.productItems;

        const productsResponse = await dataSources.CommerceAPIDataSource.getProducts(
            siteId,
            accessToken,
            productItems?.map((productHit: any) => {
                return productHit?.productId;
            }),
            locale,
            inventoryId
        );

        const parsedProducts = parseProductHit(productsResponse, pricebookId, inventoryId);

        const productsWithIngredientsFromOrder = productItems.map((productHit: any) => {
            const product = parsedProducts.find((product: any) => product.id === productHit.productId);

            const parsedIngredients = productHit.c_ingredients
                ? JSON.parse(productHit.c_ingredients)?.filter((ingredient: any) => ingredient.qty > 0) ??
                  null
                : null;

            return {
                productId: product.id,
                productName: product.name,
                imgUrl: product.imgUrl,
                price: product.price,
                isAvailableInStore: product.isAvailableInStore,
                ingredientsString:
                    parsedIngredients
                        ?.map((ingredient: any, index: number) => {
                            return `${ingredient.name}: ${ingredient.qty}${
                                index < parsedIngredients.length - 1 ? "," : ""
                            }`;
                        })
                        ?.join(" ") ?? null,
                quantity: productHit.quantity,
            };
        });

        return {
            productItems: productsWithIngredientsFromOrder,
        };
    }

    @Mutation(() => Basket)
    async reorder(
        @Arg("siteId") siteId: string,
        @Arg("locale") locale: string,
        @Arg("orderNo") orderNo: string,
        @Ctx()
        {
            dataSources,
            user: { accessToken, customerId },
            req,
            res,
        }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const selectedStoreId = cookies.get("session.selectedStoreId", { signed: true });

        if (!selectedStoreId) {
            throw new CommerceError("No store selected.", "NO_STORE_SELECTED");
        }

        const order = await dataSources.StripeCommerceAPIDataSource.getOrder(siteId, orderNo);
        const inventoryId = `${selectedStoreId}-inventory`;
        const priceBookId = `pricebook-${selectedStoreId}`;

        const productItems = order.productItems;

        const productsResponse = await dataSources.CommerceAPIDataSource.getProducts(
            siteId,
            accessToken,
            productItems?.map((productHit: any) => {
                return productHit?.productId;
            }),
            locale,
            inventoryId
        );

        const productsToAdd = productItems?.map((productHit: any) => {
            const product = productsResponse?.data?.find(
                (product: any) => product.id === productHit.productId
            );

            if (product) {
                const productInventory = product.inventories?.find(
                    (inventory: any) => inventory.id === inventoryId
                );

                const orderable = productInventory?.orderable ?? false;

                if (!orderable) return null;
            } else {
                return null;
            }

            return {
                productId: productHit.productId,
                quantity: productHit.quantity,
                ingredients: productHit.c_ingredients,
                image: productHit.c_image,
            };
        });

        let basketData = null;
        let createBasketData = null;

        basketData = await dataSources.CommerceAPIDataSource.getCustomerBaskets(
            siteId,
            accessToken,
            customerId
        );

        const productsInStock = productsToAdd.filter((element: any) => element !== null);

        if (!productsInStock.length) {
            throw new CommerceError("No products to add.", "NO_PRODUCTS_TO_ADD");
        }

        /**
         *  If there is no basket available, create it with the first product in the list
         *  and add the rest of the products to the basket.
         */
        if ("baskets" in basketData === false) {
            const firstProduct = productsInStock.shift();

            createBasketData = await dataSources.CommerceAPIDataSource.createBasket(
                siteId,
                accessToken,
                locale,
                inventoryId,
                firstProduct?.productId,
                firstProduct?.quantity,
                firstProduct?.image,
                firstProduct?.ingredients,
                undefined,
                undefined
            );

            await dataSources.CommerceAPIDataSource.addPriceBookToBasket(
                siteId,
                createBasketData.basketId,
                priceBookId
            );
        }

        const { basketId } = createBasketData ? createBasketData : basketData.baskets[0];

        let addToBasketResult = null;
        let basketAfterPriceAdjustment = null;

        for (const product of productsInStock) {
            addToBasketResult = await dataSources.CommerceAPIDataSource.addItemToBasket(
                siteId,
                accessToken,
                product.productId,
                product.quantity,
                basketId,
                inventoryId,
                locale,
                product.image,
                product.ingredients
            );

            const { productItems, currency } = addToBasketResult;

            /*
             * since we allow product duplicates in cart,
             * when we add the same product multiple times to the cart
             * the product will be in cart multiple times with different lineItem ID's but with the same product ID
             * find method below needs to find the most recent product added to cart to apply price adjustment
             * without reversing the array it will find the first product in the cart that already has a price adjustment
             */
            const {
                c_ingredients,
                basePrice,
                itemId,
                itemText,
                quantity: lineItemQty,
            } = productItems.reverse().find((item: any) => item.productId === product.productId);

            const { totalPriceValue } = calculateProductPrice(
                currency,
                JSON.parse(c_ingredients),
                basePrice,
                lineItemQty
            );

            basketAfterPriceAdjustment = await dataSources.ocapi.priceAdjustment(
                siteId,
                basketId,
                itemId,
                itemText,
                totalPriceValue
            ); // ocapi response object uses snake case, commerce api is camel case
        }

        const camelCaseBasket = keysToCamel(basketAfterPriceAdjustment);

        return {
            ...camelCaseBasket,
            orderTotal: toPrice(camelCaseBasket.orderTotal, camelCaseBasket.currency).toFormat(),
            taxTotal: toPrice(camelCaseBasket?.taxTotal ?? 0, camelCaseBasket.currency).toFormat(),
            shippingTotal: toPrice(camelCaseBasket?.shippingTotal ?? 0, camelCaseBasket.currency).toFormat(),
            productSubTotal: toPrice(camelCaseBasket.productSubTotal, camelCaseBasket.currency).toFormat(),
            productItems: camelCaseBasket.productItems.map((element: any) => {
                const parsedIngredients = element.cIngredients
                    ? JSON.parse(element.cIngredients)?.filter((ingredient: any) => ingredient.qty > 0) ??
                      null
                    : null;

                return {
                    ...element,
                    ingredients: element.cIngredients,
                    price: toPrice(element.priceAfterItemDiscount, camelCaseBasket.currency).toFormat(),
                    minQty: element.cMinQty,
                    maxQty: element.cMaxQty,
                    image: element.cImage,
                    ingredientsString:
                        parsedIngredients
                            ?.map((ingredient: any, index: number) => {
                                return `${ingredient.name}: ${ingredient.qty}${
                                    index < parsedIngredients.length - 1 ? "," : ""
                                }`;
                            })
                            ?.join(" ") ?? null,
                };
            }),
        };
    }

    @Mutation(() => Basket)
    async updateItemInBasket(
        @Arg("itemId") itemId: string,
        @Arg("quantity") quantity: number,
        @Arg("siteId") siteId: string,
        @Arg("locale") locale: string,
        @Arg("basketId") basketId: string,
        @Ctx() { dataSources, user: { accessToken } }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Basket> {
        const updateItemRes = await dataSources.CommerceAPIDataSource.updateItemInBasket(
            siteId,
            locale,
            accessToken,
            basketId,
            itemId,
            quantity
        );

        return {
            ...updateItemRes,
            orderTotal: toPrice(updateItemRes.orderTotal, updateItemRes.currency).toFormat(),
            productSubTotal: toPrice(updateItemRes.productSubTotal, updateItemRes.currency).toFormat(),
            taxTotal: toPrice(updateItemRes?.taxTotal ?? 0, updateItemRes.currency).toFormat(),
            shippingTotal: toPrice(updateItemRes?.shippingTotal ?? 0, updateItemRes.currency).toFormat(),
            productItems:
                updateItemRes?.productItems?.map((productLineItem: any) => {
                    const parsedIngredients = productLineItem.c_ingredients
                        ? JSON.parse(productLineItem.c_ingredients)?.filter(
                              (ingredient: any) => ingredient.qty > 0
                          ) ?? null
                        : null;

                    return {
                        ...productLineItem,
                        ingredients: productLineItem.c_ingredients,
                        price: toPrice(
                            productLineItem.priceAfterItemDiscount,
                            updateItemRes.currency
                        ).toFormat(),
                        minQty: productLineItem.c_minQty,
                        maxQty: productLineItem.c_maxQty,
                        image: productLineItem.c_image,
                        ingredientsString:
                            parsedIngredients
                                ?.map((ingredient: any, index: number) => {
                                    return `${ingredient.name}: ${ingredient.qty}${
                                        index < parsedIngredients.length - 1 ? "," : ""
                                    }`;
                                })
                                ?.join(" ") ?? null,
                    };
                }) ?? [],
        };
    }

    @Query(() => Basket, { nullable: true })
    async getCustomerBaskets(
        @Arg("siteId") siteId: string,
        @Ctx()
        {
            dataSources,
            user: { accessToken, customerId },
        }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Basket | null> {
        const basketData = await dataSources.CommerceAPIDataSource.getCustomerBaskets(
            siteId,
            accessToken,
            customerId
        );

        if ("baskets" in basketData) {
            const { productItems, currency, orderTotal, productSubTotal, taxTotal, shippingTotal } =
                basketData.baskets[0];

            return {
                ...basketData.baskets[0],
                orderTotal: toPrice(orderTotal, currency).toFormat(),
                productSubTotal: toPrice(productSubTotal, currency).toFormat(),
                taxTotal: toPrice(taxTotal, currency).toFormat(),
                shippingTotal: toPrice(shippingTotal ? shippingTotal : 0, currency).toFormat(),
                productItems:
                    productItems?.map((productLineItem: any) => {
                        const parsedIngredients = productLineItem?.c_ingredients
                            ? JSON.parse(productLineItem.c_ingredients)?.filter(
                                  (ingredient: any) => ingredient.qty > 0
                              ) ?? null
                            : null;

                        return {
                            ...productLineItem,
                            ingredients: productLineItem.c_ingredients,
                            price: toPrice(productLineItem.priceAfterItemDiscount, currency).toFormat(),
                            minQty: productLineItem.c_minQty,
                            maxQty: productLineItem.c_maxQty,
                            image: productLineItem.c_image,
                            ingredientsString:
                                parsedIngredients
                                    ?.map((ingredient: any, index: number) => {
                                        return `${ingredient.name}: ${ingredient.qty}${
                                            index < parsedIngredients.length - 1 ? "," : ""
                                        }`;
                                    })
                                    ?.join(" ") ?? null,
                        };
                    }) ?? [],
            };
        }

        return null;
    }
}
