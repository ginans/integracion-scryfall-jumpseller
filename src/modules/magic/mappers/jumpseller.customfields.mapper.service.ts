import { Injectable, Logger } from '@nestjs/common';
import { JumpsellerService } from '../../jumpseller/jumpseller.service';
import { GetAllCustomFieldResponse, JumpsellerCustomField } from 'src/modules/jumpseller/interfaces/jumpselllerCustomFields/getAllCustomFields.interface';
import { MappedMagicCard } from 'src/modules/jumpseller/interfaces/mapped-magic-card.interface';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/jumpselllerCustomFields/addAnExistingCustomFieldToAProductRequest.interface';
import { custom } from 'joi';
import { all } from 'axios';


@Injectable()
export class CustomFieldsMapperService {
  private readonly logger = new Logger(CustomFieldsMapperService.name);
  constructor(
    private readonly jumpsellerService: JumpsellerService
    
  ) {}
  

  async mappedCustomFields(
    card: MappedMagicCard, 
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

  customFieldsLabelsToValue(card: MappedMagicCard, customFieldLabel: string){
    const legalFormats = Object.entries(card.finishes) // convierte en array de pares [key, value]
    .filter(([_, value]) => value === "legal")         // filtra los que tengan valor 'legal'
    .map(([key]) => key)                               // extrae solo las keys y los mete en un array
    .join(", ");                                       // une en un string separando por comas
  
    switch (customFieldLabel) {
      case "Color":
        return card.colors && card.colors.length > 0 ? card.colors.join(', ') : 'Sin color';
      case "Game Changer":
        return card.gameChanger ? 'Sí' : 'No';
      case "Rareza":
        return card.rarity;
      case "Edición":
        return card.setName;
      case "Tipo de edición":
        return card.setType;
      case "Coste de maná":
        return card.manaCost ? card.manaCost : 'Sin coste de maná';
      case "Coste de maná convertido":
        return card.cmc ? card.cmc.toString() : 'Sin coste de maná convertido';
      case "Poder":
        return card.power;
      case "Resistencia":
        return card.toughness;
      case "Identidad":
        return card.colorIdentity ? card.colorIdentity.join(', ') : 'Sin identidad';
      case "Palabras claves":
        return card.keywords ? card.keywords.join(', '): 'Sin palabras claves';
      case "Legal en":
        return card.legalities ? legalFormats : "No legal" ;
      case "Dibujante":
        return card.artist;
      case "Color de borde":
        return card.borderColor;
      case "Sin texto":
        return card.textless ? 'Sí' : 'No';
      case "Ilustración grande":
        return card.fullArt ? 'Sí' : 'No';    
      default:
        return null;
    }
  
  }
}