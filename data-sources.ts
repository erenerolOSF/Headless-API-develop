import { CommerceAPIDataSource } from "./modules/commerce";
import { OpenCommerceAPIDataSource } from "./modules/ocapi";
import { StripeCommerceAPIDataSource } from "./modules/stripe";
import { PageDesignerCMSDataSource } from "./modules/cms/pageDesigner/data-sources";

const {
    OCAPI_BM_USER,
    OCAPI_BM_PASSWORD,
    OCAPI_CLIENT_SECRET,
    OCAPI_CLIENT_ID,
    OCAPI_URL,
    COMMERCE_API_URL,
    COMMERCE_API_CLIENT_ID,
    COMMERCE_API_CLIENT_SECRET,
    COMMERCE_API_TENANT_ID,
    COMMERCE_API_ORGANIZATION_ID,
    STRIPE_PAYMENT_INSTRUMENT_ID,
} = process.env;

export function dataSources() {
    return {
        PageDesignerCMSDataSource: new PageDesignerCMSDataSource(),
        ocapi: new OpenCommerceAPIDataSource(
            OCAPI_URL as string,
            OCAPI_CLIENT_ID as string,
            OCAPI_CLIENT_SECRET,
            OCAPI_BM_USER as string,
            OCAPI_BM_PASSWORD as string
        ),
        CommerceAPIDataSource: new CommerceAPIDataSource(
            COMMERCE_API_URL,
            COMMERCE_API_ORGANIZATION_ID,
            COMMERCE_API_CLIENT_ID,
            COMMERCE_API_CLIENT_SECRET,
            OCAPI_CLIENT_ID,
            OCAPI_CLIENT_SECRET,
            COMMERCE_API_TENANT_ID
        ),
        StripeCommerceAPIDataSource: new StripeCommerceAPIDataSource(
            OCAPI_CLIENT_ID,
            STRIPE_PAYMENT_INSTRUMENT_ID,
            COMMERCE_API_URL,
            COMMERCE_API_ORGANIZATION_ID,
            OCAPI_CLIENT_SECRET,
            COMMERCE_API_TENANT_ID
        ),
    };
}
