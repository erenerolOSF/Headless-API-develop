import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Ping {
    @Field({ nullable: true })
    pong: string;
}
