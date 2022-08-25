import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class GlobalDataResponse {
    @Field({ nullable: false })
    globalData: string;
}

@ObjectType()
export class PreRendererdProduct {
    @Field({ nullable: true })
    name: string;

    @Field({ nullable: false })
    id: string;
}
