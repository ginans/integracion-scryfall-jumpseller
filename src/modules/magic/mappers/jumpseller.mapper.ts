import { MappedMagicCard } from 'src/modules/jumpseller/interfaces/mapped-magic-card.interface';
import { JumpsellerProductRequest, JumpsellerStatus } from 'src/modules/jumpseller/interfaces/jumpsellerProducts/jumpsellerCreateProductRequest.interface';
import { JumpsellerUpdateProductRequest } from 'src/modules/jumpseller/interfaces/jumpsellerProducts/JumpsellerUpdateProductRequest.interface';
import { JumpsellerCreateImageRequest } from 'src/modules/jumpseller/interfaces/jumpsellerImages/jumpsellerCreateImageRequest.interface';
import { JumpsellerCreateVariantRequest, JumpsellerOptionType } from 'src/modules/jumpseller/interfaces/jumpsellerVariants/JumpsellerCreateVariantRequest.interface';
import { EnumLanguage } from 'src/modules/magic/enums/lang.enum';
import { EnumGame } from 'src/common/enums/game.enum';
import { EnumCondition } from '../enums/condition.enum';

export type Language = {
  code: EnumLanguage;
  name: string;
};

  const translatedLanguages = (lang: string)  => {
    switch (lang) {
      case EnumLanguage.ESPAÑOL: lang = 'Español'; break;
      case EnumLanguage.PORTUGUES: lang = 'Portugués'; break;
      case EnumLanguage.FRANCES: lang = 'Frances'; break;
      case EnumLanguage.ALEMAN: lang = 'Alemán'; break;
      case EnumLanguage.ITALIANO: lang = 'Italiano'; break;
      case EnumLanguage.JAPONES: lang = 'Japonés'; break;
      case EnumLanguage.COREANO: lang = 'Coreano'; break;
      case EnumLanguage.CHINO_SIMP: lang = 'Chino simplificado'; break;
      case EnumLanguage.CHINO_TRAD: lang = 'Chino tradicional'; break;
      case EnumLanguage.RUSO: lang = 'Ruso'; break;
      case EnumLanguage.ARABE: lang = 'Árabe'; break;
      case EnumLanguage.GRIEGO_ANTIGUO: lang = 'Griego antiguo'; break;
      case EnumLanguage.HEBREO: lang = 'Hebreo'; break;
      case EnumLanguage.LATIN: lang = 'Latín'; break;
      case EnumLanguage.PHYREXIAN: lang = 'Pyrexiano'; break;
      case EnumLanguage.QUENYA: lang = 'Quenya'; break;
      case EnumLanguage.SANSCRITO: lang = 'Sánscrito'; break;
      default: lang = "Desconocido"; break;
    }

  }

