import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ScryfallCardResponse } from './submodules/scryfall/interfaces/scryfall.interface';
import { MagicCard, MagicCardDocument } from './entities/magic-card.entity';
import { Model, set, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  IsetMagic,
  MappedMagicCard,
} from '../jumpseller/interfaces/mapped-magic-card.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { ILangUrlEnum } from './submodules/scryfall/enums/lang.enum';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { ScryfallService } from './submodules/scryfall/scryfall.service';
import { EnumLanguage } from './enums/lang.enum';
import { IVariant } from '../variants/interfaces/variants.interface';
import {
  Variants,
  VariantsDocument,
} from '../variants/entities/variants.entity';
import { EnumGame } from '../../common/enums/game.enum';
import { findByCardByLangDto } from './dto/find-by-collector-number-and-lang.dto';
import { EnumCondition } from './enums/condition.enum';
import {
  JumpsellerMapperService,
  Language,
} from './mappers/jumpseller.mapper.service';
import { JumpsellerCustomField } from '../jumpseller/interfaces/custom-fields-jumpseller/getAllCustomFields.interface';
import { CustomFieldsMapperService } from './mappers/jumpseller.customfields.mapper.service';
import { mapCardData } from './mappers/scryfall-to-db.mapper';
import { mappedStaggingProductVariant } from './mappers/staging-product-variant.mapper';
import { ProcessService } from '../process/process.service';
import { JumpsellerProductRequest } from '../jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductRequest.interface';
import {
  JumpsellerProductResponse,
  ICreateProductVariant,
} from '../jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductResponse.interface';
import { EnumStatus } from './enums/status.enum';
import { JumpsellerCreateVariantRequest } from '../jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';
import { JumpsellerCreateVariantResponse } from '../jumpseller/interfaces/variants-jumpseller/jumpsellerCreateVariantResponse.interface';
import { ICreateImageRequest } from '../jumpseller/interfaces/create-image.interface';
import {
  CustomFieldValues,
  MapCFCollection,
} from '../jumpseller/interfaces/map-CF-collection.interface';
import { CustomField, CustomFieldFallback } from './enums/custom-fields.enum';
import {
  spanishRarities,
  translateColors,
} from '../../common/utils/traduction.util';
import { createCustomFieldRequest } from '../jumpseller/interfaces/custom-fields-jumpseller/createCustomfieldRequest.interface';
import { CreateCustomFieldResponse } from '../jumpseller/interfaces/custom-fields-jumpseller/createCustomFieldResponse.interface';
import { UpdateCustomFieldRequest } from '../jumpseller/interfaces/custom-fields-jumpseller/updateCustomFieldRequest.interface';
import { UpdateCustomFieldResponse } from '../jumpseller/interfaces/custom-fields-jumpseller/updateCustomFieldResponse.interface';

@Injectable()
export class MagicCardsService {
  private readonly logger = new Logger(MagicCardsService.name);

  constructor(
    private readonly jumpsellerService: JumpsellerService,
    @InjectModel(MagicCard.name) private readonly model: Model<MagicCard>,
    @InjectModel(Variants.name)
    private VariantModel: Model<VariantsDocument>,
    private readonly scryfallService: ScryfallService,
    private readonly jumpsellerMapperService: JumpsellerMapperService,
    private readonly customFieldsMapperService: CustomFieldsMapperService,
    private readonly processService: ProcessService,
  ) {}

  // helper para pausar entre llamadas
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getCardInOtherLang(
    lang: ILangUrlEnum,
    oracleId: string,
    collectorNumber: string,
    set: string,
  ): Promise<ScryfallCardResponse | null> {
    return await this.scryfallService.getCardInOtherLang(
      lang,
      oracleId,
      collectorNumber,
      set,
    );
  }

  async translatedLanguages(lang: string): Promise<string> {
    return await this.jumpsellerMapperService.translatedLanguages(lang);
  }

  async mapCardData(
    card: MagicCard,
    description: string[],
    variantsRequest: JumpsellerCreateVariantRequest[],
  ): Promise<JumpsellerProductRequest> {
    return this.jumpsellerMapperService.mapDBProductToJumpseller(
      card,
      description,
      variantsRequest,
    );
  }

