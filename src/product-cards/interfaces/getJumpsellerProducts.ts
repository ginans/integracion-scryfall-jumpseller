export interface GetJumpsellerProduct {
    product: {
        id: number;
        name: string;
        page_title: string;
        description: string | null;
        meta_description: string | null;
        price: number;
        cost_per_item: number | null;
        compare_at_price: number | null;
        weight: number;
        stock: number;
        stock_unlimited: boolean;
        stock_threshold: number;
        stock_notification: boolean;
        sku: string;
        brand: string | null;
        barcode: string | null;
        featured: boolean;
        reviews_enabled: boolean;
        status: string;
        shipping_required: boolean;
        type: string;
        days_to_expire: number | null;
        created_at: string;
        updated_at: string;
        package_format: string;
        length: number;
        width: number;
        height: number;
        diameter: number;
        google_product_category: string | null;
        categories: any[]; // Replace `any` with a specific type if known
        images: any[]; // Replace `any` with a specific type if known
        variants: any[]; // Replace `any` with a specific type if known
        fields: any[]; // Replace `any` with a specific type if known
        permalink: string;
        discount: string;
        currency: string;
    };
}