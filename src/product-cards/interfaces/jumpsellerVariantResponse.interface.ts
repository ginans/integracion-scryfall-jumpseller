interface JumpsellerVariantResponse {
    variant: JumpsellerVariant;
}

interface JumpsellerVariant {
  id: number;
  price: number;
  sku: string;
  barcode?: string;
  stock: number;
  stock_unlimited: boolean;
  stock_threshold: number;
  stock_notification: boolean;
  cost_per_item?: number;
  compare_at_price?: number;
  options: JumpsellerVariantOption[];
  image?: JumpsellerVariantImage;
}

interface JumpsellerVariantOption {
    name: string;
    option_type: "option"; // Parece que siempre es "option"
    value: string;
    custom?: string;
    product_option_position?: number;
    product_value_position?: number;
  }
  
  interface JumpsellerVariantImage {
    id: number;
    position: number;
    url: string;
  }
  
  
  