  async createProductJumpseller(
    request: JumpsellerProductRequest,
  ): Promise<JumpsellerProductResponse> {
    return await this.jumpsellerService.createProduct(request);
  }
  async updateJumpsellerId(id: string, jumpsellerId: number): Promise<void> {
    try {
      const result = await this.model.updateOne(
        { id: id },
        { idJumpSeller: jumpsellerId, status: EnumStatus.COMPLETED },
      );
      if (result.modifiedCount === 0) {
        throw new NotFoundException(`No se encontró la carta con id: ${id}`);
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al actualizar JumpsellerId: ${error.message}`,
      );
    }
  }
  async createVariantsBody(
    card: MagicCard,
    langs: Language[],
  ): Promise<JumpsellerCreateVariantRequest[]> {
    return await this.jumpsellerMapperService.mapVariantsToJumpseller(
      card,
      langs,
    );
  }
  async createJumpsellerVariant(
    productId: number,
    variant: JumpsellerCreateVariantRequest,
  ): Promise<JumpsellerCreateVariantResponse> {
    return await this.jumpsellerService.createJumpsellerVariant(
      productId,
      variant,
    );
  }
  async createVariantInApp(
    card: MagicCard,
    variant: ICreateProductVariant,
    condition: string,
    finish: string,
  ): Promise<VariantsDocument> {
    const stagingVariant = mappedStaggingProductVariant(
      card,
      variant,
      condition,
      finish,
    );
    // Verificar si ya existe una variante con el mismo productId y variantId
    const existingVariant = await this.VariantModel.findOne({
      productId: stagingVariant.productId,
      variantId: stagingVariant.variantId,
    });
    if (existingVariant) {
      this.logger.warn(
        `⚠️ Variante ya existe: ProductId=${stagingVariant.productId}, VariantId=${stagingVariant.variantId}`,
      );
      return existingVariant; // Retornar la variante existente
    }
    // Usar upsert para evitar duplicados basado en productId y variantId
    const result = await this.VariantModel.findOneAndUpdate(
      {
        productId: stagingVariant.productId,
        variantId: stagingVariant.variantId,
      }, // Buscar por ProductId y VariantId
      { $set: stagingVariant }, // Actualizar con los nuevos datos
      {
        upsert: true, // Crear si no existe
        new: true, // Retornar el documento actualizado
        runValidators: true, // Ejecutar validaciones
      },
    );
    return result;
  }
  async findCardByJumpsellerId(idJumpSeller: number): Promise<MagicCard> {
    return await this.model.findOne({ idJumpSeller: idJumpSeller }).exec();
  }
  async findCardByScryfallId(id: string): Promise<MagicCardDocument> {
    return await this.model.findOne({ id: id }).exec();
  }
  async calculatePrice(productId: number, variantId: number): Promise<void> {
    await this.processService.updateApiPricesQueue({ productId, variantId });
  }
  async createImagesRequests(card: MagicCard): Promise<ICreateImageRequest[]> {
    const imagesRequests: ICreateImageRequest[] = [];
    const imgReq =
      await this.jumpsellerMapperService.mapImageToJumpseller(card);
    if (imgReq) imagesRequests.push(imgReq);

    if (card.cardFaces && card.cardFaces.length >= 2) {
      // Procesar en orden inverso: índice 1 primero, luego índice 0
      for (let index = card.cardFaces.length - 1; index >= 0; index--) {
        const faceImage =
          await this.jumpsellerMapperService.mapCardFaceImageToJumpseller(
            card,
            index,
          );
        if (faceImage) imagesRequests.push(faceImage);
      }
    }

    return imagesRequests;
  }
  async insertImages(
    productId: number,
    images: ICreateImageRequest,
  ): Promise<void> {
    await this.jumpsellerService.insertImages(productId, images);
  }
  async processAndInsertCustomFields(
    card: MagicCard,
    idJumpseller: number,
  ): Promise<void> {
    const customFields = await this.getAllCustomFields();
    if (!customFields || customFields.length === 0) return;
    const requestsCustomFields =
      await this.customFieldsMapperService.mappedCustomFields(
        card,
        customFields,
      );
    for (const customField of requestsCustomFields) {
      try {
        await this.jumpsellerService.addCustomFieldInProduct(
          idJumpseller,
          customField,
        );
      } catch (error) {
        this.logger.error(`❌ Error al agregar custom field: ${error.message}`);
      }
      await this.delay(300);
    }
  }
  //buscar actualizar o crear magic card
  async createMagicCards(
    card: ScryfallCardResponse,
  ): Promise<MagicCardDocument> {
    const newCard = mapCardData(card);
    const existingCard: MagicCardDocument = await this.model.findOne({
      id: card.id,
    });
    if (existingCard) {
      return this.model.findByIdAndUpdate(
        existingCard._id,
        { $set: { ...newCard } },
        {
          new: true,
          lean: false,
        },
      );
    } else {
      const doc = new this.model(newCard);
      const savedCard = await doc.save();
      return savedCard as MagicCardDocument;
    }
  }
  //buscar paginar magic card
  async findAllCards(query: PaginationQueryDto) {
    const {
      limit,
      page,
      sortBy,
      sortOrder,
      to,
      from,
      search,
      status,
      lang,
      set,
    } = query;

    const sort: { [key: string]: 1 | -1 } = {
      [sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
    };

    const skip = (page - 1) * limit;
    const filters: { $or?: any[]; $and?: any[] } = {};

    if (search && search.length > 0) {
      const searchValue = search.trim();
      filters.$or = [];
      filters.$or.push({
        collectorNumber: { $regex: searchValue, $options: 'i' },
      });

      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: '$name' },
            regex: searchValue,
            options: 'i',
          },
        },
      });
      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: '$printedName' },
            regex: searchValue,
            options: 'i',
          },
        },
      });
      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: '$status' },
            regex: searchValue,
            options: 'i',
          },
        },
      });
      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: '$set' },
            regex: searchValue,
            options: 'i',
          },
        },
      });
      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: '$setName' },
            regex: searchValue,
            options: 'i',
          },
        },
      });
      filters.$or.push({
        products: {
          $elemMatch: {
            sku: { $regex: searchValue, $options: 'i' },
          },
        },
      });
    }

    if (from && to) {
      filters.$and = [
        {
          createdAt: {
            $gte: new Date(`${from}T00:00:00.000Z`),
            $lte: new Date(`${to}T23:59:59.999Z`),
          },
        },
      ];
    }

    if (status) {
      const stateFilter = { status: { $regex: `^${status}$`, $options: 'i' } };
      filters.$and = filters.$and
        ? [...filters.$and, stateFilter]
        : [stateFilter];
    }

    if (lang) {
      const langFilter = { lang: { $regex: `^${lang}$`, $options: 'i' } };
      filters.$and = filters.$and
        ? [...filters.$and, langFilter]
        : [langFilter];
    }
    if (set) {
      const setFilter = { set: { $regex: `^${set}$`, $options: 'i' } };
      filters.$and = filters.$and ? [...filters.$and, setFilter] : [setFilter];
    }
    // if (setName) {
    //   const setNameFilter = {
    //     setName: { $regex: `^${setName}$`, $options: 'i' },
    //   };
    //   filters.$and = filters.$and
    //     ? [...filters.$and, setNameFilter]
    //     : [setNameFilter];
    // }
    this.logger.log(
      `📋 Filtros aplicados: ${JSON.stringify(filters, null, 2)}`,
    );
    try {
      const [productCards, total] = await Promise.all([
        this.model.find(filters).sort(sort).skip(skip).limit(limit).exec(),
        this.model.countDocuments(filters).exec(),
      ]);
      return {
        items: productCards.map((user) => user.toObject()),
        meta: {
          totalItems: total,
          itemsPerPage: productCards.length,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          hasNextPage: total > page * limit,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error fetching Transfers: ${error.message}`,
      );
    }
  }

