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
import { map } from 'rxjs';

@Injectable()
export class CustomFieldsMapperService {
  //TODO: REDACTORIZAR
  async mappedCustomFields(
    card: MagicCard,
    customFields: JumpsellerCustomField[],
  ): Promise<AddAnExistingCustomFieldToAProductRequest[]> {
    return customFields.map((customField) => ({
      field: {
        id: customField.id,
        value: '',
        variants: [],
      },
    }));
  }

  // Método simple y directo - fácil de entender
  async mappedCFLabelAndValues(values: CustomFieldValues): Promise<MapCFCollection> {
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
      
      }
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
