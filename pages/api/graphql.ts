// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from "next";
import { handler as localBDHandler } from "../../graphql";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await localBDHandler(req, res);
}

export const config = {
    api: {
        bodyParser: false,
    },
};
