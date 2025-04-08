import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { ScryfallCard, ScryfallCardResponse } from './scryfall/interfaces/scryfall.interface';
import { MagicCard, magicCardDocument as MagicCardEntity } from './entities/magic-card.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IsetMagic, MappedMagicCard } from '../jumpseller/interfaces/mapped-magic-card.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { IenumURLLang } from './scryfall/enums/lang.enum';
import { JumpsellerOptionType, JumpsellerProductRequest } from 'src/jumpseller/interfaces/jumpsellerProducts/jumpsellerCreateProductRequest.interface';
import { JumpsellerService } from 'src/jumpseller/jumpseller.service';
import { JumpsellerCreateImageRequest } from 'src/jumpseller/interfaces/jumpsellerImages/jumpsellerCreateImageRequest.interface';
import { JumpsellerCreateVariantRequest } from 'src/jumpseller/interfaces/jumpsellerVariants/JumpsellerCreateVariantRequest.interface';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/jumpseller/interfaces/jumpselllerCustomFields/addAnExistingCustomFieldToAProductRequest.interface';
import { createCustomFieldRequest } from 'src/jumpseller/interfaces/jumpselllerCustomFields/createCustomfieldRequest.interface';
import { ProductsService } from 'src/products/products.service';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { JumpsellerUpdateProductRequest } from 'src/jumpseller/interfaces/jumpsellerProducts/JumpsellerUpdateProductRequest.interface';

@Injectable()
export class MagicCardsService {
  private readonly logger = new Logger(MagicCardsService.name);

  constructor(

    private readonly jumpsellerService: JumpsellerService,
    private readonly productsService: ProductsService,
    @InjectModel(MagicCard.name)
    private readonly model: Model<MagicCardEntity>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>
  ) { }


