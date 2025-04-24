import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ScryfallCard, ScryfallCardResponse } from './scryfall/interfaces/scryfall.interface';
import { MagicCard, magicCardDocument as MagicCardEntity } from './entities/magic-card.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IsetMagic, MappedMagicCard } from '../jumpseller/interfaces/mapped-magic-card.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { IenumURLLang } from './scryfall/enums/lang.enum';
import { JumpsellerService } from 'src/jumpseller/jumpseller.service';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/jumpseller/interfaces/jumpselllerCustomFields/addAnExistingCustomFieldToAProductRequest.interface';
import { ProductsService } from 'src/products/products.service';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { ScryfallService } from './scryfall/scryfall.service';
import { CreateMagicCardDto } from './dto/create-magic-card.dto';
import { UsdPricesService } from '../usd-prices/usd-prices.service';
import { UsdPrice, UsdPriceDocument } from 'src/usd-prices/entities/usd-price.entity';
import { BasePrice, BasePriceDocument } from 'src/base-prices/entities/base-price.entity';
import { BasePricesService } from 'src/base-prices/base-prices.service';
import {
  mapDBProductToJumpseller,
  mapDBUpdateProductToJumpseller,
  mapImageToJumpseller,
  mapCardFace1ImageToJumpseller,
  mapCardFace2ImageToJumpseller,
  mapVariantsToJumpseller,
  Language
} from './mappers/jumpseller.mapper';
import {
  mapCMCCustomField,
  mapTypeLineCustomField,
  mapColorCustomField,
  mapColorIdentityCustomField,
  mapKeywordsCustomField,
  mapLegalitiesCustomField,
  mapGameChangerCustomField,
  mapRarityCustomField,
  mapArtistCustomField,
} from './mappers/jumpseller.customfields.mapper';
import { EnumLanguage } from './enums/lang.enum';

@Injectable()
export class MagicCardsService {
  private readonly logger = new Logger(MagicCardsService.name);

  constructor(
    private readonly jumpsellerService: JumpsellerService,
    private readonly productsService: ProductsService,
    @InjectModel(MagicCard.name)
    private readonly model: Model<MagicCardEntity>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(UsdPrice.name) private readonly usdPricesModel: Model<UsdPriceDocument>,
    @InjectModel(BasePrice.name) private readonly basePricesModel: Model<BasePriceDocument>,
    private readonly scryfallService: ScryfallService,
    private readonly usdPricesService: UsdPricesService,
    private readonly basePricesService: BasePricesService,
  ) {}

