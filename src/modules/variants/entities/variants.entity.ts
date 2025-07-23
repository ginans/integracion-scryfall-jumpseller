import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EnumPriceAndStockState } from '../enums/price-and-stock-state.enum';
import { JumpsellerStatus } from '../enums/jumpsellerStatus.enum';
import { IVariant } from '../interfaces/variants.interface';

@Schema({ timestamps: true })
export class Variants implements IVariant {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ default: null, index: true })
  productId: number;

  @Prop({ default: null, index: { unique: true } })
  variantId: number;

  @Prop({ default: null })
  name: string;

  @Prop({ default: null })
  anotherLangName: string;

  @Prop({ default: null, index: { unique: true } })
  sku: string;

  @Prop({ default: 0 })
  variantPrice: number | 0;

  @Prop({ default: true })
  isPriceUpdateable: boolean;

  @Prop({ default: 0 })
  variantStock: number | 0;

  @Prop({ default: 46801 })
  locationId: number | 46801;

  @Prop({ default: false })
  stockUnlimited: boolean;

  @Prop({ default: null })
  finish: string | null;

  @Prop({ default: null, index: true })
  rarity: string | null;

  @Prop({ default: null })
  condition: string | null;

  @Prop({ default: null, index: true })
  game: string | null;

  @Prop({ default: 0 })
  salesByCard: number | 0;

  @Prop({
    type: Object,
    default: null,
  })
  imageUrl: {
    large: string | null;
    cardFaceLarge1: string | null;
    cardFaceLarge2: string | null;
    small: string | null;
    cardFaceSmall1: string | null;
    cardFaceSmall2: string | null;
  };

  @Prop({
    default: EnumPriceAndStockState.COMPLETED,
  })
  priceUpdateStatus: EnumPriceAndStockState;

  @Prop({ default: null })
  priceUpdateError: string;

  @Prop({
    default: EnumPriceAndStockState.COMPLETED,
  })
  stockUpdateStatus: EnumPriceAndStockState;

  @Prop({ default: null })
  stockUpdateError: string;

  @Prop({ default: JumpsellerStatus.AVALIABLE })
  jumpsellerStatus: JumpsellerStatus;

  @Prop({
    type: Object,
    default: null,
  })
  fatherProduct: {
    id: string;
    collectorNumber: string;
    oracleId: string;
    sku?: string | null;
    description: string;
    setId: string;
    set: string;
  };
}

export type VariantsDocument =
  HydratedDocument<Variants>;
export const VariantsSchema = SchemaFactory.createForClass(
  Variants,
);

VariantsSchema.index(
  { productId: 1, variantId: 1 },
  { unique: true },
);
