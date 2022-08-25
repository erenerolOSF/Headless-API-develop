/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mutation, Resolver, Ctx, Arg } from "type-graphql";
import { ApolloError } from "apollo-server-errors";
import { GraphQLContext, GraphQLDataSources } from "../../types";
import Stripe from "stripe";
import Dinero, { Currency } from "dinero.js";
import { CreatePaymentIntentResponse, WebhookResponse } from "./types";
import { PaymentInstrument } from "../commerce/basket/types";

function toPrice(amount: number, currency: Currency, factor = Math.pow(10, 2)) {
    return Dinero({ amount: Math.round(amount * factor), currency });
}

@Resolver()
export class StripeResolver {
    @Mutation(() => CreatePaymentIntentResponse)
    async stripeCreatePaymentIntent(
        @Arg("siteId") siteId: string,
        @Arg("orderNo") orderNo: string,
        @Ctx() { dataSources }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const order = await dataSources.StripeCommerceAPIDataSource.getOrder(siteId, orderNo);
        const stripe = new Stripe(process.env.STRIPE_SECRET, {
            apiVersion: "2020-08-27",
        });

        const paymentInstrument = order.paymentInstruments.find(
            (instrument: PaymentInstrument) => instrument.paymentMethodId === "STRIPE_CREDIT_CARD"
        );

        const paymentIntentId = paymentInstrument?.c_stripePaymentIntentID ?? "";

        if (paymentIntentId) {
            try {
                const paymentIntentResponse = await stripe.paymentIntents.retrieve(paymentIntentId);

                return {
                    status: "200",
                    clientSecret: paymentIntentResponse.client_secret,
                };
            } catch (err) {
                console.trace(err);
                throw new ApolloError("Internal Server Error", "INTERNAL_SERVER_ERROR");
            }
        }

        const orderTotal = toPrice(order.orderTotal, order.currency).getAmount();

        try {
            const paymentIntentResponse = await stripe.paymentIntents.create({
                amount: orderTotal,
                currency: order.currency,
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            await stripe.paymentIntents.update(paymentIntentResponse.id, {
                metadata: {
                    orderNo,
                    siteId,
                },
            });

            await dataSources.StripeCommerceAPIDataSource.putStripePaymentIntentIdOnOrder(
                siteId,
                orderNo,
                paymentIntentResponse.id
            );

            return {
                status: "200",
                clientSecret: paymentIntentResponse.client_secret,
            };
        } catch (error) {
            console.trace(error);
            throw new ApolloError("Internal Server Error", "INTERNAL_SERVER_ERROR");
        }
    }

    @Mutation(() => WebhookResponse)
    async stripeWebhook(
        @Arg("stripeSignature") stripeSignature: string,
        @Arg("rawReqBody") rawReqBody: string,
        @Ctx() { dataSources }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        let event;
        const stripe = new Stripe(process.env.STRIPE_SECRET, {
            apiVersion: "2020-08-27",
        });

        try {
            event = stripe.webhooks.constructEvent(
                rawReqBody,
                stripeSignature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.trace(err.message);
            throw new ApolloError("Internal Server Error", "INTERNAL_SERVER_ERROR");
        }

        const paymentIntent: any = event.data.object;
        const orderNo = paymentIntent?.metadata?.orderNo;
        const siteId = paymentIntent?.metadata?.siteId;
        //write payment intent data to order

        switch (event.type) {
            case "payment_intent.succeeded":
                if (orderNo && siteId) {
                    await dataSources.StripeCommerceAPIDataSource.updateOrderPaymentStatus(
                        siteId,
                        orderNo,
                        "paid"
                    );

                    await dataSources.StripeCommerceAPIDataSource.updateOrderConfirmationStatus(
                        siteId,
                        orderNo,
                        "confirmed"
                    );
                }
                break;
            case "payment_intent.canceled":
            case "payment_intent.payment_failed":
            case "payment_intent.requires_action":
                if (orderNo && siteId) {
                    await dataSources.StripeCommerceAPIDataSource.updateOrderStatus(siteId, orderNo, "new");

                    await dataSources.StripeCommerceAPIDataSource.updateOrderPaymentStatus(
                        siteId,
                        orderNo,
                        "not_paid"
                    );

                    await dataSources.StripeCommerceAPIDataSource.updateOrderConfirmationStatus(
                        siteId,
                        orderNo,
                        "not_confirmed"
                    );
                }
                break;

            // ... handle other event types
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return {
            status: "200",
        };
    }
}
