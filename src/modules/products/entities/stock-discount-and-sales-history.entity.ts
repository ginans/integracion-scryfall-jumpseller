import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true })
export class StockAndSalesHistory {
    @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
    _id: Types.ObjectId;

    @Prop({ type: String})
    orderId: string;

    @Prop({ type: String})
    productId: string;

    @Prop({ type: String})
    variantId: string;
    
    @Prop({ type: String })
    quantityDiscounted: number;

    @Prop({ type: Date })
    date: Date;
    
    @Prop({ type: Number})
    previousStock: number
    
    @Prop({ type: Number })
    newStock: number;

    @Prop({ type: Number})
    salesByCard: number;

}

export type StockAndSalesHistoryDocument = HydratedDocument<StockAndSalesHistory>;
export const StockAndSalesHistorySchema = SchemaFactory.createForClass(StockAndSalesHistory);