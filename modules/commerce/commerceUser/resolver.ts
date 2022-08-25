/* eslint-disable @typescript-eslint/no-explicit-any */
import { Query, Resolver, Ctx, Arg, Mutation, Args } from "type-graphql";
import { GraphQLContext, GraphQLDataSources } from "../../../types";
import {
    Address,
    AddToWishlistRes,
    DeleteAddressRes,
    DeleteWishlistItemRes,
    GetCustomerOrdersRes,
    GetCustomerWishlistsRes,
    GlobalUserDataRes,
    ProfileDataRes,
    UpdateCustomerPassword,
    UpdateCustomerProfileRes,
    UpdateWishlistRes,
} from "./types";
import { AddressInputArgs, WishlistItemArgs } from "./input";
import { toPrice } from "../basket/resolver";
import { guestLogin } from "../../../context";
import Cookies from "cookies";

@Resolver()
export class CommerceUserResolver {
    @Mutation(() => DeleteWishlistItemRes)
    async deleteWishlistItem(
        @Arg("siteId") siteId: string,
        @Arg("itemId") itemId: string,
        @Arg("wishlistId") wishlistId: string,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<DeleteWishlistItemRes> {
        await dataSources.CommerceAPIDataSource.deleteWishlistItem(
            siteId,
            itemId,
            wishlistId,
            user.customerId,
            user.accessToken
        );

        return { status: "OK" };
    }

    @Query(() => GetCustomerWishlistsRes)
    async getPublicWishlist(
        @Arg("siteId") siteId: string,
        @Arg("wishlistId") wishlistId: string,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<GetCustomerWishlistsRes> {
        const publicWishlist = await dataSources.CommerceAPIDataSource.getPublicWishlist(
            siteId,
            user.accessToken,
            wishlistId
        );

        const itemIds = publicWishlist.productListItems.map((elem: any) => {
            return elem.id;
        });

        const products: any[] = [];

        for (const id of itemIds) {
            const itemData = await dataSources.CommerceAPIDataSource.getProductWishlistItem(
                siteId,
                user.accessToken,
                publicWishlist.id,
                id
            );

            products.push(itemData);
        }

        const publicWishlistItems = products.map((wishlistItem: any) => {
            return {
                id: wishlistItem.id,
                productId: wishlistItem.product.id,
                image: wishlistItem.product.imageGroups[0].images[0].link ?? null,
                name: wishlistItem.product.name,
                size: null,
                quantity: null,
                price: toPrice(wishlistItem.product.price, wishlistItem.product.currency).toFormat(),
                wishlistId: publicWishlist.id,
                storeId: wishlistItem.c_storeId,
            };
        });

        return {
            wishlistId: publicWishlist.id,
            public: publicWishlist.public,
            customerProductListItems: publicWishlistItems,
        };
    }

    @Query(() => GlobalUserDataRes)
    async getGlobalUserData(
        @Arg("siteId") siteId: string,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<GlobalUserDataRes> {
        const data = await dataSources.CommerceAPIDataSource.getUser(
            siteId,
            user.customerId,
            user.accessToken
        );

        return {
            firstName: data?.firstName ?? null,
            lastName: data?.lastName ?? null,
            isLoggedIn: data.authType === "registered",
        };
    }

    @Query(() => ProfileDataRes)
    async getProfileData(
        @Arg("siteId") siteId: string,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<ProfileDataRes> {
        const userDataRes = await dataSources.CommerceAPIDataSource.getUser(
            siteId,
            user.customerId,
            user.accessToken
        );
        const ordersRes = await dataSources.CommerceAPIDataSource.getUserOrders(siteId);

        return {
            firstName: userDataRes?.firstName ?? null,
            lastName: userDataRes?.lastName ?? null,
            phone: userDataRes?.phoneMobile ?? null,
            email: userDataRes?.login ?? null,
            numberOfOrders: ordersRes.total,
            lastOrderDate: "data" in ordersRes ? ordersRes.data[0].creationDate : null,
        };
    }

    @Query(() => [Address])
    async getSavedAddresses(
        @Arg("siteId") siteId: string,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Address[]> {
        const data = await dataSources.CommerceAPIDataSource.getUser(
            siteId,
            user.customerId,
            user.accessToken
        );

        if ("addresses" in data) {
            return data.addresses.map((address: any): Address[] => {
                return {
                    ...address,
                    id: address?.addressId ?? null,
                    addressName: address?.addressId ?? null,
                    address2: address?.address2 ?? null,
                    country: address.countryCode,
                    state: address.stateCode,
                    zip: address.postalCode,
                    isPrimary: address.preferred,
                };
            });
        }

        return [];
    }

    @Mutation(() => Address)
    async updateAddress(
        @Args() args: AddressInputArgs,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Address> {
        const address = await dataSources.CommerceAPIDataSource.updateAddress(
            args.siteId,
            user.customerId,
            args.address,
            user.accessToken
        );

        return {
            id: address?.addressId ?? null,
            addressName: address?.addressId ?? null,
            firstName: address.firstName,
            lastName: address.lastName,
            address1: address.address1,
            address2: address?.address2 ?? "",
            country: address.countryCode,
            city: address?.city ?? "",
            state: address.stateCode,
            zip: address.postalCode,
            phone: address.phone,
            isPrimary: address.preferred,
        };
    }

    @Mutation(() => Address)
    async addNewAddress(
        @Args() args: AddressInputArgs,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Address> {
        const userData = await dataSources.CommerceAPIDataSource.getUser(
            args.siteId,
            user.customerId,
            user.accessToken
        );

        if ("addresses" in userData) {
            const address = !!userData.addresses.find((address: any) => address.isPrimary);

            if (!address) {
                args.address.isPrimary = true;
            }
        } else {
            args.address.isPrimary = true;
        }

        const addAddressRes = await dataSources.CommerceAPIDataSource.addAddress(
            args.siteId,
            user.customerId,
            user.accessToken,
            args.address
        );

        return {
            id: addAddressRes?.addressId ?? null,
            addressName: addAddressRes?.addressId ?? null,
            firstName: addAddressRes.firstName,
            lastName: addAddressRes.lastName,
            address1: addAddressRes.address1,
            address2: addAddressRes?.address2 ?? null,
            country: addAddressRes.countryCode,
            city: addAddressRes.city,
            state: addAddressRes.stateCode,
            zip: addAddressRes.postalCode,
            phone: addAddressRes.phone,
            isPrimary: addAddressRes.preferred,
        };
    }

    @Mutation(() => DeleteAddressRes)
    async deleteAddress(
        @Arg("siteId") siteId: string,
        @Arg("addressId") addressId: string,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<DeleteAddressRes> {
        await dataSources.CommerceAPIDataSource.deleteAddress(
            siteId,
            addressId,
            user.accessToken,
            user.customerId
        );

        return { status: "OK" };
    }

    @Query(() => GetCustomerWishlistsRes, { nullable: true })
    async getCustomerWishlists(
        @Arg("siteId") siteId: string,
        @Arg("locale") locale: string,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<GetCustomerWishlistsRes | null> {
        const customerWishlist = await dataSources.CommerceAPIDataSource.getWishlists(
            siteId,
            user.customerId,
            user.accessToken
        );

        if ("data" in customerWishlist) {
            const wishlist = customerWishlist.data[0];

            if ("customerProductListItems" in wishlist) {
                const productIds = wishlist.customerProductListItems.map((elem: any) => {
                    return elem.productId;
                });

                const products = await dataSources.CommerceAPIDataSource.getProducts(
                    siteId,
                    user.accessToken,
                    productIds,
                    locale
                );

                const wishlistItems = wishlist.customerProductListItems.map((wishlistItem: any) => {
                    const productFound = products.data.find(
                        (product: any) => product.id === wishlistItem.productId
                    );

                    const variationWeightValues = productFound?.variationAttributes?.find(
                        (attribute: any) => attribute.id === "weight"
                    )?.values;

                    return {
                        id: wishlistItem.id,
                        productId: wishlistItem.productId,
                        image: productFound.imageGroups[0].images[0].link ?? null,
                        name: productFound.name,
                        size:
                            variationWeightValues.find(
                                (item: any) => item.value === productFound.variationValues.weight
                            )?.name ?? "",
                        quantity: wishlistItem.quantity,
                        price: toPrice(productFound.price, productFound.currency).toFormat(),
                        wishlistId: wishlist.id,
                        storeId: wishlistItem.c_storeId,
                    };
                });

                return {
                    wishlistId: wishlist.id,
                    public: wishlist.public,
                    customerProductListItems: wishlistItems,
                };
            }

            return {
                wishlistId: wishlist.id,
                public: wishlist.public,
                customerProductListItems: null,
            };
        }

        return null;
    }

    @Mutation(() => UpdateWishlistRes)
    async updateCustomerWishlist(
        @Arg("siteId") siteId: string,
        @Arg("wishlistId") wishlistId: string,
        @Arg("public") publicWishlist: boolean,
        @Arg("locale") locale: string,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<UpdateWishlistRes> {
        await dataSources.CommerceAPIDataSource.updateCustomerWishlist(
            siteId,
            user.accessToken,
            user.customerId,
            { wishlistId, public: publicWishlist }
        );

        return {
            status: "OK",
        };
    }

    @Mutation(() => AddToWishlistRes)
    async addWishlistProduct(
        @Arg("siteId") siteId: string,
        @Arg("item") item: WishlistItemArgs,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<AddToWishlistRes> {
        const wishlistRes = await dataSources.CommerceAPIDataSource.getWishlists(
            siteId,
            user.customerId,
            user.accessToken
        );

        if (wishlistRes.total === 0) {
            const wishlist = await dataSources.CommerceAPIDataSource.createCustomerWishlist(
                siteId,
                user.customerId,
                user.accessToken
            );

            const wishlistItem = await dataSources.CommerceAPIDataSource.addWishlistsItem(
                siteId,
                user.customerId,
                user.accessToken,
                wishlist.id,
                item
            );

            return {
                id: wishlistItem.id,
                priority: wishlistItem.priority,
                productId: wishlistItem.productId,
                public: wishlistItem.public,
                quantity: wishlistItem.quantity,
                type: wishlistItem.type,
                storeId: wishlistItem.c_storeId,
            };
        }

        const wishlist = wishlistRes.data[0];

        const wishlistItem = await dataSources.CommerceAPIDataSource.addWishlistsItem(
            siteId,
            user.customerId,
            user.accessToken,
            wishlist.id,
            item
        );

        return {
            id: wishlistItem.id,
            priority: wishlistItem.priority,
            productId: wishlistItem.productId,
            public: wishlistItem.public,
            quantity: wishlistItem.quantity,
            type: wishlistItem.type,
            storeId: wishlistItem.c_storeId,
        };
    }

    @Mutation(() => UpdateCustomerPassword)
    async updateCustomerPassword(
        @Arg("siteId") siteId: string,
        @Arg("oldPassword") oldPassword: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<UpdateCustomerPassword> {
        await dataSources.CommerceAPIDataSource.updateCustomerPassword(
            siteId,
            user.customerId,
            user.accessToken,
            oldPassword,
            newPassword
        );

        return {
            status: "OK",
        };
    }

    @Query(() => GetCustomerOrdersRes, { nullable: true })
    async getCustomerOrders(
        @Arg("siteId") siteId: string,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<GetCustomerOrdersRes | null> {
        const customerOrders = await dataSources.CommerceAPIDataSource.getCustomerOrders(
            user.accessToken,
            siteId,
            user.customerId
        );

        if ("data" in customerOrders) {
            const orders = customerOrders.data.map((order: any) => {
                return {
                    billingAddress: {
                        id: order.billingAddress.id,
                        firstName: order.billingAddress.firstName,
                        lastName: order.billingAddress.lastName,
                        fullName: order.billingAddress.fullName,
                        address2: order.billingAddress.address2,
                        address1: order.billingAddress.address1,
                        city: order.billingAddress.city,
                        state: order.billingAddress.stateCode,
                        zip: order.billingAddress.postalCode,
                        phone: order.billingAddress.phone,
                        country: order.billingAddress.countryCode,
                    },
                    shippingTotal: toPrice(order?.shippingTotal ?? 0, order.currency).toFormat(),
                    taxTotal: toPrice(order?.taxTotal ?? 0, order.currency).toFormat(),
                    shipments: order.shipments.map((shipment: any) => {
                        return {
                            id: shipment.shipmentId,
                            shippingStatus: shipment.shippingStatus,
                            deliveryMethod: {
                                name: shipment.shippingMethod?.name ?? "",
                                description: shipment.shippingMethod?.description ?? "",
                                requiresDate: shipment.shippingMethod.c_requiresDate || false,
                                isStorePickup: shipment.shippingMethod.c_storePickupEnabled,
                            },
                            shippingAddress: {
                                id: shipment.shippingAddress.id,
                                firstName: shipment.shippingAddress.firstName,
                                lastName: shipment.shippingAddress.lastName,
                                fullName: shipment.shippingAddress.fullName,
                                address2: shipment.shippingAddress.address2,
                                address1: shipment.shippingAddress?.address1,
                                city: shipment.shippingAddress.city,
                                stateCode: shipment.shippingAddress.stateCode,
                                postalCode: shipment.shippingAddress.postalCode,
                                phone: shipment.shippingAddress.phone,
                                countryCode: shipment.shippingAddress.countryCode,
                            },
                            items: order.productItems.map((productItem: any) => {
                                const parsedIngredients =
                                    JSON.parse(productItem.c_ingredients)?.filter(
                                        (ingredient: any) => ingredient.qty > 0
                                    ) ?? null;

                                return {
                                    productName: productItem.productName,
                                    minQty: productItem.c_minQty,
                                    maxQty: productItem.c_maxQty,
                                    quantity: productItem.quantity,
                                    price: toPrice(
                                        productItem.priceAfterItemDiscount,
                                        order.currency
                                    ).toFormat(),
                                    productId: productItem.productId,
                                    image: productItem.c_image,
                                    priceAfterOrderDiscount: productItem.priceAfterOrderDiscount,
                                    adjustedTax: productItem.adjustedTax,
                                    basePrice: productItem.basePrice,
                                    bonusProductLineItem: productItem.bonusProductLineItem,
                                    gift: productItem.gift,
                                    inventoryId: productItem.inventoryId,
                                    itemText: productItem.itemText,
                                    priceAfterItemDiscount: productItem.priceAfterItemDiscount,
                                    ingredients: productItem.c_ingredients,
                                    tax: productItem.tax,
                                    taxBasis: productItem.taxBasis,
                                    taxClassId: productItem.taxClassId,
                                    itemId: productItem.itemId,
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
                    }),
                    date: order.creationDate,
                    orderNumber: order.orderNo,
                    subtotal: toPrice(order.productSubTotal, order.currency).toFormat(),
                    total: toPrice(order.orderTotal, order.currency).toFormat(),
                    paymentStatus: order.paymentStatus,
                    status: order.status,
                    storeId: order?.c_storeId ?? "",
                    storeName: order?.c_storeName ?? "",
                };
            });

            return {
                orders,
                total: customerOrders.total,
            };
        }

        return {
            orders: [],
            total: 0,
        };
    }

    @Mutation(() => UpdateCustomerProfileRes)
    async updateCustomerProfileData(
        @Arg("siteId") siteId: string,
        @Arg("lastName") lastName: string,
        @Arg("firstName") firstName: string,
        @Arg("email") email: string,
        @Arg("phone") phone: string,
        @Ctx() { dataSources, user, req, res }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<UpdateCustomerProfileRes> {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const { customerNo, login } = await dataSources.CommerceAPIDataSource.getUser(
            siteId,
            user.customerId,
            user.accessToken
        );

        const isEmailChanged = email !== login;

        if (isEmailChanged) {
            await guestLogin(cookies);

            await dataSources.CommerceAPIDataSource.logout(user.accessToken, user.refreshToken, siteId);
        }

        await dataSources.CommerceAPIDataSource.updateCustomerProfileData(siteId, customerNo, {
            credentials: {
                login: email,
                enabled: true,
                locked: false,
            },
            lastName,
            firstName,
            phoneMobile: phone,
            email,
        });

        return {
            isEmailChanged,
        };
    }
}
