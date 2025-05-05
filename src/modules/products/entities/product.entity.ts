import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IdataProduct } from '../interfaces/product.interface';

@Schema({ timestamps: true })
export class Product implements IdataProduct {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: String, unique: true })
  oracleId?: string;

  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ default: Date.now() })
  created_at: string;

  @Prop({ default: Date.now() })
  updated_at: string;

  @Prop()
  page_title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  type: string;

  @Prop({ default: 365 })
  days_to_expire: number;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 1 })
  weight: number;

  @Prop({ default: 100 })
  stock: number;

  @Prop({ default: 0 })
  historySales: number;

  @Prop({ type: [] })
  stockHistory: Array<{
    quantityDiscounted: number;
    date: Date;
    orderId: string;
    previousStock: number;
    newStock: number;
  }>;

  @Prop({ default: true })
  stock_unlimited: boolean;

  @Prop({ default: 0 })
  stock_threshold: number;

  @Prop({ default: true })
  stock_notification: boolean;

  @Prop({ default: 0 })
  cost_per_item: number;

  @Prop({ default: 0 })
  compare_at_price: number;

  @Prop()
  sku: string;

  @Prop()
  brand: string;

  @Prop()
  barcode: string;

  @Prop()
  google_product_category: string;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: true })
  reviews_enabled: boolean;

  @Prop({ default: 'available' })
  status: string;

  @Prop()
  package_format: string;

  @Prop({ default: 0.1 })
  length: number;

  @Prop({ default: 0.1 })
  width: number;

  @Prop({ default: 0.1 })
  height: number;

  @Prop({ default: 0.1 })
  diameter: number;

  @Prop()
  permalink: string;

  @Prop({
    type: [
      {
        id: Number,
        name: String,
        parent_id: Number,
        permalink: String,
      },
    ],
  })
  categories: Array<{
    id: number;
    name: string;
    parent_id: number;
    permalink: string;
  }>;

  @Prop({
    type: [
      {
        id: Number,
        position: Number,
        url: String,
      },
    ],
  })
  images: Array<{
    id: number;
    position: number;
    url: string;
  }>;

  @Prop({
    type: [
      {
        id: Number,
        price: Number,
        sku: String,
        barcode: String,
        stock: { type: Number, default: 0 },
        historySales: Number,
        stockHistory: { type: [] },
        stock_unlimited: Boolean,
        stock_threshold: Number,
        stock_notification: Boolean,
        cost_per_item: Number,
        compare_at_price: Number,
        options: [
          {
            name: String,
            option_type: String,
            value: String,
            custom: String,
            product_option_position: Number,
            product_value_position: Number,
          },
        ],
        image: {
          id: Number,
          position: Number,
          url: String,
        },
      },
    ],
  })
  variants: Array<{
    id: number;
    price: number;
    sku: string;
    barcode: string;
    stock: number;
    historySales: number;
    stockHistory: Array<{
      quantityDiscounted: number;
      date: Date;
      orderId: string;
      previousStock: number;
      newStock: number;
    }>;
    stock_unlimited: boolean;
    stock_threshold: number;
    stock_notification: boolean;
    cost_per_item: number;
    compare_at_price: number;
    options: Array<{
      name: string;
      option_type: string;
      value: string;
      custom: string;
      product_option_position: number;
      product_value_position: number;
    }>;
    image: {
      id: number;
      position: number;
      url: string;
    };
  }>;
}
export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);