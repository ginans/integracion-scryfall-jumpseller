import { Injectable } from '@nestjs/common';
import { JumpsellerCustomField } from 'src/modules/jumpseller/interfaces/jumpselllerCustomFields/getAllCustomFields.interface';
import { MappedMagicCard } from 'src/modules/jumpseller/interfaces/mapped-magic-card.interface';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/jumpselllerCustomFields/addAnExistingCustomFieldToAProductRequest.interface';
import { CustomField, CustomFieldFallback, CustomFieldTextBoolean } from '../enums/custom-fields.enum';
import { MagicCard } from '../entities/magic-card.entity';


@Injectable()
export class CustomFieldsMapperService {
  async mappedCustomFields(
    card: MagicCard,
    customFields: JumpsellerCustomField[], 
  ): Promise<AddAnExistingCustomFieldToAProductRequest[]> {
    return customFields.map(customField => ({
      field: {
        id: customField.id,
        value: String(this.customFieldsLabelsToValue(card, customField.label)),
        variants: []
      }
    }));
  }

  customFieldsLabelsToValue(card: MagicCard, customFieldLabel: string){
    const legalFormats = Object.entries(card.legalities) // convierte en array de pares [key, value]
    .filter(([_, value]) => value === "legal")           // filtra los que tengan valor 'legal'
    .map(([key]) => key)                                 // extrae solo las keys y los mete en un array
    .join(", ");                                         // une en un string separando por comas
    switch (customFieldLabel) {
      case CustomField.COLOR:
        if(!card.colors || card.colors.length === 0) return CustomFieldFallback.COLOR;
        return card?.colors.length > 1 ? card.colors.join(', ') : card.colors[0];
      case CustomField.GAME_CHANGER:
        return card?.gameChanger ? CustomFieldTextBoolean.YES : CustomFieldTextBoolean.NO;
      case CustomField.RARITY: return card.rarity;
      case CustomField.SET_NAME: return card.setName;
      case CustomField.SET_TYPE: return card.setType;
      case CustomField.MANA_COST:
        return card.manaCost ? card.manaCost : CustomFieldFallback.MANA_COST;
      case CustomField.CMC:
        return card.cmc ? `${card.cmc}` : CustomFieldFallback.CMC;
      case CustomField.POWER:
        return (!card.power) ? CustomFieldFallback.POWER : card.power;
      case CustomField.TOUGHNESS:
        return (!card.toughness) ? CustomFieldFallback.TOUGHNESS : card.toughness;
      case CustomField.COLOR_IDENTITY:
        if (!card.colorIdentity || card.colorIdentity.length === 0) return CustomFieldFallback.COLOR_IDENTITY;
        return card.colorIdentity.length > 1 ? card.colorIdentity.join(', ') : card.colorIdentity[0];
      case CustomField.KEYWORDS:
        if (!card.keywords || card.keywords.length === 0) return CustomFieldFallback.KEYWORDS;
        return card.keywords.length > 1 ? card.keywords.join(', ') : card.keywords[0];
      case CustomField.LEGAL_FORMATS:
        return Array.isArray(card.legalities) && card.legalities.length > 0 ? legalFormats : CustomFieldFallback.LEGAL_FORMATS;
      case CustomField.ARTIST: return card.artist;
      case CustomField.BORDER_COLOR: return card.borderColor;
      case CustomField.TEXTLESS: return card.textless ? CustomFieldTextBoolean.YES : CustomFieldTextBoolean.NO;
      case CustomField.FULL_ART: return card.fullArt ? CustomFieldTextBoolean.YES : CustomFieldTextBoolean.NO;
      default: return null;
    }
  }
}