  async getAllSets(): Promise<{
    sets: { setName: string; setPrefix: string }[];
  }> {
    const mappedSets: { setName: string; setPrefix: string }[] = [];
    const setNames = await this.model.distinct('setName').exec();
    for (const setName of setNames) {
      const matchedSet = await this.model.findOne({ setName });
      mappedSets.push({ setName: setName, setPrefix: matchedSet.set || '' });
    }
    return {
      sets: mappedSets,
    };
  }

  async findAllCardsWithoutFilters(): Promise<MagicCard[]> {
    const cardsMagic = await this.model.find({}).exec();
    return cardsMagic as unknown as MagicCard[];
  }

  //buscar paginar magic card por ID
  async findOneCard(_id: string): Promise<MagicCard | null> {
    if (!Types.ObjectId.isValid(_id))
      throw new BadRequestException('Formato de ID inválido');
    const card = await this.model
      .findOne({ _id: new Types.ObjectId(_id) })
      .exec();
    if (!card) throw new NotFoundException('Card no encontrada');
    return card;
  }

  async findCardByOracleId(oracleId: string): Promise<MappedMagicCard> {
    const card = await this.model.findOne({ oracleId }).exec();
    if (!card) throw new NotFoundException('Card no encontrada');
    return card as unknown as MappedMagicCard;
  }

