import { BadRequestException, Body, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ScryfallService } from '../scryfall/scryfall.service';
import { IenumURLLang } from '../scryfall/enums/lang.enum';
import { ScryfallCard, ScryfallCardResponse } from '../scryfall/interfaces/scryfall.interface';
import { CreateMagicCardDto } from './dto/create-magic-card.dto';
import { MagicCard, magicCardDocument } from './entities/magic-card.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MappedMagicCard } from './interfaces/mapped-magic-card.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { JumpsellerProductRequest } from './interfaces/jumpsellerProductRequest.interface';
import axios from 'axios';
import { JumpsellerProductResponse } from './interfaces/jumpsellerProductResponse.interface';

@Injectable()
export class MagicCardsService {
  private readonly logger = new Logger(MagicCardsService.name);

  constructor(
    private readonly scryfallService: ScryfallService,
    @InjectModel(MagicCard.name)
    private magicCardModel: Model<magicCardDocument>
  ) { }

  private mapCardData(card: Partial<ScryfallCard>): MappedMagicCard {
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
        imageUris: face.image_uris ? {
          small: face.image_uris.small || '',
          large: face.image_uris.large || ''
        } : { small: '', large: '' },
      })) || [],
      legalities: card.legalities ? {
        standard: card.legalities.standard || '',
        future: card.legalities.future || '',
        historic: card.legalities.historic || '',
        timeless: card.legalities.timeless || '',
        gladiator: card.legalities.gladiator || '',
        pioneer: card.legalities.pioneer || '',
        explorer: card.legalities.explorer || '',
        modern: card.legalities.modern || '',
        legacy: card.legalities.legacy || '',
        pauper: card.legalities.pauper || '',
        vintage: card.legalities.vintage || '',
        penny: card.legalities.penny || '',
        commander: card.legalities.commander || '',
        brawl: card.legalities.brawl || '',
        standardbrawl: card.legalities.standardbrawl || '',
        alchemy: card.legalities.alchemy || '',
        paupercommander: card.legalities.paupercommander || '',
        duel: card.legalities.duel || '',
        oldschool: card.legalities.oldschool || '',
        premodern: card.legalities.premodern || '',
        predh: card.legalities.predh || '',
        oathbreaker: card.legalities.oathbreaker || ''
      } : {}, 
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
    };
  }

  async fetchAndCreateCards() {
    const onPageFetched = async (cards: ScryfallCardResponse[]) => {
      // Mapeo de los datos por pagina
      const mappedCardData: MappedMagicCard[] = cards.map(this.mapCardData);

      // Verificar duplicados por ID y actualizar o insertar
      for (const card of mappedCardData) {
        const existingCard = await this.magicCardModel.findOne({ id: card.id });
        if (existingCard) {
          await this.magicCardModel.updateOne({ id: card.id }, card);
        } else {
          await this.magicCardModel.create(card); // Insertar si no existe
        }
      }
    };

    // Obtener cartas de Scryfall
    const cardsInSpanish = await this.scryfallService.getScryfallCards(IenumURLLang.ES, onPageFetched);
    this.logger.log(`✅ Cartas en español obtenidas: ${cardsInSpanish.length}`);

    const cardsInEnglish = await this.scryfallService.getScryfallCards(IenumURLLang.EN, onPageFetched);
    this.logger.log(`✅ Cartas en inglés obtenidas: ${cardsInEnglish.length}`);

    this.logger.log("Todos los datos nuevos de han guardado y los duplicados se han actualizado");
    return { message: "Todos los datos nuevos de han guardado y los duplicados se han actualizado." };
  }

  // Mapeo de producto base para Jumpseller
  private jumpsellerProduct(card: MappedMagicCard): JumpsellerProductRequest {
    const isfoil = (card.foil === true);
    const product = {
      name: card.name || '',
      description: `${card.oracleText}; Costo de maná:${card.manaCost}; Costo de maná convertido:${card.cmc}` || '',
      price: parseFloat(isfoil ? card.prices?.usdFoil || '0.00' : card.prices?.usd || '0.00'),
      sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber}`,
      stock: 0,
      categories: card.setId ? [{ name: card.setName || '', id: 1 }] : [], 
    };

    console.log(`sku: ${product.sku}`);
    console.log(`collector number: ${card.collectorNumber}`);
    return product;
  }

  async createJumpsellerProducts(): Promise<JumpsellerProductRequest[]> { 
    const cards = await this.magicCardModel.find({ status: "pending", lang: { $regex: "^en$", $options: "i" } });
    
    //TODO: mover a servicio de jumpseller
  const jumpsellerApiUrl = 'https://api.jumpseller.com/v1/products.json';
  const login = process.env.JUMPSELLER_LOGIN
  const authtoken = process.env.JUMPSELLER_AUTHTOKEN
  const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  

  const mappedCards: MappedMagicCard[] = cards;
  const results: JumpsellerProductRequest[] = [];

  for (const mappedCard of mappedCards) {
    try {
      const product = this.jumpsellerProduct(mappedCard);

      this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
      this.logger.debug(`Cuerpo de la solicitud: ${JSON.stringify(product)}`);

      const { data } = await axios.post(
        jumpsellerApiUrl,
        { product }, 
        { 
          headers: {
            Authorization: `Basic ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Añadir el producto creado a los resultados
      results.push(data.product);
          
      await this.magicCardModel.updateOne(
        { id: mappedCard.id }, 
        { status: "completed" } 
      );
      this.logger.log(`✅ Estado actualizado para el producto ${mappedCard.name} a 'completed'`);

    } catch (error) {
      this.logger.error(`❌ Error al crear producto en Jumpseller: ${error.message}`);
      if (error.response) {
        this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
        this.logger.error(`Código de estado: ${error.response.status}`);
        this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
      }
    }

    // Esperar 300 ms antes de la siguiente solicitud
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return results; 
}



  async findAllCards(query: PaginationQueryDto) {
    const { limit, page, sortBy, sortOrder, to, from, search, status, lang } = query;

    const sort: { [key: string]: 1 | -1 } = {
      [sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
    };

    const skip = (page - 1) * limit;
    const filters: { $or?: any[], $and?: any[] } = {};


    if (search && search.length > 0) {
      const searchValue = search.trim();
      filters.$or = [];
      if (!isNaN(Number(searchValue))) {
        filters.$or.push({ receptionNbr: Number(searchValue) });
      }
      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$name" },
            regex: searchValue,
            options: "i"
          }
        }
      });
      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$printedName" },
            regex: searchValue,
            options: "i"
          }
        }
      });
      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$status" },
            regex: searchValue,
            options: "i"
          }
        }
      });
      filters.$or.push({
        products: {
          $elemMatch: {
            sku: { $regex: searchValue, $options: "i" }
          }
        }
      });
    }

    if (from && to) {
      filters.$and = [
        {
          createdAt: { //preguntar
            $gte: new Date(`${from}T00:00:00.000Z`),
            $lte: new Date(`${to}T23:59:59.999Z`)
          }
        },
      ];
    }

    if (status) {
      const stateFilter = { status: { $regex: `^${status}$`, $options: "i" } };
      filters.$and = filters.$and ? [...filters.$and, stateFilter] : [stateFilter];
    }

    if (lang) {
      const langFilter = { lang: { $regex: `^${lang}$`, $options: "i" } };
      filters.$and = filters.$and ? [...filters.$and, langFilter] : [langFilter];
    }

    try {
      const [productCards, total] = await Promise.all([
        this.magicCardModel.find(filters).sort(sort).skip(skip).limit(limit).exec(),
        this.magicCardModel.countDocuments(filters).exec()
      ]);
      return {
        items: productCards.map(user => user.toObject()),
        meta: {
          totalItems: total,
          itemsPerPage: productCards.length,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          hasNextPage: total > (page * limit),
          hasPreviousPage: page > 1,
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching Transfers: ${error.message}`);
    }
  }

  async findOneCard(_id: string): Promise<MagicCard | null> {
    if (!Types.ObjectId.isValid(_id))
      throw new BadRequestException('Formato de ID inválido');
    const card = await this.magicCardModel.findOne({ _id: new Types.ObjectId(_id) }).exec();
    if (!card) throw new NotFoundException('Card no encontrada');
    return card;
  }
}

// update(id: number, updateProductCardDto: UpdateProductCardDto) {
//     return `This action updates a #${id} productCard`;
// }


