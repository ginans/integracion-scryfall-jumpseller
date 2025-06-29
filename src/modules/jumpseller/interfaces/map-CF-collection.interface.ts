import { CustomField } from 'src/modules/magic/enums/custom-fields.enum';
export interface CleanMapCFCollection {
  label: CustomField;
  values: string[] | boolean[] | number[] | null;
}

export interface MapCFCollection {
  setNames: {
    label: CustomField;
    values: string[];
  };
  colors: {
    label: CustomField;
    values: string[];
  };
  gameChangers: {
    label: CustomField;
    values: boolean[];
  };
  rarities: {
    label: CustomField;
    values: string[];
  };
  setTypes: {
    label: CustomField;
    values: string[];
  };
  manaCosts: {
    label: CustomField;
    values: string[];
  };
  cmcs: {
    label: CustomField;
    values: number[] | null;
  };
  powers: {
    label: CustomField;
    values: string[];
  };
  toughness: {
    label: CustomField;
    values: string[];
  };
  colorIdentities: {
    label: CustomField;
    values: string[];
  };
  keywords: {
    label: CustomField;
    values: string[];
  };
  legalities: {
    label: CustomField;
    values: string[];
  };
  artists: {
    label: CustomField;
    values: string[];
  };
  borderColors: {
    label: CustomField;
    values: string[];
  };
  textless: {
    label: CustomField;
    values: boolean[];
  };
  fullArt: {
    label: CustomField;
    values: boolean[];
  };
  typeLines: {
    label: CustomField;
    values: string[];
  };
  subTypeLines: {
    label: CustomField;
    values: string[];
  };
}

// Interfaz para valores de custom fields
export interface CustomFieldValues {
  setNames: string[];
  colors: string[];
  gameChangers: boolean[];
  rarities: string[];
  setTypes: string[];
  manaCosts: string[];
  cmcs: number[] | null;
  powers: string[];
  toughness: string[];
  colorIdentities: string[];
  keywords: string[];
  legalities: string[];
  artists: string[];
  borderColors: string[];
  textless: boolean[];
  fullArt: boolean[];
  typeLines: string[];
  subTypeLines: string[];
}
