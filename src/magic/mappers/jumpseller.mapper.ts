import { MappedMagicCard } from 'src/jumpseller/interfaces/mapped-magic-card.interface';
import { JumpsellerProductRequest } from 'src/jumpseller/interfaces/jumpsellerProducts/jumpsellerCreateProductRequest.interface';
import { JumpsellerUpdateProductRequest } from 'src/jumpseller/interfaces/jumpsellerProducts/JumpsellerUpdateProductRequest.interface';
import { JumpsellerCreateImageRequest } from 'src/jumpseller/interfaces/jumpsellerImages/jumpsellerCreateImageRequest.interface';
import { JumpsellerCreateVariantRequest, JumpsellerOptionType } from 'src/jumpseller/interfaces/jumpsellerVariants/JumpsellerCreateVariantRequest.interface';
import { EnumLanguage } from 'src/magic/enums/lang.enum';

export type Language = {
  code: EnumLanguage;
  name: string;
};

export function mapDBProductToJumpseller(card: MappedMagicCard): JumpsellerProductRequest {
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
  }
  const product = {
    name: card.name || '',
    description: `
      Nombre en Ingles: ${card.name}.
      Nombre en español: ${card.printedName || ''}.
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
    price: card.nonfoil
      ? parseInt(card.prices?.valorPesoChilenoCalculado) || 0
      : card.foil
        ? parseInt(card.prices?.valorPesoChilenoCalculadoFoil) || 0
        : card.finishes?.includes('etched')
          ? parseInt(card.prices?.valorPesoChilenoCalculadoEtched) || 0
          : 0,
    sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber
      ? (card.collectorNumber.length <= 4
        ? card.collectorNumber.padStart(4, '0')
        : card.collectorNumber)
      : ''}`,
    stock: 0,
    weight: 2,
    width: 6.35,
    height: 8.89,
    brand: 'Magic: the Gathering',
    categories: card.setId ? [{ name: card.setName || '', id: 1 }] : [],
  };
  return product;
}

export function mapDBUpdateProductToJumpseller(card: MappedMagicCard): JumpsellerUpdateProductRequest {
  const cardFacesColors = card.cardFaces?.map(f => f.colors).flat() || [];
  let rarity = card.rarity;
  switch (card.rarity) {
    case 'mythic': rarity = 'Mitica'; break;
    case 'rare': rarity = 'Rara'; break;
    case 'uncommon': rarity = 'Infrecuente'; break;
    case 'common': rarity = 'Común'; break;
  }
  const product = {
    name: card.name || '',
    description: `
      Nombre en Ingles: ${card.name}.
      Nombre en español: ${card.printedName || ''}.
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
    price: card.nonfoil
      ? parseInt(card.prices?.valorPesoChilenoCalculado) || 0
      : card.foil
        ? parseInt(card.prices?.valorPesoChilenoCalculadoFoil) || 0
        : card.finishes?.includes('etched')
          ? parseInt(card.prices?.valorPesoChilenoCalculadoEtched) || 0
          : 0,
    sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber
      ? (card.collectorNumber.length <= 4
        ? card.collectorNumber.padStart(4, '0')
        : card.collectorNumber)
      : ''}`,
    stock: 0,
    weight: 2,
    width: 6.35,
    height: 8.89,
    brand: 'Magic: the Gathering',
    categories: card.setId ? [{ name: card.setName || '', id: 1 }] : [],
  };
  return { product };
}

export function mapImageToJumpseller(card: MappedMagicCard): JumpsellerCreateImageRequest {
  return { image: { url: card.imageUris.large || '', position: 0 } };
}

export function mapCardFace1ImageToJumpseller(card: MappedMagicCard): JumpsellerCreateImageRequest {
  return { image: { url: card.cardFaces[0]?.imageUris.large || '', position: 0 } };
}

export function mapCardFace2ImageToJumpseller(card: MappedMagicCard): JumpsellerCreateImageRequest {
  return { image: { url: card.cardFaces[1]?.imageUris.large || '', position: 0 } };
}

export function mapVariantsToJumpseller(
    card: MappedMagicCard,
    languages: Language[]
): JumpsellerCreateVariantRequest[] {
    const finishes = [
        { key: 'Foil', name: 'Foil', suffix: 'F', available: card.foil },
        { key: 'Non-Foil', name: 'No Foil', suffix: 'NF', available: card.nonfoil },
        { key: 'Etched', name: 'Etched Foil', suffix: 'EF', available: card.finishes?.includes('etched') },
    ];
    const variants: JumpsellerCreateVariantRequest[] = [];

    for (const lang of languages) {
        for (const finish of finishes) {
            if (!finish.available) continue;
            const base = card.collectorNumber
                ? (card.collectorNumber.length <= 4
                    ? card.collectorNumber.padStart(4, '0')
                    : card.collectorNumber)
                : '';
            const sku = `M-${card.set?.toUpperCase() || ''}${base ? base + `-${lang.code.toUpperCase()}-${finish.suffix}` : ''}`;

            variants.push({
                variant: {
                    sku,
                    price: card.nonfoil
                    ? parseInt(card.prices?.valorPesoChilenoCalculado) || 0
                    : card.foil
                        ? parseInt(card.prices?.valorPesoChilenoCalculadoFoil) || 0
                        : card.finishes?.includes('etched')
                        ? parseInt(card.prices?.valorPesoChilenoCalculadoEtched) || 0
                        : 0,
                    options: [
                      { name: 'Lenguaje', option_type: JumpsellerOptionType.OPTION, value: lang.name },
                      { name: 'Finish',  option_type: JumpsellerOptionType.OPTION, value: finish.name },
                    ],
                },
            });
        }
    }

    return variants;
}