  async findCardPending(): Promise<MappedMagicCard[]> {
    const response = await this.model.find({
      status: 'pending',
      lang: { $regex: '^en$', $options: 'i' },
    });
    return response as unknown as MappedMagicCard[];
  }
  //actualizar por id u estado
  async updateByStatus(id: string, set: IsetMagic): Promise<void> {
    await this.model.updateOne({ id }, { ...set });
  }
  //endpoint para buscar en bd y traer si no existe en scryfall
  async findByCollectorNumberAndLang(
    form: findByCardByLangDto,
    _id: string,
  ): Promise<{ oracleId: string; message: string } | ScryfallCardResponse[]> {
    try {
      //consultar solo por id para tomar el oracleId en caso de que sea distinta
      const existingCard = await this.model
        .findOne({ _id: new Types.ObjectId(_id) })
        .exec();
      if (!existingCard) {
        throw new NotFoundException(`No se encontró la carta con id: ${_id}`);
      }
      //busco por el oracleId, por lenguaje, por collectorNumber y set
      const scryfallResponse =
        await this.scryfallService.getScryfallCardByOracleIdAndLang(
          existingCard.oracleId,
          form.lenguaje,
          existingCard.collectorNumber,
          existingCard.get('set'),
        );

      if (
        !scryfallResponse ||
        !scryfallResponse.data ||
        scryfallResponse.data.length === 0
      ) {
        throw new NotFoundException(
          `No se encontraron cartas para oracleId: ${existingCard.oracleId}, lang: ${form.lenguaje}, collectorNumber: ${existingCard.collectorNumber}, set: ${existingCard.get('set')}`,
        );
      }
      this.logger.log(
        `Se trajeron ${scryfallResponse.data.length} cartas ${scryfallResponse.data.length < 10 ? '😎' : '💀'} de scryfall`,
      );
      return scryfallResponse.data;
    } catch (error) {
      this.logger.error(`Error al buscar carta: ${error.message}`);
      throw new InternalServerErrorException(
        `Error al buscar carta: ${error.message}`,
      );
    }
  }

  async createNewMagicCardAndVariantToJumpseller(
    card: ScryfallCardResponse,
    condition: EnumCondition,
  ): Promise<MagicCard> {
    const mappedCardData: MagicCard = mapCardData(card);
    //verificar si el condition para la carta que entra existe en staggingProductVariantModel
    const existingCard = await this.model.findOne({ id: mappedCardData.id });
    if (existingCard) {
      this.logger.log(`actualizar id ${mappedCardData.id}`);
      await this.model.updateOne(
        { id: mappedCardData.id },
        { $set: { ...mappedCardData } },
      );
    } else {
      this.logger.log(`crear card magic ${mappedCardData.id}`);
      await this.model.create({ ...mappedCardData });
    }
    const existingVariant = await this.VariantModel.findOne({
      condition: condition || EnumCondition.NearMint,
      game: EnumGame.MAGIC,
      'fatherProduct.id': existingCard.id,
      'fatherProduct.set': existingCard.get('set'),
      'fatherProduct.collectorNumber': existingCard.collectorNumber,
      'fatherProduct.oracleId': existingCard.oracleId,
    });
    if (existingVariant) {
      this.logger.warn(
        `La variante ya existe en el stock, omitiendo duplicado`,
      );
      return;
    }
    //enviar carta a jumpseller como variante de la carta original
    if (existingCard && existingCard.idJumpSeller && !existingVariant) {
      const variantReq =
        await this.jumpsellerMapperService.mapVariantFromNewCardToJumpseller(
          existingCard,
          [
            {
              code: mappedCardData.lang as EnumLanguage,
              name: await this.jumpsellerMapperService.translatedLanguages(
                mappedCardData.lang,
              ),
            },
          ],
          condition,
        );
      const varRes = await this.jumpsellerService.createJumpsellerVariant(
        existingCard.idJumpSeller,
        { variant: variantReq[0].variant },
      );
      await this.delay(300);
      //verificar si esta variante ya existe en el VariantModel antes de agregarla
      const cardWithStock: IVariant =
        await this.VariantModel.findOne({
          productId: existingCard.idJumpSeller,
          sku: varRes.variant.sku,
        });

      if (!cardWithStock) {
        this.logger.log(
          `Agregando nueva variante al stock: ${varRes.variant.id}`,
        );
        await this.VariantModel.create({
          productId: existingCard.idJumpSeller,
          variantId: varRes.variant.id,
          name: existingCard.name || '',
          anotherLangName: existingCard.printedName || '',
          sku: varRes.variant.sku,
          finish: '',
          rarity: existingCard.rarity || '',
          condition: condition || '',
          game: EnumGame.MAGIC,
          imageUrl: {
            large: existingCard.imageUris?.large || null,
            cardFacelarge1:
              existingCard.cardFaces?.[0]?.imageUris?.large || null,
            cardFacelarge2:
              existingCard.cardFaces?.[1]?.imageUris?.large || null,
            small: existingCard.imageUris?.small || null,
            cardFaceSmall1:
              existingCard.cardFaces?.[0]?.imageUris?.small || null,
            cardFaceSmall2:
              existingCard.cardFaces?.[1]?.imageUris?.small || null,
          },
          fatherProduct: {
            id: existingCard.id,
            collectorNumber: existingCard.collectorNumber || '',
            oracleId: existingCard.oracleId,
            description: existingCard.oracleText || '',
            setName: existingCard.setName || '',
            setId: existingCard.setId || '',
            set: existingCard.set || '',
          },
        });
      } else {
        this.logger.log(
          `La variante ${varRes.variant.id} ya existe en el stock, omitiendo duplicado`,
        );
      }
    }

    return {
      ...mappedCardData,
      idJumpSeller: existingCard?.idJumpSeller || null,
    }; //enviar carta a jumpseller como variante de la carta original
  }

