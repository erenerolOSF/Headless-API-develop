import { buffer } from "micro";
import { NextApiRequest, NextApiResponse } from "next";
import fetch from "make-fetch-happen";

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function (req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stripeSignature: any = req.headers["stripe-signature"];

        const requestBuffer = await buffer(req);
        const vercelURL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
        const rootUrl = vercelURL || "http://localhost:3001";
        const graphQLUrl = `${rootUrl}/api/graphql`;

        const query = `
            mutation Mutation($stripeSignature: String!, $rawReqBody: String!) {
                stripeWebhook(stripeSignature: $stripeSignature, rawReqBody: $rawReqBody) {
                status
                }
            }
        `;

        const response = await fetch(graphQLUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query,
                variables: {
                    stripeSignature,
                    rawReqBody: requestBuffer.toString(),
                },
            }),
        });

        const { errors } = await response.json();

        if (errors) {
            console.trace(errors);
            res.status(500).json({
                status: "error",
                message: "Internal server error",
            });

            return res.end();
        }

        res.status(200).json({
            status: "success",
        });

        return res.end();
    }

    res.status(405).end("Method not allowed");
}
