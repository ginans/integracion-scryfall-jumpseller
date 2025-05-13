import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, HttpException } from '@nestjs/common';
import { IresponseSryfall, ScryfallCard, ScryfallCardResponse } from './submodules/scryfall/interfaces/scryfall.interface';
import { MagicCard, magicCardDocument as MagicCardEntity } from './entities/magic-card.entity';
import { Model, set, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IsetMagic, MappedMagicCard } from '../../modules/jumpseller/interfaces/mapped-magic-card.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { IenumURLLang } from './submodules/scryfall/enums/lang.enum';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { ProductsService } from 'src/modules/products/products.service';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { ScryfallService } from './submodules/scryfall/scryfall.service';
import { UsdPricesService } from '../prices/usd-prices/usd-prices.service';
import { UsdPrice, UsdPriceDocument } from 'src/modules/prices/usd-prices/entities/usd-price.entity';
import { BasePrice, BasePriceDocument } from 'src/modules/prices/base-prices/entities/base-price.entity';
import { BasePricesService } from 'src/modules/prices/base-prices/base-prices.service';
import {
  mapDBProductToJumpseller,
  mapImageToJumpseller,
  mapCardFace1ImageToJumpseller,
  mapCardFace2ImageToJumpseller,
  mapVariantsToJumpseller,
} from './mappers/jumpseller.mapper';
import { EnumLanguage } from './enums/lang.enum';
import { StagingProductVariantService } from '../products/staging-product-variant/staging-product-variant.service';
import { IStagingProductVariant } from '../products/staging-product-variant/interfaces/stagingProductVariant.interface';
import { StagingProductVariant, StagingProductVariantDocument, StagingProductVariantSchema } from '../products/staging-product-variant/entities/staging-product-variant.entity';
import { StagingProductVariantModule } from '../products/staging-product-variant/staging-product-variant.module';
import { EnumGame, EnumGamePrefix } from '../../common/enums/game.enum';
import { all } from 'axios';
import { ObjectId } from 'typeorm';
import { exist } from 'joi';
import { findByCollectorNumberAndLangDto } from './dto/find-by-collector-number-and-lang.dto';

@Injectable()
export class MagicCardsService {
  private readonly logger = new Logger(MagicCardsService.name);

