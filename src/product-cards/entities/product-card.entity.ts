import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { string } from 'joi';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ProductCard {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  id: string;

  @Prop()
  oracleId: string;

  @Prop()
  name: string;

  @Prop()
  printedName: string;

  @Prop()
  lang: string;

  @Prop()
  uri: string;

  @Prop()
  layout: string;

  @Prop({ type: Object })
  imageUris?: {
    small?: string;
    large?: string;
  };

  @Prop()
  manaCost: string;

  @Prop()
  cmc: number;

  @Prop()
  typeLine: string;

  @Prop()
  printedTypeLine: string;

  @Prop({ type: [String]})
  colors: string[];

  @Prop({ type: [String] })
  colorIdentity: string[];

  @Prop({ type: [String]})
  keywords: string[];

  @Prop({ type: Object })
  cardFaces?: {
    name?: string;
    printedName?: string;
    manaCost?: string;
    typeLine?: string;
    printedTypeLine?: string;
    oracleText?: string;
    printedText?: string;
    colors?: string[];
    artist?: string;
    imageUris?: {
      small?: string;
      large?: string;
    };
  }[];

  @Prop({ type: Object })
  legalities?: {
    standard?: string;
    future?: string;
    historic?: string;
    timeless?: string;
    gladiator?: string;
    pioneer?: string;
    explorer?: string;
    modern?: string;
    legacy?: string;
    pauper?: string;
    vintage?: string;
    penny?: string;
    commander?: string;
    oathbreaker?: string;
    standardbrawl?: string;
    brawl?: string;
    alchemy?: string;
    paupercommander?: string;
    duel?: string;
    oldschool?: string;
    premodern?: string;
    predh?: string;
  };

  @Prop({ type: Object })
  prices?: {
    usd?: string | null;
    usdFoil?: string | null;
    usdEtched?: string | null;
  };

  @Prop()
  gameChanger: boolean;

  @Prop()
  rarity: string;

  @Prop()
  artist: string;

  @Prop()
  collectorNumber?: string;

  @Prop()
  setId?: string

  @Prop()
  set?: string;

  @Prop()
  setName?: string;

  @Prop()
  sku?: string;

  @Prop({
    default: "pending",
  })
  status?: string;
}

export type productCardDocument = HydratedDocument<ProductCard>;
export const productCardSchema = SchemaFactory.createForClass(ProductCard);

