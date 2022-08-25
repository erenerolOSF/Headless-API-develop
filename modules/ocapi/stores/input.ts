import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class GetStoresByCoordinatesArgs {
    @Field({ nullable: false })
    latitude: string;

    @Field({ nullable: false })
    longitude: string;

    @Field({
        nullable: false,
        description: "Delivery method ID that the returned stores must support",
    })
    deliveryMethodId: string;

    @Field({ nullable: false })
    locale: string;

    @Field({ nullable: false })
    maxDistance: string;

    @Field({ nullable: false })
    siteId: string;
}
