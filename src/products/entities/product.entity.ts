import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop()
  catalog: string;
  @Prop()
  barcode: string;
  @Prop()
  status: boolean;
  @Prop()
  ivaSpecific: number;
  @Prop()
  ivaUnitary: number;
  @Prop()
  brandId: number;
  @Prop()
  name: string;
  @Prop()
  nameAttribute: string;
  @Prop()
  weight: number;
  @Prop()
  productFamilyId: number;
  @Prop()
  uuid: number;
  @Prop()
  productSubFamilyId: number;
  @Prop()
  sku: string;
  @Prop()
  skuOld: string;
  @Prop()
  type: string;
  @Prop()
  unity: number;
  @Prop()
  visibility: boolean;
  @Prop()
  wcProductId?: string | null;
  @Prop()
  price?: number;
}

export const productSchema = SchemaFactory.createForClass(Product);
