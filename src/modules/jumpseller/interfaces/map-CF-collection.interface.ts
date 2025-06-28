import { CustomField } from 'src/modules/magic/enums/custom-fields.enum';

export interface MapCFCollection {
  setNames: {
    name: CustomField;
    values: string[];
  };
  colors: {
    name: CustomField;
    values: string[];
  };
  gameChangers: {
    name: CustomField;
    values: boolean[];
  };
  rarities: {
    name: CustomField;
    values: string[];
  };
  setTypes: {
    name: CustomField;
    values: string[];
  };
  manaCosts: {
    name: CustomField;
    values: string[];
  };
  cmcs: {
    name: CustomField;
    values: number[] | null | string[]; // Puede ser null si no hay CMC
  };
  powers: {
    name: CustomField;
    values: string[];
  };
  toughness: {
    name: CustomField;
    values: string[];
  };
  colorIdentities: {
    name: CustomField;
    values: string[];
  };
  keywords: {
    name: CustomField;
    values: string[];
  };
  legalities: {
    name: CustomField;
    values: string[];
  };
  artists: {
    name: CustomField;
    values: string[];
  };
  borderColors: {
    name: CustomField;
    values: string[];
  };
  textless: {
    name: CustomField;
    values: boolean[];
  };
  fullArt: {
    name: CustomField;
    values: boolean[];
  };
  typeLines: {
    name: CustomField;
    values: string[];
  };
  subTypeLines: {
    name: CustomField;
    values: string[];
  };
}
