import { DataSource, DataSourceConfig } from "apollo-datasource";
import fetch from "make-fetch-happen";
import { URL, URLSearchParams } from "url";

import { GraphQLContext, TokenResponse } from "../../types";
import { LoginStartResponse } from "./authentication/types";
import { AddressInput, WishlistItemArgs } from "./commerceUser/input";
import { OrderAddressInput } from "./checkout/input";
import { RegisterArgs } from "./authentication/input";
import { CommerceUser } from "./dto/CommerceUser";
import { CommerceError } from "./errors";
import { Filter } from "./category/input";

export const categoryFilterKey = "cgid";

export class CommerceAPIDataSource extends DataSource {
    private user: CommerceUser;

    constructor(
        private readonly baseURL: string,
        private readonly organizationId: string,
        private readonly clientId: string,
        private readonly clientSecret: string,
        private readonly SCAPIAdminApiClientId: string,
        private readonly SCAPIAdminApiClientSecret: string,
        private readonly tenantId: string
    ) {
        super();
    }

    initialize(config: DataSourceConfig<GraphQLContext>) {
        this.user = config.context.user;
    }

    async loginStart(
        codeChallenge: string,
        siteId: string,
        username: string,
        guestUsid: string | undefined,
        password: string,
        commerceRedirectUrl: string
    ): Promise<LoginStartResponse> {
        const loginStartURL = new URL(
            `${this.baseURL}/shopper/auth/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/oauth2/login`
        );

        const reqParams = new URLSearchParams({
            client_id: this.clientId,
            response_type: "code",
            redirect_uri: commerceRedirectUrl,
            state: "start_login",
            scope: "openid",
            channel_id: siteId,
            code_challenge: codeChallenge,
        });

        if (guestUsid) {
            reqParams.append("usid", guestUsid);
        }

        loginStartURL.search = reqParams.toString();

        const loginStartRes = await fetch(loginStartURL.toString(), {
            method: "POST",
            redirect: "manual",
            headers: {
                Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (loginStartRes.status === 401) {
            const errResponse = await loginStartRes.json();
            console.trace(errResponse);
            throw new CommerceError(errResponse.message, "INVALID_CREDENTIALS");
        }

        const redirectURL = loginStartRes.headers.get("Location");

        if (!redirectURL) {
            console.trace(await loginStartRes.json());
            throw new CommerceError("Internal Server Error");
        }

        return { redirectURL };
    }

    async loginEnd(
        code: string,
        codeVerifier: string,
        usid: string,
        commerceRedirectUrl: string
    ): Promise<TokenResponse> {
        const loginEndURL = new URL(
            `${this.baseURL}/shopper/auth/v1/organizations/${encodeURIComponent(
                this.organizationId
            )}/oauth2/token`
        );

        const reqParams = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: commerceRedirectUrl,
            code_verifier: codeVerifier,
            code,
            grant_type: "authorization_code_pkce",
            usid,
        });

        loginEndURL.search = reqParams.toString();

        const loginEndRes = await fetch(loginEndURL.toString(), {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
                    "base64"
                )}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const loginEndResData: TokenResponse = await loginEndRes.json();

        if (!loginEndRes.ok) {
            console.trace(loginEndResData);
            throw new CommerceError("Internal Server Error");
        }

        return loginEndResData;
    }

    async logout(accessToken: string, refreshToken: string, siteId: string): Promise<{ status: "OK" }> {
        const logoutURL = new URL(
            `${this.baseURL}/shopper/auth/v1/organizations/${encodeURIComponent(
                this.organizationId
            )}/oauth2/logout`
        );

        logoutURL.search = new URLSearchParams({
            client_id: this.clientId,
            channel_id: siteId,
            refresh_token: refreshToken,
        }).toString();

        const logoutRes = await fetch(logoutURL.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const logoutResData = await logoutRes.json();

        if (!logoutRes.ok) {
            console.trace(logoutResData);
            throw new CommerceError("Internal Server Error");
        }

        return { status: "OK" };
    }

    async register({ customer, password, siteId, accessToken }: RegisterArgs & { accessToken: string }) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers?siteId=${encodeURIComponent(siteId)}`
        );

        const response = await fetch(fetchURL.toString(), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                customer,
                password,
            }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.trace(responseData);
            throw new CommerceError(responseData.detail, responseData.type);
        }

        return responseData;
    }

    async getUser(siteId: string, customerId: string, accessToken: string) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(customerId)}`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const responseData = await response.json();

        if (response.status === 404) {
            throw new CommerceError("User not found", responseData.type);
        }

        if (!response.ok) {
            console.trace(responseData);
            throw new CommerceError("Internal Server Error");
        }

        return responseData;
    }

    async getUserOrders(siteId: string) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(this.user.customerId as string)}/orders`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            headers: {
                Authorization: `Bearer ${this.user.accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (!response.ok) {
            console.trace(await response.json());
            throw new CommerceError("Internal Server Error");
        }

        return response.json();
    }

