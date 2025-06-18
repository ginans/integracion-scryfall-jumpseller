import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { StateOrderEnum } from "../enums/state-order.enum";

@Schema({ _id: false })
export class Source {
    @Prop({ type: String })
    name?: string;
    @Prop({ type: String })
    medium?: string;
    @Prop({ type: String })
    campaign?: string;
    @Prop({ type: String })
    referralUrl?: string;
    @Prop({ type: String })
    referralCode?: string;
    @Prop({ type: String })
    userAgent?: string;
    @Prop({ type: String })
    firstPageVisited?: string;
    @Prop({ type: String })
    firstPageVisitedAt?: string;
    @Prop({ type: String })
    referralSource?: string;
    @Prop({ type: String })
    createdFrom?: string;
    @Prop({ type: String})
    createdFromAppCode?: string;
}

@Schema({ _id: false })
export class Customer {
    @Prop({ type: Number, required: true })
    id: number;
    @Prop({ type: String})
    name: string;
    @Prop({ type: String})
    email: string;
    @Prop({ type: String})
    phone: string;
    @Prop({ type: String})
    phonePrefix: string;
    ip: string;
}


@Schema({ _id: false })
export class ShippingAddress {
    @Prop({ type: String })
    name: string;
    @Prop({ type: String })
    surName: string;
    @Prop({ type: String })
    address: string;
    @Prop({ type: String })
    city: string;
    @Prop({ type: String })
    region: string;
    @Prop({ type: String })
    country: string;
    @Prop({ type: Number })
    streetNumber: number;
    @Prop({ type: String })
    municipality: string;
};

@Schema({ _id: false })
export class ShippingBranch {
    @Prop({ type: Number })
    id: number;
    @Prop({ type: String })
    name: string;
}

@Schema({ _id: false })
export class BillingAddress {
    @Prop({ type: String })
    name: string;
    @Prop({ type: String })
    surName: string;
    @Prop({ type: String })
    address: string;
    @Prop({ type: String })
    city: string;
    @Prop({ type: String })
    region: string;
    @Prop({ type: String })
    country: string;
    @Prop({ type: Number })
    streetNumber: number;
    @Prop({ type: String })
    municipality: string;
}

@Schema({ _id: false })
export class PickupAddress {
    @Prop({ type: String })
    name: string;
    @Prop({ type: String })
    surName: string;
    @Prop({ type: String })
    address: string;
    @Prop({ type: String })
    city: string;
    @Prop({ type: String })
    region: string;
    @Prop({ type: String })
    country: string;
    @Prop({ type: Number })
    streetNumber: number;
    @Prop({ type: String })
    municipality: string;
    @Prop({ type: String })
    pickUpPlaceName: string;
}

 @Schema({ _id: false })
export class StockLocation {
    @Prop({ type: Number })
    locationId: number;
    @Prop({ type: Number })
    stock: number;
}

@Schema({ _id: false })
export class Taxes {
    @Prop({ type: Number })
    id: number;
    @Prop({ type: String })
    name: string;
    @Prop({ type: Number })
    rate: number;
}

@Schema({ _id: false })
export class Products {
    @Prop({ type: Number, required: true })
    id: number;
    @Prop({ type: Number, required: true })
    variantId: number;
    @Prop({ type: String, required: true })
    sku: string;
    @Prop({ type: String, required: true })
    name: string;
    @Prop({ type: String})
    image: string;
    @Prop({ type: Number, required: true })
    qty: number;
    @Prop({ type: Number, required: true })
    price: number;
    @Prop({ type: Number })
    discount: number;
    @Prop({ type: [Object], nullable: true })
    taxes: Taxes[];
    @Prop({ type: [Object], nullable: true })
    stockLocations: StockLocation[];
    }

@Schema({ _id: false })
export class ShippingTaxes {
    @Prop({ type: Number})
    id: number;
    @Prop({ type: String})
    name: string;
    @Prop({ type: Number})
    rate: number;
    @Prop({ type: String})
    country: string;
    @Prop({ type: String})
    region: string;
}

@Schema({ _id: false })
export class BillingInformation {
    @Prop({ type: String })
    businessActivity: string;
    @Prop({ type: String })
    companyName: string;
    @Prop({ type: String })
    taxpayerType: string;
}


@Schema({ timestamps: true })
export class Order {

    @Prop({ type: Number, required: true, unique: true })
    orderId: number;

    @Prop({ type: Object, nullable: true }) 
    source?: Source

    @Prop({ type: String })
    saleCreationDate: string;

    @Prop({ type: String})
    saleCompletedDate: string;

    @Prop({ type: String })
    currency: string;

    @Prop({ type: Number })
    subTotal: number;

    @Prop({ type: Number })
    tax: number;

    @Prop({ type: Number })
    shippingTax: number;

    @Prop({ type: Number })
    shipping: number;

    @Prop({ type: Number })
    total: number;

    @Prop({ type: Number })
    discount: number;

    @Prop({ type: Number })
    shippingDiscount: number;

    @Prop({ type: String })
    fullfillmentStatus: string;

    @Prop({ type: String })
    shippingMethodName: string;

    @Prop({ type: String })
    paymentMethodName: string;

    @Prop({ type: String })
    paymentMethodType: string;

    @Prop({ type: String })
    paymentInformation: string;

    @Prop({ type: String })
    checkoutUrl: string;

    @Prop({ type: String })
    coupon: string;

    @Prop({type: Object, nullable: true })
    customer?: Customer

    @Prop({type: Object, nullable: true })
    shippingBranch?: ShippingBranch

    @Prop({type: Object, nullable: true })
    shippingAddress?: ShippingAddress;

    @Prop({type: Object, nullable: true })
    billingAddress?: BillingAddress

    @Prop({type: Object, nullable: true })
    pickupAddress?: PickupAddress;

    @Prop({type: [Object], nullable: true })
    products?: Products[]

    @Prop({type: [Object], nullable: true })
    shippingTaxes?: ShippingTaxes[]

    @Prop({type: String })
    statusJumpseller?: string;

    @Prop({type: String })
    statusJumpsellerName?: string;

    @Prop({type: String })
    statusJumpsellerEnum?: string;

    @Prop({type: String })
    trackingUrl?: string;

    @Prop({type: String })
    trackingNumber?: string;

    @Prop({type: String })
    shippingOption?: string;

    @Prop({type: Boolean })
    sameDayDelivery?: boolean;

    @Prop({type: String })
    shipmentStatus?: string;

    @Prop({type: String })
    shipmentStatusEnum?: string;

    @Prop({type: String })
    recoveredFrom?: number;

    @Prop({type: Object, nullable: true })
    billingInformation?: BillingInformation

    @Prop({ type: String, default: StateOrderEnum.PENDING })
    state: StateOrderEnum;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);

