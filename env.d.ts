declare namespace NodeJS {
    interface ProcessEnv {
        COOKIES_SIGNATURE_KEY: string;
        COMMERCE_API_URL: string;
        COMMERCE_API_ORGANIZATION_ID: string;
        COMMERCE_API_CLIENT_ID: string;
        COMMERCE_API_CLIENT_SECRET: string;
        COMMERCE_API_TENANT_ID: string;
        OCAPI_CLIENT_ID: string;
        OCAPI_CLIENT_SECRET: string;
        OCAPI_URL: string;
        OSF_REFAPP_SITE_PREFERENCE_INSTANCE_TYPE: string;
        OSF_REFAPP_PREFERENCE_GROUP_ID: string;
        OCAPI_BM_USER: string;
        OCAPI_BM_PASSWORD: string;
        STRIPE_SECRET: string;
        STRIPE_WEBHOOK_SECRET: string;
        STRIPE_PAYMENT_INSTRUMENT_ID: string;
    }
}
