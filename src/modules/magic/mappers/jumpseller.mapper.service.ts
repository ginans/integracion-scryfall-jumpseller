import { MappedMagicCard } from 'src/modules/jumpseller/interfaces/mapped-magic-card.interface';
import { JumpsellerProductRequest, JumpsellerStatus } from 'src/modules/jumpseller/interfaces/jumpsellerProducts/jumpsellerCreateProductRequest.interface';
import { JumpsellerUpdateProductRequest } from 'src/modules/jumpseller/interfaces/jumpsellerProducts/JumpsellerUpdateProductRequest.interface';
import { JumpsellerCreateVariantRequest, JumpsellerOptionType } from 'src/modules/jumpseller/interfaces/jumpsellerVariants/JumpsellerCreateVariantRequest.interface';
import { EnumLanguage } from 'src/modules/magic/enums/lang.enum';
import { EnumGame } from 'src/common/enums/game.enum';
import { EnumCondition } from '../enums/condition.enum';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MagicCard, MagicCardDocument } from '../entities/magic-card.entity';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { ICreateImageRequest } from '../../jumpseller/interfaces/create-image.interface';

export type Language = {
  code: EnumLanguage; 
  name: string;
};

@Injectable()
export class JumpsellerMapperService {
  private readonly logger = new Logger(JumpsellerMapperService.name);
  constructor(
    @InjectModel(MagicCard.name) private readonly magicCardModel: Model<MagicCardDocument>,
  ) {}

async translatedLanguages(langInput: string): Promise<string> {
  let translatedLang: string;
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
    default: translatedLang = langInput; break;
  }
  return translatedLang;
}

createSku(card: MagicCard, lang?: Language, finish?: string, condition?: string): string {
  let formattedSet = "";
  const regPromo = /promos?/i;
  const regToken = /tokens?/i;
  const regArt = /arts?/i;

  if (regToken.test(card.setName)) {
    formattedSet = card.set.slice(1);
  } else if (regPromo.test(card.setName)) {
    formattedSet = card.set.slice(1);
  } else if (regArt.test(card.setName)) {
    formattedSet = card.set.slice(1);
  } else if (card.setName === "The List") {
    formattedSet = "";
  } else {
    formattedSet = card.set;
  }

  const collectorNumberToUpperCase = card.collectorNumber?.toUpperCase();
  
  // Formateo especial para cartas de "The List"
  let baseCollectorNumber = '';
  if (card.setName === "The List" && collectorNumberToUpperCase) {
    // Para The List, formatear el número después del guión
    if (collectorNumberToUpperCase.includes('-')) {
      const parts = collectorNumberToUpperCase.split('-');
      const prefix = parts[0];
      const number = parts[1];
      const paddedNumber = number.padStart(4, '0');
      baseCollectorNumber = `${prefix}-${paddedNumber}`;
    } else {
      baseCollectorNumber = collectorNumberToUpperCase.length <= 4
        ? collectorNumberToUpperCase.padStart(4, '0')
        : collectorNumberToUpperCase;
    }
  } else {
    // Para otras cartas, usar la lógica original
    baseCollectorNumber = collectorNumberToUpperCase
      ? (collectorNumberToUpperCase.length <= 4
          ? collectorNumberToUpperCase.padStart(4, '0')
          : collectorNumberToUpperCase)
      : '';
  }

  // 💡 Sufijo especial según el setName
  const suffix = (() => {
    if (card.setName === "The List") {
      return 'TL';
    } else if (
      regToken.test(card.setName) ||
      regPromo.test(card.setName) ||
      regArt.test(card.setName)
    ) {
      return card.set ? card.set[0].toUpperCase() : '';
    } else {
      return '';
    }
  })();

  return `M-${formattedSet?.toUpperCase() || ''}${baseCollectorNumber}${suffix}${
    lang ? ("-" + lang.code.toUpperCase()) : ''
  }${finish ? ("-" + finish) : ""}${condition ? ("-" + condition) : ""}`;
}

