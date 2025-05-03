export interface JumpsellerUpdateVariantResponse {
    variant: Variant
}

export interface Variant {
    id: number
    price: number
    sku: string
    barcode: string
    stock: number
    stock_unlimited: boolean
    stock_threshold: number
    stock_notification: boolean
    cost_per_item: number
    compare_at_price: number
    options: VariantOption[]
    image: VariantImage
}

export interface VariantOption {
    name: string
    option_type: JumpsellerOptionType
    value: string
    custom: string
    product_option_position: number
    product_value_position: number
}

export interface VariantImage {
    id: number
    position: number
    url: string
}

export enum JumpsellerOptionType {
    OPTION = "option", 
    COLOR = "color",
    DROPDOWN = "dropdown"
  }