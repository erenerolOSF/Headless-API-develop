/* eslint-disable @typescript-eslint/no-explicit-any */
import { Query, Resolver, Ctx, Args, Arg } from "type-graphql";
import { GraphQLContext, GraphQLDataSources } from "../../../types";
import { getPlpDataArgs } from "./input";
import { PlpData, PlpFilter, ClpData } from "./types";
import { categoryFilterKey } from "../data-sources";
import { toPrice } from "../basket/resolver";
import { CommerceError } from "../errors";
import Cookies from "cookies";

export const parseProductHit = (
    productHits: any,
    pricebookId: string | undefined,
    inventoryId: string | undefined
) => {
    return productHits?.data
        ? productHits?.data.map((productItem: any) => {
              const defaultImageGroup = productItem.imageGroups?.filter((imageGroup: any) => {
                  return imageGroup?.viewType == "default";
              })[0]?.images[0];

              const variationWeightValues = productItem?.variationAttributes?.find(
                  (attribute: any) => attribute.id === "weight"
              )?.values;

              if (!variationWeightValues) {
                  console.trace(
                      `Product ID: "${productItem.id}" has no weight values, Please check this product configuration / category assignation.`
                  );

                  throw new CommerceError("INTERNAL SERVER ERROR");
              }

              const itemPrice =
                  productItem?.tieredPrices?.find((tier: any) => tier.pricebook === pricebookId)?.price ??
                  null;

              return {
                  id: productItem.id || "",
                  name: productItem.name || "",
                  description: productItem.shortDescription || "",
                  price: itemPrice ? toPrice(itemPrice, productItem.currency).toFormat() : null,
                  weight:
                      variationWeightValues.find(
                          (item: any) => item.value === productItem.variationValues.weight
                      )?.name ?? "",
                  imgUrl: defaultImageGroup ? encodeURI(defaultImageGroup?.link) : "",
                  isAvailableInStore:
                      (inventoryId &&
                          productItem?.inventories?.find((inventory: any) => inventoryId === inventory.id)
                              ?.orderable) ??
                      false,
              };
          })
        : [];
};
@Resolver()
export class CategoryResolver {
    @Query(() => PlpData)
    async getPlpData(
        @Args() { categoryId, filters, limit, locale, offset, siteId }: getPlpDataArgs,
        @Ctx() { dataSources, user, req, res }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const productSearchResults = await dataSources.CommerceAPIDataSource.getProductSearchResults(
            categoryId,
            siteId,
            user.accessToken,
            filters,
            offset,
            limit,
            locale
        );

        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const selectedStoreId = cookies.get("session.selectedStoreId", { signed: true });
        const inventoryId = selectedStoreId ? `${selectedStoreId}-inventory` : undefined;
        const pricebookId = selectedStoreId ? `pricebook-${selectedStoreId}` : undefined;

        const productHits = await dataSources.CommerceAPIDataSource.getProducts(
            siteId,
            user.accessToken,
            productSearchResults?.hits
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ?.map((productHit: any) => {
                    return productHit?.productId;
                }),
            locale,
            inventoryId
        );

        const categoryResponse = await dataSources.CommerceAPIDataSource.getCategoryById(
            categoryId,
            siteId,
            user.accessToken,
            locale
        );

        const subCategories =
            categoryResponse?.categories?.map((subCategory: any) => {
                return {
                    ...subCategory,
                    categoryLogo: subCategory?.c_categoryLogo ?? null,
                };
            }) ?? null;

        const booleanRefinements = ["c_isVegan", "c_isVegetarian", "c_isGlutenFree"];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const checkboxGroupRefinements: string | any[] = [];
        const radioGroupRefinements = ["cgid", "c_size"];

        const parsedRefinements = productSearchResults?.refinements
            ? productSearchResults?.refinements.map((refinement: any) => {
                  const resultRefinement: PlpFilter = {
                      id: refinement.attributeId,
                      name: refinement.label,
                      values: [],
                      isCategoryFilter: false,
                      type: "checkboxGroup", //boolean, radioGroup
                  };

                  if (booleanRefinements.includes(refinement.attributeId)) {
                      resultRefinement.type = "boolean";
                  }

                  if (checkboxGroupRefinements.includes(refinement.attributeId)) {
                      resultRefinement.type = "checkboxGroup";
                  }

                  if (radioGroupRefinements.includes(refinement.attributeId)) {
                      resultRefinement.type = "radioGroup";
                  }

                  if (refinement.attributeId === categoryFilterKey) {
                      resultRefinement.isCategoryFilter = true;
                  }

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  refinement.values?.forEach((refinementValue: any) => {
                      if (resultRefinement.isCategoryFilter) {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          refinementValue.values?.forEach((subCategoryValue: any) => {
                              resultRefinement.values.push({
                                  id: subCategoryValue.value,
                                  name: subCategoryValue.label,
                                  resultsCount: subCategoryValue.hitCount,
                              });
                          });
                      } else {
                          resultRefinement.values.push({
                              id: refinementValue.value,
                              name: refinementValue.label,
                              resultsCount: refinementValue.hitCount,
                          });
                      }
                  });
                  return resultRefinement;
              })
            : [];

        const parsedProductsList = parseProductHit(productHits, pricebookId, inventoryId);

        const plpData: PlpData = {
            name: categoryResponse?.name || "",
            imgMobileUrl: categoryResponse?.c_bannerMobile || "",
            imgDesktopUrl: categoryResponse?.c_bannerDesktop || "",
            resultsQty: productSearchResults?.total || 0,
            filters: parsedRefinements,
            productsList: parsedProductsList,
            subCategories: subCategories || [],
            isStoreSelected: !!selectedStoreId,
        };

        return plpData;
    }

