export interface SaleData {
    order: Order;
}

export interface Order {
    id: number;
    created_at: string;
    status: string;
    currency: string;
    subtotal: number;
    tax: number;
    shipping_tax: number;
    shipping: number;
    shipping_required: boolean;
    total: number;
    discount: number;
    shipping_discount: number;
    fulfillment_status: string | null;
    shipping_method_id: number;
    shipping_service_id: null;
    shipping_method_name: string;
    payment_method_name: string;
    payment_method_type: string;
    payment_information: string;
    additional_information: string;
    duplicate_url: string;
    recovery_url: string | null;
    checkout_url: string;
    coupons: null;
    promotions: any[];
    customer: Customer;
    shipping_address: ShippingAddress;
    billing_address: BillingAddress;
    products: Product[];
    additional_fields: AdditionalField[];
    shipping_taxes: shipingTaxes[];
    source: Source;
    tracking_url: string | null;
    tracking_company: string | null;
    tracking_number: string | null;
    shipping_option: string;
    shipment_status: string;
    external_shipping_rate_id: string | null;
    external_shipping_rate_description: string | null;
}

export interface shipingTaxes {
    id: number,
    name: string,
    country: string,
    region: string,
    rate: number,
    fixed: boolean,
    tax_on_shipping_price: boolean
}

export interface Customer {
    id: string;
    email: string;
    phone: string;
    ip: string;
}

export interface ShippingAddress {
    name: string;
    surname: string;
    address: string;
    city: string;
    postal: string;
    region: string;
    country: string;
    country_code: string;
    region_code: string;
    street_number: string | null;
    latitude: number;
    longitude: number;
}

export interface BillingAddress {
    name: string;
    surname: string;
    taxid: string | null;
    address: string;
    city: string;
    postal: string;
    region: string;
    country: string;
    country_code: string;
    region_code: string;
    street_number: string | null;
}

export interface Product {
    id: number;
    variant_id: number;
    sku: string;
    name: string;
    qty: number;
    price: number;
    tax: number;
    discount: number;
    weight: number;
    image: string;
    files: any[];
    taxes: ProductTaxes[];
}

export interface ProductTaxes{
    id: number,
    name: string,
    rate: number,
    fixed: boolean,
    tax_on_product_price: boolean
}

export interface AdditionalField {
    label: string;
    value: string;
    id: number;
    area: string;
}

export interface Source {
    source_name: string | null;
    medium: string | null;
    campaign: string | null;
    referral_url: string | null;
    referral_code: string | null;
    user_agent: string;
    first_page_visited: string;
    first_page_visited_at: string;
    referral_source: string;
}


export interface JumpsellerWebhookSaleResponse {
    success: boolean;
    message: string;
    receivedAt: string;
    Headers: Headers;
    Body: Order;
}