  // helper para pausar entre llamadas
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  //procesar cada carta magic
  async procesarCardMagic(cards: ScryfallCardResponse): Promise<void> {
    try {
      // 1. guardar en BD todas las versiones (fetchAndCreateCards)
      const versions: MappedMagicCard[] = [];
      versions.push(await this.fetchAndCreateCards(cards));
      const versionES = await this.scryfallService.getScryfallCards(IenumURLLang.ES, 1, cards.oracle_id);
      await this.delay(300);
      if (versionES?.data?.length) {
        versions.push(await this.fetchAndCreateCards(versionES.data[0]));
      }

      // 2. crear producto base en Jumpseller (versión en inglés)
      const enCard = versions.find(v => v.lang?.toLowerCase() === 'en');
      if (enCard && !enCard.idJumpSeller) {
        const baseReq = mapDBProductToJumpseller(enCard);
        const baseRes = await this.jumpsellerService.createJumpsellerProducts(baseReq);
        await this.delay(300);
        enCard.idJumpSeller = baseRes.product?.id;
        await this.updateByStatus(enCard.id, { idJumpSeller: enCard.idJumpSeller });
        await this.productsService.createOrUpdateProduct({ oracleId: enCard.oracleId, ...baseRes.product });
        await this.delay(300);
      }

      // 3. calcular precios en BD
      await this.calculatePricesForAllCards();
      await this.delay(300);

      // 4. crear variantes para idiomas != 'en'
      this.logger.log(`👽 Creando variantes para idiomas diferentes a 'en'`);
      // construir array de todos los idiomas
      const langs = versions
        .map(v => {
          const code = v.lang! as EnumLanguage;
          const key = Object.entries(EnumLanguage).find(([, val]) => val === code)?.[0];
          const name = key
            ? key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')
            : v.lang!;
          return { code, name };
        });
      // generar todas las variantes de una vez
      const variantReqs = mapVariantsToJumpseller(enCard, langs);
      for (const variantReq of variantReqs) {
        if (enCard.idJumpSeller) {
          const varRes = await this.jumpsellerService.createJumpsellerVariant(
            enCard.idJumpSeller,
            variantReq
          );
          await this.delay(300);
          
          //verificar si esta variante ya existe en el stock antes de agregarla
          const cardWithStock = await this.model.findOne({
            id: enCard.id,
            "stock.variant_id": varRes.variant.id,
            "stock.product_id": enCard.idJumpSeller
          });
          
          if (!cardWithStock) {
            //solo agregar al stock si no existe
            this.logger.log(`Agregando nueva variante al stock: ${varRes.variant.id}`);
            await this.model.updateOne(
              { id: enCard.id },
              {
                $push: {
                  stock: {
                    card_name: enCard.name? enCard.name : "",
                    another_lang_name: enCard.printedName? enCard.printedName : "",
                    sku: varRes.variant.sku,
                    product_id: enCard.idJumpSeller,
                    variant_id: varRes.variant.id,
                    location_id: null,       
                    stock_unlimited: null,   
                    stock: null             
                  }
                }
              }
            );
          } else {
            this.logger.log(`La variante ${varRes.variant.id} ya existe en el stock, omitiendo duplicado`);
          }
          await this.delay(300);
        }
      }

      // 6. insertar imágenes
      if (enCard.idJumpSeller) {
        const imgReq = mapImageToJumpseller(enCard);
        await this.jumpsellerService.insertJumpsellerImages(enCard.idJumpSeller, imgReq);
        await this.delay(300);
        if (enCard.cardFaces && enCard.cardFaces.length >= 2 && enCard.cardFaces[0].imageUris && enCard.cardFaces[1].imageUris) {
          const mappedCardFace2Image = mapCardFace2ImageToJumpseller(enCard);
          await this.jumpsellerService.insertJumpsellerImages(enCard.idJumpSeller, mappedCardFace2Image);
          await this.delay(300);
          const mappedCardFace1Image = mapCardFace1ImageToJumpseller(enCard);
          await this.jumpsellerService.insertJumpsellerImages(enCard.idJumpSeller, mappedCardFace1Image);
          await this.delay(300);
        }
      }

      // 7. obtener respuesta final y guardar en products
      if (enCard.idJumpSeller) {
        const finalRes = await this.jumpsellerService.getJumpsellerProductById(enCard.idJumpSeller);
        await this.productsService.createOrUpdateProduct({ oracleId: enCard.oracleId, ...finalRes.product });
        await this.delay(300);
      }

      // 8. completar flujo
      await this.updateByStatus(enCard.id, { status: 'completed' });
      this.logger.log(`✅ Proceso completo para carta ${enCard.oracleId}`);
    } catch (error) {
      this.logger.error(error);
    }
  }