  //procesar  cada carta magic
  async procesarCardMagic(cards: ScryfallCardResponse, lg: IenumURLLang): Promise<void> {
    //crear o actualizar cartas magic
    const req = await this.fetchAndCreateCards(cards);
    // Para cartas en español, buscar su contraparte en inglés para obtener el idJumpSeller
    if (lg === IenumURLLang.ES && !req?.idJumpSeller) {
      // Buscar el producto existente por oracleId
      const existingProduct = await this.productModel.findOne({ oracleId: req.oracleId });
      if (existingProduct?.id) {
        req.idJumpSeller = existingProduct.id;
        // Actualizar el ID en la entidad MagicCard
        await this.updateByStatus(req.id, { idJumpSeller: req.idJumpSeller });
        this.logger.log(`✅ Producto en español vinculado al ID de Jumpseller: ${req.idJumpSeller}`);
      } else {
        this.logger.log(`⚠️ No se encontró un producto en inglés para la carta en español: ${req.name}`);
      }
    }
    // Si no tiene ID de Jumpseller y es inglés, crear nuevo producto
    if (!req?.idJumpSeller && lg === IenumURLLang.EN) {
      // Solo crear en jumpseller cuando es inglés
        const requestJumpseller = this.mappedDBProductToJumpseller(req);
        const response = await this.jumpsellerService.createJumpsellerProducts(requestJumpseller);

        if (response?.product?.id) {
          await this.productsService.createOrUpdateProduct({ oracleId: req.oracleId, ...response.product });
          req.idJumpSeller = response.product.id;
          await this.updateByStatus(req.id, { idJumpSeller: req.idJumpSeller });
        }
    } 
    
    // Actualizar el producto existente (solo si es inglés)
    if (req?.idJumpSeller) {
      if (lg === IenumURLLang.EN) {
        const mappedUpdateToJumpseller = this.mappedDBUpdateProductToJumpseller(req);
        await this.jumpsellerService.updateJumpsellerProduct(req.idJumpSeller, mappedUpdateToJumpseller);
        this.logger.log(`✅ Producto actualizado en Jumpseller con ID: ${req.idJumpSeller}`);
      }

      // Crear variantes según el idioma
      if (lg === IenumURLLang.EN) {
        this.logger.log(`✅ Se comienza a crear variantes en Jumpseller en Inglés`);
        const mappedENFVariants = this.mappedENFVariantsToJumpseller(req);
        await this.jumpsellerService.createJumpsellerVariants(req.idJumpSeller, mappedENFVariants);
        this.logger.log(`mappedENFVariantsToJumpseller: ${JSON.stringify(mappedENFVariants)}`);

        const mappedENFNVariants = this.mappedENFNVariantsToJumpseller(req);
        await this.jumpsellerService.createJumpsellerVariants(req.idJumpSeller, mappedENFNVariants);
        this.logger.log(`mappedENFNVariantsToJumpseller: ${JSON.stringify(mappedENFNVariants)}`);

        this.logger.log(`✅ Se comienza a crear imágenes en Inglés en Jumpseller`);
        const mappedImage = this.mappedImageToJumpseller(req);
        await this.jumpsellerService.insertJumpsellerImages(req.idJumpSeller, mappedImage);
        this.logger.log(`mappedImageToJumpseller: ${JSON.stringify(mappedImage)}`);
      } 
      if (lg === IenumURLLang.ES) {
        this.logger.log(`✅ Se comienza a crear variantes en Jumpseller en Español`);
        const mappedESFVariants = this.mappedESFVariantsToJumpseller(req);
        await this.jumpsellerService.createJumpsellerVariants(req.idJumpSeller, mappedESFVariants);
        this.logger.log(`mappedESFVariantsToJumpseller: ${JSON.stringify(mappedESFVariants)}`);

        const mappedESFNVariants = this.mappedESFNVariantsToJumpseller(req);
        await this.jumpsellerService.createJumpsellerVariants(req.idJumpSeller, mappedESFNVariants);
        this.logger.log(`mappedESFNVariantsToJumpseller: ${JSON.stringify(mappedESFNVariants)}`);

        this.logger.log(`✅ Se comienza a crear imágenes en Español en Jumpseller`);
        const mappedImage = this.mappedImageToJumpseller(req);
        await this.jumpsellerService.insertJumpsellerImages(req.idJumpSeller, mappedImage);
        this.logger.log(`mappedImageToJumpseller: ${JSON.stringify(mappedImage)}`);
      }

      // Guardar la respuesta completa de Jumpseller en products
      this.logger.log(`✅ Se comienza a guardar la respuesta completa de Jumpseller en products`);
      const fullResponse = await this.jumpsellerService.getAllJumpsellerProducts(req.idJumpSeller);
      const product = fullResponse.product;
      await this.productsService.createOrUpdateProduct({ oracleId: req.oracleId, ...product });
    }
    this.logger.log(`✅ Estado actualizado para el producto a 'completed'`);
    await this.updateByStatus(req.id, { status: 'completed' });
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  //mapeo de cartas completas de la db magic a jumpseller
  private mappedDBProductToJumpseller(card: MappedMagicCard): JumpsellerProductRequest {
    const isfoil = (card.foil === true);
    let product = {
      name: card.name || '',
      description: `${card.oracleText}; Costo de maná:${card.manaCost}; Costo de maná convertido:${card.cmc}` || '',
      price: parseFloat(isfoil ? card.prices?.usdFoil || '0.00' : card.prices?.usd || '0.00'),
      sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber}`,
      stock: 0,
      weight: 2, //Peso en gramos
      //width en in: 2,5, height en in: 3,5
      width: 6.35, //Ancho del producto en cm
      height: 8.89, //Altura del producto en cm
      brand: "Magic: the Gathering",
      categories: card.setId ? [{ name: card.setName || '', id: 1 }] : [],
    };
    return product;
  }
  private mappedDBUpdateProductToJumpseller(card: MappedMagicCard): JumpsellerUpdateProductRequest {
    const isfoil = (card.foil === true);
    let productDetails = {
      name: card.name || '',
      description: `${card.oracleText}; Costo de maná:${card.manaCost}; Costo de maná convertido:${card.cmc}` || '',
      price: parseFloat(isfoil ? card.prices?.usdFoil || '0.00' : card.prices?.usd || '0.00'),
      sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber}`,
      stock: 0,
      weight: 2, //Peso en gramos
      //width en in: 2,5, height en in: 3,5
      width: 6.35, //Ancho del producto en cm
      height: 8.89, //Altura del producto en cm
      brand: "Magic: the Gathering",
      categories: card.setId ? [{ name: card.setName || '', id: 1 }] : [],
    };
    return { product: productDetails };
  }

  //mapeo de imagenes de la db magic a jumpseller
  private mappedImageToJumpseller(card: MappedMagicCard): JumpsellerCreateImageRequest {
    let imageRequest: JumpsellerCreateImageRequest = {
      image: {
        url: card.imageUris.large || "",
        position: 0,
      }
    };
    return imageRequest;
  }

