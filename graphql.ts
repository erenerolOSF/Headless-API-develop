import { ApolloServer } from "apollo-server-micro";
import Ajv from "ajv";

import { schema } from "./schema";
import { dataSources } from "./data-sources";
import { context } from "./context";
import envSchema from "./envSchema";
import { NextApiRequest, NextApiResponse } from "next";

const { ACCESS_CONTROL_ALLOW_ORIGIN } = process.env;

const ajv = new Ajv();
const validate = ajv.compile(envSchema);

const apolloServer = new ApolloServer({ schema, dataSources, context });
const startServer = apolloServer.start();

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (!validate(process.env)) {
        console.error(validate.errors);
        return res.status(500).end("Internal Server Error");
    }

    if (ACCESS_CONTROL_ALLOW_ORIGIN || req.headers.origin) {
        res.setHeader(
            "Access-Control-Allow-Origin",
            (ACCESS_CONTROL_ALLOW_ORIGIN as string) || (req.headers.origin as string)
        );
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.setHeader("Access-Control-Allow-Credentials", "true");

        if (req.method === "OPTIONS") {
            return res.end();
        }
    }

    await startServer;
    const apolloHandler = apolloServer.createHandler({ path: "/api/graphql" });
    await apolloHandler(req, res);
};
