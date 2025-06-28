import { CustomField } from 'src/modules/magic/enums/custom-fields.enum';

export interface MapCFCollection {
  setNames: {
    label: CustomField;
    type: string;
    values: string[];
  };
  colors: {
    label: CustomField;
    type: string;
    values: string[];
  };
  gameChangers: {
    label: CustomField;
    type: string;
    values: boolean[];
  };
  rarities: {
    label: CustomField;
    type: string;
    values: string[];
  };
  setTypes: {
    label: CustomField;
    type: string;
    values: string[];
  };
  manaCosts: {
    label: CustomField;
    type: string;
    values: string[];
  };
  cmcs: {
    label: CustomField;
    type: string;
    values: number[] | null | string[]; // Puede ser null si no hay CMC
  };
  powers: {
    label: CustomField;
    type: string;
    values: string[];
  };
  toughness: {
    label: CustomField;
    type: string;
    values: string[];
  };
  colorIdentities: {
    label: CustomField;
    type: string;
    values: string[];
  };
  keywords: {
    label: CustomField;
    type: string;
    values: string[];
  };
  legalities: {
    label: CustomField;
    type: string;
    values: string[];
  };
  artists: {
    label: CustomField;
    type: string;
    values: string[];
  };
  borderColors: {
    label: CustomField;
    type: string;
    values: string[];
  };
  textless: {
    label: CustomField;
    type: string;
    values: boolean[];
  };
  fullArt: {
    label: CustomField;
    type: string;
    values: boolean[];
  };
  typeLines: {
    label: CustomField;
    type: string;
    values: string[];
  };
  subTypeLines: {
    label: CustomField;
    type: string;
    values: string[];
  };
}
