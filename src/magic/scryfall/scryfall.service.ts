import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IresponseSryfall } from './interfaces/scryfall.interface';
import { IenumURLLang } from './enums/lang.enum';

@Injectable()
export class ScryfallService {
  async getScryfallCards(lang: IenumURLLang, page: number): Promise<IresponseSryfall> {
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
      const queryString = new URLSearchParams(params as any).toString() + `&q=${lang}`;
      console.log(`Requesting: ${url}?${queryString}`);
      const { data } = await axios.get(`${url}?${queryString}`);
      return data;
      // retraso de 75ms
    } catch (error) {
      throw new Error(`Fallo al traer las cartas: ${JSON.stringify(error)}`);
    }
  }
}