  async getAllCustomFields(): Promise<JumpsellerCustomField[]> {
    try {
      const response = await this.jumpsellerService.getAllCustomFields();
      return response.custom_fields;
    } catch (error) {
      this.logger.error('Error trayendo los custom fields', error);
      throw error;
    }
  }

  async createCustomFields(
    customField: createCustomFieldRequest,
  ): Promise<CreateCustomFieldResponse> {
    try {
      const response =
        await this.jumpsellerService.createCustomField(customField);
      return response;
    } catch (error) {
      this.logger.error('Error creando los custom fields', error);
      throw error;
    }
  }
  async updateCustomFields(
    customField: UpdateCustomFieldRequest,
    productId: number,
  ): Promise<UpdateCustomFieldResponse> {
    try {
      const response = await this.jumpsellerService.updateCustomField(
        customField,
        productId,
      );
      return response;
    } catch (error) {
      this.logger.error('Error actualizando los custom fields', error);
      throw error;
    }
  }
  //para crear campos personalizados en jumpseller vamos a traer todos los campos necesarios desde la bd para armar la creacion
  async getSetNames(): Promise<string[]> {
    const setNames = await this.model.distinct('setName').exec();
    return this.addFallbackString(setNames, CustomFieldFallback.SET_NAME);
  }
  async getColors(): Promise<string[]> {
    const colorNames = await this.model.distinct('colors').exec();
    return this.addFallbackString(
      colorNames.map((name) => translateColors(name)),
      CustomFieldFallback.COLOR,
    );
  }
  async getGameChangers(): Promise<string[]> {
    const gameChangers = await this.model.distinct('gameChanger').exec();
    const uniqueGameChangers = new Set(gameChangers);
    // Convertir a string y agregar fallback
    return Array.from(uniqueGameChangers).map((name) => {
      return name ? 'Sí' : 'No';
    });
  }
  async getRarities(): Promise<string[]> {
    const rarityNames = await this.model.distinct('rarity').exec();
    return this.addFallbackString(
      rarityNames.map((name) => spanishRarities(name)),
      CustomFieldFallback.RARITY,
    );
  }
  async getSetTypes(): Promise<string[]> {
    const setTypeNames = await this.model.distinct('setType').exec();
    return this.addFallbackString(setTypeNames, CustomFieldFallback.SET_TYPE);
  }
  async getManaCosts(): Promise<string[]> {
    const manaCostNames = await this.model.distinct('manaCost').exec();
    return this.addFallbackString(manaCostNames, CustomFieldFallback.MANA_COST);
  }
  async getCmcs(): Promise<string[]> {
    const cmcNames = await this.model.distinct('cmc').exec();
    //convertir a string
    const cmcNamesAsString = cmcNames.map((name) => String(name));
    //agregar el fallback
    const response = this.addFallbackString(
      cmcNamesAsString,
      CustomFieldFallback.CMC,
    );
    return response;
  }
  async getPowers(): Promise<string[]> {
    const powerNames = await this.model.distinct('power').exec();
    return this.addFallbackString(powerNames, CustomFieldFallback.POWER);
  }
  async getToughness(): Promise<string[]> {
    const toughnessNames = await this.model.distinct('toughness').exec();
    return this.addFallbackString(
      toughnessNames,
      CustomFieldFallback.TOUGHNESS,
    );
  }
  async getColorIdentities(): Promise<string[]> {
    const colorIdentityNames = await this.model
      .distinct('colorIdentity')
      .exec();
    return this.addFallbackString(
      colorIdentityNames.map((name) => translateColors(name)),
      CustomFieldFallback.COLOR_IDENTITY,
    );
  }
  async getKeywords(): Promise<string[]> {
    const keywordNames = await this.model.distinct('keywords').exec();
    return this.addFallbackString(keywordNames, CustomFieldFallback.KEYWORDS);
  }

