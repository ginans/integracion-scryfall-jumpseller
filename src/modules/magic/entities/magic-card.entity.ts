import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MappedMagicCard } from '../../../modules/jumpseller/interfaces/mapped-magic-card.interface';
import { EnumCondition } from '../enums/condition.enum';
import { EnumStatus } from '../enums/status.enum';
import { Stock } from 'src/modules/process/interface/stock.interface';

@Schema({ timestamps: true })
export class MagicCard implements MappedMagicCard{
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;
  
  
  @Prop({ default: null })
  idJumpSeller: number;
  
  @Prop({ required: true })
  id: string;
  
  @Prop()
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
  
  @Prop({ type: Object })
  imageUris: {
    small: string;
    large: string;
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

  @Prop({ type: [String]})
  setType: string;
  
  @Prop({ type: [String]})
  keywords: string[];
  
  @Prop({ type: [String]})
  finishes: string[];

  @Prop()
  foil: boolean;

  @Prop()
  nonfoil: boolean;

  @Prop({ type: Object })
  cardFaces: {
    name: string;
    printedName: string;
    manaCost: string;
    typeLine: string;
    printedTypeLine: string;
    oracleText: string;
    printedText: string;
    power: string;
    toughness: string;
    colors: string[];
    artist: string;
    imageUris: {
      small: string;
      large: string;
    };
  }[];

  @Prop({ type: Object })
  legalities: {
    standard: string;
    future: string;
    historic: string;
    timeless: string;
    gladiator: string;
    pioneer: string;
    explorer: string;
    modern: string;
    legacy: string;
    pauper: string;
    vintage: string;
    penny: string;
    commander: string;
    oathbreaker: string;
    standardbrawl: string;
    brawl: string;
    alchemy: string;
    paupercommander: string;
    duel: string;
    oldschool: string;
    premodern: string;
    predh: string;
  };

  @Prop({ type: Object })
  prices: {
    usd: string | null;
    usdFoil: string | null;
    usdEtched: string | null;
    valorPesoChilenoCalculado: string | null,
    valorPesoChilenoCalculadoFoil: string | null,
    valorPesoChilenoCalculadoEtched: string | null;
  };
  @Prop({ type: Array })
  stock: Stock[];

  @Prop()
  gameChanger: boolean;

  @Prop()
  rarity: string;

  @Prop()
  artist: string;

  @Prop({ nulleable: true })
  collectorNumber?: string;

  @Prop({ nulleable: true })
  setId: string

  @Prop({ nulleable: true })
  set: string;

  @Prop()
  setName: string;

  @Prop({ type: [String]})
  games: string[];

  @Prop({
    default: EnumStatus.PENDING,
  })
  status: EnumStatus;

  @Prop({ default: EnumCondition.NearMint })
  condition: EnumCondition;

}



export type magicCardDocument = HydratedDocument<MagicCard>;
export const magicCardSchema = SchemaFactory.createForClass(MagicCard);

