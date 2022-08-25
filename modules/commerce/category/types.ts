import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class PlpFilterValue {
    @Field({ nullable: false })
    id: string;
    @Field({ nullable: false })
    name: string;
    @Field({ nullable: false })
    resultsCount: number;
}

@ObjectType()
export class PlpFilter {
    @Field({ nullable: false })
    id: string;

    @Field({ nullable: false })
    name: string;

    @Field({ nullable: false })
    type: string;

    @Field({ nullable: false })
    isCategoryFilter: boolean;

    @Field(() => [PlpFilterValue], { nullable: false })
    values: PlpFilterValue[];
}

@ObjectType()
class PlpProduct {
    @Field({ nullable: true })
    name: string;

    @Field({ nullable: true })
    description: string;

    @Field({ nullable: true })
    price: string;

    @Field({ nullable: true })
    weight: string;

    @Field({ nullable: false })
    id: string;

    @Field({ nullable: true })
    imgUrl: string;

    @Field({ nullable: false })
    isAvailableInStore: boolean;
}

@ObjectType()
export class SubCategory {
    @Field({ nullable: false })
    id: string;

    @Field({ nullable: false })
    name: string;

    @Field({ nullable: false })
    parentCategoryId: string;

    @Field({ nullable: true })
    categoryLogo: string;
}

@ObjectType()
export class PlpData {
    @Field({ nullable: true })
    name: string;

    @Field({ nullable: true })
    imgMobileUrl: string;

    @Field({ nullable: true })
    imgDesktopUrl: string;

    @Field({ nullable: true })
    resultsQty: number;

    @Field(() => [PlpFilter], { nullable: true })
    filters: PlpFilter[];

    @Field(() => [PlpProduct], { nullable: true })
    productsList: PlpProduct[];

    @Field(() => [SubCategory], { nullable: false })
    subCategories: SubCategory[];

    @Field({ nullable: false })
    isStoreSelected: boolean;
}
@ObjectType()
export class ClpData {
    @Field({ nullable: false })
    isClpEnabled: boolean;

    @Field(() => [SubCategory], { nullable: false })
    subCategories: SubCategory[];

    @Field(() => [PlpProduct], { nullable: false })
    popularProducts: PlpProduct[];

    @Field({ nullable: true })
    imgDesktop: string;

    @Field({ nullable: true })
    imgMobile: string;
}
