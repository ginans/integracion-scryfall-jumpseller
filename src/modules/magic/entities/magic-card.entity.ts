import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EnumStatus } from '../enums/status.enum';

@Schema({ _id: false })
export class ImageUris {
  @Prop({ type: String, required: false })
  small: string;

  @Prop({ type: String, required: false })
  large: string;
}

@Schema({ _id: false })
export class CardFace {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  printedName: string;

  @Prop({ type: String })
  manaCost: string;

  @Prop({ type: String })
  typeLine: string;

  @Prop({ type: String })
  printedTypeLine: string;

  @Prop({ type: String })
  oracleText: string;

  @Prop({ type: String })
  printedText: string;

  @Prop({ type: String })
  power: string;

  @Prop({ type: String })
  toughness: string;

  @Prop({ type: [String], default: [] })
  colors: string[];

  @Prop({ type: String })
  artist: string;

  @Prop({ type: ImageUris })
  imageUris: ImageUris;
}

@Schema({ _id: false })
export class Legalities {
  @Prop({ type: String })
  standard?: string;

  @Prop({ type: String })
  future?: string;

  @Prop({ type: String })
  historic?: string;

  @Prop({ type: String })
  timeless?: string;

  @Prop({ type: String })
  gladiator?: string;

  @Prop({ type: String })
  pioneer?: string;

  @Prop({ type: String })
  explorer?: string;

  @Prop({ type: String })
  modern?: string;

  @Prop({ type: String })
  legacy?: string;

  @Prop({ type: String })
  pauper?: string;

  @Prop({ type: String })
  vintage?: string;

  @Prop({ type: String })
  penny?: string;

  @Prop({ type: String })
  commander?: string;

  @Prop({ type: String })
  oathbreaker?: string;

  @Prop({ type: String })
  standardbrawl?: string;

  @Prop({ type: String })
  brawl?: string;

  @Prop({ type: String })
  alchemy?: string;

  @Prop({ type: String })
  paupercommander?: string;

  @Prop({ type: String })
  duel?: string;

  @Prop({ type: String })
  oldschool?: string;

  @Prop({ type: String })
  premodern?: string;

  @Prop({ type: String })
  predh?: string;
}

@Schema({ _id: false })
export class Prices {
  @Prop({ type: String, default: null })
  usd?: string | null;

  @Prop({ type: String, default: null })
  usdFoil?: string | null;

  @Prop({ type: String, default: null })
  usdEtched?: string | null;
}

@Schema({ timestamps: true })
export class MagicCard {
  @Prop({ type: String, required: true, unique: true })
  id: string;

  @Prop({ default: null, index: true })
  idJumpSeller?: number | null;
  
  @Prop({ index: true })
  oracleId: string;
  
  @Prop()
  name: string;
  
  @Prop()
  printedName: string;
  
  @Prop()
  oracleText: string;
  
  @Prop()
  printedText: string;
  
  @Prop()
  lang: string;
  
  @Prop()
  uri: string;
  
  @Prop()
  layout: string;
  
  @Prop({ type: ImageUris, required: true })
  imageUris: ImageUris;
  
  @Prop()
  manaCost: string;
  
  @Prop()
  cmc: number;
  
  @Prop()
  typeLine: string;
  
  @Prop()
  printedTypeLine: string;
  
  @Prop({ type: [String], default: [] })
  colors: string[];
  
  @Prop({ type: [String], default: [] })
  colorIdentity: string[];

  @Prop()
  borderColor: string;

  @Prop()
  fullArt: boolean;

  @Prop()
  textless: boolean;

  @Prop()
  power: string;

  @Prop()
  toughness: string;

  @Prop({ type: String})
  setType: string;
  
  @Prop({ type: [String]})
  keywords: string[];
  
  @Prop({ type: [String]})
  finishes: string[];

  @Prop()
  foil: boolean;

  @Prop()
  nonfoil: boolean;

  @Prop({ type: [CardFace], default: [] })
  cardFaces: CardFace[];

  @Prop({ type: Object })
  legalities: Legalities;

  @Prop({ type: Object })
  prices: Prices;

  @Prop()
  gameChanger: boolean;

  @Prop()
  rarity: string;

  @Prop()
  artist: string;

  @Prop({ nullable: true })
  collectorNumber?: string | null;

  @Prop({ nullable: true })
  setId: string

  @Prop({ nullable: true })
  set: string;

  @Prop()
  setName: string;

  @Prop({ type: [String]})
  games: string[];

  @Prop({ default: EnumStatus.PENDING })
  status?: EnumStatus;
}

export type MagicCardDocument = HydratedDocument<MagicCard>;
export const magicCardSchema = SchemaFactory.createForClass(MagicCard);