    @Query(() => ClpData)
    async getCLPData(
        @Arg("categoryId") categoryId: string,
        @Arg("locale") locale: string,
        @Arg("siteId") siteId: string,
        @Ctx() { dataSources, user, req, res }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<ClpData> {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const selectedStoreId = cookies.get("session.selectedStoreId", { signed: true });
        const inventoryId = `${selectedStoreId}-inventory`;
        const pricebookId = `pricebook-${selectedStoreId}`;

        const categoryResponse = await dataSources.CommerceAPIDataSource.getCategoryById(
            categoryId,
            siteId,
            user.accessToken,
            locale
        );

        const subCategories =
            categoryResponse?.categories?.map((subCategory: any) => {
                return {
                    ...subCategory,
                    categoryLogo: subCategory?.c_categoryLogo ?? null,
                };
            }) ?? null;

        if (!subCategories) {
            console.trace(`Category ${categoryId} does not have sub categories.`);
            throw new CommerceError("INTERNAL SERVER ERROR");
        }

        let productHits, clpPopularProducts, productSearchResults;

        try {
            productSearchResults = await dataSources.CommerceAPIDataSource.getProductSearchResults(
                categoryId,
                siteId,
                user.accessToken,
                [],
                0,
                5,
                locale
            );

            productHits = await dataSources.CommerceAPIDataSource.getProducts(
                siteId,
                user.accessToken,
                productSearchResults?.hits
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ?.map((productHit: any) => {
                        return productHit?.productId;
                    }),
                locale,
                inventoryId
            );

            clpPopularProducts = parseProductHit(productHits, pricebookId, inventoryId);
        } catch (err) {
            console.trace("error getting product hits:", err);
        }

        const clpData = {
            isClpEnabled: true,
            subCategories: subCategories || [],
            popularProducts: clpPopularProducts,
            imgDesktop: categoryResponse?.c_bannerDesktop ?? null,
            imgMobile: categoryResponse?.c_bannerMobile ?? null,
        };

        return clpData;
    }
}
