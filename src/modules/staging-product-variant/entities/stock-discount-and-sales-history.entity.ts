import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true })
export class StockAndSalesHistory {

    @Prop({ type: Number, required: true })
    orderId: number;

    @Prop({ type: String})
    productId: string;

    @Prop({ type: String})
    variantId: string;

    @Prop({ type: Number })
    quantityDiscounted: number;

    @Prop({ type: Date })
    date: Date;

    @Prop({ type: Number })
    previousStock: number;

    @Prop({ type: Number })
    newStock: number;

    @Prop({ type: Number})
    salesByCard: number;

}

export type StockAndSalesHistoryDocument = HydratedDocument<StockAndSalesHistory>;
export const StockAndSalesHistorySchema = SchemaFactory.createForClass(StockAndSalesHistory);