    async addAddress(siteId: string, customerId: string, accessToken: string, address: AddressInput) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(customerId)}/addresses?siteId=${encodeURIComponent(siteId)}`
        );

        const response = await fetch(fetchURL.toString(), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                addressId: address.addressName,
                firstName: address.firstName,
                lastName: address.lastName,
                address1: address.address1,
                address2: address?.address2 ?? "",
                countryCode: address.country,
                city: address.city,
                stateCode: address.state,
                postalCode: address.zip,
                phone: address.phone,
                preferred: address.isPrimary,
            }),
        });

        if (!response.ok) {
            console.trace(await response.json());
            throw new CommerceError("Internal Server Error");
        }

        return response.json();
    }

    async getProductWishlistItem(siteId: string, accessToken: string, wishlistId: string, itemId: string) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/product-lists/${encodeURIComponent(wishlistId as string)}/items/${encodeURIComponent(
                itemId as string
            )}`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
        }).toString();
        const response = await fetch(fetchURL.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (!response.ok) {
            console.trace(await response.json());
            throw new CommerceError("INTERNAL SERVER ERROR");
        }

        return response.json();
    }

    async updateAddress(siteId: string, customerId: string, address: AddressInput, accessToken: string) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(customerId as string)}/addresses/${encodeURIComponent(
                address.addressName as string
            )}`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                addressId: address.addressName,
                firstName: address.firstName,
                lastName: address.lastName,
                address1: address.address1,
                address2: address?.address2 ?? "",
                countryCode: address.country,
                city: address?.city ?? "",
                stateCode: address.state,
                postalCode: address.zip,
                phone: address.phone,
                preferred: address.isPrimary,
            }),
        });

        if (!response.ok) {
            console.trace(await response.json());
            throw new CommerceError("Internal Server Error");
        }

        return response.json();
    }

    async getProduct(
        siteId: string,
        productId: string,
        accessToken: string,
        locale: string,
        inventoryId?: string
    ) {
        const fetchURL = new URL(
            `${this.baseURL}/product/shopper-products/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/products/${encodeURIComponent(productId)}`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
            allImages: "true",
            locale,
            perPricebook: "true",
        }).toString();

        if (inventoryId) {
            fetchURL.search += `&inventoryIds=${encodeURIComponent(inventoryId)}`;
        }

        const response = await fetch(fetchURL.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async getProducts(
        siteId: string,
        accessToken: string,
        ids: string[],
        locale: string,
        inventoryIds?: string
    ) {
        if (!ids.length) {
            return [];
        }

        const fetchURL = new URL(
            `${this.baseURL}/product/shopper-products/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/products`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
            allImages: "true",
            locale,
            ids: ids.join(","),
            perPricebook: "true",
        }).toString();

        if (inventoryIds) {
            fetchURL.search += `&inventoryIds=${encodeURIComponent(inventoryIds)}`;
        }

        const response = await fetch(fetchURL.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async createBasket(
        siteId: string,
        accessToken: string,
        locale: string,
        inventoryId: string,
        productId: string,
        quantity: number,
        imageUrl?: string,
        ingredients?: string,
        minOrderQty?: number,
        maxOrderQty?: number
    ) {
        const fetchURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
            locale,
        }).toString();

        const params: { [key: string]: string | number } = {
            productId,
            quantity,
            inventoryId,
        };

        if (minOrderQty) {
            params.c_minQty = minOrderQty;
        }

        if (maxOrderQty) {
            params.c_maxQty = maxOrderQty;
        }

        if (ingredients) {
            params.c_ingredients = ingredients;
        }

        if (imageUrl) {
            params.c_image = imageUrl;
        }

        const response = await fetch(fetchURL.toString(), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                productItems: [params],
            }),
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async addItemToBasket(
        siteId: string,
        accessToken: string,
        productId: string,
        quantity: number,
        basketId: string,
        inventoryId: string,
        locale: string,
        imageUrl?: string,
        ingredients?: string,
        minOrderQty?: number,
        maxOrderQty?: number
    ) {
        const fetchURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/${encodeURIComponent(basketId)}/items`
        );

        fetchURL.search = new URLSearchParams({
            locale,
            siteId,
        }).toString();

        const params: { [key: string]: string | number } = {
            productId,
            quantity,
            inventoryId,
        };

        if (minOrderQty) {
            params.c_minQty = minOrderQty;
        }

        if (maxOrderQty) {
            params.c_maxQty = maxOrderQty;
        }

        if (ingredients) {
            params.c_ingredients = ingredients;
        }

        if (imageUrl) {
            params.c_image = imageUrl;
        }

        const response = await fetch(fetchURL.toString(), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify([params]),
        });

        const resJson = await response.json();

        if (!response.ok) {
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return resJson;
    }

    async getCustomerBaskets(siteId: string, accessToken: string, customerId: string) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(customerId)}/baskets`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async getProductSearchResults(
        categoryId: string,
        siteId: string,
        accessToken: string,
        filters: Filter[],
        offset: number,
        limit: number,
        locale: string
    ) {
        filters = filters || [];
        offset = offset || 0;
        limit = limit || 12;
        categoryId = categoryId || "root";

        let refinementString = "";

        const isCategoryFilterKeyInFilters = filters?.filter((filter) => {
            return filter.id == categoryFilterKey;
        }).length
            ? true
            : false;

        refinementString = filters
            .map((filter, index) => {
                let separatorPrefix = "";
                let refinementItemString = "";
                if (index != 0) {
                    separatorPrefix = "&refine=";
                }

                filter.values.forEach((value: string, index: number) => {
                    if (index != 0) {
                        refinementItemString += "&refine=";
                    }

                    refinementItemString += `${filter.id}=${value}`;
                });

                return `${separatorPrefix}${refinementItemString}`;
            })
            .join("");

        if (!isCategoryFilterKeyInFilters) {
            if (refinementString.length) {
                refinementString += "&refine=";
            }
            refinementString += `${categoryFilterKey}=${categoryId}`;
        }

        const productSearchResultsURL = new URL(
            `${this.baseURL}/search/shopper-search/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/product-search`
        );
        const reqParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString(),
            locale: locale,
            siteId: siteId,
            refine: refinementString + "&refine=htype=product",
        });

        productSearchResultsURL.search = reqParams.toString();

        const productSearchResultRes = await fetch(productSearchResultsURL.toString(), {
            method: "GET",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        const resJson = await productSearchResultRes.json();

        if (productSearchResultRes.status === 401) {
            console.trace(resJson);
            throw new CommerceError(resJson.message, "INVALID_CREDENTIALS");
        }

        if (productSearchResultRes.status !== 200) {
            console.trace(resJson);
            throw new CommerceError("Internal Server Error");
        }

        return resJson;
    }

    async getCategoryById(categoryId: string, siteId: string, accessToken: string, locale: string) {
        const getCategoryByIdURL = new URL(
            `${this.baseURL}/product/shopper-products/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/categories/${categoryId}`
        );

        const reqParams = new URLSearchParams({
            locale: locale,
            siteId: siteId,
        });

        getCategoryByIdURL.search = reqParams.toString();

        const categoryRes = await fetch(getCategoryByIdURL.toString(), {
            method: "GET",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        const resJson = await categoryRes.json();

        if (categoryRes.status === 401) {
            console.trace(resJson);
            throw new CommerceError(resJson.message, "INVALID_CREDENTIALS");
        }

        if (categoryRes.status !== 200) {
            console.trace(resJson);
            throw new CommerceError("Internal Server Error");
        }

        return resJson;
    }

    async updateItemInBasket(
        siteId: string,
        locale: string,
        accessToken: string,
        basketId: string,
        itemId: string,
        quantity: number
    ) {
        const updateItemInBasketURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/${encodeURIComponent(basketId)}/items/${encodeURIComponent(itemId)}`
        );

        updateItemInBasketURL.search = new URLSearchParams({
            locale,
            siteId,
        }).toString();

        const response = await fetch(updateItemInBasketURL.toString(), {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                quantity,
            }),
        });

        const resJson = await response.json();

        if (!response.ok) {
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return resJson;
    }

    async updateCustomerWishlist(
        siteId: string,
        accessToken: string,
        customerId: string,
        wishlist: {
            wishlistId: string;
            public: boolean;
        }
    ) {
        const updateCustomerWishlistURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(customerId)}/product-lists/${encodeURIComponent(
                wishlist.wishlistId
            )}`
        );

        updateCustomerWishlistURL.search = new URLSearchParams({
            siteId,
        }).toString();

        const response = await fetch(updateCustomerWishlistURL.toString(), {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                public: wishlist.public,
            }),
        });

        const resJson = await response.json();

        if (!response.ok) {
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return resJson;
    }

    async deleteBasket(siteId: string, accessToken: string, basketId: string) {
        const deleteBasketURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/${encodeURIComponent(basketId)}`
        );

        deleteBasketURL.search = new URLSearchParams({
            siteId,
        }).toString();

        const response = await fetch(deleteBasketURL.toString(), {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 204) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response;
    }

    async deleteWishlistItem(
        siteId: string,
        itemId: string,
        wishlistId: string,
        customerId: string,
        accessToken: string
    ) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(customerId)}/product-lists/${encodeURIComponent(
                wishlistId as string
            )}/items/${encodeURIComponent(itemId as string)}`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status !== 204) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response;
    }

    async deleteAddress(siteId: string, addressId: string, accessToken: string, customerId: string) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(customerId as string)}/addresses/${encodeURIComponent(
                addressId
            )}?siteId=${encodeURIComponent(siteId as string)}`
        );

        const response = await fetch(fetchURL.toString(), {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status !== 204) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async getPublicWishlist(siteId: string, accessToken: string, wishlistId: string) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/product-lists/${encodeURIComponent(wishlistId as string)}`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (!response.ok) {
            console.trace(await response.json());
            throw new CommerceError("Internal Server Error");
        }

        return response.json();
    }

    async getWishlists(siteId: string, customerId: string, accessToken: string) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(customerId)}/product-lists`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (!response.ok) {
            console.trace(await response.json());
            throw new CommerceError("Internal Server Error");
        }

        return response.json();
    }

    async addWishlistsItem(
        siteId: string,
        customerId: string,
        accessToken: string,
        wishlistId: string,
        item: WishlistItemArgs
    ) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(customerId)}/product-lists/${encodeURIComponent(
                wishlistId
            )}/items`
        );

        const wishlistItemParams: { [key: string]: string | number | boolean } = { ...item };

        if ("storeId" in item) {
            delete wishlistItemParams.storeId;
            wishlistItemParams.c_storeId = item.storeId;
        }

        fetchURL.search = new URLSearchParams({
            siteId,
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(wishlistItemParams),
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async siteSearch(
        query: string,
        siteId: string,
        accessToken: string,
        locale: string,
        selectedStoreId?: string
    ) {
        const searchResultsLimit = 12;

        const searchURL = new URL(
            `${this.baseURL}/search/shopper-search/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/product-search`
        );

        const reqParams = new URLSearchParams({
            locale: locale,
            siteId: siteId,
            q: query,
            limit: searchResultsLimit.toString(),
            refine: `htype=product`,
        });

        if (selectedStoreId) {
            reqParams.append("refine", `cgid=${selectedStoreId}`);
        }

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "GET",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async createCustomerWishlist(siteId: string, customerId: string, accessToken: string) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${customerId}/product-lists?siteId=${encodeURIComponent(siteId)}`
        );

        const response = await fetch(fetchURL.toString(), {
            method: "POST",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                public: false,
                type: "wish_list",
            }),
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async updateCustomerPassword(
        siteId: string,
        customerId: string,
        accessToken: string,
        oldPassword: string,
        newPassword: string
    ) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(customerId)}/password`
        );

        fetchURL.search = new URLSearchParams({
            siteId,
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            method: "PUT",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                currentPassword: oldPassword,
                password: newPassword,
            }),
        });

        if (response.status !== 204) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response;
    }

    async getPaymentMethodsForBasket(basketId: string, siteId: string, accessToken: string, locale: string) {
        const searchURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/${basketId}/payment-methods`
        );

        const reqParams = new URLSearchParams({
            locale: locale,
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "GET",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async getShippingMethodsForBasket(
        basketId: string,
        shipmentId: string,
        siteId: string,
        accessToken: string,
        locale: string
    ) {
        const searchURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/${basketId}/shipments/${shipmentId}/shipping-methods`
        );

        const reqParams = new URLSearchParams({
            locale: locale,
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "GET",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async addShippingMethodToBasket(
        basketId: string,
        shipmentId: string,
        accessToken: string,
        siteId: string,
        shippingMethodId: string
    ) {
        const searchURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/${basketId}/shipments/${shipmentId}/shipping-method`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "PUT",
            redirect: "manual",
            body: JSON.stringify({
                id: shippingMethodId,
            }),
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async addShippingAddressToBasket(
        basketId: string,
        shipmentId: string,
        accessToken: string,
        siteId: string,
        shippingAddress: OrderAddressInput
    ) {
        const searchURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/${basketId}/shipments/${shipmentId}/shipping-address`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "PUT",
            redirect: "manual",
            body: JSON.stringify(shippingAddress),
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async addBillingAddressToBasket(
        basketId: string,
        accessToken: string,
        siteId: string,
        billingAddress: OrderAddressInput
    ) {
        const searchURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/${basketId}/billing-address`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "PUT",
            redirect: "manual",
            body: JSON.stringify(billingAddress),
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async addPaymentMethodToBasket(
        basketId: string,
        accessToken: string,
        siteId: string,
        paymentMethodId: string
    ) {
        const searchURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/${basketId}/payment-instruments`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "POST",
            redirect: "manual",
            body: JSON.stringify({
                paymentMethodId: paymentMethodId,
            }),
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async removePaymentInstrumentFromBasket(
        basketId: string,
        accessToken: string,
        siteId: string,
        paymentInstrumentId: string
    ) {
        const searchURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/${basketId}/payment-instruments/${paymentInstrumentId}`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "DELETE",
            redirect: "manual",
            body: JSON.stringify({
                paymentMethodId: paymentInstrumentId,
            }),
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async createOrder(accessToken: string, siteId: string, basketId: string) {
        const searchURL = new URL(
            `${this.baseURL}/checkout/shopper-orders/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/orders`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "POST",
            redirect: "manual",
            body: JSON.stringify({
                basketId: basketId,
            }),
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async getOrderConfirmationData(accessToken: string, siteId: string, locale: string, orderId: string) {
        const searchURL = new URL(
            `${this.baseURL}/checkout/shopper-orders/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/orders/${orderId}`
        );

        const reqParams = new URLSearchParams({
            locale: locale,
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "GET",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async getCustomerOrders(accessToken: string, siteId: string, customerId: string) {
        const fetchURL = new URL(
            `${this.baseURL}/customer/shopper-customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customers/${encodeURIComponent(customerId)}/orders`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        fetchURL.search = reqParams.toString();

        const response = await fetch(fetchURL.toString(), {
            method: "GET",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        const resJson = await response.json();

        if (!response.ok) {
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return resJson;
    }

    async transferBasket(accessToken: string, siteId: string) {
        const searchURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/actions/transfer`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
            overrideExisting: "true",
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "POST",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async addPriceBookToBasket(siteId: string, basketId: string, priceBookId: string) {
        const { accessToken } = await this.getAccessToken(["sfcc.shopper-baskets-orders.rw"]);

        const searchURL = new URL(
            `${this.baseURL}/checkout/shopper-baskets/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/baskets/${basketId}/price-books`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "PUT",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify([priceBookId]),
        });

        if (response.status !== 204) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response;
    }

    private async getAccessToken(scopes: string[]): Promise<{ accessToken: string }> {
        const fetchURL = new URL("https://account.demandware.com/dwsso/oauth2/access_token");

        fetchURL.search = new URLSearchParams({
            grant_type: "client_credentials",
            scope: `SALESFORCE_COMMERCE_API:${this.tenantId} ${scopes.join()}`,
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${this.SCAPIAdminApiClientId}:${this.SCAPIAdminApiClientSecret}`
                ).toString("base64")}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const resJson = await response.json();

        if (!response.ok) {
            console.trace(resJson);
            throw new CommerceError("Internal Server Error");
        }

        return { accessToken: resJson.access_token };
    }

    async updateCustomerProfileData(
        siteId: string,
        customerNo: string,
        profileData: {
            credentials: {
                login: string;
                enabled: boolean;
                locked: boolean;
            };
            lastName: string;
            firstName: string;
            phoneMobile: string;
            email: string;
        }
    ) {
        // siteId should be equal to customer list ID
        const fetchURL = new URL(
            `${this.baseURL}/customer/customers/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/customer-lists/${encodeURIComponent(siteId)}/customers/${encodeURIComponent(customerNo)}`
        );
        const { accessToken: BMAccessToken } = await this.getAccessToken(["sfcc.customerlists.rw"]);

        const response = await fetch(fetchURL.toString(), {
            method: "PATCH",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${BMAccessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...profileData, customerNo }),
        });

        if (!response.ok) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new CommerceError(resJson.detail, resJson.type);
        }

        return response.json();
    }
}
