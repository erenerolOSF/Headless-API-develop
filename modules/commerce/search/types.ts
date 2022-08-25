import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class productSearchItemImg {
    @Field({ nullable: true })
    link: string;

    @Field({ nullable: true })
    alt: string;

    @Field({ nullable: true })
    title: string;
}

@ObjectType()
export class ProductSearchItem {
    @Field({ nullable: true })
    id: string;

    @Field({ nullable: true })
    name: string;

    @Field(() => productSearchItemImg, { nullable: true })
    image: productSearchItemImg;

    @Field({ nullable: true })
    price: string;

    @Field({ nullable: false })
    isAvailableInStore: boolean;
}

@ObjectType()
export class CategorySearchItem {
    @Field({ nullable: true })
    id: string;

    @Field({ nullable: true })
    name: string;
}

@ObjectType()
export class SearchResult {
    @Field(() => [ProductSearchItem])
    productSearchResults: ProductSearchItem[];

    @Field(() => [CategorySearchItem])
    categorySearchResults: CategorySearchItem[];
}
