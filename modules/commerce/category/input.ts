import { ArgsType, Field, InputType } from "type-graphql";

@InputType()
export class Filter {
    @Field({ nullable: false })
    id: string;

    @Field(() => [String], { nullable: false })
    values: string[];
}

@ArgsType()
export class getPlpDataArgs {
    @Field({ nullable: false })
    siteId: string;

    @Field({ nullable: false })
    categoryId: string;

    @Field({ nullable: true })
    offset: number;

    @Field({ nullable: true })
    limit: number;

    @Field({ nullable: false })
    locale: string;

    @Field(() => [Filter], { nullable: true })
    filters: Filter[];
}
