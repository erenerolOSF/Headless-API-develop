import { ArgsType, Field, InputType } from "type-graphql";

@InputType()
class Customer {
    @Field({ nullable: false })
    firstName: string;

    @Field({ nullable: false })
    lastName: string;

    @Field({ nullable: false })
    email: string;

    @Field({ nullable: false })
    login: string;

    @Field({ nullable: false })
    phoneMobile: string;
}

@ArgsType()
export class RegisterArgs {
    @Field({ nullable: false })
    siteId: string;

    @Field(() => Customer, { nullable: false })
    customer: Customer;

    @Field({ nullable: false })
    password: string;
}
