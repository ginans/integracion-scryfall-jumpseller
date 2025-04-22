export interface StockJumpsellerRequest {
    location_id: number;
    product_id: number;
    variant_id: number;
    stock_unlimited: boolean;
    stock: number;
}