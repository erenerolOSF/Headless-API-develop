import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class CustomerInfo {
    @Field()
    customerId: string;

    @Field({ nullable: true })
    email: string;
}

@ObjectType()
export class ShippingMethod {
    @Field({ nullable: false })
    id: string;

    @Field({ nullable: true })
    name: string;

    @Field({ nullable: true })
    price: number;

    @Field({ nullable: true })
    estimatedArrivalTime: string;

    @Field({ nullable: true })
    storePickupEnabled: boolean;

    @Field({ nullable: true })
    description: string;
}

@ObjectType()
export class PaymentInstrument {
    @Field({ nullable: true })
    amount: number;

    @Field({ nullable: true })
    paymentInstrumentId: string;

    @Field({ nullable: true })
    paymentMethodId: string;
}
@ObjectType()
export class ShippingAddress {
    @Field({ nullable: true })
    id: string;

    @Field({ nullable: true })
    address1: string;

    @Field({ nullable: true })
    address2: string;

    @Field({ nullable: true })
    city: string;

    @Field({ nullable: true })
    countryCode: string;

    @Field({ nullable: true })
    firstName: string;

    @Field({ nullable: true })
    lastName: string;

    @Field({ nullable: true })
    fullName: string;

    @Field({ nullable: true })
    phone: string;

    @Field({ nullable: true })
    postalCode: string;

    @Field({ nullable: true })
    stateCode: string;
}

@ObjectType()
export class BillingAddress {
    @Field({ nullable: true })
    id: string;

    @Field({ nullable: true })
    address1: string;

    @Field({ nullable: true })
    address2: string;

    @Field({ nullable: true })
    city: string;

    @Field({ nullable: true })
    countryCode: string;

    @Field({ nullable: true })
    firstName: string;

    @Field({ nullable: true })
    lastName: string;

    @Field({ nullable: true })
    fullName: string;

    @Field({ nullable: true })
    phone: string;

    @Field({ nullable: true })
    postalCode: string;

    @Field({ nullable: true })
    stateCode: string;
}

@ObjectType()
export class Shipment {
    @Field()
    adjustedMerchandizeTotalTax: number;

    @Field({ nullable: true })
    adjustedShippingTotalTax: number;

    @Field()
    merchandizeTotalTax: number;

    @Field()
    productSubTotal: number;

    @Field()
    productTotal: number;

    @Field()
    shipmentId: string;

    @Field({ nullable: true })
    shipmentTotal: number;

    @Field(() => ShippingMethod, { nullable: true })
    shippingMethod: ShippingMethod;

    @Field(() => ShippingAddress, { nullable: true })
    shippingAddress: ShippingAddress;

    @Field({ nullable: true })
    shippingStatus: string;

    @Field({ nullable: true })
    shippingTotal: number;

    @Field({ nullable: true })
    shippingTotalTax: number;

    @Field({ nullable: true })
    taxTotal: number;
}

@ObjectType()
export class ProductLineItem {
    @Field()
    adjustedTax: number;

    @Field()
    basePrice: number;

    @Field({ nullable: true })
    bonusProductLineItem: boolean;

    @Field()
    gift: boolean;

    @Field({ nullable: true })
    inventoryId: string;

    @Field()
    itemId: string;

    @Field()
    itemText: string;

    @Field({ nullable: true })
    price: string;

    @Field()
    priceAfterItemDiscount: number;

    @Field()
    priceAfterOrderDiscount: number;

    @Field()
    productId: string;

    @Field()
    productName: string;

    @Field({ nullable: true })
    image?: string;

    @Field()
    quantity: number;

    @Field()
    tax: number;

    @Field()
    taxBasis: number;

    @Field({ nullable: true })
    taxClassId: string;

    @Field({ nullable: true })
    ingredients: string;

    @Field({ nullable: true })
    maxQty: number;

    @Field({ nullable: true })
    minQty: number;

    @Field({ nullable: true })
    ingredientsString: string;
}

@ObjectType()
export class ShippingItem {
    @Field({ nullable: true })
    adjustedTax: number;

    @Field({ nullable: true })
    basePrice: number;

    @Field()
    itemId: string;

    @Field()
    itemText: string;

    @Field({ nullable: true })
    price: number;

    @Field({ nullable: true })
    priceAfterItemDiscount: number;

    @Field()
    shipmentId: string;

    @Field({ nullable: true })
    tax: number;

    @Field({ nullable: true })
    taxClassId: string;

    @Field()
    taxRate: number;
}

@ObjectType()
export class Basket {
    @Field()
    adjustedMerchandizeTotalTax: number;

    @Field({ nullable: true })
    adjustedShippingTotalTax: number;

    @Field()
    basketId: string;

    @Field(() => BillingAddress, { nullable: true })
    billingAddress: BillingAddress;

    @Field(() => [PaymentInstrument], { nullable: true })
    paymentInstruments: PaymentInstrument[];

    @Field()
    creationDate: string;

    @Field()
    currency: string;

    @Field(() => CustomerInfo)
    customerInfo: CustomerInfo;

    @Field()
    lastModified: string;

    @Field()
    merchandizeTotalTax: number;

    @Field({ nullable: true })
    orderTotal: string;

    @Field(() => [ProductLineItem])
    productItems: ProductLineItem[];

    @Field({ nullable: true })
    productSubTotal: string;

    @Field()
    productTotal: string;

    @Field(() => [Shipment])
    shipments: Shipment[];

    @Field(() => [ShippingItem])
    shippingItems: ShippingItem[];

    @Field({ nullable: true })
    shippingTotal: string;

    @Field({ nullable: true })
    shippingTotalTax: number;

    @Field()
    taxation: string;

    @Field({ nullable: true })
    taxTotal: string;
}

@ObjectType()
export class ProductFromOrder {
    @Field({ nullable: true })
    productName: string;

    @Field({ nullable: true })
    price: string;

    @Field({ nullable: false })
    productId: string;

    @Field({ nullable: true })
    imgUrl: string;

    @Field({ nullable: false })
    isAvailableInStore: boolean;

    @Field({ nullable: true })
    ingredientsString: string;

    @Field({ nullable: true })
    quantity: number;

    @Field({ nullable: true })
    size: string;
}

@ObjectType()
export class getProductsFromOrderRes {
    @Field(() => [ProductFromOrder])
    productItems: ProductFromOrder[];
}
