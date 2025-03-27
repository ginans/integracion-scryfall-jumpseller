import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ScryfallCardResponse } from './interfaces/scryfall.interface';
import { IenumURLLang } from './enums/lang.enum';

@Injectable()
export class ScryfallService {
    async getScryfallCards(lang: IenumURLLang, onPageFetched: (cards: ScryfallCardResponse[]) => void): Promise<ScryfallCardResponse[]> {
        const url = "https://api.scryfall.com/cards/search";
        let page = 1;
        let allCards: ScryfallCardResponse[] = [];
        let hasMore = true;

        while (hasMore) {
            try {
                const params = {
                    format: 'json',
                    include_extras: true,
                    include_multilingual: true,
                    include_variations: true,
                    order: 'released',
                    page: page,
                    unique: 'prints'
                };
                
                // Construir manualmente la cadena de consulta de idioma
                const queryString = new URLSearchParams(params as any).toString() + `&q=${lang}`;
                console.log(`Requesting: ${url}?${queryString}`);
                
                const { data } = await axios.get(`${url}?${queryString}`);

                 // Llamar al callback para procesar y guardar los datos por página
                 onPageFetched(data.data);
                 hasMore = false

                // hasMore = data.has_more; //has_more es un booleano, se vuelve false en la ultima pagina
                // page++;

                // retraso de 75ms
                await this.delay(75);
            } catch (error) {
                throw new Error(`Fallo al traer las cartas: ${error.message}`);
            }
        }

        return allCards;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
