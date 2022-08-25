import { Field, ObjectType } from "type-graphql";

@ObjectType()
class StoreFeature {
    @Field({ nullable: true })
    id: string;

    @Field({ nullable: true })
    displayName: string;

    @Field({ nullable: true })
    isAvailable: boolean;
}

@ObjectType()
export class Store {
    @Field(() => [String], {
        nullable: true,
        description: "Delivery methods ID's supported by this store",
    })
    deliveryMethods: string[];

    @Field({ nullable: true })
    phone?: string;

    @Field({ nullable: true })
    latitude: string;

    @Field({ nullable: true })
    longitude: string;

    @Field({ nullable: true })
    address1: string;

    @Field({ nullable: true })
    name: string;

    @Field({ nullable: true })
    store_hours: string;

    @Field({ nullable: true })
    id: string;

    @Field({ nullable: true })
    city?: string;

    @Field({ nullable: true })
    icon?: string;

    @Field({ nullable: true })
    postal_code: number;

    @Field({ nullable: true })
    imgMobile?: string;

    @Field({ nullable: true })
    imgDesktop?: string;

    @Field(() => [StoreFeature], { nullable: true })
    features: StoreFeature[];
}

@ObjectType()
export class SetSelectedStoreResponse {
    @Field({ nullable: false })
    status: string;
}
