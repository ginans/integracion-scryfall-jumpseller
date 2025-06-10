export interface ISaleData {
    order?: IOrder;
}

export interface IOrder {
    id: number;
    source?: Source;
    created_at?: string;
    completed_at?: string;
    currency?: string;
    subtotal?: number;
    tax?: number;
    shipping_tax?: number;
    shipping?: number;
    shipping_required?: boolean;
    total?: number;
    discount?: number;
    shipping_discount?: number;
    gift_cards_discount?: number;
    fulfillment_status?: string;
    shipping_method_id?: number;
    shipping_service_id?: number;
    shipping_method_name?: string;
    payment_method_name?: string;
    payment_method_type?: string;
    payment_information?: string;
    additional_information?: string;
    duplicate_url?: string;
    recovery_url?: string;
    review_url?: string;
    checkout_url?: string;
    coupons?: string;
    promotions?: any[];
    customer?: Customer;
    shipping_branch?: ShippingBranch;
    shipping_address?: ShippingAddress;
    billing_address?: BillingAddress;
    pickup_address?: PickupAddress;
    products?: Product[];
    additional_fields?: AdditionalField[];
    shipping_taxes?: ShippingTax[];
    status?: string;
    status_name?: string;
    status_enum?: string;
    tracking_url?: string;
    tracking_company?: string;
    tracking_number?: string;
    shipping_option?: string;
    same_day_delivery?: boolean;
    shipment_status?: string;
    shipment_status_enum?: string;
    recovered_from?: number;
    external_shipping_rate_id?: string;
    external_shipping_rate_description?: string;
    billing_information?: BillingInformation;
}

export interface Source {
    source_name?: string;
    medium?: string;
    campaign?: string;
    referral_url?: string;
    referral_code?: string;
    user_agent?: string;
    first_page_visited?: string;
    first_page_visited_at?: string;
    referral_source?: string;
    created_from?: string;
    created_from_app_code?: string;
}

export interface Customer {
    id?: number;
    email?: string;
    phone?: string;
    phone_prefix?: string;
    ip?: string;
    fullname?: string;
}

export interface ShippingBranch {
    id?: number;
    name?: string;
}

export interface ShippingAddress {
    name?: string;
    surname?: string;
    address?: string;
    city?: string;
    postal?: string;
    region?: string;
    country?: string;
    country_code?: string;
    region_code?: string;
    street_number?: number;
    complement?: string;
    latitude?: number;
    longitude?: number;
    municipality?: string;
}

export interface BillingAddress {
    name?: string;
    surname?: string;
    taxid?: string;
    address?: string;
    city?: string;
    postal?: string;
    region?: string;
    country?: string;
    country_code?: string;
    region_code?: string;
    street_number?: number;
    complement?: string;
    municipality?: string;
}

export interface PickupAddress {
    name?: string;
    surname?: string;
    address?: string;
    city?: string;
    postal?: string;
    region?: string;
    country?: string;
    country_code?: string;
    region_code?: string;
    street_number?: number;
    complement?: string;
    municipality?: string;
    pickup_place_name?: string;
}

export interface Product {
    id: number;
    variant_id: number;
    sku: string;
    name?: string;
    image?: string;
    qty?: number;
    price?: number;
    discount?: number;
    weight?: number;
    taxes?: Tax[];
    tax: number;
    type?: string;
    stock_locations?: StockLocation[];
    files?: string[];
}

export interface Tax {
    id?: number;
    name?: string;
    rate?: number;
    fixed?: boolean;
    tax_on_product_price?: boolean;
}

export interface StockLocation {
    location_id?: number;
    stock?: number;
}

export interface AdditionalField {
    label?: string;
    value?: string;
    id?: number;
    area?: string;
}

export interface ShippingTax {
    id?: number;
    name?: string;
    country?: string;
    region?: string;
    rate?: number;
    fixed?: boolean;
    tax_on_shipping_price?: boolean;
}

export interface BillingInformation {
    business_activity?: string;
    company_name?: string;
    taxpayer_type?: string;
}