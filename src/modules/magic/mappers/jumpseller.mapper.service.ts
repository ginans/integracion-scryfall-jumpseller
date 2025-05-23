import { MappedMagicCard } from 'src/modules/jumpseller/interfaces/mapped-magic-card.interface';
import { JumpsellerProductRequest, JumpsellerStatus } from 'src/modules/jumpseller/interfaces/jumpsellerProducts/jumpsellerCreateProductRequest.interface';
import { JumpsellerUpdateProductRequest } from 'src/modules/jumpseller/interfaces/jumpsellerProducts/JumpsellerUpdateProductRequest.interface';
import { JumpsellerCreateImageRequest } from 'src/modules/jumpseller/interfaces/jumpsellerImages/jumpsellerCreateImageRequest.interface';
import { JumpsellerCreateVariantRequest, JumpsellerOptionType } from 'src/modules/jumpseller/interfaces/jumpsellerVariants/JumpsellerCreateVariantRequest.interface';
import { EnumLanguage } from 'src/modules/magic/enums/lang.enum';
import { EnumGame } from 'src/common/enums/game.enum';
import { EnumCondition } from '../enums/condition.enum';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MagicCard, magicCardDocument } from '../entities/magic-card.entity';
import { Model } from 'mongoose';

// If you need to use magicCardModel, define it inside a service or class like this:
import { Injectable } from '@nestjs/common';

export type Language = {
  code: EnumLanguage; 
  name: string;
};

