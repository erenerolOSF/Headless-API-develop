import { Field, ObjectType } from "type-graphql";
import {
    BillingAddress,
    CustomerInfo,
    PaymentInstrument,
    ProductLineItem,
    Shipment,
    ShippingItem,
} from "../basket/types";

@ObjectType()
export class SavedAddress {
    @Field({ nullable: false })
    id?: string;

    @Field({ nullable: false })
    addressName?: string;

    @Field({ nullable: true })
    firstName?: string;

    @Field({ nullable: true })
    lastName?: string;

    @Field({ nullable: false })
    address1: string;

    @Field({ nullable: true })
    address2?: string;

    @Field({ nullable: false })
    country: string;

    @Field({ nullable: false })
    city: string;

    @Field({ nullable: false })
    state: string;

    @Field({ nullable: true })
    zip: string;

    @Field({ nullable: true })
    phone?: string;

    @Field({ nullable: false })
    isPrimary?: boolean;

    @Field({ nullable: true })
    sameAsBilling?: boolean;
}

@ObjectType()
export class SelectedStoreAddress {
    @Field({ nullable: false })
    id?: string;

    @Field({ nullable: false })
    addressName?: string;

    @Field({ nullable: false })
    address1: string;

    @Field({ nullable: true })
    address2?: string;

    @Field({ nullable: false })
    countryCode: string;

    @Field({ nullable: false })
    city: string;

    @Field({ nullable: false })
    stateCode: string;

    @Field({ nullable: true })
    postalCode: string;

    @Field({ nullable: false })
    isPrimary?: boolean;

    @Field({ nullable: true })
    sameAsBilling: boolean;
}

@ObjectType()
export class DeliveryMethod {
    @Field({ nullable: false })
    id: string;

    @Field({ nullable: false })
    name: string;

    @Field({ nullable: true })
    description: string;

    @Field({ nullable: false })
    eta: string;

    @Field({ nullable: true })
    requiresDate: boolean;

    @Field({ nullable: false })
    isStorePickup: boolean;

    @Field({ nullable: false })
    price: string;
}

@ObjectType()
export class PaymentMethod {
    @Field({ nullable: false })
    id: string;

    @Field({ nullable: false })
    name: string;
}

@ObjectType()
export class Hour {
    @Field({ nullable: false })
    isAvailable: boolean;

    @Field({ nullable: false })
    name: string;

    @Field({ nullable: false })
    id: string;

    @Field({ nullable: false })
    period: "am" | "pm";
}

@ObjectType()
export class Day {
    @Field({ nullable: false })
    isAvailable: boolean;

    @Field({ nullable: false })
    name: string;

    @Field({ nullable: false })
    id: number;

    @Field({ nullable: false })
    dayOfAWeek: number;

    @Field(() => [Hour], { nullable: false })
    hours: Hour[];
}

@ObjectType()
export class Month {
    @Field({ nullable: false })
    isActive: boolean;

    @Field({ nullable: false })
    name: string;

    @Field({ nullable: false })
    number: number;

    @Field({ nullable: false })
    year: number;

    @Field(() => [Day], { nullable: false })
    days: Day[];
}

@ObjectType()
export class DateTimePickerData {
    @Field(() => [String], { nullable: false })
    weekDaysTexts: string[];

    @Field(() => [Month], { nullable: false })
    months: Month[];
}

@ObjectType()
export class DeliveryMethods {
    @Field(() => [DeliveryMethod], { nullable: false })
    items: DeliveryMethod[];
}

@ObjectType()
export class PaymentMethods {
    @Field(() => [PaymentMethod], { nullable: false })
    items: PaymentMethod[];
}

@ObjectType()
export class CheckoutData {
    @Field({ nullable: false })
    status: string;

    @Field(() => [SavedAddress], { nullable: false })
    savedAddresses: SavedAddress[];

    @Field(() => SelectedStoreAddress, { nullable: true })
    selectedStoreAddress?: SelectedStoreAddress;

    @Field(() => DeliveryMethods, { nullable: false })
    deliveryMethods: DeliveryMethods;

    @Field(() => PaymentMethods, { nullable: false })
    paymentMethods: PaymentMethods;

    @Field(() => DateTimePickerData, { nullable: false })
    dateTimePickerData: DateTimePickerData;
}

@ObjectType()
export class OrderData {
    @Field({ nullable: false })
    status: string;

    @Field({ nullable: false })
    orderNo: string;
}

@ObjectType()
export class OrderConfirmationAddress {
    @Field(() => String, { nullable: true })
    id: string | null;

    @Field({ nullable: false })
    firstName: string;