  //mapeo de variantes de la db magic a jumpseller
  //mapeo variante EN-F
  private mappedENFVariantsToJumpseller(card: MappedMagicCard): JumpsellerCreateVariantRequest {
    try {
      if (!card) {
        this.logger.error('Error en mappedENFVariantsToJumpseller: objeto card no definido');
        return { variant: { sku: '', options: [] } };
      }

      if (card.foil) {
        return {
          variant: {
            sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber}-EN-F`,
            options: [
              { name: "Lenguaje", option_type: JumpsellerOptionType.OPTION, value: "EN" },
              { name: "Finish", option_type: JumpsellerOptionType.OPTION, value: "Foil" },
            ],
          },
        };
      }

      return { variant: { sku: '', options: [] } };
    } catch (error) {
      this.logger.error(`Error en mappedENFVariantsToJumpseller: ${error.message}`);
      return { variant: { sku: '', options: [] } };
    }
  }

  //mapeo variante ES-F
  private mappedESFVariantsToJumpseller(card: MappedMagicCard): JumpsellerCreateVariantRequest {
    try {
      if (!card) {
        this.logger.error('Error en mappedESFVariantsToJumpseller: objeto card no definido');
        return { variant: { sku: '', options: [] } };
      }

      if (card.foil && card.lang === "ES") {
        return {
          variant: {
            sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber}-ES-F`,
            options: [
              { name: "Lenguaje", option_type: JumpsellerOptionType.OPTION, value: "ES" },
              { name: "Finish", option_type: JumpsellerOptionType.OPTION, value: "Foil" },
            ],
          },
        };
      }

      return { variant: { sku: '', options: [] } };
    } catch (error) {
      this.logger.error(`Error en mappedESFVariantsToJumpseller: ${error.message}`);
      return { variant: { sku: '', options: [] } };
    }
  }

  //mapeo variante EN-NF
  private mappedENFNVariantsToJumpseller(card: MappedMagicCard): JumpsellerCreateVariantRequest {
    try {
      if (!card) {
        this.logger.error('Error en mappedENFNVariantsToJumpseller: objeto card no definido');
        return { variant: { sku: '', options: [] } };
      }

      if (card.nonfoil) {
        return {
          variant: {
            sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber}-EN-NF`,
            options: [
              { name: "Finish", option_type: JumpsellerOptionType.OPTION, value: "Non-Foil" },
              { name: "Lenguaje", option_type: JumpsellerOptionType.OPTION, value: "EN" },
            ],
          },
        };
      }

      return { variant: { sku: '', options: [] } };
    } catch (error) {
      this.logger.error(`Error en mappedENFNVariantsToJumpseller: ${error.message}`);
      return { variant: { sku: '', options: [] } };
    }
  }

  //mapeo variante ES-NF
  private mappedESFNVariantsToJumpseller(card: MappedMagicCard): JumpsellerCreateVariantRequest {
    try {
      if (!card) {
        this.logger.error('Error en mappedESFNVariantsToJumpseller: objeto card no definido');
        return { variant: { sku: '', options: [] } };
      }

      if (card.nonfoil && card.lang === "ES") {
        return {
          variant: {
            sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber}-ES-NF`,
            options: [
              { name: "Finish", option_type: JumpsellerOptionType.OPTION, value: "Non-Foil" },
              { name: "Lenguaje", option_type: JumpsellerOptionType.OPTION, value: "ES" },
            ],
          },
        };
      }

      return { variant: { sku: '', options: [] } };
    } catch (error) {
      this.logger.error(`Error en mappedESFNVariantsToJumpseller: ${error.message}`);
      return { variant: { sku: '', options: [] } };
    }
  }



  //mapeo de custom fields de la db magic a jumpseller
  //cmc, type_line, color, color_identity, keywords, legalities (solo legales),  game_changer, rarity, artist
  private mappedAddCustomFieldsToJumpseller(card: MappedMagicCard): AddAnExistingCustomFieldToAProductRequest {
    let customfieldsRequest: AddAnExistingCustomFieldToAProductRequest = {
      field: {
        id: 0,
        value: "",
        variants: [], //Array de identificadores únicos del Producto Variante
      }
    };
    return customfieldsRequest;
  }
  private mappedCreateCustomFieldsToJumpseller(card: MappedMagicCard): createCustomFieldRequest {
    let createCustomfieldsRequest: createCustomFieldRequest = {
      custom_field: {
        label: "CMC",
        type: "selection",
        values: [card.cmc.toString()],
        product_visibility: true,
      },
    };
    return createCustomfieldsRequest;
  }

  // mapear data de Scryfall para guadar en tabla  magic
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
  //buscar actuzalizar o crear magic card
  async fetchAndCreateCards(cards: ScryfallCardResponse): Promise<MappedMagicCard> {
    // Mapeo de los datos por pagina
    const mappedCardData: MappedMagicCard = this.mapCardData(cards);
    // Verificar duplicados por ID y actualizar o insertar
    const existingCard = await this.model.findOne({ id: mappedCardData.id });
    if (existingCard) {
      await this.model.updateOne({ id: mappedCardData.id }, mappedCardData);
    } else {
      await this.model.create(mappedCardData); // Insertar si no existe
    }
    return mappedCardData;
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
  //buscar paginar magic card por ID
  async findOneCard(_id: string): Promise<MagicCard | null> {
    if (!Types.ObjectId.isValid(_id))
      throw new BadRequestException('Formato de ID inválido');
    const card = await this.model.findOne({ _id: new Types.ObjectId(_id) }).exec();
    if (!card) throw new NotFoundException('Card no encontrada');
    return card;
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
}



