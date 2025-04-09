export interface Product {
    id: number;
    variant_id: number;
    sku: string;
    name: string;
    qty: number;
    price: number;
    tax: number | null;
    discount: number;
    weight: number;
    image: string;
    type: string;
    taxes: any[];
    stock_locations: any[];
    files: any[];
}

export interface AdditionalField {
    value: string | null;
    label: string;
    id: number;
    area: string;
}

export interface Order {
    id: number;
    source: string | null;
    created_at: string;
    completed_at: string;
    currency: string;
    subtotal: number;
    tax: number;
    shipping_tax: number;
    shipping: number;
    shipping_required: boolean;
    total: number;
    discount: number;
    shipping_discount: number;
    gift_cards_discount: number;
    fulfillment_status: string;
    shipping_method_id: number | null;
    shipping_service_id: number | null;
    shipping_method_name: string | null;
    payment_method_name: string | null;
    payment_method_type: string | null;
    payment_information: string | null;
    additional_information: string | null;
    duplicate_url: string;
    recovery_url: string | null;
    review_url: string | null;
    checkout_url: string;
    coupons: any | null;
    promotions: any[];
    customer: any | null;
    shipping_branch: any | null;
    shipping_address: any | null;
    billing_address: any | null;
    pickup_address: any | null;
    products: Product[];
    additional_fields: AdditionalField[];
    shipping_taxes: any[];
    status: string;
    status_name: string;
    status_enum: string;
    tracking_url: string | null;
    tracking_company: string | null;
    tracking_number: string | null;
    shipping_option: string | null;
    same_day_delivery: boolean;
    shipment_status: string;
    shipment_status_enum: string;
    recovered_from: string | null;
    external_shipping_rate_id: string | null;
    external_shipping_rate_description: string | null;
    billing_information: string | null;
}

export interface Headers {
    [key: string]: string;
}

export interface JumpsellerWebhookSaleResponse {
    success: boolean;
    message: string;
    receivedAt: string;
    Headers: Headers;
    Body: Order;
}