    @Field({ nullable: false })
    lastName: string;

    @Field({ nullable: false })
    fullName: string;

    @Field({ nullable: false })
    address1: string;

    @Field(() => String, { nullable: true })
    address2: string | null;

    @Field({ nullable: false })
    country: string;

    @Field({ nullable: true })
    city: string;

    @Field({ nullable: false })
    state: string;

    @Field({ nullable: false })
    zip: string;

    @Field({ nullable: true })
    phone: string;
}

@ObjectType()
export class OrderConfirmationDeliveryMethod {
    @Field({ nullable: false })
    description: string;

    @Field({ nullable: false })
    name: string;

    @Field({ nullable: false })
    requiresDate: boolean;

    @Field({ nullable: false })
    isStorePickup: boolean;

    @Field({ nullable: false })
    estimatedArrivalTime: string;
}

@ObjectType()
export class OrderConfirmationReceipt {
    @Field({ nullable: false })
    orderNumber: string;

    @Field({ nullable: false })
    orderStatus: string;

    @Field({ nullable: false })
    paymentStatus: string;

    @Field({ nullable: false })
    orderDate: string;

    @Field({ nullable: false })
    deliveryMethod: OrderConfirmationDeliveryMethod;

    @Field(() => OrderConfirmationAddress, { nullable: false })
    shippingAddress: OrderConfirmationAddress;

    @Field(() => OrderConfirmationAddress, { nullable: false })
    billingAddress: OrderConfirmationAddress;

    @Field({ nullable: false })
    phone: string;
}

@ObjectType()
export class CheckoutOrderSummaryProps {
    @Field({ nullable: false })
    subtotal: string;

    @Field({ nullable: false })
    total: string;

    @Field({ nullable: false })
    taxTotal: string;

    @Field({ nullable: false })
    shippingTotal: string;

    @Field(() => [ProductLineItem], { nullable: false })
    orderItems: ProductLineItem[];

    @Field({ nullable: false })
    storeName: string;

    @Field({ nullable: false })
    storeId: string;
}

@ObjectType()
export class OrderConfirmationData {
    @Field(() => OrderConfirmationReceipt, { nullable: false })
    orderConfirmationReceipt: OrderConfirmationReceipt;

    @Field(() => CheckoutOrderSummaryProps, { nullable: false })
    orderConfirmationSummary: CheckoutOrderSummaryProps;
}
@ObjectType()
export class Order {
    @Field({ nullable: false })
    adjustedMerchandizeTotalTax: number;

    @Field({ nullable: false })
    adjustedShippingTotalTax: number;

    @Field(() => BillingAddress, { nullable: false })
    billingAddress: BillingAddress;

    @Field({ nullable: false })
    channelType: string;

    @Field({ nullable: false })
    confirmationStatus: string;

    @Field({ nullable: false })
    createdBy: string;

    @Field({ nullable: false })
    creationDate: string;

    @Field({ nullable: false })
    currency: string;

    @Field(() => CustomerInfo, { nullable: false })
    customerInfo: CustomerInfo;

    @Field({ nullable: false })
    customerLocale: string;

    @Field({ nullable: false })
    exportStatus: string;

    @Field({ nullable: false })
    invoiceNo: string;

    @Field({ nullable: false })
    lastModified: string;

    @Field({ nullable: false })
    merchandizeTotalTax: number;

    @Field({ nullable: false })
    orderNo: string;

    @Field({ nullable: false })
    orderTotal: string;

    @Field(() => [PaymentInstrument], { nullable: false })
    paymentInstruments: PaymentInstrument[];

    @Field({ nullable: false })
    paymentStatus: string;

    @Field({ nullable: false })
    placeDate: string;

    @Field(() => [ProductLineItem], { nullable: false })
    productItems: ProductLineItem[];

    @Field({ nullable: false })
    productSubTotal: string;

    @Field({ nullable: false })
    productTotal: string;

    @Field(() => [Shipment], { nullable: false })
    shipments: Shipment[];

    @Field(() => [ShippingItem], { nullable: false })
    shippingItems: ShippingItem[];

    @Field({ nullable: false })
    shippingStatus: string;

    @Field({ nullable: false })
    shippingTotal: string;

    @Field({ nullable: false })
    shippingTotalTax: string;

    @Field({ nullable: false })
    status: string;

    @Field({ nullable: false })
    taxation: string;

    @Field({ nullable: false })
    siteId: string;

    @Field({ nullable: false })
    taxTotal: string;

    @Field({ nullable: true })
    paymentIntentId: string;

    @Field({ nullable: true })
    storeId: string;

    @Field({ nullable: true })
    storeName: string;
}
