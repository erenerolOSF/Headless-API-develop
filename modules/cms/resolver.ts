import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { GraphQLContext, GraphQLDataSources } from "../../types";
import { ApolloError } from "apollo-server-errors";
import PageDesignerTranslator from "./pageDesigner/cms-translator";

@Resolver()
export class CMSResolver {
    @Query(() => String)
    getContentData(
        @Arg("cmsId") cmsId: string,
        @Arg("contentId") contentId: string,
        @Arg("siteId") siteId: string,
        @Arg("locale") locale: string,
        @Ctx() { dataSources }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): string {
        console.log(cmsId, contentId, siteId, locale);
        let contentComponentsData = "";
        if (cmsId == "pageDesigner") {
            contentComponentsData = PageDesignerTranslator.getContentById(
                contentId,
                siteId,
                locale,
                dataSources.PageDesignerCMSDataSource
            );

            return JSON.stringify(contentComponentsData);
        }

        throw new ApolloError("We do not have BD connector for this cmsId", "CONTENT_NOT_FOUND");
    }
}
