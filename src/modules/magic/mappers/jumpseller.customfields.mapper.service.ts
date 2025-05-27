import { MappedMagicCard } from 'src/modules/jumpseller/interfaces/mapped-magic-card.interface';
import { UpdateCustomFieldRequest } from 'src/modules/jumpseller/interfaces/jumpselllerCustomFields/updateCustomFieldRequest.interface';
import { JumpsellerMapperService } from './jumpseller.mapper.service';
import { Injectable, Logger } from '@nestjs/common';
//crear manualmente y luego me traigo los creados con el el get
// crear custom fields con un valor string 

@Injectable()
export class CustomFieldsMapperService {
  private readonly logger = new Logger(CustomFieldsMapperService.name);
  constructor(
   
  ) {}

async mapCMCCustomField(card: MappedMagicCard): Promise<UpdateCustomFieldRequest> {
  return {
    custom_field: {
      label: "CMC",
      type: "selection",
      values: [card.cmc.toString()],
      product_visibility: true,
    },
  };
}

async mapTypeLineCustomField(card: MappedMagicCard): Promise<UpdateCustomFieldRequest> {
  return {
    custom_field: {
      label: "Tipo",
      type: "selection",
      values: [card.typeLine],
      product_visibility: true,
    },
  };
}

async mapColorCustomField(card: MappedMagicCard): Promise<UpdateCustomFieldRequest> {
  return {
    custom_field: {
      label: "Color",
      type: "selection",
      values: [card.colors.join(', ')],
      product_visibility: true,
    },
  };
}

async mapColorIdentityCustomField(card: MappedMagicCard): Promise<UpdateCustomFieldRequest> {
  return {
    custom_field: {
      label: "Color Identity",
      type: "selection",
      values: [card.colorIdentity.join(', ')],
      product_visibility: true,
    },
  };
}

async mapKeywordsCustomField(card: MappedMagicCard): Promise<UpdateCustomFieldRequest> {
  return {
    custom_field: {
      label: "Habilidades",
      type: "selection",
      values: [card.keywords.join(', ')],
      product_visibility: true,
    },
  };
}

async mapLegalitiesCustomField(card: MappedMagicCard): Promise<UpdateCustomFieldRequest> {
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

async mapGameChangerCustomField(card: MappedMagicCard): Promise<UpdateCustomFieldRequest> {
  return {
    custom_field: {
      label: "Game Changer",
      type: "selection",
      values: [card.gameChanger ? "Si" : "No"],
      product_visibility: true,
    },
  };
}

async mapRarityCustomField(card: MappedMagicCard): Promise<UpdateCustomFieldRequest> {
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

async mapArtistCustomField(card: MappedMagicCard): Promise<UpdateCustomFieldRequest> {
  return {
    custom_field: {
      label: "Artista",
      type: "selection",
      values: [card.artist],
      product_visibility: true,
    },
  };
}
}