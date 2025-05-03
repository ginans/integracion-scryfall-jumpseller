import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IresponseSryfall } from './interfaces/scryfall.interface';
import { IenumURLLang } from './enums/lang.enum';

@Injectable()
export class ScryfallService {
   private readonly logger = new Logger(ScryfallService.name);
  async getScryfallCards(lang: IenumURLLang, page: number, oracle_id?:string ): Promise<IresponseSryfall> {
    const url = "https://api.scryfall.com/cards/search";
    try {
      const params = {
        format: 'json',
        include_extras: true,
        include_multilingual: true,
        include_variations: true,
        order: 'released',
        page,
        unique: 'prints'
      };
      // Construir manualmente la cadena de consulta de idioma
      let queryString = new URLSearchParams(params as any).toString() + `&q=${lang}`;
      if(oracle_id){
        queryString= new URLSearchParams(params as any).toString() + `&q=${lang}+oracle_id:${oracle_id}`;
      }
      const { data } = await axios.get(`${url}?${queryString}`);
      
      // filtrar para obtener todas las cartas en paper
      if (data.data && Array.isArray(data.data)) {
        const paperCards = data.data.filter(card => card.games && card.games.includes('paper'));
        return {
          ...data,
          data: paperCards
        };
      }
      
      // Si no hay estructura .data, devolver la respuesta completa
      return data;
      
    } catch (error) {
      this.logger.error(`❌ Fallo al traer las cartas ${oracle_id} desde scryfall no encontrada carta en idioma ${lang} : ${error.message}`);
    }
  }

    async getScryfallCardByOracleIdAndLang(oracle_id: string, lang: string ): Promise<IresponseSryfall> {
    const url = "https://api.scryfall.com/cards/search";
    const params = {
      format: 'json',
      // include_extras: true,
      include_multilingual: true,
      // include_variations: true,
      unique: 'prints'
    };
    // Construir manualmente la cadena de consulta de idioma
    const queryString = new URLSearchParams(params as any).toString() + `&q=lang:${lang}+oracle_id:${oracle_id}`;
    
    
    try {
      const { data } = await axios.get(`${url}?${queryString}`);
      //url consultada
      this.logger.log(`url consultada: ${url}?${queryString}`);
      return data;
    } catch (error) {
      //url consultada
      this.logger.log(`url consultada: ${url}?${queryString}`);
      this.logger.error(`❌ Fallo al traer la carta con oracle_id: ${oracle_id} y lang: ${lang}`);
    }
  }
}