@Injectable()
export class JumpsellerMapperService {
  private readonly logger = new Logger(JumpsellerMapperService.name);
  constructor(
    @InjectModel(MagicCard.name) private readonly magicCardModel: Model<magicCardDocument>,
  ) {}

async translatedLanguages(langInput: string): Promise<string> {
  let translatedLang = langInput;
  switch (langInput) {
    case EnumLanguage.ESPAÑOL: translatedLang = 'Español'; break;
    case EnumLanguage.PORTUGUES: translatedLang = 'Portugués'; break;
    case EnumLanguage.FRANCES: translatedLang = 'Frances'; break;
    case EnumLanguage.ALEMAN: translatedLang = 'Alemán'; break;
    case EnumLanguage.ITALIANO: translatedLang = 'Italiano'; break;
    case EnumLanguage.JAPONES: translatedLang = 'Japonés'; break;
    case EnumLanguage.COREANO: translatedLang = 'Coreano'; break;
    case EnumLanguage.CHINO_SIMP: translatedLang = 'Chino simplificado'; break;
    case EnumLanguage.CHINO_TRAD: translatedLang = 'Chino tradicional'; break;
    case EnumLanguage.RUSO: translatedLang = 'Ruso'; break;
    case EnumLanguage.ARABE: translatedLang = 'Árabe'; break;
    case EnumLanguage.GRIEGO_ANTIGUO: translatedLang = 'Griego antiguo'; break;
    case EnumLanguage.HEBREO: translatedLang = 'Hebreo'; break;
    case EnumLanguage.LATIN: translatedLang = 'Latín'; break;
    case EnumLanguage.PHYREXIAN: translatedLang = 'Pyrexiano'; break;
    case EnumLanguage.QUENYA: translatedLang = 'Quenya'; break;
    case EnumLanguage.SANSCRITO: translatedLang = 'Sánscrito'; break;
    default: translatedLang = "Desconocido"; break;
  }
  return translatedLang;
}


async mapDBProductToJumpseller(card: MappedMagicCard): Promise<JumpsellerProductRequest> {
  //por aca nunca va a pasar un a carta en ESPAÑOL
  const cardFacesColors = card.cardFaces?.map(f => f.colors).flat() || [];
  const cardFaceOracleText = card.oracleText
  || card.cardFaces?.map(f => f.oracleText).join('. ')
  || '';
  let rarity = card.rarity;
  switch (card.rarity) {
    case 'mythic': rarity = 'Mitica'; break;
    case 'rare': rarity = 'Rara'; break;
    case 'uncommon': rarity = 'Infrecuente'; break;
    case 'common': rarity = 'Común'; break;
    default: rarity = 'Desconocida'; break;
  }
  // Busca cartas con el mismo oracleId y set, pero en idioma diferente de inglés
  const findAnotherLangCard = await this.magicCardModel.findOne({
    oracleId: card.oracleId, 
    set: card.set, 
    lang: { $ne: "en" }
  });
  if (!findAnotherLangCard) {
    this.logger.log(`No se encontró una carta en otro idioma para ${card.name}`);
  }
    const translatedlang = await this.translatedLanguages(findAnotherLangCard.lang);
    this.logger.log(`❤️ voy a crear una descripcion en ${translatedlang}❤️`);
    const translatedName = findAnotherLangCard.printedName;
    if (!translatedName) {
      this.logger.log(`No se encontró el nombre traducido para ${card.name}`);
    }
    const translatedNameLine = findAnotherLangCard && findAnotherLangCard.printedName 
      ? `Nombre en ${translatedlang}: ${findAnotherLangCard.printedName}.`
      : ""

    const collectorNumberToUpperCase = card.collectorNumber.toUpperCase()
    const product = {
      name: card.name || '',
      description: [
      `Nombre en Inglés: ${card.name}.`,
      translatedNameLine, 
      `Tipo: ${card.typeLine}.`,
      `Texto: ${card.oracleText}.`,
      `Edición: ${card.setName}.`,
      `Color: ${card.colors?.join(', ') || cardFacesColors}.`,
      `Rareza: ${rarity}.`,
      `Artista: ${card.artist}.`,
      `Habilidades: ${card.keywords?.join(', ') || ''}.`,
      `Legal en: ${Object.entries(card.legalities || {})
        .filter(([, v]) => v === 'legal')
        .map(([f]) => f)
        .join(', ') || 'No legal'}.`,
    ].filter(Boolean).join('\n'),
      price: 0,
      sku: `M-${card.set?.toUpperCase() || ''}${collectorNumberToUpperCase
        ? (collectorNumberToUpperCase.length <= 4
          ? collectorNumberToUpperCase.padStart(4, '0')
          : collectorNumberToUpperCase)
        : ''}`,
      stock: null,
      stockUnlimited: false,
      status: JumpsellerStatus.AVALIABLE,
      weight: 2,
      width: 6.35,
      height: 8.89,
      brand: EnumGame.MAGIC,
      categories: card.setId ? [{ name: card.setName || '', id: 1 }] : [],
    };

  return product;
}

async mapDBUpdateProductToJumpseller(card: MappedMagicCard): Promise<JumpsellerUpdateProductRequest> {
  const cardFacesColors = card.cardFaces?.map(f => f.colors).flat() || [];
  let rarity = card.rarity;

  switch (card.rarity) {
    case 'mythic': rarity = 'Mitica'; break;
    case 'rare': rarity = 'Rara'; break;
    case 'uncommon': rarity = 'Infrecuente'; break;
    case 'common': rarity = 'Común'; break;
    default: rarity = 'Desconocida'; break;
  }
  
  const findAnotherLangCard = await this.magicCardModel.findOne({
    oracleId: card.oracleId, 
    set: card.set, 
    lang: { $ne: "en" }
  });
  if (!findAnotherLangCard) {
    this.logger.log(`No se encontró una carta en otro idioma para ${card.name}`);
  }
    const translatedlang = await this.translatedLanguages(findAnotherLangCard.lang);
    this.logger.log(`❤️ voy a crear una descripcion en ${translatedlang}❤️`);
    const translatedName = findAnotherLangCard.printedName;
    if (!translatedName) {
      this.logger.log(`No se encontró el nombre traducido para ${card.name}`);
    }
    const translatedNameLine = findAnotherLangCard && findAnotherLangCard.printedName 
      ? `Nombre en ${translatedlang}: ${findAnotherLangCard.printedName}.`
      : ""

  const collectorNumberToUpperCase = card.collectorNumber.toUpperCase();
  const product = {
    name: card.name || '',
    description: [
      `Nombre en Inglés: ${card.name}.`,
      translatedNameLine, 
      `Tipo: ${card.typeLine}.`,
      `Texto: ${card.oracleText}.`,
      `Edición: ${card.setName}.`,
      `Color: ${card.colors?.join(', ') || cardFacesColors}.`,
      `Rareza: ${rarity}.`,
      `Artista: ${card.artist}.`,
      `Habilidades: ${card.keywords?.join(', ') || ''}.`,
      `Legal en: ${Object.entries(card.legalities || {})
        .filter(([, v]) => v === 'legal')
        .map(([f]) => f)
        .join(', ') || 'No legal'}.`,
    ].filter(Boolean).join('\n'),
    price: 0,
    sku: `M-${card.set?.toUpperCase() || ''}${ collectorNumberToUpperCase
      ? (collectorNumberToUpperCase.length <= 4
        ? collectorNumberToUpperCase.padStart(4, '0')
        : collectorNumberToUpperCase)
      : ''}`,
    stock: null,
    stockUnlimited: false,
    status: JumpsellerStatus.AVALIABLE,
    weight: 2,
    width: 6.35,
    height: 8.89,
    brand: EnumGame.MAGIC,
    categories: card.setId ? [{ name: card.setName || '', id: 1 }] : [],
  };
  return { product };
}

async mapImageToJumpseller(card: MappedMagicCard): Promise<JumpsellerCreateImageRequest | null> {
  if (!card.imageUris || !card.imageUris.large) {
    console.warn(`⚠️ Carta sin imagen: ${card.name}`);
    return null;
  }
  return { image: { url: card.imageUris.large, position: 0 } };
}

