import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  IresponseSryfall,
  ScryfallCardResponse,
} from './interfaces/scryfall.interface';
import { ILangUrlEnum } from './enums/lang.enum';

@Injectable()
export class ScryfallService {
  private readonly logger = new Logger(ScryfallService.name);
  async getScryfallCards(
    lang: ILangUrlEnum,
    page: number,
    oracle_id?: string,
    set?: string,
  ): Promise<IresponseSryfall> {
    const url = 'https://api.scryfall.com/cards/search';
    try {
      const params = {
        format: 'json',
        include_extras: true,
        include_multilingual: true,
        include_variations: true,
        order: 'released',
        page,
        unique: 'prints',
      };
      // Construir manualmente la cadena de consulta de idioma
      let queryString =
        new URLSearchParams(params as any).toString() +
        `&q=${lang}+game%3Apaper`;
      if (oracle_id) {
        queryString =
          new URLSearchParams(params as any).toString() +
          `&q=${lang}+game%3Apaper+oracle_id:${oracle_id}`;
      }
      if (set) {
        queryString =
          new URLSearchParams(params as any).toString() +
          `&q=${lang}+game%3Apaper+set:${set}`;
      }
      const { data } = await axios.get(`${url}?${queryString}`);

      return data;
    } catch (error) {
      // Manejo específico para rate limit (429)
      if (error.response?.status === 429) {
        this.logger.error(
          `🚫 Rate limit excedido en Scryfall para página ${page}, idioma ${lang}`,
        );
        throw new Error(`Request failed with status code 429`);
      }

      this.logger.error(
        `❌ Fallo al traer las cartas ${oracle_id} desde scryfall no encontrada carta en idioma ${lang} : ${error.message}`,
      );
      throw new Error(`Error al obtener cartas de Scryfall: ${error.message}`);
    }
  }
  async getCardInOtherLang(
    lang: ILangUrlEnum,
    oracleId: string,
    collectorNumber: string,
    set: string,
  ): Promise<ScryfallCardResponse | null> {
    try {
      const url = 'https://api.scryfall.com/cards/search';
      const params = {
        format: 'json',
        include_extras: true,
        include_multilingual: true,
        include_variations: true,
        unique: 'prints',
      };
      let queryString =
        new URLSearchParams(params as any).toString() +
        `&q=${lang}+oracle_id:${oracleId}+game%3Apaper+number:${collectorNumber}+set:${set}`;
      const { data } = await axios.get<IresponseSryfall>(
        `${url}?${queryString}`,
      );
      return data.data[0];
    } catch (error) {
      return null;
    }
  }

  async getScryfallCardByOracleIdAndLang(
    oracle_id: string,
    lang: string,
    collectorNumber: string,
    set: string,
  ): Promise<IresponseSryfall> {
    const url = 'https://api.scryfall.com/cards/search';
    const params = {
      format: 'json',
      include_extras: true,
      include_multilingual: true,
      include_variations: true,
      unique: 'prints',
    };
    // Construir manualmente la cadena de consulta de idioma
    //consultar solo por oracle_id si no se pasa el lang

    let queryString =
      new URLSearchParams(params as any).toString() +
      `&q=oracle_id:${oracle_id}+game%3Apaper` +
      `+number:${collectorNumber}` +
      `+set:${set}` +
      `+lang:${lang}`;

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
      this.logger.error(
        `❌ Fallo al traer la carta con oracle_id: ${oracle_id} y lang: ${lang}`,
      );
    }
  }
}
