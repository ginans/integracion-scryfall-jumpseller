import { ScryfallCardResponse } from '../submodules/scryfall/interfaces/scryfall.interface';
import { MagicCard } from '../entities/magic-card.entity';

 export const mapCardData = (card: ScryfallCardResponse): MagicCard => {
    return {
      id: card.id || '',
      oracleId: card.oracle_id || '',
      name: card.name || '',
      printedName: card.printed_name || '',
      oracleText: card.oracle_text || '',
      printedText: card.printed_text || '',
      lang: card.lang || '',
      uri: card.uri || '',
      layout: card.layout || '',
      imageUris: card.image_uris ? {
        large: card.image_uris.large || '',
        small: card.image_uris.small || ''
      } : { small: '', large: '' },
      typeLine: card.type_line || '',
      printedTypeLine: card.printed_type_line || '',
      cmc: card.cmc || 0,
      manaCost: card.mana_cost || '',
      colors: card.colors || [],
      colorIdentity: card.color_identity || [],
      keywords: card.keywords || [],
      finishes: card.finishes || [],
      foil: card.foil || null,
      nonfoil: card.nonfoil || null,
      cardFaces: card.card_faces?.map((face) => ({
        name: face.name || '',
        printedName: face.printed_name || '',
        manaCost: face.mana_cost || '',
        typeLine: face.type_line || '',
        printedTypeLine: face.printed_type_line || '',
        oracleText: face.oracle_text || '',
        printedText: face.printed_text || '',
        colors: face.colors || [],
        artist: face.artist || '',
        power: face.power || '',
        toughness: face.toughness || '',
        imageUris: face.image_uris ? {
          small: face.image_uris.small || '',
          large: face.image_uris.large || ''
        } : { small: '', large: '' },
      })) || [],
      legalities: {
        standard: card.legalities.standard || '',//n
        // future: card.legalities.future || '',
        // historic: card.legalities.historic || '',
        // timeless: card.legalities.timeless || '',
        // gladiator: card.legalities.gladiator || '',
        pioneer: card.legalities.pioneer || '',//n
        // explorer: card.legalities.explorer || '',
        modern: card.legalities.modern || '',//n
        legacy: card.legalities.legacy || '',//n
        pauper: card.legalities.pauper || '',//n
        vintage: card.legalities.vintage || '',//n
        // penny: card.legalities.penny || '',
        commander: card.legalities.commander || '',//n
        // brawl: card.legalities.brawl || '',
        // standardbrawl: card.legalities.standardbrawl || '',
        // alchemy: card.legalities.alchemy || '',
        // paupercommander: card.legalities.paupercommander || '',
        // duel: card.legalities.duel || '',
        // oldschool: card.legalities.oldschool || '',
        premodern: card.legalities.premodern || '',//n
        // predh: card.legalities.predh || '',
        oathbreaker: card.legalities.oathbreaker || ''//n
      },
      gameChanger: card.game_changer || false,
      rarity: card.rarity || '',
      artist: card.artist || '',
      prices: {
        usd: card.prices?.usd || null,
        usdFoil: card.prices?.usd_foil || null,
        usdEtched: card.prices?.usd_etched || null,
      },
      collectorNumber: card.collector_number || '',
      setId: card.set_id || '',
      set: card.set || '',
      setName: card.set_name || '',
      setType: card.set_type || '',
      games: card.games || [],
      borderColor: card.border_color || '',
      fullArt: card.full_art || false,
      textless: card.textless || false,
      power: card.power || '',
      toughness: card.toughness || '',
    };
  }
