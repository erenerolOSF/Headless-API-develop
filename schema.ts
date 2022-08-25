import "reflect-metadata";
import { buildSchemaSync } from "type-graphql";
import {
    PingResolver,
    AuthenticationResolver,
    CommerceUserResolver,
    ProductResolver,
    CategoryResolver,
    BasketResolver,
    CheckoutResolver,
} from "./modules/commerce";
import { SearchResolver } from "./modules/commerce/search/resolver";

import { StripeResolver } from "./modules/stripe";

import { CMSResolver } from "./modules/cms";

import { StoreResolver, GlobalDataResolver } from "./modules/ocapi";

export const schema = buildSchemaSync({
    resolvers: [
        CMSResolver,
        StoreResolver,
        CategoryResolver,
        PingResolver,
        AuthenticationResolver,
        CommerceUserResolver,
        GlobalDataResolver,
        ProductResolver,
        BasketResolver,
        SearchResolver,
        CheckoutResolver,
        StripeResolver,
    ],
});
