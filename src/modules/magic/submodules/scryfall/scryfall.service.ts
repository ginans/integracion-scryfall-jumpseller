import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IresponseSryfall, ScryfallCardResponse } from './interfaces/scryfall.interface';
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
        //TODO: filtrar tambien por SET
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
      include_extras: true,
      include_multilingual: true,
      include_variations: true,
      unique: 'prints',
    };
    // Construir manualmente la cadena de consulta de idioma
    //consultar solo por oracle_id si no se pasa el lang
    let cards = []
    
    let queryString = new URLSearchParams(params as any).toString() + `&q=oracle_id:${oracle_id}`;

    if(lang){
     queryString = new URLSearchParams(params as any).toString() + `&q=lang:${lang}+oracle_id:${oracle_id}`;
    }
    try {
      let page = 1;
      let has_more = true;
      let allData: ScryfallCardResponse[] = [];
      let responseData: any = null;

      do {
        const response = await axios.get(`${url}?${queryString}&page=${page}`);
        const { data } = response;
        if (!responseData) {
          responseData = { ...data, data: undefined }; 
        }
        if (Array.isArray(data.data)) {
          allData = allData.concat(data.data);
        }
        has_more = data.has_more;
        page++;
      } while (has_more);

      //url consultada
      this.logger.log(`url consultada: ${url}?${queryString}`);
      return { ...responseData, data: allData };
    } catch (error) {
      //url consultada
      this.logger.log(`url consultada: ${url}?${queryString}`);
      this.logger.error(`❌ Fallo al traer la carta con oracle_id: ${oracle_id} y lang: ${lang}`);
    }
  }
}
