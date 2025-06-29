import { Type } from 'class-transformer';
import { TypeEnum } from '../../prices/base-prices/enums/create-base-price.enum';
export enum CustomField {
  SET_NAME = 'Edición',
  COLOR = 'Color',
  GAME_CHANGER = 'Game Changer',
  RARITY = 'Rareza',
  SET_TYPE = 'Tipo de edición',
  MANA_COST = 'Coste de maná',
  CMC = 'Coste de maná convertido',
  POWER = 'Poder',
  TOUGHNESS = 'Resistencia',
  COLOR_IDENTITY = 'Identidad',
  KEYWORDS = 'Palabras claves',
  LEGAL_FORMATS = 'Legal en',
  ARTIST = 'Dibujante',
  BORDER_COLOR = 'Color de borde',
  TEXTLESS = 'Textless',
  FULL_ART = 'Full Art',
  TYPE_LINE = 'Tipo de Carta',
  SUB_TYPE_LINE = 'Subtipo',

}
export enum CustomFieldTextBoolean {
  YES = 'Si',
  NO = 'No',
}
export enum CustomFieldFallback {
  COLOR = 'Sin color',
  MANA_COST = 'Sin coste de maná',
  SET_NAME = 'Sin nombre de set',
  SET_TYPE = 'Sin tipo de set',
  RARITY = 'Sin rareza',
  BORDER_COLOR = 'Sin color de borde',
  CMC = 'Sin coste de maná convertido',
  ARTIST = 'Dibujante desconocido',
  POWER = 'Sin poder',
  TOUGHNESS = 'Sin resistencia',
  COLOR_IDENTITY = 'Sin identidad',
  KEYWORDS = 'Sin palabras claves',
  LEGAL_FORMATS = 'Ningún formato legal',
  TYPE_LINE = 'Sin tipo de carta',
  SUB_TYPE_LINE = 'Sin subtipo',
  FULL_ART = 'Desconocido',
  TEXTLESS = 'Desconocido',
  GAME_CHANGER = 'Desconocido',
}

export enum CustomFieldTypeEnum {
  SELECTION = 'selection',
  TEXT = 'text',
  INPUT = 'input',
}