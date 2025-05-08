import { MappedMagicCard } from 'src/modules/jumpseller/interfaces/mapped-magic-card.interface';
import { UpdateCustomFieldRequest } from 'src/modules/jumpseller/interfaces/jumpselllerCustomFields/updateCustomFieldRequest.interface';

export function mapCMCCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
  return {
    custom_field: {
      label: "CMC",
      type: "selection",
      values: [card.cmc.toString()],
      product_visibility: true,
    },
  };
}

export function mapTypeLineCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
  return {
    custom_field: {
      label: "Tipo",
      type: "selection",
      values: [card.typeLine],
      product_visibility: true,
    },
  };
}

export function mapColorCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
  return {
    custom_field: {
      label: "Color",
      type: "selection",
      values: [card.colors.join(', ')],
      product_visibility: true,
    },
  };
}

export function mapColorIdentityCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
  return {
    custom_field: {
      label: "Color Identity",
      type: "selection",
      values: [card.colorIdentity.join(', ')],
      product_visibility: true,
    },
  };
}

export function mapKeywordsCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
  return {
    custom_field: {
      label: "Habilidades",
      type: "selection",
      values: [card.keywords.join(', ')],
      product_visibility: true,
    },
  };
}

export function mapLegalitiesCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
  const legalities = Object.entries(card.legalities || {})
    .filter(([, v]) => v === 'legal')
    .map(([f]) => f)
    .join(', ');
  return {
    custom_field: {
      label: "Legalidades",
      type: "selection",
      values: [legalities],
      product_visibility: true,
    },
  };
}

export function mapGameChangerCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
  return {
    custom_field: {
      label: "Game Changer",
      type: "selection",
      values: [card.gameChanger ? "Si" : "No"],
      product_visibility: true,
    },
  };
}

export function mapRarityCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
  let rarity = card.rarity;
  switch (card.rarity) {
    case 'mythic': rarity = 'Mitica'; break;
    case 'rare': rarity = 'Rara'; break;
    case 'uncommon': rarity = 'Infrecuente'; break;
    case 'common': rarity = 'Común'; break;
  }
  return {
    custom_field: {
      label: "Rareza",
      type: "selection",
      values: [rarity],
      product_visibility: true,
    },
  };
}

export function mapArtistCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
  return {
    custom_field: {
      label: "Artista",
      type: "selection",
      values: [card.artist],
      product_visibility: true,
    },
  };
}
