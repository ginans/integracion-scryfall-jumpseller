import { CustomField } from 'src/modules/magic/enums/custom-fields.enum';
export interface CleanMapCFCollection {
  label: CustomField;
  values: string[];
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
    values: string[];
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
    values: string[];
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
    values: string[];
  };
  fullArt: {
    label: CustomField;
    values: string[];
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
  gameChangers: string[];
  rarities: string[];
  setTypes: string[];
  manaCosts: string[];
  cmcs: string[];
  powers: string[];
  toughness: string[];
  colorIdentities: string[];
  keywords: string[];
  legalities: string[];
  artists: string[];
  borderColors: string[];
  textless: string[];
  fullArt: string[];
  typeLines: string[];
  subTypeLines: string[];
}
