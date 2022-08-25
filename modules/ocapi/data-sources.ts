/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource } from "apollo-datasource";
import { URL, URLSearchParams } from "url";
import fetch from "make-fetch-happen";

import { StoreSearchArgs } from "./types";
import { ApolloError } from "apollo-server-errors";

export class OpenCommerceAPIDataSource extends DataSource {
    constructor(
        private readonly baseURL: string,
        private readonly clientId: string,
        private readonly clientSecret: string,
        private readonly bmUser: string,
        private readonly bmPassword: string
    ) {
        super();
    }

    /**
     * @param latitude,
     * @param longitude,
     * @param locale current locale,
     * @param maxDistance maximum distance around the coordinates that the search will be performed,
     * @param siteId current siteId
     * @return {*}  {Promise<Store[]>}
     */
    async storeSearch({
        latitude,
        locale,
        longitude,
        maxDistance,
        siteId,
        accessToken,
    }: StoreSearchArgs): Promise<any> {
        try {
            const fetchURL = new URL(`${this.baseURL}/s/${siteId}/dw/shop/v21_3/stores`);

            fetchURL.search = new URLSearchParams({
                latitude,
                longitude,
                locale,
                max_distance: maxDistance,
                client_id: this.clientId,
            }).toString();

            const response = await fetch(fetchURL.toString(), {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const responseJSON = await response.json();

            if (responseJSON?.fault?.message) {
                throw new ApolloError(responseJSON.fault.message, "INTERNAL_SERVER_ERROR");
            }

            const { data } = responseJSON;

            return data;
        } catch (error) {
            console.trace(error);

            throw new ApolloError("Internal Server Error", "INTERNAL_SERVER_ERROR");
        }
    }

    async getStoreById(storeId: string, siteId: string, accessToken: string): Promise<any> {
        try {
            const fetchURL = new URL(
                `${this.baseURL}/s/${encodeURIComponent(siteId)}/dw/shop/v21_3/stores/${encodeURIComponent(
                    storeId
                )}`
            );

            const response = await fetch(fetchURL.toString(), {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            return response.json();
        } catch (error) {
            console.trace(error);

            throw new ApolloError("Internal Server Error", "INTERNAL_SERVER_ERROR");
        }
    }

    private async getDataApiAccessToken(): Promise<{ accessToken: string }> {
        const accessTokenUrl = new URL(
            `https://account.demandware.com/dwsso/oauth2/access_token?grant_type=client_credentials`
        );

        const response = await fetch(accessTokenUrl.toString(), {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
                    "base64"
                )}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.trace(responseData);
            throw new ApolloError("Internal Server Error", "INTERNAL_SERVER_ERROR");
        }

        return { accessToken: responseData.access_token };
    }

    async getSitePreferenceGroup(
        siteId: string,
        prefernceGroupId: string,
        preferenceGroupInstanceType: string
    ): Promise<any> {
        const { accessToken } = await this.getDataApiAccessToken();

        const fetchURL = new URL(
            `${
                this.baseURL
            }/s/-/dw/data/v21_9/sites/${siteId}/site_preferences/preference_groups/${encodeURIComponent(
                prefernceGroupId
            )}/${encodeURIComponent(preferenceGroupInstanceType)}`
        );

        const sitePreferencesResponse = await fetch(fetchURL.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!sitePreferencesResponse.ok) {
            console.trace(await sitePreferencesResponse.json());
            throw new ApolloError("Internal Server Error", "INTERNAL_SERVER_ERROR");
        }

        return sitePreferencesResponse.json();
    }

    async getContentAssets(assetsIds: string[], locale: string, siteId: string): Promise<any> {
        const accessToken = await this.getDataApiAccessToken();

        const fetchURL = new URL(
            `${this.baseURL}/s/${encodeURIComponent(siteId)}/dw/shop/v21_3/content/(${assetsIds.join(
                ","
            )})?client_id=${encodeURIComponent(this.clientId)}&locale=${encodeURIComponent(locale)}`
        );

        const response = await fetch(fetchURL.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            console.trace(await response.json());
            throw new ApolloError("Internal Server Error", "INTERNAL_SERVER_ERROR");
        }

        return response.json();
    }

    private async getBMUserAccessToken() {
        const fetchURL = new URL(`${this.baseURL}/dw/oauth2/access_token`);

        fetchURL.search = new URLSearchParams({
            client_id: this.clientId,
            grant_type: "urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken",
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${this.bmUser}:${this.bmPassword}:${this.clientSecret}`
                ).toString("base64")}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (!response.ok) {
            console.trace(await response.json());
            throw new ApolloError("Internal Server Error", "INTERNAL_SERVER_ERROR");
        }

        const resJson = await response.json();

        return { BMAccessToken: resJson.access_token };
    }

    async priceAdjustment(
        siteId: string,
        basketId: string,
        lineItemId: string,
        lineItemText: string,
        amount: number
    ) {
        const { BMAccessToken } = await this.getBMUserAccessToken();

        const fetchURL = new URL(
            `${this.baseURL}/s/${encodeURIComponent(siteId)}/dw/shop/v21_3/baskets/${encodeURIComponent(
                basketId
            )}/price_adjustments`
        );

        const response = await fetch(fetchURL.toString(), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BMAccessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                discount: {
                    type: "fixed_price",
                    value: amount,
                },
                item_id: lineItemId,
                item_text: lineItemText,
                level: "product",
                reason_code: "PRICE_MATCH",
            }),
        });

        if (!response.ok) {
            console.trace(await response.json());
            throw new ApolloError("Internal Server Error", "INTERNAL_SERVER_ERROR");
        }

        const resJson = await response.json();

        return resJson;
    }
}
