import { JumpsellerOptionType } from "./jumpsellerProductRequest.interface"

export interface JumpsellerVariantRequest{
    // variant: {
        price?: number,
        sku?: string,
        barcode?: number,
        stock?: number,
        stock_unlimited?: boolean,
        stock_threshold?: number,
        stock_notification?: boolean,
        cost_per_item?: number,
        compare_at_price?: number,
        image_id?: number,
        options?: Options[]
    // }

}

export interface Options{
    name?: string,
    option_type?: JumpsellerOptionType,
    value?: string,
    custom?: string,
    product_option_position?: number,
    product_value_position?: number
}
