export interface StockJumpsellerRequest {
    stock?: number;
    product_id?: number;
    variant_id?: number;
    location_id?: number;
    stock_unlimited?: boolean;
}

export interface IStockFromFront {
    variantStock: number;
    productId: number;
    variantId: number;
    locationId?: number;
    stockUnlimited?: boolean;
}