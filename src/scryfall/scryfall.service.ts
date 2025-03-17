import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ScryfallCard, ScryfallCardResponse } from './interfaces/scryfall.interface';

enum IenumLang {
  ES = 'lang:es',
  EN = 'lang:en'
}

@Injectable()
export class ScryfallService {
    async getScryfallCards(lang:IenumLang): Promise<ScryfallCardResponse>  {
      try {
      const url = "https://api.scryfall.com/cards/search";
      const params = {
        format: 'json',
        include_extras: true,
        include_multilingual: true,
        include_variations: true,
        order: 'released',
        page: 1,
        q: lang,
        unique: 'prints'
      };
      const {data} = await axios.get(url, { params });

      const mappedCardData: ScryfallCard = data.map((card: ScryfallCard) => ({
        name: card.name,
        printedName: card.printed_name,
        lang: card.lang,
        uri: card.uri,
        layout: card.layout,
        imageUrisLarge: card.image_uris.large,
        imageUrisSmall: card.image_uris.small,
        manaCost: card.mana_cost,
        cmc: card.cmc,
        typeLine: card.type_line,
        color: card.colors,
        colorIdentity: card.color_identity,
        keywords: card.keywords,
        legalities: card.legalities,
        gameChanger: card.game_changer,
        rarity: card.rarity,
        artist: card.artist,
        
      }));


      return mappedCardData;


      } catch (error) {
      throw new Error(`Failed to fetch Scryfall cards: ${error.message}`);
      }
    }


}
