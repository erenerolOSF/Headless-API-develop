import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class LoginStartResponse {
    @Field({ nullable: false })
    redirectURL: string;
}

@ObjectType()
export class LoginEndResponse {
    @Field(() => String, { nullable: true })
    firstName: string | null;

    @Field(() => String, { nullable: true })
    lastName: string | null;

    @Field({ nullable: false })
    isLoggedIn: boolean;
}

@ObjectType()
export class LogoutResponse {
    @Field({ nullable: false })
    isLoggedIn: boolean;
}

@ObjectType()
export class RegisterResponse {
    @Field({ nullable: false })
    email: string;
}
