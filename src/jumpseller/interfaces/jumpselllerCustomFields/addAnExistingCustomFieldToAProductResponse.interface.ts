export interface AddAnExistingCustomFieldToAProductResponse {
    product: {
        id: number;
        name: string;
        page_title: string;
        description: string;
        type: string;
        days_to_expire: number;
        price: number;
        discount: number;
        weight: number;
        stock: number;
        stock_unlimited: boolean;
        stock_threshold: number;
        stock_notification: boolean;
        cost_per_item: number;
        compare_at_price: number;
        sku: string;
        brand: string;
        barcode: string;
        google_product_category: string;
        featured: boolean;
        reviews_enabled: boolean;
        status: string;
        created_at: string;
        updated_at: string;
        package_format: string;
        length: number;
        width: number;
        height: number;
        diameter: number;
        permalink: string;
        categories: {
            id: number;
            name: string;
            parent_id: number;
            permalink: string;
        }[];
        images: {
            id: number;
            position: number;
            url: string;
        }[];
        variants: {
            id: number;
            price: number;
            sku: string;
            barcode: string;
            stock: number;
            stock_unlimited: boolean;
            stock_threshold: number;
            stock_notification: boolean;
            cost_per_item: number;
            compare_at_price: number;
            options: {
                name: string;
                option_type: string;
                value: string;
                custom: string;
                product_option_position: number;
                product_value_position: number;
            }[];
            image: {
                id: number;
                position: number;
                url: string;
            };
        }[];
    };
}
