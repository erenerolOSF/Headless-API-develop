import { Buffer } from "buffer";
import Cookies from "cookies";
import fetch from "make-fetch-happen";

import type { GraphQLContextArgs, GraphQLContext, TokenResponse } from "./types";
import { CommerceUser } from "./modules/commerce/dto/CommerceUser";
import { URLSearchParams } from "url";
import { CommerceError } from "./modules/commerce/errors";

const {
    COOKIES_SIGNATURE_KEY,
    COMMERCE_API_URL,
    COMMERCE_API_ORGANIZATION_ID,
    COMMERCE_API_CLIENT_ID,
    COMMERCE_API_CLIENT_SECRET,
} = process.env;

const authURL = `${COMMERCE_API_URL}/shopper/auth/v1/organizations/${encodeURIComponent(
    COMMERCE_API_ORGANIZATION_ID as string
)}/oauth2/token`;

/**
 * @description Logs in customer as a guest
 * @param {Cookies} cookies
 */
export async function guestLogin(cookies: Cookies) {
    const fetchURL = new URL(authURL);
    const params = new URLSearchParams({
        grant_type: "client_credentials",
    });

    fetchURL.search = params.toString();

    const response = await fetch(fetchURL.toString(), {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(
                `${COMMERCE_API_CLIENT_ID}:${COMMERCE_API_CLIENT_SECRET}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    const responseJson: TokenResponse = await response.json();

    if (!response.ok) {
        console.trace(responseJson);
        throw new CommerceError("Internal Server Error");
    }

    const {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        usid,
        customer_id: customerId,
    } = responseJson;

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

    cookies.set("session.usid", usid, {
        signed: true,
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development" ? true : false,
        sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
        expires: refreshTokenExpire,
    });

    return {
        accessToken,
        refreshToken,
        usid,
        customerId,
    };
}

/**
 *  @description Runs before each resolver is triggered
 *  Data returned is available in every resolver
 *  Currently used to power login flow
 *
 */
export async function context({ req, res }: GraphQLContextArgs): Promise<GraphQLContext> {
    const cookies = new Cookies(req, res, { keys: [COOKIES_SIGNATURE_KEY as string], secure: true });
    const accessToken = cookies.get("session.accessToken", { signed: true });
    const refreshToken = cookies.get("session.refreshToken", { signed: true });
    const customerId = cookies.get("session.customerId", { signed: true });
    const usid = cookies.get("session.usid", { signed: true });

    if (!refreshToken) {
        const { accessToken, refreshToken, usid, customerId } = await guestLogin(cookies);

        return {
            user: new CommerceUser(accessToken, refreshToken, customerId, usid),
            req,
            res,
        };
    }

    if (!accessToken && usid && customerId) {
        const fetchURL = new URL(authURL);

        fetchURL.search = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }).toString();

        const refreshTokenRes = await fetch(fetchURL.toString(), {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${COMMERCE_API_CLIENT_ID}:${COMMERCE_API_CLIENT_SECRET}`
                ).toString("base64")}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (refreshTokenRes.ok) {
            const { access_token: accessToken, expires_in: expiresIn }: TokenResponse =
                await refreshTokenRes.json();

            cookies.set("session.accessToken", accessToken, {
                signed: true,
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development" ? true : false,
                sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
                /* Expires 29 minutes from "now" */
                expires: new Date((Math.floor(Date.now() / 1000) + (expiresIn - 60)) * 1000),
            });

            return {
                user: new CommerceUser(accessToken, refreshToken, customerId, usid),
                req,
                res,
            };
        } else if (refreshTokenRes.status === 401) {
            const { accessToken, refreshToken, usid, customerId } = await guestLogin(cookies);

            return {
                user: new CommerceUser(accessToken, refreshToken, customerId, usid),
                req,
                res,
            };
        } else {
            console.trace(await refreshTokenRes.json());
            throw new CommerceError("Internal Server Error");
        }
    }

    if (accessToken && refreshToken && usid && customerId) {
        return {
            user: new CommerceUser(accessToken, refreshToken, customerId, usid),
            req,
            res,
        };
    }

    console.trace("Something went wrong getting cookies ");
    throw new CommerceError("Internal Server Error");
}
