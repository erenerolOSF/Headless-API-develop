/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from "cookies";
import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { GraphQLContext, GraphQLDataSources } from "../../../types";
import { toPrice } from "../basket/resolver";
import { SearchResult } from "./types";

@Resolver()
export class SearchResolver {
    @Query(() => SearchResult)
    async getSearchResults(
        @Arg("query") query: string,
        @Arg("siteId") siteId: string,
        @Arg("locale") locale: string,
        @Ctx() context: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<SearchResult> {
        const cookies = new Cookies(context.req, context.res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const selectedStoreId = cookies.get("session.selectedStoreId", { signed: true });

        const results = await context.dataSources.CommerceAPIDataSource.siteSearch(
            query,
            siteId,
            context.user.accessToken,
            locale,
            selectedStoreId
        );

        const inventoryId = selectedStoreId ? `${selectedStoreId}-inventory` : "default-inventory";
        const priceBookId = selectedStoreId ? `pricebook-${selectedStoreId}` : undefined;

        const productResults = await context.dataSources.CommerceAPIDataSource.getProducts(
            siteId,
            context.user.accessToken,
            results.hits.map((hit: any) => hit.productId),
            locale,
            inventoryId
        );

        const productSearchResults =
            productResults.data?.map((product: any) => {
                const defaultImageGroup = product.imageGroups?.filter((imageGroup: any) => {
                    return imageGroup?.viewType == "default";
                })[0]?.images[0];

                const itemPrice =
                    product?.tieredPrices?.find((tier: any) => tier.pricebook === priceBookId)?.price ?? null;

                return {
                    id: product.id,
                    name: product.name,
                    image: defaultImageGroup
                        ? {
                              alt: defaultImageGroup.alt,
                              link: defaultImageGroup.link,
                              title: defaultImageGroup.title,
                          }
                        : null,
                    price: itemPrice ? toPrice(itemPrice, product.currency).toFormat() : null,
                    isAvailableInStore:
                        (inventoryId &&
                            product?.inventories?.find((inventory: any) => inventoryId === inventory.id)
                                ?.orderable) ??
                        false,
                };
            }) ?? [];

        const categoriesHits = results.refinements.find((element: any) => {
            return element.attributeId === "cgid";
        });

        const categorySearchResults =
            categoriesHits?.values?.reduce((acc: any, hit: any) => {
                return [
                    ...acc,
                    ...(hit?.values?.map((el: any) => {
                        return {
                            id: el.value,
                            name: el.label,
                        };
                    }) ?? []),
                ];
            }, []) ?? [];

        return {
            productSearchResults,
            categorySearchResults,
        };
    }
}