export function mapDBProductToJumpseller(card: MappedMagicCard): JumpsellerProductRequest {
  let lang = card.lang
  const translatedlang= translatedLanguages(lang)
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


  const collectorNumberToUpperCase = card.collectorNumber.toUpperCase()
  const product = {
    name: card.name || '',
    description: `
      $Nombre en Inglés: ${card.name}.
      Nombre en ${card.lang === "en"? "otro idioma": translatedlang}: ${card.lang === "en"? "Esta carta solo esta en inglés" : card.printedName || ''}
      Tipo: ${card.typeLine}.
      Texto: ${card.oracleText || cardFaceOracleText}.
      Edición: ${card.setName}.
      Color: ${card.colors?.join(', ') || cardFacesColors}.
      Rareza: ${rarity}.
      Artista: ${card.artist}.
      Habilidades: ${card.keywords?.join(', ') || ''}.
      Legal en: ${Object.entries(card.legalities || {})
        .filter(([, v]) => v === 'legal')
        .map(([f]) => f)
        .join(', ') || 'No legal'}.
    `,
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

export function mapDBUpdateProductToJumpseller(card: MappedMagicCard): JumpsellerUpdateProductRequest {
  const cardFacesColors = card.cardFaces?.map(f => f.colors).flat() || [];
  let rarity = card.rarity;

  let lang = card.lang
  const translatedlang= translatedLanguages(lang)

  switch (card.rarity) {
    case 'mythic': rarity = 'Mitica'; break;
    case 'rare': rarity = 'Rara'; break;
    case 'uncommon': rarity = 'Infrecuente'; break;
    case 'common': rarity = 'Común'; break;
    default: rarity = 'Desconocida'; break;
  }
  const collectorNumberToUpperCase = card.collectorNumber.toUpperCase()
  const product = {
    name: card.name || '',
    description: `
      Nombre en Inglés: ${card.name}.
      Nombre en ${card.lang === "en"? "otro idioma": translatedlang}: ${card.lang === "en"? "Esta carta solo esta en inglés" : card.printedName || ''}.
      Tipo: ${card.typeLine}.
      Texto: ${card.oracleText}.
      Edición: ${card.setName}.
      Color: ${card.colors?.join(', ') || cardFacesColors}.
      Rareza: ${rarity}.
      Artista: ${card.artist}.
      Habilidades: ${card.keywords?.join(', ') || ''}.
      Legal en: ${Object.entries(card.legalities || {})
        .filter(([, v]) => v === 'legal')
        .map(([f]) => f)
        .join(', ') || 'No legal'}.
    `,
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

export function mapImageToJumpseller(card: MappedMagicCard): JumpsellerCreateImageRequest | null {
  if (!card.imageUris || !card.imageUris.large) {
    console.warn(`⚠️ Carta sin imagen: ${card.name}`);
    return null;
  }
  return { image: { url: card.imageUris.large, position: 0 } };
}

export function mapCardFace1ImageToJumpseller(card: MappedMagicCard): JumpsellerCreateImageRequest | null {
  if (!card.cardFaces || !card.cardFaces[0] || !card.cardFaces[0].imageUris || !card.cardFaces[0].imageUris.large) {
    console.warn(`⚠️ Carta sin imagen para la primera cara: ${card.name}`);
    return null;
  }
  
  return { image: { url: card.cardFaces[0].imageUris.large, position: 0 } };
}

export function mapCardFace2ImageToJumpseller(card: MappedMagicCard): JumpsellerCreateImageRequest | null {
  if (!card.cardFaces || !card.cardFaces[1] || !card.cardFaces[1].imageUris || !card.cardFaces[1].imageUris.large) {
    console.warn(`⚠️ Carta sin imagen para la segunda cara: ${card.name}`);
    return null;
  }
  
  return { image: { url: card.cardFaces[1].imageUris.large, position: 0 } };
}

export function mapVariantsToJumpseller(
  card: MappedMagicCard,
  languages: Language[],
): JumpsellerCreateVariantRequest[] {
  const finishes = [
    { key: 'Non-Foil', name: 'No Foil', suffix: 'NF', available: card.nonfoil },
    { key: 'Foil', name: 'Foil', suffix: 'F', available: card.foil },
    { key: 'Etched', name: 'Etched Foil', suffix: 'EF', available: card.finishes?.includes('etched') },
  ];

  const conditions = [
    { key: 'Near Mint', name: 'Como nueva', suffix: 'NM', available: card.condition?.includes(EnumCondition.NearMint) },
    { key: 'Lightly Played', name: 'Poco jugada', suffix: 'LP', available: card.condition?.includes(EnumCondition.LightlyPlayed) },
    { key: 'Moderately Played', name: 'Moderadamente jugada', suffix: 'MP', available: card.condition?.includes(EnumCondition.ModeratelyPlayed) },
    { key: 'Heavily Played', name: 'Muy jugada', suffix: 'HP', available: card.condition?.includes(EnumCondition.HeavilyPlayed) },
    { key: 'Damaged', name: 'Dañada', suffix: 'D', available: card.condition?.includes(EnumCondition.Damaged) },
  ];
  
  const variants: JumpsellerCreateVariantRequest[] = [];

  for (const lang of languages) {
    for (const finish of finishes) {
      for (const condition of conditions) {
        if (!finish.available) continue;
        const collectorNumberToUpperCase = card.collectorNumber.toUpperCase();
        const base = collectorNumberToUpperCase
            ? (collectorNumberToUpperCase.length <= 4
                ? collectorNumberToUpperCase.padStart(4, '0')
                : collectorNumberToUpperCase)
            : '';
        const sku = `M-${card.set?.toUpperCase() || ''}${base ? base + `-${lang.code.toUpperCase()}-${finish.suffix}${condition.suffix == "NM"? "" : "-"+ condition.suffix}` : ''}`;
        variants.push({
          variant: {
            sku,
            price: 0, 
            options: [
              { name: 'Acabado', option_type: JumpsellerOptionType.OPTION, value: finish.name },
              { name: 'Condición', option_type: JumpsellerOptionType.OPTION, value: condition.name },
              { name: 'Lenguaje', option_type: JumpsellerOptionType.OPTION, value: lang.name },
            ],
          },
          finish: finish.key,
          condition: condition.suffix,
        });
      }
    }

  return variants;
  }
}
