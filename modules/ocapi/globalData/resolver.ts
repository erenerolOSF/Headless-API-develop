/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApolloError } from "apollo-server-errors";
import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { GraphQLContext, GraphQLDataSources } from "../../../types";
import { GlobalDataResponse, PreRendererdProduct } from "./types";

@Resolver()
export class GlobalDataResolver {
    @Query(() => GlobalDataResponse)
    async getGlobalData(
        @Arg("siteId", { nullable: false }) siteId: string,
        @Arg("locale", { nullable: false }) locale: string,
        @Ctx() context: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<GlobalDataResponse> {
        const { OSF_REFAPP_PREFERENCE_GROUP_ID, OSF_REFAPP_SITE_PREFERENCE_INSTANCE_TYPE } = process.env;

        const sitePreferences = await context.dataSources.ocapi.getSitePreferenceGroup(
            siteId,
            OSF_REFAPP_PREFERENCE_GROUP_ID,
            OSF_REFAPP_SITE_PREFERENCE_INSTANCE_TYPE
        );

        const footerJsonAssetId = sitePreferences.c_footerJsonAssetId;
        const menuJsonAssetId = sitePreferences.c_menuJsonAssetId;
        const storelocatorConfigs = sitePreferences.c_storelocatorConfigs;

        const { data } = await context.dataSources.ocapi.getContentAssets(
            [footerJsonAssetId, menuJsonAssetId],
            locale,
            siteId
        );

        const footerJsonData = data.find((asset: any) => asset.id === footerJsonAssetId);
        const menuJsonData = data.find((asset: any) => asset.id === menuJsonAssetId);

        const resData = {
            sitePreferences: {
                siteLogo: sitePreferences?.c_siteLogo?.abs_url ?? null,
                favicon_32: sitePreferences?.c_favicon_32x32?.abs_url ?? null,
                favicon_16: sitePreferences?.c_favicon_16x16?.abs_url ?? null,
                isWishlistEnabled: true,
            },
            footerData: footerJsonData.c_body ? JSON.parse(footerJsonData.c_body) : null,
            navigationData: menuJsonData.c_body ? JSON.parse(menuJsonData.c_body) : null,
            storelocatorConfigs: storelocatorConfigs ? JSON.parse(storelocatorConfigs) : null,
        };

        return { globalData: JSON.stringify(resData) };
    }

    @Query(() => [PreRendererdProduct])
    async getIsrPreRenderedPdps(
        @Arg("siteId") siteId: string,
        @Arg("locale") locale: string,
        @Ctx() { dataSources, user }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const { OSF_REFAPP_PREFERENCE_GROUP_ID, OSF_REFAPP_SITE_PREFERENCE_INSTANCE_TYPE } = process.env;

        const sitePreferences = await dataSources.ocapi.getSitePreferenceGroup(
            siteId,
            OSF_REFAPP_PREFERENCE_GROUP_ID,
            OSF_REFAPP_SITE_PREFERENCE_INSTANCE_TYPE
        );

        const productIds = sitePreferences.c_pdpsToPrerender
            ? JSON.parse(sitePreferences.c_pdpsToPrerender).products
            : [];

        const result = [];

        for (const id of productIds) {
            const { name } = await dataSources.CommerceAPIDataSource.getProduct(
                siteId,
                id,
                user.accessToken,
                locale
            );

            result.push({
                id,
                name,
            });
        }

        return result;
    }

    @Query(() => [String])
    async getIsrPreRenderedPlps(
        @Arg("siteId") siteId: string,
        @Ctx() { dataSources }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const { OSF_REFAPP_PREFERENCE_GROUP_ID, OSF_REFAPP_SITE_PREFERENCE_INSTANCE_TYPE } = process.env;

        let sitePreferences;

        try {
            sitePreferences = await dataSources.ocapi.getSitePreferenceGroup(
                siteId,
                OSF_REFAPP_PREFERENCE_GROUP_ID,
                OSF_REFAPP_SITE_PREFERENCE_INSTANCE_TYPE
            );
        } catch (err) {
            console.error(err);
            throw new ApolloError("Internal Server Error", "INTERNAL_SERVER_ERROR");
        }

        return sitePreferences.c_plpsToPrerender
            ? JSON.parse(sitePreferences.c_plpsToPrerender)?.categories
            : [];
    }

    @Query(() => [String])
    async getIsrPreRenderedClps(
        @Arg("siteId") siteId: string,
        @Ctx() { dataSources }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const { OSF_REFAPP_PREFERENCE_GROUP_ID, OSF_REFAPP_SITE_PREFERENCE_INSTANCE_TYPE } = process.env;
        let sitePreferences;

        try {
            sitePreferences = await dataSources.ocapi.getSitePreferenceGroup(
                siteId,
                OSF_REFAPP_PREFERENCE_GROUP_ID,
                OSF_REFAPP_SITE_PREFERENCE_INSTANCE_TYPE
            );
        } catch (err) {
            console.error(err);
        }

        return sitePreferences.c_clpsToPrerender
            ? JSON.parse(sitePreferences.c_clpsToPrerender)?.categories
            : [];
    }
}
