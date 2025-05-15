export interface JumpsellerUpdateProductRequest {
    product: {
        name: string;
        price: number;
        description?: string;
        page_title?: string;
        meta_description?: string;
        type?: string;
        days_to_expire?: number;
        weight?: number;
        stock?: number;
        stock_unlimited?: boolean;
        stock_threshold?: number;
        stock_notification?: boolean;
        cost_per_item?: number;
        compare_at_price?: number;
        minimum_quantity?: number;
        maximum_quantity?: number;
        sku?: string;
        barcode?: string;
        google_product_category?: string;
        featured?: boolean;
        shipping_required?: boolean;
        status?: string;
        package_format?: string;
        length?: number;
        width?: number;
        height?: number;
        diameter?: number;
        permalink?: string;
        categories?: JumpsellerCategory[];
    }
}

export interface JumpsellerCategory {
    id?: number;
    name?: string;
    parent_id?: number;
    permalink?: string;
}