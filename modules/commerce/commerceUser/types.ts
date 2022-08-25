import { Field, ObjectType } from "type-graphql";
import { ProductLineItem, ShippingAddress } from "../basket/types";
import { OrderConfirmationAddress, OrderConfirmationDeliveryMethod } from "../checkout/types";

@ObjectType()
export class GlobalUserDataRes {
    @Field(() => String, { nullable: true })
    firstName: string | null;

    @Field(() => String, { nullable: true })
    lastName: string | null;

    @Field({ nullable: false })
    isLoggedIn: boolean;
}

@ObjectType()
export class ProfileDataRes {
    @Field({ nullable: true })
    firstName: string;

    @Field({ nullable: true })
    lastName: string;

    @Field({ nullable: true })
    phone: string;

    @Field({ nullable: true })
    email: string;

    @Field({ nullable: false })
    numberOfOrders: number;

    @Field(() => String, { nullable: true })
    lastOrderDate: string | null;
}

@ObjectType()
export class Address {
    @Field(() => String, { nullable: true })
    id: string | null;

    @Field(() => String, { nullable: true })
    addressName: string | null;

    @Field({ nullable: false })
    firstName: string;

    @Field({ nullable: false })
    lastName: string;

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

    @Field(() => Boolean, { nullable: false })
    isPrimary: boolean;
}

@ObjectType()
export class WishlistItem {
    @Field({ nullable: false })
    id: string;

    @Field({ nullable: false })
    productId: string;

    @Field({ nullable: true })
    image: string;

    @Field({ nullable: false })
    name: string;

    @Field(() => String, { nullable: true })
    size: string | null;

    @Field(() => Number, { nullable: true })
    quantity: number | null;

    @Field({ nullable: false })
    price: string;

    @Field({ nullable: true })
    storeId: string;
}

@ObjectType()
export class GetCustomerWishlistsRes {
    @Field({ nullable: false })
    wishlistId: string;

    @Field({ nullable: false })
    public: boolean;

    @Field(() => [WishlistItem], { nullable: true })
    customerProductListItems: WishlistItem[] | null;
}

@ObjectType()
export class UpdateWishlistRes {
    @Field({ nullable: false })
    status: string;
}

@ObjectType()
export class DeleteWishlistItemRes {
    @Field({ nullable: false })
    status: string;
}

@ObjectType()
export class DeleteAddressRes {
    @Field({ nullable: false })
    status: string;
}

@ObjectType()
export class AddToWishlistRes {
    @Field({ nullable: false })
    id: string;

    @Field({ nullable: false })
    priority: number;

    @Field({ nullable: false })
    productId: string;

    @Field({ nullable: false })
    public: boolean;

    @Field({ nullable: false })
    quantity: number;

    @Field({ nullable: false })
    type: string;

    @Field({ nullable: false })
    storeId: string;
}

@ObjectType()
export class UpdateCustomerPassword {
    @Field({ nullable: false })
    status: string;
}
@ObjectType()
export class OrderShipment {
    @Field(() => String, { nullable: false })
    id: string;

    @Field(() => String, { nullable: false })
    shippingStatus: string;

    @Field(() => ShippingAddress, { nullable: false })
    shippingAddress: ShippingAddress;

    @Field(() => [ProductLineItem], { nullable: false })
    items: ProductLineItem[];

    @Field(() => OrderConfirmationDeliveryMethod, { nullable: true })
    deliveryMethod?: OrderConfirmationDeliveryMethod;
}

@ObjectType()
export class OrderItem {
    @Field({ nullable: false })
    billingAddress: OrderConfirmationAddress;

    @Field({ nullable: false })
    orderNumber: string;

    @Field({ nullable: false })
    date: string;

    @Field({ nullable: false })
    status: string;

    @Field({ nullable: false })
    total: string;

    @Field({ nullable: false })
    subtotal: string;

    @Field(() => [OrderShipment], { nullable: false })
    shipments: OrderShipment[];

    @Field()
    paymentStatus: string;

    @Field({ nullable: false })
    shippingTotal: string;

    @Field({ nullable: false })
    taxTotal: string;

    @Field({ nullable: true })
    storeId?: string;

    @Field({ nullable: true })
    storeName?: string;
}
@ObjectType()
export class GetCustomerOrdersRes {
    @Field(() => [OrderItem], { nullable: false })
    orders: OrderItem[];

    @Field({ nullable: false })
    total: number;
}

@ObjectType()
export class UpdateCustomerProfileRes {
    @Field()
    isEmailChanged: boolean;
}
