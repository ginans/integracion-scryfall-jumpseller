export interface JumpsellerCreateVariantResponse {
  variant: {
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
    options: JumpsellerVariantOption[];
    image: {
      id: number;
      position: number;
      url: string;
    };
  };
}
  
export interface JumpsellerVariantOption {
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