  async getLegalities(): Promise<string[]> {
    const documents = await this.model.find({}, { legalities: 1 }).lean();
    const legalFormats = new Set<string>();

    for (const doc of documents) {
      const legalities = doc.legalities;
      if (!legalities) continue;

      for (const format in legalities) {
        if (legalities[format] === 'legal') {
          legalFormats.add(format);
        }
      }
    }

    return this.addFallbackString(
      Array.from(legalFormats),
      CustomFieldFallback.LEGAL_FORMATS,
    );
  }

  async getArtists(): Promise<string[]> {
    const artistNames = await this.model.distinct('artist').exec();
    return this.addFallbackString(artistNames, CustomFieldFallback.ARTIST);
  }
  async getBorderColors(): Promise<string[]> {
    const borderColorNames = await this.model.distinct('borderColor').exec();
    return this.addFallbackString(
      borderColorNames.map((name) => translateColors(name)),
      CustomFieldFallback.BORDER_COLOR,
    );
  }
  async getFullArt(): Promise<string[]> {
    const fullArtNames = await this.model.distinct('fullArt').exec();
    //si es true que ponga si, si es false, que ponga no
    const uniqueFullArtNames = new Set(fullArtNames);
    const fullArtNamesAsString = Array.from(uniqueFullArtNames).map((name) => {
      return name ? 'Sí' : 'No';
    });
    //agregar el fallback
    const response = this.addFallbackString(
      fullArtNamesAsString,
      CustomFieldFallback.FULL_ART,
    );
    return response;
  }
  async getTextless(): Promise<string[]> {
    const textlessNames = await this.model.distinct('textless').exec();
    //si es true que ponga si, si es false, que ponga no
    const uniqueTextlessNames = new Set(textlessNames);
    const textlessNamesAsString = Array.from(uniqueTextlessNames).map(
      (name) => {
        return name ? 'Sí' : 'No';
      },
    );
    //agregar el fallback
    const response = this.addFallbackString(
      textlessNamesAsString,
      CustomFieldFallback.TEXTLESS,
    );
    return response;
  }
  async getTypeLines(): Promise<{
    typeLines: string[];
    subTypeLines: string[];
  }> {
    const typeLines = await this.model.distinct('typeLine').exec();

    const typeLineSet = new Set<string>();
    const subTypeLineSet = new Set<string>();

    for (const line of typeLines) {
      const [typeLine, subTypeLine] = line.split('—'); // guion largo (em dash)
      const trimmedTypeLine = typeLine.trim();
      const trimmedSubTypeLine = subTypeLine ? subTypeLine.trim() : '';

      if (trimmedTypeLine) typeLineSet.add(trimmedTypeLine);
      if (trimmedSubTypeLine) subTypeLineSet.add(trimmedSubTypeLine);
    }
    return {
      typeLines: this.addFallbackString(
        Array.from(typeLineSet),
        CustomFieldFallback.TYPE_LINE,
      ),
      subTypeLines: this.addFallbackString(
        Array.from(subTypeLineSet),
        CustomFieldFallback.SUB_TYPE_LINE,
      ),
    };
  }

