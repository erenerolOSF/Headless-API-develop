import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CommerceAPIDataSource } from "./modules/commerce";
import { CommerceUser } from "./modules/commerce/dto/CommerceUser";
import { OpenCommerceAPIDataSource } from "./modules/ocapi";
import { StripeCommerceAPIDataSource } from "./modules/stripe";
import { PageDesignerCMSDataSource } from "./modules/cms/pageDesigner/data-sources";

export interface GraphQLContextArgs {
    req: VercelRequest;
    res: VercelResponse;
}

export interface GraphQLDataSources {
    PageDesignerCMSDataSource: PageDesignerCMSDataSource;
    ocapi: OpenCommerceAPIDataSource;
    CommerceAPIDataSource: CommerceAPIDataSource;
    StripeCommerceAPIDataSource: StripeCommerceAPIDataSource;
}

export interface GraphQLContext {
    user: CommerceUser;
    req: VercelRequest;
    res: VercelResponse;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    usid: string;
    customer_id: string;
}
