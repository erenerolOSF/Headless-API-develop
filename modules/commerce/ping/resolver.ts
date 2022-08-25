import { Query, Resolver } from "type-graphql";
import { Ping } from "./types";

@Resolver(() => Ping)
export class PingResolver {
    @Query(() => String)
    Ping(): string {
        return "Pong";
    }
}
