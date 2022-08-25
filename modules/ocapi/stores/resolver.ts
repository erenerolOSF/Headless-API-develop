/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApolloError } from "apollo-server-errors";
import Cookies from "cookies";
import { Resolver, Query, Ctx, Args, Mutation, Arg } from "type-graphql";
import { GraphQLContext, GraphQLDataSources } from "../../../types";
import { GetStoresByCoordinatesArgs } from "./input";
import { SetSelectedStoreResponse, Store } from "./types";

@Resolver(() => Store)
export class StoreResolver {
    @Query(() => [Store], { description: "Returns stores near the provided coordinates." })
    async getStoresByCoordinates(
        @Args()
        { latitude, longitude, deliveryMethodId, locale, maxDistance, siteId }: GetStoresByCoordinatesArgs,
        @Ctx() context: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Store[]> {
        const stores = await context.dataSources.ocapi.storeSearch({
            latitude,
            longitude,
            locale,
            maxDistance,
            siteId,
            accessToken: context.user.accessToken,
        });

        return stores
            .filter((store: any) => {
                if (!store.c_deliveryMethods) return false;
                return store.c_deliveryMethods.indexOf(deliveryMethodId) !== -1;
            })
            .map((store: any): Store[] => {
                return {
                    ...store,
                    deliveryMethods: store.c_deliveryMethods,
                    imgMobile: store?.c_imgMobile ?? null,
                    imgDesktop: store?.c_imgDesktop ?? null,
                    icon: store?.c_icon ?? null,
                    features: store.c_features ? JSON.parse(store.c_features) : null,
                };
            });
    }

    @Mutation(() => SetSelectedStoreResponse)
    async setSelectedStoreId(
        @Arg("storeId") storeId: string,
        @Ctx() { req, res, dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources },
        @Arg("siteId", { nullable: true }) siteId?: string,
        @Arg("basketId", { nullable: true }) basketId?: string
    ): Promise<{ status: string }> {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        cookies.set("session.selectedStoreId", storeId, {
            signed: true,
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development" ? true : false,
            sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        });

        if (basketId && siteId) {
            await dataSources.CommerceAPIDataSource.deleteBasket(siteId, user.accessToken, basketId);
        }

        return { status: "OK" };
    }

    @Query(() => Store, { description: "Return the currently selected store." })
    async getSelectedStore(
        @Arg("siteId") siteId: string,
        @Ctx() context: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Store> {
        const cookies = new Cookies(context.req, context.res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const selectedStoreId = cookies.get("session.selectedStoreId", { signed: true });

        if (!selectedStoreId) {
            throw new ApolloError("No store selected.", "NO_STORE_SELECTED");
        }

        const storeRes = await context.dataSources.ocapi.getStoreById(
            selectedStoreId,
            siteId,
            context.user.accessToken
        );

        if (!storeRes) {
            throw new ApolloError("No store selected.", "NO_STORE_SELECTED");
        }

        return {
            ...storeRes,
            deliveryMethods: storeRes.c_deliveryMethods,
            imgMobile: storeRes?.c_imgMobile ?? null,
            imgDesktop: storeRes?.c_imgDesktop ?? null,
            icon: storeRes?.c_icon ?? null,
            features: storeRes.c_features ? JSON.parse(storeRes.c_features) : null,
        };
    }

    @Query(() => Store, { description: "Return the store with the provided ID." })
    async getStoreById(
        @Arg("storeId") storeId: string,
        @Arg("siteId") siteId: string,
        @Ctx() context: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Store> {
        const store = await context.dataSources.ocapi.getStoreById(storeId, siteId, context.user.accessToken);

        return {
            ...store,
            deliveryMethods: store.c_deliveryMethods,
            imgMobile: store?.c_imgMobile ?? null,
            imgDesktop: store?.c_imgDesktop ?? null,
            icon: store?.c_icon ?? null,
            features: store.c_features ? JSON.parse(store.c_features) : null,
        };
    }
}
