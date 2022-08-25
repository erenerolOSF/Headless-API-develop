import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Price {
    @Field({ nullable: true })
    value: number;

    @Field({ nullable: true })
    displayValue: string;
}

@ObjectType()
export class Tab {
    @Field({ nullable: true })
    id: string;

    @Field({ nullable: true })
    title: string;

    @Field({ nullable: true })
    content: string;
}

@ObjectType()
export class SizeTile {
    @Field()
    id: string;

    @Field()
    isActive: boolean;

    @Field()
    title: string;

    @Field()
    subTitle: string;

    @Field({ nullable: true })
    price: string;
}
@ObjectType()
export class Item {
    @Field()
    id: string;

    @Field({ nullable: true })
    name: string;

    @Field({ nullable: true })
    price: Price;

    @Field()
    qty: number;

    @Field()
    min: number;

    @Field()
    max: number;

    @Field({ nullable: true })
    imgUrl: string;

    @Field({ nullable: true })
    initialQty: number;
}

@ObjectType()
export class IngredientGroup {
    @Field()
    id: string;

    @Field()
    name: string;

    @Field(() => [Item])
    items: Item[];
}

@ObjectType()
export class Image {
    @Field()
    alt: string;

    @Field()
    url: string;

    @Field()
    title: string;
}

@ObjectType()
export class Inventory {
    @Field()
    ats: number;

    @Field()
    backorderable: boolean;

    @Field()
    id: string;

    @Field()
    orderable: boolean;

    @Field()
    preorderable: boolean;

    @Field()
    stockLevel: number;
}
@ObjectType()
export class Product {
    @Field()
    id: string;

    @Field()
    name: string;

    @Field({ nullable: true })
    shortDescription: string;

    @Field({ nullable: true })
    weight: string;

    @Field(() => String, { nullable: true })
    price: string | null;

    @Field(() => Image, { nullable: true })
    imgSquare: Image | null;

    @Field(() => Image, { nullable: true })
    imgLandscape: Image | null;

    @Field()
    parentCategoryId: string;

    @Field({ nullable: false })
    minQty: number;

    @Field({ nullable: false })
    maxQty: number;

    @Field()
    isProductSavedInWishlist: boolean;

    @Field(() => [String])
    badges: string[];

    @Field(() => [SizeTile], { nullable: true })
    sizeTiles: SizeTile[] | null;

    @Field(() => [Tab], { nullable: true })
    tabs: Tab[] | null;

    @Field(() => [IngredientGroup], { nullable: true })
    ingredientGroups: IngredientGroup[] | null;

    @Field(() => Boolean)
    isMasterProduct: boolean;

    @Field(() => Inventory)
    inventory: Inventory;

    @Field({ nullable: false })
    isStoreSelected: boolean;
}

@ObjectType()
export class ProductPriceRes {
    @Field()
    unitPrice: string;

    @Field()
    totalPrice: string;
}
