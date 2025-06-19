export interface JumpsellerCreateVariantRequest {
    variant: {
        price?: number;
        sku: string;
        barcode?: number;
        stock?: number;
        stock_unlimited?: boolean;
        stock_threshold?: number;
        stock_notification?: boolean;
        cost_per_item?: number;
        compare_at_price?: number;
        image_id?: number;
        options?: JumpsellerVariantOption[];
    }
}
export interface JumpsellerCreateVariantRequestForBD extends JumpsellerCreateVariantRequest {
    finish?: string;
    condition?: string;
}
interface JumpsellerVariantOption {
    name: string;
    option_type: JumpsellerOptionType;
    value: string;
    custom?: string;
    product_option_position?: number;
    product_value_position?: number;
}

export enum JumpsellerOptionType {
  OPTION = "option", 
  COLOR = "color",
  DROPDOWN = "dropdown"
}