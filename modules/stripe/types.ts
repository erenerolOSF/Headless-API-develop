import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class CreatePaymentIntentResponse {
    @Field({ nullable: false })
    status: string;
    @Field({ nullable: true })
    clientSecret: string;
}

@ObjectType()
export class WebhookResponse {
    @Field({ nullable: false })
    status: string;
}

@ObjectType()
export class InvalidatePaymentIntentCookieResponse {
    @Field({ nullable: false })
    status: string;
}

@ObjectType()
export class StripeSetOrderMetadataResponse {
    @Field({ nullable: false })
    status: string;
}
