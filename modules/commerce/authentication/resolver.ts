import Cookies from "cookies";
import { Arg, Args, Ctx, Mutation, Resolver } from "type-graphql";

import { GraphQLContext, GraphQLDataSources } from "../../../types";
import { LoginEndResponse, LoginStartResponse, LogoutResponse, RegisterResponse } from "./types";
import { guestLogin } from "../../../context";
import { RegisterArgs } from "./input";

@Resolver()
export class AuthenticationResolver {
    @Mutation(() => LoginStartResponse)
    async loginStart(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Arg("codeChallenge") codeChallenge: string,
        @Arg("siteId") siteId: string,
        @Arg("commerceRedirectUrl") commerceRedirectUrl: string,
        @Ctx()
        { req, res, dataSources }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<LoginStartResponse> {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const guestUsid = cookies.get("session.usid", { signed: true });

        return dataSources.CommerceAPIDataSource.loginStart(
            codeChallenge,
            siteId,
            username,
            guestUsid,
            password,
            commerceRedirectUrl
        );
    }

    @Mutation(() => LoginEndResponse)
    async loginEnd(
        @Arg("code") code: string,
        @Arg("codeVerifier") codeVerifier: string,
        @Arg("usid") usid: string,
        @Arg("siteId") siteId: string,
        @Arg("commerceRedirectUrl") commerceRedirectUrl: string,
        @Ctx() { req, res, dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<LoginEndResponse> {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const loginEndData = await dataSources.CommerceAPIDataSource.loginEnd(
            code,
            codeVerifier,
            usid,
            commerceRedirectUrl
        );

        const {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: expiresIn,
            usid: loggedInUsid,
            customer_id: customerId,
        } = loginEndData;

        /*
         * transfer basket to the logged in user if the guest user had a basket
         * */
        const basketsRes = await dataSources.CommerceAPIDataSource.getCustomerBaskets(
            siteId,
            user.accessToken,
            user.customerId
        );

        if ("baskets" in basketsRes) {
            await dataSources.CommerceAPIDataSource.transferBasket(accessToken, siteId);
        }

        const now = new Date();
        /* Expires 90 days from "now" */
        const refreshTokenExpire = new Date(now.setDate(now.getDate() + 90));

        cookies.set("session.accessToken", accessToken, {
            signed: true,
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development" ? true : false,
            sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
            /* Expires 29 minutes from "now" */
            expires: new Date((Math.floor(Date.now() / 1000) + (expiresIn - 60)) * 1000),
        });

        cookies.set("session.refreshToken", refreshToken, {
            signed: true,
            expires: refreshTokenExpire,
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development" ? true : false,
            sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
        });

        cookies.set("session.customerId", customerId, {
            signed: true,
            expires: refreshTokenExpire,
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development" ? true : false,
            sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
        });

        cookies.set("session.usid", loggedInUsid, {
            signed: true,
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development" ? true : false,
            sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
            expires: refreshTokenExpire,
        });

        const userData = await dataSources.CommerceAPIDataSource.getUser(siteId, customerId, accessToken);

        return {
            firstName: userData?.firstName ?? null,
            lastName: userData?.lastName ?? null,
            isLoggedIn: userData.authType === "registered",
        };
    }

    @Mutation(() => RegisterResponse)
    async register(
        @Args() { customer, password, siteId }: RegisterArgs,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const data = await dataSources.CommerceAPIDataSource.register({
            accessToken: user.accessToken,
            password,
            siteId,
            customer: { ...customer, login: customer.email },
        });

        return { email: data.email };
    }

    @Mutation(() => LogoutResponse)
    async logout(
        @Arg("siteId") siteId: string,
        @Ctx() { req, res, dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        await guestLogin(cookies);

        await dataSources.CommerceAPIDataSource.logout(user.accessToken, user.refreshToken, siteId);

        return { isLoggedIn: false };
    }
}