  constructor(
    private readonly jumpsellerService: JumpsellerService,
    private readonly productsService: ProductsService,
    @InjectModel(MagicCard.name) private readonly model: Model<MagicCardEntity>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(UsdPrice.name) private readonly usdPricesModel: Model<UsdPriceDocument>,
    @InjectModel(BasePrice.name) private readonly basePricesModel: Model<BasePriceDocument>,
    @InjectModel(StagingProductVariant.name) private stagingProductVariantModel: Model<StagingProductVariantDocument>,
    private readonly stagingProductVariantService: StagingProductVariantService,
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
      
      // Guardar la carta original
      const originalCard = await this.createMagicCards(cards);
      versions.push(originalCard);
      
      // Verificación de seguridad: si la carta no está en inglés, buscarla 
      if (originalCard.lang?.toLowerCase() !== 'en') {
        this.logger.warn(`⚠️ Carta no está en inglés: ${originalCard.name}`);
        const versionEN = await this.scryfallService.getScryfallCards(IenumURLLang.EN, 1, cards.oracle_id);
        await this.delay(300);
        if (versionEN?.data?.length) {
          versions.push(await this.createMagicCards(versionEN.data[0]));
        }
      }

      const versionES = await this.scryfallService.getScryfallCards(IenumURLLang.ES, 1, cards.oracle_id);
      await this.delay(300);
      if (versionES?.data?.length) {
        versions.push(await this.createMagicCards(versionES.data[0]));
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

      // // 3. calcular precios en BD
      // await this.calculatePricesForAllCards();
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
      for (const { variant, finish, condition } of variantReqs) {
        if (enCard.idJumpSeller ) {
          const varRes = await this.jumpsellerService.createJumpsellerVariant(
            enCard.idJumpSeller,
            {variant}
          );
          await this.delay(300);
          
          //verificar si esta variante ya existe en el stageProductVariantModel antes de agregarla
          const cardWithStock : IStagingProductVariant = await this.stagingProductVariantModel.findOne({
            variantId: varRes.variant.id,
            productId: enCard.idJumpSeller,
            sku: varRes.variant.sku
          });
          
          if (!cardWithStock) {
            const getGameFromSku = (sku: string) => {
              if (!sku) return null;
              const prefix = sku.split('-')[0];
              switch (prefix) {
                case EnumGamePrefix.MAGIC: return EnumGame.MAGIC;
                case  EnumGamePrefix.POKEMON: return EnumGame.POKEMON;
                case EnumGamePrefix.ONEPIECE: return EnumGame.ONEPIECE;
                default: return `Juego no encontrado para el SKU: ${sku}`;
              }
            };
            
            //solo agregar al stock si no existe
            this.logger.log(`Agregando nueva variante al stock: ${varRes.variant.id}`);
            await this.stagingProductVariantModel.create(
              {
                productId: enCard.idJumpSeller,
                variantId: varRes.variant.id,
                name: enCard.name || "",
                anotherLangName: enCard.printedName || "",
                sku: varRes.variant.sku,
                finish: finish || "",
                rarity: enCard.rarity || "",
                condition: condition || "",
                game: getGameFromSku(varRes.variant.sku) || null,
                imageUrl: {
                  large: enCard.imageUris?.large || null,
                  cardFacelarge1: enCard.cardFaces?.[0]?.imageUris?.large || null,
                  cardFacelarge2: enCard.cardFaces?.[1]?.imageUris?.large || null,
                  small: enCard.imageUris?.small || null,
                  cardFaceSmall1: enCard.cardFaces?.[0]?.imageUris?.small || null,
                  cardFaceSmall2: enCard.cardFaces?.[1]?.imageUris?.small || null,
                },
                fatherProduct: {
                  oracleId: enCard.oracleId,
                  // sku: REVISAR LOGICA, SE DEBE CREAR VARIANTES EN LA ACTUALIZACION DE LOS PRODUCTOS
                  description: enCard.oracleText || "",
                  setName: enCard.setName || "",
                  setId: enCard.setId || "",
                  set: enCard.set || "",
                },
              }
            );
            const price= await this.stagingProductVariantService.calculatePricesForAllCards( enCard.idJumpSeller, varRes.variant.id); 
              if (price) {
                this.logger.log(`🪙✅Precios calculados para la variante ${varRes.variant.id} con precio ${JSON.stringify(price)}`);
              } else {
                this.logger.warn(`🪙😭Error al calcular precios para la variante ${varRes.variant.id}`);
              }
          } else {
            this.logger.log(`La variante ${varRes.variant.id} ya existe en el stock, omitiendo duplicado`);
          }
          await this.delay(300);
        }
      }


      // 6. insertar imágenes
      if (enCard.idJumpSeller) {
        // Subir imagen principal solo si existe
        const imgReq = mapImageToJumpseller(enCard);
        if (imgReq) {
          try {
            await this.jumpsellerService.insertJumpsellerImages(enCard.idJumpSeller, imgReq);
            this.logger.log(`✅ Imagen principal subida para carta ${enCard.name}`);
          } catch (error) {
            this.logger.error(`❌ Error al subir imagen principal: ${error.message}`);
          }
          await this.delay(300);
        }
        
        // Verificar si es una carta de doble cara y procesar imágenes de ambas caras
        if (enCard.cardFaces && enCard.cardFaces.length >= 2) {
          // Subir imagen cara 1 si existe
          const mappedCardFace1Image = mapCardFace1ImageToJumpseller(enCard);
          if (mappedCardFace1Image) {
            try {
              await this.jumpsellerService.insertJumpsellerImages(enCard.idJumpSeller, mappedCardFace1Image);
              this.logger.log(`✅ Imagen cara 1 subida para carta ${enCard.name}`);
            } catch (error) {
              this.logger.error(`❌ Error al subir imagen cara 1: ${error.message}`);
            }
            await this.delay(300);
          }
          
          // Subir imagen cara 2 si existe
          const mappedCardFace2Image = mapCardFace2ImageToJumpseller(enCard);
          if (mappedCardFace2Image) {
            try {
              await this.jumpsellerService.insertJumpsellerImages(enCard.idJumpSeller, mappedCardFace2Image);
              this.logger.log(`✅ Imagen cara 2 subida para carta ${enCard.name}`);
            } catch (error) {
              this.logger.error(`❌ Error al subir imagen cara 2: ${error.message}`);
            }
            await this.delay(300);
          }
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

  //buscar actualizar o crear magic card
  async createMagicCards(cards: ScryfallCardResponse): Promise<MappedMagicCard> {
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
//endpoint para buscar en bd y traer si no existe en scryfall
  async findByCollectorNumberAndLang( form: findByCollectorNumberAndLangDto, _id: string ) : Promise<ScryfallCardResponse[] | { oracleId: string; message: string }> {
    try {
        const existingCard = await this.model.findOne({ _id: new Types.ObjectId(_id)  }).exec();
        if (!existingCard) {
          throw new NotFoundException(`No se encontró la carta con id: ${_id}`);
        }

        //revisar si la carta que se quiere crear ya existe en la base de datos
        const existingCardByColNumberAndLang = await this.model.findOne({ collectorNumber: form.collectorNumber, lang: form.lenguaje, _id: new Types.ObjectId(_id)}).exec();
        if (existingCardByColNumberAndLang) {
          return { 
            oracleId: existingCardByColNumberAndLang.oracleId, 
            message: `La carta con collectorNumber ${existingCardByColNumberAndLang.collectorNumber} y lenguaje ${existingCardByColNumberAndLang.lang} ya existe en la base de datos` };
        }
        
        const scryfallResponse = await this.scryfallService.getScryfallCardByOracleIdAndLang(
          existingCard.oracleId,
          form.lenguaje,
        );

        if (!scryfallResponse || !scryfallResponse.data || scryfallResponse.data.length === 0) {
          throw new NotFoundException(`No se encontraron cartas para oracleId: ${existingCard.oracleId} y lang: ${form.lenguaje}`);
        }

        const filteredBySet = scryfallResponse.data.filter(scryfallCard =>
          scryfallCard.oracle_id === existingCard.oracleId &&
          scryfallCard.set?.toLowerCase() === existingCard.set &&
          scryfallCard.lang?.toLowerCase() === form.lenguaje?.toLowerCase() &&
          (form.collectorNumber ? scryfallCard.collector_number?.toLowerCase() === form.collectorNumber?.toLowerCase() : true)
        );
  
        if (!filteredBySet.length) {
          throw new NotFoundException(`No existe la carta para oracleId: ${existingCard.oracleId}, lang: ${form.lenguaje} y collectorNumber: ${form.collectorNumber}`);
        }

         this.logger.log(`Buscando carta con collectorNumber: ${form.collectorNumber}`);
        return filteredBySet;

    } catch (error) {
      this.logger.error(`Error al buscar carta: ${error.message}`);
      throw new InternalServerErrorException(`Error al buscar carta: ${error.message}`);
    }
  }

  

}
