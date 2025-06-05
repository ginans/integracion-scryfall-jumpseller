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
    .join(", ");       
    
  const spanishRarities = (() => {
    switch (card.rarity) {
      case 'common': return 'Común';
      case 'uncommon': return 'Poco Común';
      case 'rare': return 'Rara';
      case 'mythic': return 'Mítica';
      default: return card.rarity;
    }
  })();

  const translateColors = (colors: string[]) => {
    const translatedColors = colors.map(color => {
      switch (color) {
        case 'W': return 'Blanco';
        case 'U': return 'Azul';
        case 'B': return 'Negro';
        case 'R': return 'Rojo';
        case 'G': return 'Verde';
        case "black": return "Negro";
        case "white": return "Blanco";
        case "borderless": return "Sin Borde";
        case "yellow": return "Amarillo";
        case "silver": return "Plateado";
        case "gold": return "Dorado";
        default: return color;
      }
    });
    if (translatedColors.length > 1) return translatedColors.join(', ');
    return translatedColors[0];
  };

  // une en un string separando por comas
    switch (customFieldLabel) {
      case CustomField.COLOR:
        if(!card.colors || card.colors.length === 0) return CustomFieldFallback.COLOR;
        return translateColors(card.colors);
      case CustomField.GAME_CHANGER:
        return card?.gameChanger ? CustomFieldTextBoolean.YES : CustomFieldTextBoolean.NO;
      case CustomField.RARITY: return spanishRarities;
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
        return translateColors(card.colorIdentity);
      case CustomField.KEYWORDS:
        if (!card.keywords || card.keywords.length === 0) return CustomFieldFallback.KEYWORDS;
        return card.keywords.length > 1 ? card.keywords.join(', ') : card.keywords[0];
      case CustomField.LEGAL_FORMATS:
        return Array.isArray(card.legalities) && card.legalities.length > 0 ? legalFormats : CustomFieldFallback.LEGAL_FORMATS;
      case CustomField.ARTIST: return card.artist;
      case CustomField.BORDER_COLOR: return translateColors(Array(card.borderColor));
      case CustomField.TEXTLESS: return card.textless ? CustomFieldTextBoolean.YES : CustomFieldTextBoolean.NO;
      case CustomField.FULL_ART: return card.fullArt ? CustomFieldTextBoolean.YES : CustomFieldTextBoolean.NO;
      case CustomField.TYPE_LINE: 
        return card.typeLine ? card.typeLine.split(' — ')[0] : CustomFieldFallback.TYPE_LINE;
      case CustomField.SUB_TYPE_LINE:
        if (!card.typeLine) return CustomFieldFallback.SUB_TYPE_LINE;
        const parts = card.typeLine.split(' — ');
        return parts.length > 1 ? parts[1] : CustomFieldFallback.SUB_TYPE_LINE;
        default: return null;
      }
    }
  }