  // mapear data de Scryfall para guadar en tabla magic
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
        power: face.power || '',
        toughness: face.toughness || '',
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
        valorPesoChilenoCalculado: null,
        valorPesoChilenoCalculadoFoil: null,
        valorPesoChilenoCalculadoEtched: null,
      },
      stock: [],
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

  //buscar actualizar o crear magic card
  async fetchAndCreateCards(cards: ScryfallCardResponse): Promise<MappedMagicCard> {
    const mappedCardData: MappedMagicCard = this.mapCardData(cards);
    const existingCard = await this.model.findOne({ id: mappedCardData.id });
    if (existingCard) {
      this.logger.log(`actualizar id ${mappedCardData.id}`);
      await this.model.updateOne(
        { id: mappedCardData.id },
        { $set: { ...mappedCardData } }
      );
    } else {
      this.logger.log(`crear card magic ${mappedCardData.id}`);
      await this.model.create({ ...mappedCardData });
    }
    return { ...mappedCardData, idJumpSeller: existingCard?.idJumpSeller || null };
  }

  //buscar paginar magic card
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
        $expr: {
          $regexMatch: {
            input: { $toString: "$set" },
            regex: searchValue,
            options: "i"
          }
        }
      });
      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$setName" },
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
          createdAt: {
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
        this.model.find(filters).sort(sort).skip(skip).limit(limit).exec(),
        this.model.countDocuments(filters).exec()
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

  async findAllCardsWithoutFilters(): Promise<MagicCard[]> {
    const cardsMagic = await this.model.find({}).exec();
    const cardsMagicResponse = cardsMagic as unknown as MagicCard[];
    return cardsMagicResponse;
  }

  //buscar paginar magic card por ID
  async findOneCard(_id: string): Promise<MagicCard | null> {
    if (!Types.ObjectId.isValid(_id))
      throw new BadRequestException('Formato de ID inválido');
    const card = await this.model.findOne({ _id: new Types.ObjectId(_id) }).exec();
    if (!card) throw new NotFoundException('Card no encontrada');
    return card;
  }

  async findCardByOracleId(oracleId: string): Promise<MappedMagicCard> {
    const card = await this.model.findOne({ oracleId }).exec();
    if (!card) throw new NotFoundException('Card no encontrada');
    return card as unknown as MappedMagicCard;
  }

  async findCardPending(): Promise<MappedMagicCard[]> {
    const response = await this.model.find({ status: "pending", lang: { $regex: "^en$", $options: "i" } });
    return response as unknown as MappedMagicCard[];
  }

  //actualizar por id u estado
  async updateByStatus(id: string, set: IsetMagic): Promise<void> {
    await this.model.updateOne(
      { id },
      { ...set }
    );
  }

  //agregar nueva carta a la db magic
  async addCard(card: CreateMagicCardDto): Promise<MappedMagicCard> {
    try {
      const lang = card.lenguaje.toLowerCase();
      const oracle_id = card.oracle_id.toLowerCase();

      this.logger.log(`Buscando carta con oracle_id: ${card.oracle_id} en idioma: ${lang}`);

      const scryfallResponse = await this.scryfallService.getScryfallCardByOracleIdAndLang(
        oracle_id,
        lang
      );

      const exactMatch = scryfallResponse.data.find(card =>
        card.oracle_id === card.oracle_id &&
        card.lang.toLowerCase() === lang
      );

      if (!exactMatch) {
        throw new NotFoundException(`No se encontró una coincidencia exacta para oracle_id: ${card.oracle_id} y lenguaje: ${lang}`);
      }

      const cardData = exactMatch;

      const mappedCardData: MappedMagicCard = this.mapCardData(cardData);

      const existingCard = await this.model.findOne({
        oracleId: mappedCardData.oracleId,
        lang: mappedCardData.lang
      });

      if (existingCard) {
        this.logger.log(`La carta con ID ${mappedCardData.id} ya existe, actualizando`);
        await this.model.updateOne({
          oracleId: mappedCardData.oracleId,
          lang: mappedCardData.lang
        },
          { ...mappedCardData });
        return { ...mappedCardData, idJumpSeller: existingCard.idJumpSeller };

      } else {
        this.logger.log(`Creando nueva carta Magic con ID ${mappedCardData.id}`);
        const newCard = await this.model.create(mappedCardData);
        return newCard as unknown as MappedMagicCard;
      }
    } catch (error) {
      this.logger.error(`Error al agregar carta: ${error.message}`);
      throw new InternalServerErrorException(`Error al agregar carta: ${error.message}`);
    }
  }

  //Calcular precio de todas las cartas
  async calculatePricesForAllCards(): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;

    const usdPricesArr = await this.usdPricesService.findAllPrices();
    const usdPriceDoc = Array.isArray(usdPricesArr)
      ? usdPricesArr.find(p => p.game === "Magic: The Gathering")
      : null;
    if (!usdPriceDoc || !usdPriceDoc.usdPrice) throw new NotFoundException('Valor del dólar no encontrado');
    const dollarValue = usdPriceDoc.usdPrice;

    const basePricesArr = await this.basePricesService.findAllBasePrices();
    const basePriceObj = Array.isArray(basePricesArr)
      ? basePricesArr.find(bp => bp.game === "Magic: The Gathering" && bp.type === "rarity")
      : null;
    if (!basePriceObj || !basePriceObj.basePrices) throw new NotFoundException('Precios base no encontrados');

    const cards = await this.model.find({}).exec();

    for (const card of cards) {
      try {
        const rarity = card.rarity?.toLowerCase() || '';
        let labelBase = '';
        if (rarity === 'rare') labelBase = 'rareR';
        else if (rarity === 'mythic') labelBase = 'mythicM';
        else if (rarity === 'common') labelBase = 'commonC';
        else if (rarity === 'uncommon') labelBase = 'uncommonU';

        let precioApiNonFoil = card.prices.usd ? parseFloat(card.prices.usd) : 0;
        let precioFinalNonFoilmultiploCien = 0;
        if (precioApiNonFoil > 0) {
          const precioCalculadoNonFoil = Math.round(precioApiNonFoil * dollarValue);
          let basePriceNonFoil = 0;
          if (labelBase) {
            const baseItem = basePriceObj.basePrices.find(bp => bp.label === labelBase);
            basePriceNonFoil = baseItem ? baseItem.price : 0;
          }
          const precioFinalNonFoil = Math.max(precioCalculadoNonFoil, basePriceNonFoil);
          precioFinalNonFoilmultiploCien = Math.ceil(precioFinalNonFoil / 100) * 100;
        } else {
          this.logger.warn(`Precio API en dolar para nonfoil no disponible para carta ${card.oracleId}`);
        }

        let precioApiFoil = card.prices.usdFoil ? parseFloat(card.prices.usdFoil) : 0;
        let precioFinalFoilmultiploCien = 0;
        if (precioApiFoil > 0) {
          const precioCalculadoFoil = Math.round(precioApiFoil * dollarValue);
          let basePriceFoil = 0;
          if (labelBase) {
            const baseItemFoil = basePriceObj.basePrices.find(bp => bp.label === `${labelBase}-Foil`);
            basePriceFoil = baseItemFoil ? baseItemFoil.price : 0;
          }
          const precioFinalFoil = Math.max(precioCalculadoFoil, basePriceFoil);
          precioFinalFoilmultiploCien = Math.ceil(precioFinalFoil / 100) * 100;
        } else {
          this.logger.warn(`Precio API en dolar para foil no disponible para carta ${card.oracleId}`);
        }

        let precioApiEtched = card.prices.usdEtched ? parseFloat(card.prices.usdEtched) : 0;
        let precioFinalEtchedmultiploCien = 0;
        if (precioApiEtched > 0) {
          const precioCalculadoEtched = Math.round(precioApiEtched * dollarValue);
          let basePriceEtched = 0;
          if (labelBase) {
            const baseItemEtched = basePriceObj.basePrices.find(bp => bp.label === `${labelBase}-Etched`);
            basePriceEtched = baseItemEtched ? baseItemEtched.price : 0;
          }
          const precioFinalEtched = Math.max(precioCalculadoEtched, basePriceEtched);
          precioFinalEtchedmultiploCien = Math.ceil(precioFinalEtched / 100) * 100;
        } else {
          this.logger.warn(`Precio API en dolar para etched no disponible para carta ${card.oracleId}`);
        }

        if (precioApiNonFoil > 0) {
          card.prices.valorPesoChilenoCalculado = precioFinalNonFoilmultiploCien.toString();
        }
        if (precioApiFoil > 0) {
          card.prices.valorPesoChilenoCalculadoFoil = precioFinalFoilmultiploCien.toString();
        }
        if (precioApiEtched > 0) {
          card.prices.valorPesoChilenoCalculadoEtched = precioFinalEtchedmultiploCien.toString();
        }

        await this.model.updateOne({ oracleId: card.oracleId }, { prices: card.prices });
        this.logger.log(`Actualizado precio para carta ${card.oracleId}: NonFoil: ${precioFinalNonFoilmultiploCien}, Foil: ${precioFinalFoilmultiploCien}, Etched: ${precioFinalEtchedmultiploCien}`);
        updated++;
        
      } catch (e) {
        this.logger.error(`Error al calcular precio para carta ${card.oracleId}: ${e.message}`);
        errors++;
      }
    }

    return { updated, errors };
  }
}
