/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from "cookies";
import Dinero, { Currency } from "dinero.js";
import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { GraphQLContext, GraphQLDataSources } from "../../../types";
import { toPrice } from "../basket/resolver";
import { CommerceError, errorTypes } from "../errors";
import { IngredientGroup, Item, Product, ProductPriceRes } from "./types";

export function calculateProductPrice(
    currency: Currency,
    ingredients: Item[],
    basePrice: number,
    qty?: number
): { unitPrice: string; totalPrice: string; totalPriceValue: number } {
    let ingredientsTotalPrice = Dinero({
        amount: 0,
        currency,
    });

    ingredients.forEach((item: any) => {
        const ingredientPrice = toPrice(item.price.value, currency);

        if (item.qty <= item.initialQty) return;

        if (item.qty > item.initialQty) {
            ingredientsTotalPrice = ingredientsTotalPrice.add(
                ingredientPrice.multiply(item.qty - item.initialQty)
            );
        }
    });

    const baseProductPrice = toPrice(basePrice, currency);
    const totalUnitPrice = baseProductPrice.add(ingredientsTotalPrice);

    return {
        unitPrice: totalUnitPrice.toFormat(),
        totalPrice: qty && qty > 0 ? totalUnitPrice.multiply(qty).toFormat() : totalUnitPrice.toFormat(),
        totalPriceValue: totalUnitPrice.toUnit(),
    };
}