  async getAllCFValues(): Promise<CustomFieldValues> {
    const setNames = await this.getSetNames();
    const colors = await this.getColors();
    const gameChangers = await this.getGameChangers();
    const rarities = await this.getRarities();
    const setTypes = await this.getSetTypes();
    const manaCosts = await this.getManaCosts();
    const cmcs = await this.getCmcs();
    const powers = await this.getPowers();
    const toughness = await this.getToughness();
    const colorIdentities = await this.getColorIdentities();
    const keywords = await this.getKeywords();
    const legalities = await this.getLegalities();
    const artists = await this.getArtists();
    const borderColors = await this.getBorderColors();
    const fullArt = await this.getFullArt();
    const textless = await this.getTextless();
    const typeLines = (await this.getTypeLines()).typeLines;
    const subTypeLines = (await this.getTypeLines()).subTypeLines;
    return {
      setNames,
      colors,
      gameChangers,
      rarities,
      setTypes,
      manaCosts,
      cmcs,
      powers,
      toughness,
      colorIdentities,
      keywords,
      legalities,
      artists,
      borderColors,
      fullArt,
      textless,
      typeLines,
      subTypeLines,
    };
  }

  //TODO: PROBAR ENVIAR A JUMPSELLER
  async createCFBody(): Promise<createCustomFieldRequest[]> {
    const values = await this.getAllCFValues();
    //mapear los valores y labels
    const CF: MapCFCollection =
      await this.customFieldsMapperService.mappedCFLabelAndValues(values);
    const {
      setNames,
      colors,
      gameChangers,
      rarities,
      setTypes,
      artists,
      borderColors,
      fullArt,
      textless,
      typeLines,
      subTypeLines,
      cmcs,
      colorIdentities,
      manaCosts,
      powers,
      toughness,
      keywords,
      legalities,
    } = CF;
    //retornar el resultado mapeado para jumpseller
    const req = this.customFieldsMapperService.mapCreateCustomFieldsRequest([
      setNames,
      colors,
      gameChangers,
      rarities,
      setTypes,
      artists,
      borderColors,
      fullArt,
      textless,
      typeLines,
      subTypeLines,
      cmcs,
      colorIdentities,
      manaCosts,
      powers,
      toughness,
      keywords,
      legalities,
    ]);
    return req;
  }

  async sentCreateCFInJumpseller(): Promise<CreateCustomFieldResponse[]> {
    const customFields = await this.createCFBody();
    const responses: CreateCustomFieldResponse[] = [];
    for (const customField of customFields) {
      try {
        const response = await this.createCustomFields(customField);
        //DELAY
        await this.delay(300);
        responses.push(response);
      } catch (error) {
        this.logger.error(
          `Error creando el custom field: ${customField.custom_field.label} - ${error.message}`,
        );
      }
    }
    this.logger.log(
      `Se crearon ${responses.length} custom fields en Jumpseller`,
    );
    return responses;
  }

  //TODO: CORREGIR MAPEO
  async sentUpdateCFInJumpseller(): Promise<UpdateCustomFieldRequest[]> {
    const createdCustomFields: JumpsellerCustomField[] =
      await this.getAllCustomFields();
    //si no hay custom fields creados, retornar
    if (!createdCustomFields || createdCustomFields.length === 0) {
      this.logger.warn(`No hay custom fields creados en Jumpseller`);
      return [];
    }
    const customFields = await this.createCFBody();
    const responses: UpdateCustomFieldResponse[] = [];
    for (const customField of customFields) {
      try {
        for (const createdCF of createdCustomFields) {
          await this.logger.log(
            `Actualizando el custom field: ${JSON.stringify(customField)} - ${createdCF.id}`,
          );
          const response = await this.updateCustomFields(
            customField,
            createdCF.id,
          );
          //DELAY
          await this.delay(300);
          responses.push(response);
        }
      } catch (error) {
        this.logger.error(
          `Error actualizando el custom field: ${customField.custom_field.label} - ${error.message}`,
        );
      }
    }
    this.logger.log(
      `Se actualizaron ${responses.length} custom fields en Jumpseller`,
    );
    return responses;
  }

  private addFallbackString(values: string[], fallback: string): string[] {
    const cleaned = values.map((v) => (v === '' ? fallback : v));
    if (!cleaned.includes(fallback)) {
      cleaned.push(fallback);
    }
    return cleaned;
  }
}
