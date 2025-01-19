import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument, Types} from "mongoose";

@Schema({ timestamps: true })
export class ImportCost {
    @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
    _id: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    accountNumber: string;

    @Prop({ required: true })
    businessCenter: string;

    @Prop({ default: false })
    isService: boolean;
}
export type ImportCostDocument = HydratedDocument<ImportCost>;
export const ImportCostSchema = SchemaFactory.createForClass(ImportCost);
