import { Injectable } from '@nestjs/common';
import { JumpsellerCustomField } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/getAllCustomFields.interface';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/addAnExistingCustomFieldToAProductRequest.interface';
import { CustomField, CustomFieldTypeEnum } from '../enums/custom-fields.enum';
import { MagicCard } from '../entities/magic-card.entity';
import {
  CleanMapCFCollection,
  CustomFieldValues,
  MapCFCollection,
} from 'src/modules/jumpseller/interfaces/map-CF-collection.interface';
import { createCustomFieldRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/createCustomfieldRequest.interface';
import {
  translateColors,
  spanishRarities,
} from 'src/common/utils/traduction.util';
import {
  CustomFieldFallback,
  CustomFieldTextBoolean,
} from '../enums/custom-fields.enum';

@Injectable()
export class CustomFieldsMapperService {
  async mappedCustomFields(
    card: MagicCard,
    customFields: JumpsellerCustomField[],
  ): Promise<AddAnExistingCustomFieldToAProductRequest[]> {
    const results: AddAnExistingCustomFieldToAProductRequest[] = [];

    for (const customField of customFields) {
      const values = this.customFieldsLabelsToValues(card, customField.label);

      // Si el campo tiene múltiples valores, crear una entrada por cada uno
      if (Array.isArray(values)) {
        for (const value of values) {
          results.push({
            field: {
              id: customField.id,
              value: String(value),
              // variants: [],
            },
          });
        }
      } else {
        // Si es un solo valor, crear una entrada
        results.push({
          field: {
            id: customField.id,
            value: String(values),
            // variants: [],
          },
        });
      }
    }

    return results;
  }

  customFieldsLabelsToValues(
    card: MagicCard,
    customFieldLabel: string,
  ): string | string[] {
    const legalFormats = Object.entries(card.legalities) // convierte en array de pares [key, value]
      .filter(([_, value]) => value === 'legal') // filtra los que tengan valor 'legal'
      .map(([key]) => key); // extrae solo las keys y los mete en un array

    switch (customFieldLabel) {
      case CustomField.COLOR:
        if (!card.colors || card.colors.length === 0)
          return CustomFieldFallback.COLOR;
        return card.colors.map((color) => translateColors(color));
      case CustomField.GAME_CHANGER:
        // if (!card.gameChanger) return CustomFieldFallback.GAME_CHANGER;
        return card?.gameChanger
          ? CustomFieldTextBoolean.YES
          : CustomFieldTextBoolean.NO;
      case CustomField.RARITY:
        if (!card.rarity) return CustomFieldFallback.RARITY;
        return spanishRarities(card.rarity || 'common');
      case CustomField.SET_NAME:
        if (!card.setName) return CustomFieldFallback.SET_NAME;
        return card.setName;
      case CustomField.SET_TYPE:
        if (!card.setType) return CustomFieldFallback.SET_TYPE;
        return card.setType;
      case CustomField.MANA_COST:
        return card.manaCost ? card.manaCost : CustomFieldFallback.MANA_COST;
      case CustomField.CMC:
        return card.cmc ? `${card.cmc}` : CustomFieldFallback.CMC;
      case CustomField.POWER:
        return !card.power ? CustomFieldFallback.POWER : card.power;
      case CustomField.TOUGHNESS:
        return !card.toughness ? CustomFieldFallback.TOUGHNESS : card.toughness;
      case CustomField.COLOR_IDENTITY:
        if (!card.colorIdentity || card.colorIdentity.length === 0)
          return CustomFieldFallback.COLOR_IDENTITY;
        return card.colorIdentity.map((color) => translateColors(color));
      case CustomField.KEYWORDS:
        if (!card.keywords || card.keywords.length === 0)
          return CustomFieldFallback.KEYWORDS;
        return card.keywords; // Devolver el array completo
      case CustomField.LEGAL_FORMATS:
        if (card.legalities && legalFormats.length > 0) {
          return legalFormats; // Devolver el array completo
        } else {
          return CustomFieldFallback.LEGAL_FORMATS;
        }
      case CustomField.ARTIST:
        if (!card.artist) return CustomFieldFallback.ARTIST;
        return card.artist;
      case CustomField.BORDER_COLOR:
        if (!card.borderColor) return CustomFieldFallback.BORDER_COLOR;
        return translateColors(card.borderColor);
      case CustomField.TEXTLESS:
        // if (!card.textless) return CustomFieldFallback.TEXTLESS;
        return card.textless
          ? CustomFieldTextBoolean.YES
          : CustomFieldTextBoolean.NO;
      case CustomField.FULL_ART:
        // if (!card.typeLine) return CustomFieldFallback.TYPE_LINE;
        return card.fullArt
          ? CustomFieldTextBoolean.YES
          : CustomFieldTextBoolean.NO;
      case CustomField.TYPE_LINE:
        return card.typeLine
          ? card.typeLine.split(' — ')[0]
          : CustomFieldFallback.TYPE_LINE;
      case CustomField.SUB_TYPE_LINE:
        if (!card.typeLine) return CustomFieldFallback.SUB_TYPE_LINE;
        const parts = card.typeLine.split(' — ');
        return parts.length > 1 ? parts[1] : CustomFieldFallback.SUB_TYPE_LINE;
      default:
        return null;
    }
  }

  // -------------------------------------------------------------------------------------------
  async mappedCFLabelAndValues(
    values: CustomFieldValues,
  ): Promise<MapCFCollection> {
    const mapCF = {
      setNames: {
        label: CustomField.SET_NAME,
        values: values.setNames,
      },
      colors: {
        label: CustomField.COLOR,
        values: values.colors,
      },
      gameChangers: {
        label: CustomField.GAME_CHANGER,
        values: values.gameChangers,
      },
      rarities: {
        label: CustomField.RARITY,
        values: values.rarities,
      },
      setTypes: {
        label: CustomField.SET_TYPE,
        values: values.setTypes,
      },
      manaCosts: {
        label: CustomField.MANA_COST,
        values: values.manaCosts,
      },
      cmcs: {
        label: CustomField.CMC,
        values: values.cmcs,
      },
      powers: {
        label: CustomField.POWER,
        values: values.powers,
      },
      toughness: {
        label: CustomField.TOUGHNESS,
        values: values.toughness,
      },
      colorIdentities: {
        label: CustomField.COLOR_IDENTITY,
        values: values.colorIdentities,
      },
      keywords: {
        label: CustomField.KEYWORDS,
        values: values.keywords,
      },
      legalities: {
        label: CustomField.LEGAL_FORMATS,
        values: values.legalities,
      },
      artists: {
        label: CustomField.ARTIST,
        values: values.artists,
      },
      borderColors: {
        label: CustomField.BORDER_COLOR,
        values: values.borderColors,
      },
      fullArt: {
        label: CustomField.FULL_ART,
        values: values.fullArt,
      },
      textless: {
        label: CustomField.TEXTLESS,
        values: values.textless,
      },
      typeLines: {
        label: CustomField.TYPE_LINE,
        values: values.typeLines,
      },
      subTypeLines: {
        label: CustomField.SUB_TYPE_LINE,
        values: values.subTypeLines,
      },
    };
    return mapCF;
  }

  // convertir MapCFCollection a createCustomFieldRequest
  async mapCreateCustomFieldsRequest(
    mapCollections: CleanMapCFCollection[],
  ): Promise<createCustomFieldRequest[]> {
    const result: createCustomFieldRequest[] = [];

    // Para cada colección de campos
    for (const field of mapCollections) {
      result.push({
        custom_field: {
          label: field.label,
          type: CustomFieldTypeEnum.SELECTION,
          values: Array.isArray(field.values) ? field.values.map(String) : [],
          product_visibility: true,
        },
      });
    }

    return result;
  }
}
