import { ArgsType, Field, InputType } from "type-graphql";

@InputType()
export class AddressInput {
    @Field({ nullable: false })
    id: string;

    @Field({ nullable: true })
    addressName: string;

    @Field({ nullable: true })
    firstName: string;

    @Field({ nullable: true })
    lastName: string;

    @Field({ nullable: true })
    address1: string;

    @Field({ nullable: true })
    address2: string;

    @Field({ nullable: true })
    country: string;

    @Field({ nullable: true })
    city: string;

    @Field({ nullable: true })
    state: string;

    @Field({ nullable: true })
    zip: string;

    @Field({ nullable: true })
    phone: string;

    @Field({ nullable: false })
    isPrimary: boolean;
}

@ArgsType()
export class AddressInputArgs {
    @Field({ nullable: false })
    siteId: string;

    @Field(() => AddressInput, { nullable: false })
    address: AddressInput;
}

@InputType()
export class WishlistItemArgs {
    @Field({ nullable: false })
    priority: number;

    @Field(() => String, { nullable: false })
    productId: string;

    @Field({ nullable: false })
    public: boolean;

    @Field({ nullable: false })
    quantity: number;

    @Field({ nullable: false })
    type: string;

    @Field({ nullable: false })
    storeId: string;
}
