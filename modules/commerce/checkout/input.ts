import { ArgsType, Field, InputType } from "type-graphql";

@ArgsType()
export class CheckoutDataArgs {
    @Field({ nullable: false })
    siteId: string;

    @Field(() => String, { nullable: true })
    locale: string;
}

@InputType()
export class OrderAddressInput {
    @Field()
    firstName: string;

    @Field()
    lastName: string;

    @Field()
    address1: string;

    @Field()
    address2: string;

    @Field()
    countryCode: string;

    @Field()
    city: string;

    @Field()
    stateCode: string;

    @Field()
    postalCode: string;

    @Field()
    phone: string;
}
