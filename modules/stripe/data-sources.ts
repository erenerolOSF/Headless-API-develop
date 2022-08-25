import { DataSource } from "apollo-datasource";
import fetch from "make-fetch-happen";
import { URL, URLSearchParams } from "url";
import { ApolloError } from "apollo-server-errors";

export const categoryFilterKey = "cgid";

export class StripeCommerceAPIDataSource extends DataSource {
    constructor(
        private readonly OCAPIClientId: string,
        private readonly stripePaymentInstrumentId: string,
        private readonly baseURL: string,
        private readonly organizationId: string,
        private readonly OCAPIClientSecret: string,
        private readonly tenantId: string
    ) {
        super();
    }

    private async getClientCredentialsGrant(): Promise<{ accessToken: string }> {
        const fetchURL = new URL("https://account.demandware.com/dwsso/oauth2/access_token");

        fetchURL.search = new URLSearchParams({
            grant_type: "client_credentials",
            scope: `SALESFORCE_COMMERCE_API:${this.tenantId} sfcc.orders.rw`,
        }).toString();

        const response = await fetch(fetchURL.toString(), {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${this.OCAPIClientId}:${this.OCAPIClientSecret}`
                ).toString("base64")}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.trace(responseData);
            throw new ApolloError("Internal Server Error");
        }

        return { accessToken: responseData.access_token };
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
            throw new ApolloError(resJson.detail, resJson.type);
        }

        return response.json();
    }

    async updateOrderPaymentStatus(siteId: string, orderNumber: string, status: string) {
        const clientCredentialsGrant = await this.getClientCredentialsGrant();
        const clientCredentialsGrantAccessToken = clientCredentialsGrant.accessToken;

        const searchURL = new URL(
            `${this.baseURL}/checkout/orders/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/orders/${orderNumber}/payment-status`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "PUT",
            redirect: "manual",
            body: JSON.stringify({
                status: status,
            }),
            headers: {
                Authorization: `Bearer ${clientCredentialsGrantAccessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 204) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new ApolloError(resJson.detail, resJson.type);
        }

        return response;
    }

    async getOrder(siteId: string, orderNumber: string) {
        const { accessToken } = await this.getClientCredentialsGrant();

        const searchURL = new URL(
            `${this.baseURL}/checkout/orders/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/orders/${orderNumber}`
        );

        const reqParams = new URLSearchParams({
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

        const resJson = await response.json();

        if (response.status !== 200) {
            console.trace(resJson);
            throw new ApolloError(resJson.detail, resJson.type);
        }

        return resJson;
    }

    async putStripePaymentIntentIdOnOrder(
        siteId: string,
        orderNumber: string,
        stripePaymentIntentId: string
    ) {
        const clientCredentialsGrant = await this.getClientCredentialsGrant();
        const clientCredentialsGrantAccessToken = clientCredentialsGrant.accessToken;

        const orderSearchURL = new URL(
            `${this.baseURL}/checkout/orders/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/orders/${orderNumber}`
        );

        const orderReqParams = new URLSearchParams({
            siteId: siteId,
        });

        orderSearchURL.search = orderReqParams.toString();

        const orderResponse = await fetch(orderSearchURL.toString(), {
            method: "GET",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${clientCredentialsGrantAccessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (orderResponse.status !== 200) {
            const resJson = await orderResponse.json();
            console.trace(resJson);
            throw new ApolloError(resJson.detail, resJson.type);
        }

        const order = await orderResponse.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paymentInstrument = order?.paymentInstruments?.filter((paymentInstrument: any) => {
            return paymentInstrument.paymentMethodId === this.stripePaymentInstrumentId;
        })[0];

        if (!paymentInstrument) {
            throw new ApolloError("No payment instrument found for order");
        }

        const stripePaymentInstrumentId = paymentInstrument.paymentInstrumentId;

        const paymentInstrumentSearchURL = new URL(
            `${this.baseURL}/checkout/orders/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/orders/${orderNumber}/payment-instruments/${stripePaymentInstrumentId}`
        );

        const paymentInstrumentReqParams = new URLSearchParams({
            siteId: siteId,
        });

        paymentInstrumentSearchURL.search = paymentInstrumentReqParams.toString();

        const paymentInstrumentResponse = await fetch(paymentInstrumentSearchURL.toString(), {
            method: "PATCH",
            redirect: "manual",
            body: JSON.stringify({
                c_stripePaymentIntentID: stripePaymentIntentId,
            }),
            headers: {
                Authorization: `Bearer ${clientCredentialsGrantAccessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (paymentInstrumentResponse.status !== 204) {
            const resJson = await paymentInstrumentResponse.json();
            console.trace(resJson);
            throw new ApolloError(resJson.detail, resJson.type);
        }

        return paymentInstrumentResponse;
    }

    async updateOrderStatus(siteId: string, orderNumber: string, status: string) {
        const clientCredentialsGrant = await this.getClientCredentialsGrant();
        const clientCredentialsGrantAccessToken = clientCredentialsGrant.accessToken;

        const searchURL = new URL(
            `${this.baseURL}/checkout/orders/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/orders/${orderNumber}/status`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "PUT",
            redirect: "manual",
            body: JSON.stringify({
                status: status,
            }),
            headers: {
                Authorization: `Bearer ${clientCredentialsGrantAccessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 204) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new ApolloError(resJson.detail, resJson.type);
        }

        return {
            status: "ok",
        };
    }

    async updateOrderConfirmationStatus(siteId: string, orderNumber: string, status: string) {
        const clientCredentialsGrant = await this.getClientCredentialsGrant();
        const clientCredentialsGrantAccessToken = clientCredentialsGrant.accessToken;

        const searchURL = new URL(
            `${this.baseURL}/checkout/orders/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/orders/${orderNumber}/confirmation-status`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const response = await fetch(searchURL.toString(), {
            method: "PUT",
            redirect: "manual",
            body: JSON.stringify({
                status: status,
            }),
            headers: {
                Authorization: `Bearer ${clientCredentialsGrantAccessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 204) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new ApolloError(resJson.detail, resJson.type);
        }

        return response;
    }

    async updateOrder(siteId: string, orderNumber: string, payload: { [key: string]: string | number }) {
        const clientCredentialsGrant = await this.getClientCredentialsGrant();
        const clientCredentialsGrantAccessToken = clientCredentialsGrant.accessToken;

        const searchURL = new URL(
            `${this.baseURL}/checkout/orders/v1/organizations/${encodeURIComponent(
                this.organizationId as string
            )}/orders/${orderNumber}`
        );

        const reqParams = new URLSearchParams({
            siteId: siteId,
        });

        searchURL.search = reqParams.toString();

        const body: { [key: string]: string | number } = {};

        if (payload.storeId) {
            body.c_storeId = payload.storeId;
        }

        if (payload.storeName) {
            body.c_storeName = payload.storeName;
        }

        const response = await fetch(searchURL.toString(), {
            method: "PATCH",
            redirect: "manual",
            headers: {
                Authorization: `Bearer ${clientCredentialsGrantAccessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (response.status !== 204) {
            const resJson = await response.json();
            console.trace(resJson);
            throw new ApolloError(resJson.detail, resJson.type);
        }

        return response;
    }
}