async mapDBProductToJumpseller(card: MagicCard, description: string[]): Promise<JumpsellerProductRequest> {
  const cardFacesColors = card.cardFaces?.map(f => f.colors).flat() || [];
  let rarity: string;
  switch (card.rarity) {
    case 'mythic': rarity = 'Mitica'; break;
    case 'rare': rarity = 'Rara'; break;
    case 'uncommon': rarity = 'Infrecuente'; break;
    case 'common': rarity = 'Común'; break;
    default: rarity = 'Desconocida'; break;
  }
    let artDescription = ""
    const regArt = /arts?/i;
    if (card.setName && regArt.test(card.setName)) artDescription = `CARTA DE ARTE COLECCIONABLE NO VÁLIDA PARA JUGAR`
    const product = {
      name: card.name || '',
      description: [
      artDescription,
      `Nombre en Inglés: ${card.name}.`,
        description && description.length === 1 ? description[0] : (description && description.length > 1 ? description.join('\n') : ''),
      `Tipo: ${card.typeLine}.`,
      `Texto: ${card.oracleText}.`,
      `Edición: ${card.setName}.`,
      `Color: ${card.colors?.join(', ') || cardFacesColors}.`,
      `Rareza: ${rarity}.`,
      `Artista: ${card.artist}.`,
      `Habilidades: ${card.keywords?.join(', ') || ''}`,
      `Legal en: ${Object.entries(card.legalities || {})
        .filter(([, v]) => v === 'legal')
        .map(([f]) => f)
        .join(', ') || 'No legal'}.`,
    ].filter(Boolean).join('\n'),
      price: 0,
      sku: this.createSku(card),
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

async mapDBUpdateProductToJumpseller(card: MagicCard): Promise<JumpsellerUpdateProductRequest> {
    //por aca nunca va a pasar un a carta en ESPAÑOL
    const cardFacesColors = card.cardFaces?.map(f => f.colors).flat() || [];
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
  
      let translatedName: string = ""
      if(findAnotherLangCard) {
        const translatedlang = await this.translatedLanguages(findAnotherLangCard?.lang || "No encontrado");
        translatedName = findAnotherLangCard.printedName 
          ? `Nombre en ${translatedlang}: ${findAnotherLangCard.printedName}.`
          : translatedName
      }
  
    
      let artDescription = ""
      const regArt = /arts?/i;
      if (card.setName && regArt.test(card.setName)) {
        artDescription = `CARTA DE ARTE COLECCIONABLE NO VÁLIDA PARA JUGAR`
      }
      const product = {
        name: card.name || '',
        description: [
        artDescription,
        `Nombre en Inglés: ${card.name}.`,
        translatedName, 
        `Tipo: ${card.typeLine}.`,
        `Texto: ${card.oracleText}.`,
        `Edición: ${card.setName}.`,
        `Color: ${card.colors?.join(', ') || cardFacesColors}.`,
        `Rareza: ${rarity}.`,
        `Artista: ${card.artist}.`,
        `Habilidades: ${card.keywords?.join(', ') || ''}`,
        `Legal en: ${Object.entries(card.legalities || {})
          .filter(([, v]) => v === 'legal')
          .map(([f]) => f)
          .join(', ') || 'No legal'}.`,
      ].filter(Boolean).join('\n'),
        price: 0,
        sku: this.createSku(card),
        stock: null,
        stockUnlimited: false,
        status: JumpsellerStatus.AVALIABLE,
        weight: 2,
        width: 6.35,
        height: 8.89,
        brand: EnumGame.MAGIC,
        categories: card.setId ? [{ name: card.setName || '', id: 1 }] : [],
      };
  
    return {product};
}

async mapImageToJumpseller(card: MagicCard): Promise<ICreateImageRequest | null> {
  if (!card.imageUris || !card.imageUris.large) return null;
  return { image: { url: card.imageUris.large, position: 0 } };
}

  async mapCardFace1ImageToJumpseller(card: MagicCard): Promise<ICreateImageRequest | null> {
    if (!card.cardFaces || !card.cardFaces[0] || !card.cardFaces[0].imageUris || !card.cardFaces[0].imageUris.large) {
      console.warn(`⚠️ Carta sin imagen para la primera cara: ${card.name}`);
      return null;
    }
    
    return { image: { url: card.cardFaces[0].imageUris.large, position: 0 } };
  }


async mapCardFace2ImageToJumpseller(card: MagicCard): Promise<ICreateImageRequest | null> {
  if (!card.cardFaces || !card.cardFaces[1] || !card.cardFaces[1].imageUris || !card.cardFaces[1].imageUris.large) {
    console.warn(`⚠️ Carta sin imagen para la segunda cara: ${card.name}`);
    return null;
  }
  
  return { image: { url: card.cardFaces[1].imageUris.large, position: 0 } };
}
//TODO: Refactorizar función Arriba

async mapCardFaceImageToJumpseller(card: MagicCard, faceIndex: number): Promise<ICreateImageRequest | null> {
  const face = card.cardFaces?.[faceIndex];
  const url = face?.imageUris?.large;
  if (!url) { return null }
  return { image: { url, position: 0 } };
}

async mapVariantsToJumpseller(
  card: MagicCard,
  languages: Language[],
  condition: EnumCondition = EnumCondition.NearMint
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
        
       
        variants.push({
          variant: {
            sku: this.createSku(card, lang, finish.suffix),
            price: 0, 
            options: [
              { name: 'Lenguaje', option_type: JumpsellerOptionType.OPTION, value: lang.name },
              { name: 'Acabado', option_type: JumpsellerOptionType.OPTION, value: finish.name },
              { name: 'Condición', option_type: JumpsellerOptionType.OPTION, value: condition },
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
  card: MagicCard,
  languages: Language[],
  condition: EnumCondition,
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
        variants.push({
          variant: {
            sku: this.createSku(card, lang, finish.suffix, condition),
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