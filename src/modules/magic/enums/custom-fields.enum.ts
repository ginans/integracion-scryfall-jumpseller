import { Type } from 'class-transformer';
import { TypeEnum } from '../../prices/base-prices/enums/create-base-price.enum';
export enum CustomField {
  COLOR = 'Color',
  GAME_CHANGER = 'Game Changer',
  RARITY = 'Rareza',
  SET_NAME = 'Edición',
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
  YES = 'Sí',
  NO = 'No',
}
export enum CustomFieldFallback {
  COLOR = 'Sin color',
  MANA_COST = 'Sin coste de maná',
  CMC = 'Sin coste de maná convertido',
  POWER = 'Sin poder',
  TOUGHNESS = 'Sin resistencia',
  COLOR_IDENTITY = 'Sin identidad',
  KEYWORDS = 'Sin palabras claves',
  LEGAL_FORMATS = 'Ningún formato legal',
  TYPE_LINE = 'Sin tipo de carta',
  SUB_TYPE_LINE = 'Sin subtipo'
}