  async mapCardFace1ImageToJumpseller(card: MappedMagicCard): Promise<JumpsellerCreateImageRequest | null> {
    if (!card.cardFaces || !card.cardFaces[0] || !card.cardFaces[0].imageUris || !card.cardFaces[0].imageUris.large) {
      console.warn(`⚠️ Carta sin imagen para la primera cara: ${card.name}`);
      return null;
    }
    
    return { image: { url: card.cardFaces[0].imageUris.large, position: 0 } };
  }


async mapCardFace2ImageToJumpseller(card: MappedMagicCard): Promise<JumpsellerCreateImageRequest | null> {
  if (!card.cardFaces || !card.cardFaces[1] || !card.cardFaces[1].imageUris || !card.cardFaces[1].imageUris.large) {
    console.warn(`⚠️ Carta sin imagen para la segunda cara: ${card.name}`);
    return null;
  }
  
  return { image: { url: card.cardFaces[1].imageUris.large, position: 0 } };
}

async mapVariantsToJumpseller(
  card: MappedMagicCard,
  languages: Language[],
): Promise<JumpsellerCreateVariantRequest[]> {
     
  const finishes = [
    { key: 'Non-Foil', name: 'No Foil', suffix: 'NF', available: card.nonfoil },
    { key: 'Foil', name: 'Foil', suffix: 'F', available: card.foil },
    { key: 'Etched', name: 'Etched Foil', suffix: 'EF', available: card.finishes?.includes('etched') },
  ];
  
  const variants: JumpsellerCreateVariantRequest[] = [];

  for (const lang of languages) {
    for (const finish of finishes) {
        if (!finish.available) continue;
        const collectorNumberToUpperCase = card.collectorNumber.toUpperCase();
        const baseCollectorNumber = collectorNumberToUpperCase
            ? (collectorNumberToUpperCase.length <= 4
                ? collectorNumberToUpperCase.padStart(4, '0')
                : collectorNumberToUpperCase)
            : '';
        // const baseSet = card.set? ;

        const sku = `M-${card.set?.toUpperCase() || ''}${baseCollectorNumber ? baseCollectorNumber + `-${lang.code.toUpperCase()}-${finish.suffix} ` : ''}`;
        variants.push({
          variant: {
            sku,
            price: 0, 
            options: [
              { name: 'Lenguaje', option_type: JumpsellerOptionType.OPTION, value: lang.name },
              { name: 'Acabado', option_type: JumpsellerOptionType.OPTION, value: finish.name },
              { name: 'Condición', option_type: JumpsellerOptionType.OPTION, value: "NM" },
            ],
          },
          finish: finish.key === "Non-Foil"? "nonfoil" : finish.key === "Foil"? "foil" : "etched",
          condition: "NM",
        });
    }
  }
  return variants;
}

//mapeo de variantes para el caso de crear una carta nueva a partir de una ya existente
async mapVariantFromNewCardToJumpseller(
  card: MappedMagicCard,
  languages: Language[],
  condition: EnumCondition,
): Promise<JumpsellerCreateVariantRequest[]> {
     
  const finishes = [
    { key: 'Non-Foil', name: 'No Foil', suffix: 'NF', available: card.nonfoil },
    { key: 'Foil', name: 'Foil', suffix: 'F', available: card.foil },
    { key: 'Etched', name: 'Etched Foil', suffix: 'EF', available: card.finishes?.includes('etched') },
  ];

  // const conditions = [
  //   { key: 'Near Mint', name: 'Como nueva', suffix: EnumCondition.NearMint, available: card.condition?.includes(EnumCondition.NearMint) },
  //   { key: 'Lightly Played', name: 'Poco jugada', suffix: EnumCondition.LightlyPlayed, available: card.condition?.includes(EnumCondition.LightlyPlayed) },
  //   { key: 'Moderately Played', name: 'Moderadamente jugada', suffix: EnumCondition.ModeratelyPlayed, available: card.condition?.includes(EnumCondition.ModeratelyPlayed) },
  //   { key: 'Heavily Played', name: 'Muy jugada', suffix: EnumCondition.HeavilyPlayed, available: card.condition?.includes(EnumCondition.HeavilyPlayed) },
  //   { key: 'Damaged', name: 'Dañada', suffix: EnumCondition.Damaged, available: card.condition?.includes(EnumCondition.Damaged) },
  // ];
  
  const variants: JumpsellerCreateVariantRequest[] = [];

  for (const lang of languages) {
    for (const finish of finishes) {
        if (!finish.available) continue;
        const collectorNumberToUpperCase = card.collectorNumber.toUpperCase();
        const baseCollectorNumber = collectorNumberToUpperCase
            ? (collectorNumberToUpperCase.length <= 4
                ? collectorNumberToUpperCase.padStart(4, '0')
                : collectorNumberToUpperCase)
            : '';
        // const baseSet = card.set? ;

        const sku = `M-${card.set?.toUpperCase() || ''}${baseCollectorNumber ? baseCollectorNumber + `-${lang.code.toUpperCase()}-${finish.suffix}${condition == EnumCondition.NearMint ? "" : "-"+ condition}` : ''}`;
        variants.push({
          variant: {
            sku,
            price: 0, 
            options: [
              { name: 'Lenguaje', option_type: JumpsellerOptionType.OPTION, value: lang.name },
              { name: 'Acabado', option_type: JumpsellerOptionType.OPTION, value: finish.name },
              { name: 'Condición', option_type: JumpsellerOptionType.OPTION, value: condition },
            ],
          },
          finish: finish.key === "Non-Foil"? "nonfoil" : finish.key === "Foil"? "foil" : "etched",
        });
    }
  }
  return variants;
}
}