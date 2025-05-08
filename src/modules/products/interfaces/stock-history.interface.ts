export interface StockHistoryEntry {
  quantityDiscounted: number;
  date: Date;
  orderId: string;
  previousStock: number;
  newStock: number;
}
