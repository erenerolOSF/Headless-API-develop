# Docs

You can check our docs here https://qsr-docs.osf-demo.com/

storefront password: graduatedM1lk

# Test Stripe Locally

## Start Stripe Local Listener

`stripe listen --forward-to localhost:3001/api/stripe/webhook`

## Testing stripe hooks

`stripe trigger payment_intent.succeeded --add payment_intent:metadata.orderId=00000606 --add payment_intent:metadata.siteId=QSR`