@Resolver()
export class ProductResolver {
    @Query(() => Product)
    async getProduct(
        @Arg("productId") productId: string,
        @Arg("siteId") siteId: string,
        @Arg("locale") locale: string,
        @Ctx() { req, res, dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Product> {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const selectedStoreId = cookies.get("session.selectedStoreId", { signed: true });
        const productInvetoryId = selectedStoreId ? `${selectedStoreId}-inventory` : "default-inventory";
        const priceBookId = selectedStoreId ? `pricebook-${selectedStoreId}` : undefined;

        const productDataRes = await dataSources.CommerceAPIDataSource.getProduct(
            siteId,
            productId,
            user.accessToken,
            locale,
            productInvetoryId
        );

        const isIngredient = productDataRes?.c_isIngredient;

        if (isIngredient) {
            throw new CommerceError("Product not found", errorTypes["PRODUCT_NOT_FOUND"]);
        }

        const desktopViewType =
            productDataRes?.imageGroups.find((group: any) => group.viewType === "pdpBannerDesktop")
                ?.images[0] ?? null;
        const pdpBannerMobile =
            productDataRes?.imageGroups.find((group: any) => group.viewType === "pdpBannerMobile")
                ?.images[0] ?? null;

        const sizeTiles =
            productDataRes?.variants?.map((variant: any) => {
                const variationSizeValues = productDataRes?.variationAttributes?.find(
                    (attribute: any) => attribute.id === "size"
                )?.values;

                const variationWeightValues = productDataRes?.variationAttributes?.find(
                    (attribute: any) => attribute.id === "weight"
                )?.values;

                return {
                    id: variant.productId,
                    isActive: productId === variant.productId,
                    title:
                        variationSizeValues.find((item: any) => item.value === variant.variationValues.size)
                            ?.name ?? "",
                    subTitle:
                        variationWeightValues.find(
                            (item: any) => item.value === variant.variationValues.weight
                        )?.name ?? "",
                    price: variant.price
                        ? toPrice(
                              variant?.tieredPrices?.find(
                                  (tier: any) => tier.pricebook === `pricebook-${selectedStoreId}`
                              )?.price ?? 0,
                              productDataRes.currency
                          ).toFormat()
                        : null,
                };
            }) ?? [];

        const parsedIngredientGroups = JSON.parse(productDataRes?.c_ingredientGroups ?? null);

        const ingredientsIds =
            parsedIngredientGroups?.reduce((acc: any, group: any) => {
                return [...acc, ...group.items.map((item: any) => item.id)];
            }, []) ?? [];

        const ingredientProducts = await dataSources.CommerceAPIDataSource.getProducts(
            siteId,
            user.accessToken,
            ingredientsIds,
            locale,
            productInvetoryId
        );

        const ingredientImages =
            ingredientProducts?.data?.map((product: any) => {
                return {
                    id: product.id,
                    images:
                        product?.imageGroups?.find((group: any) => group.viewType === "default").images[0] ??
                        null,
                };
            }) ?? [];

        const ingredientGroups: IngredientGroup[] =
            parsedIngredientGroups?.map((group: IngredientGroup) => {
                return {
                    id: group?.id ?? null,
                    name: group?.name ?? null,
                    items:
                        group?.items?.map((ingredient: any) => {
                            const ingredientImage = ingredientImages.find(
                                (image: any) => image.id === ingredient.id
                            );

                            const ingredientProduct = ingredientProducts?.data?.find(
                                (product: any) => product.id === ingredient.id
                            );

                            if (!ingredientProduct) {
                                console.trace(
                                    `Unable to fetch ingredient with id ${ingredient.id} for product ${productId}.`
                                );
                                throw new CommerceError("Invalid product configuration");
                            }

                            if (
                                !ingredientProduct.hasOwnProperty("price") ||
                                !ingredientProduct.hasOwnProperty("name")
                            ) {
                                console.trace(
                                    `Ingredient product '${ingredient.id}' has missing configuration.`
                                );
                                throw new CommerceError("Invalid product configuration");
                            }

                            const itemPrice =
                                ingredientProduct?.tieredPrices?.find(
                                    (tier: any) => tier.pricebook === priceBookId
                                )?.price ?? null;

                            const priceObj = itemPrice ? toPrice(itemPrice, productDataRes.currency) : null;

                            return {
                                id: ingredient?.id ?? null,
                                name: ingredientProduct.name,
                                price: {
                                    value: priceObj?.toUnit() ?? null,
                                    displayValue: priceObj?.toFormat() ?? null,
                                },
                                initialQty: ingredient?.qty ?? null,
                                qty: ingredient?.qty ?? null,
                                min: ingredient?.min ?? null,
                                max: ingredient?.max ?? null,
                                imgUrl: ingredientImage?.images?.link ?? null,
                            };
                        }) ?? null,
                };
            }) ?? [];

        const ingredients = ingredientGroups.reduce((acc, group) => {
            return [...acc, ...group.items];
        }, []);

        let unitPrice = null;

        const isMasterProduct = productDataRes.type?.master ?? false;
        const isProductAvailable =
            productDataRes?.inventories?.find((inv: any) => inv.id === productInvetoryId)?.orderable ?? false;

        if (isProductAvailable && !isMasterProduct) {
            unitPrice = calculateProductPrice(
                productDataRes.currency,
                ingredients,
                productDataRes?.tieredPrices?.find((tier: any) => tier.pricebook === priceBookId)?.price ?? 0
            ).unitPrice;
        }

        const productTabs = [];

        if (productDataRes.c_detailsTab && productDataRes.c_detailsTabTitle) {
            productTabs.push({
                id: "details",
                title: productDataRes.c_detailsTabTitle,
                content: productDataRes.c_detailsTab,
            });
        }

        if (productDataRes.c_ingredientsTab && productDataRes.c_ingredientsTabTitle) {
            productTabs.push({
                id: "ingredients",
                title: productDataRes.c_ingredientsTabTitle,
                content: productDataRes.c_ingredientsTab,
            });
        }

        if (productDataRes.c_nutritionTab && productDataRes.c_nutritionTabTitle) {
            productTabs.push({
                id: "nutrition",
                title: productDataRes.c_nutritionTabTitle,
                content: productDataRes.c_nutritionTab,
            });
        }

        let isProductSavedInWishlist = false;

        const customerWishlistRes = await dataSources.CommerceAPIDataSource.getWishlists(
            siteId,
            user.customerId,
            user.accessToken
        );

        if ("data" in customerWishlistRes) {
            const wishlist = customerWishlistRes.data[0];

            if ("customerProductListItems" in wishlist) {
                const wishlistItem = wishlist.customerProductListItems.find(
                    (item: any) => item.productId === productId
                );

                if (wishlistItem) {
                    isProductSavedInWishlist = true;
                }
            }
        }

        const productData = {
            id: productDataRes.id,
            name: productDataRes.name,
            price: unitPrice,
            shortDescription: productDataRes?.shortDescription ?? null,
            parentCategoryId: productDataRes.primaryCategoryId,
            badges: ["V", "N", "S"], // TODO: discuss if it's needed & implement or remove
            isProductSavedInWishlist,
            ingredientGroups,
            tabs: productTabs,
            minQty: productDataRes?.c_minQty ?? 1,
            maxQty: productDataRes?.c_maxQty ?? 10,
            imgSquare: pdpBannerMobile
                ? {
                      url: pdpBannerMobile.link,
                      alt: pdpBannerMobile.alt,
                      title: pdpBannerMobile.title,
                  }
                : null,
            imgLandscape: desktopViewType
                ? {
                      url: desktopViewType?.link,
                      alt: desktopViewType?.alt,
                      title: desktopViewType?.title,
                  }
                : null,
            sizeTiles: sizeTiles,
            weight: !productDataRes.type.master ? productDataRes?.c_weight ?? null : null,
            isMasterProduct,
            inventory: productDataRes.inventories.find((inv: any) => inv.id === productInvetoryId),
            isStoreSelected: !!selectedStoreId,
        };

        return productData;
    }

    @Query(() => ProductPriceRes, { nullable: true })
    async getProductPrice(
        @Arg("siteId") siteId: string,
        @Arg("productId") productId: string,
        @Arg("locale") locale: string,
        @Arg("ingredients") ingredients: string,
        @Arg("qty") qty: number,
        @Ctx() context: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<ProductPriceRes | null> {
        const cookies = new Cookies(context.req, context.res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const selectedStoreId = cookies.get("session.selectedStoreId", { signed: true });
        const productInvetoryId = selectedStoreId ? `${selectedStoreId}-inventory` : "default-inventory";

        const productDataRes = await context.dataSources.CommerceAPIDataSource.getProduct(
            siteId,
            productId,
            context.user.accessToken,
            locale,
            productInvetoryId
        );

        const isProductAvailable =
            productDataRes?.inventories?.find((inv: any) => inv.id === productInvetoryId)?.orderable ?? false;

        if ((isProductAvailable && !productDataRes.type?.master) ?? false) {
            return calculateProductPrice(
                productDataRes.currency,
                JSON.parse(ingredients),
                productDataRes?.tieredPrices?.find(
                    (tier: any) => tier.pricebook === `pricebook-${selectedStoreId}`
                )?.price ?? 0,
                qty
            );
        }

        return null;
    }
}
