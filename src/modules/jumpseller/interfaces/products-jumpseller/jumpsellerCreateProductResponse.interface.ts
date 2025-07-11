export interface JumpsellerProductResponse {
  product: IJumpsellerProduct;
}
export interface IJumpsellerProduct {
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
  categories: ICategory[];
  images: IImage[];
  variants: ICreateProductVariant[];
}
export interface ICategory {
  id: number;
  name: string;
  parent_id: number;
  permalink: string;
}
export interface IImage {
  id: number;
  position: number;
  url: string;
}
export interface ICreateProductVariant {
  id: number;
  position: number;
  price: number;
  cost_per_item: number;
  compare_at_price: number;
  sku: string;
  barcode: string;
  stock: number;
  stock_unlimited: boolean;
  stock_threshold: number;
  stock_notification: boolean;
  weight: number;
  options: IOption[];
  image: {
    id: number;
    position: number;
    url: string;
  } | null;
  discount: string;
}

export interface IOption {
  product_option_id?: number;
  product_option_value_id?: number;
  name: string;
  option_type: JumpsellerOptionType;
  value: string;
  custom?: string | null;
  product_option_position?: number;
  product_value_position?: number;
}

enum JumpsellerOptionType {
  OPTION = 'option',
  COLOR = 'color',
  DROPDOWN = 'dropdown',
}
