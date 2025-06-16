import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ScryfallCardResponse } from './submodules/scryfall/interfaces/scryfall.interface';
import { MagicCard, MagicCardDocument } from './entities/magic-card.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IsetMagic, MappedMagicCard } from '../jumpseller/interfaces/mapped-magic-card.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { ILangUrlEnum } from './submodules/scryfall/enums/lang.enum';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { ScryfallService } from './submodules/scryfall/scryfall.service';
import { EnumLanguage } from './enums/lang.enum';
import { IStagingProductVariant } from '../staging-product-variant/interfaces/stagingProductVariant.interface';
import {
  StagingProductVariant,
  StagingProductVariantDocument,
} from '../staging-product-variant/entities/staging-product-variant.entity';
import { EnumGame } from '../../common/enums/game.enum';
import { findByCardByLangDto } from './dto/find-by-collector-number-and-lang.dto';
import { EnumCondition } from './enums/condition.enum';
import { JumpsellerMapperService, Language } from './mappers/jumpseller.mapper.service';
import { JumpsellerCustomField } from '../jumpseller/interfaces/custom-fields-jumpseller/getAllCustomFields.interface';
import { CustomFieldsMapperService } from './mappers/jumpseller.customfields.mapper.service';
import { mapCardData } from './mappers/scryfall-to-db.mapper';
import { mappedStaggingProductVariant } from './mappers/staging-product-variant.mapper';
import { ProcessService } from '../process/process.service';
import {
  JumpsellerProductRequest,
} from '../jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductRequest.interface';
import {
  JumpsellerProductResponse,
} from '../jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductResponse.interface';
import { EnumStatus } from './enums/status.enum';
import {
  JumpsellerCreateVariantRequest,
} from '../jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';
import {
  JumpsellerCreateVariantResponse,
} from '../jumpseller/interfaces/variants-jumpseller/jumpsellerCreateVariantResponse.interface';
import { ICreateImageRequest } from '../jumpseller/interfaces/create-image.interface';

@Injectable()
export class MagicCardsService {
  private readonly logger = new Logger(MagicCardsService.name);

  constructor(
    private readonly jumpsellerService: JumpsellerService,
    @InjectModel(MagicCard.name) private readonly model: Model<MagicCard>,
    @InjectModel(StagingProductVariant.name) private stagingProductVariantModel: Model<StagingProductVariantDocument>,
    private readonly scryfallService: ScryfallService,
    private readonly jumpsellerMapperService: JumpsellerMapperService,
    private readonly customFieldsMapperService: CustomFieldsMapperService,
    private readonly processService: ProcessService,
  ) {}

  // helper para pausar entre llamadas
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getCardInOtherLang(lang: ILangUrlEnum, oracleId: string, collectorNumber: string, set: string): Promise<ScryfallCardResponse | null> {
    return await this.scryfallService.getCardInOtherLang(lang, oracleId, collectorNumber, set)
  }

  async translatedLanguages(lang: string): Promise<string> {
    return await this.jumpsellerMapperService.translatedLanguages(lang);
  }

  async mapCardData(card: MagicCard, description: string[]): Promise<JumpsellerProductRequest> {
    return this.jumpsellerMapperService.mapDBProductToJumpseller(card, description);
  }

  async createProductJumpseller(request: JumpsellerProductRequest): Promise<JumpsellerProductResponse> {
    return await this.jumpsellerService.createProduct(request);
  }
  async updateJumpsellerId(id: string, jumpsellerId: number): Promise<void> {
    try {
      const result = await this.model.updateOne(
        { id: id },
        { idJumpSeller: jumpsellerId, status: EnumStatus.COMPLETED }
      );
      if (result.modifiedCount === 0) {
        throw new NotFoundException(`No se encontró la carta con id: ${id}`);
      }
    } catch (error) {
      throw new InternalServerErrorException(`Error al actualizar JumpsellerId: ${error.message}`);
    }
  }
  async createVariantsBody(card: MagicCard, langs: Language[]): Promise<JumpsellerCreateVariantRequest[]> {
    return await this.jumpsellerMapperService.mapVariantsToJumpseller(card, langs);
  }
  async createJumpsellerVariant(
    productId: number,
    variant: JumpsellerCreateVariantRequest
  ): Promise<JumpsellerCreateVariantResponse> {
    return await this.jumpsellerService.createJumpsellerVariant(productId, variant);
  }
  async createVariantInApp(card: MagicCard, variant: JumpsellerCreateVariantResponse, condition: string, finish: string): Promise<StagingProductVariantDocument> {
    const stagingVariant = mappedStaggingProductVariant(card, variant, condition, finish);
    //TODO: Pasar a Entidad de BD
    return await this.stagingProductVariantModel.create(stagingVariant)
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
    const imgReq = await this.jumpsellerMapperService.mapImageToJumpseller(card);
    if (imgReq) imagesRequests.push(imgReq);

    if (card.cardFaces && card.cardFaces.length >= 2) {
      // Procesar en orden inverso: índice 1 primero, luego índice 0
      for (let index = card.cardFaces.length - 1; index >= 0; index--) {
        const faceImage = await this.jumpsellerMapperService.mapCardFaceImageToJumpseller(card, index);
        if (faceImage) imagesRequests.push(faceImage);
      }
  }

    return imagesRequests;
  }
  async insertImages(productId: number, images: ICreateImageRequest): Promise<void> {
    await this.jumpsellerService.insertImages(productId, images);
  }

  //buscar actualizar o crear magic card
  async createMagicCards(card: ScryfallCardResponse): Promise<MagicCardDocument> {
    const newCard = mapCardData(card);
    const existingCard: MagicCardDocument = await this.model.findOne({ id: card.id });
    if (existingCard) {
      return this.model.findByIdAndUpdate(
        existingCard._id,
        { $set: {...newCard} },
        {
          new: true,
          lean: false,
        }
      );
    } else {
      const doc = new this.model(newCard);
      const savedCard = await doc.save();
      return savedCard as MagicCardDocument;
    }
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
    return cardsMagic as unknown as MagicCard[];
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
  async findByCollectorNumberAndLang( form: findByCardByLangDto, _id: string ) : Promise<{ oracleId: string; message: string } | ScryfallCardResponse[]> {
    try {
      //consultar solo por id para tomar el oracleId en caso de que sea distinta
      const existingCard = await this.model.findOne({ _id: new Types.ObjectId(_id) }).exec();
      if (!existingCard) {
        throw new NotFoundException(`No se encontró la carta con id: ${_id}`);
      }
      //busco por el oracleId, por lenguaje, por collectorNumber y set
      const scryfallResponse = await this.scryfallService.getScryfallCardByOracleIdAndLang(
          existingCard.oracleId,
          form.lenguaje,
          existingCard.collectorNumber,
          existingCard.get('set')
        );
      
        if (!scryfallResponse || !scryfallResponse.data || scryfallResponse.data.length === 0) {
          throw new NotFoundException(`No se encontraron cartas para oracleId: ${existingCard.oracleId}, lang: ${form.lenguaje}, collectorNumber: ${existingCard.collectorNumber}, set: ${existingCard.get('set')}`);
        }
        this.logger.log(`Se trajeron ${scryfallResponse.data.length} cartas ${scryfallResponse.data.length < 10? "😎": "💀"} de scryfall`);
        return scryfallResponse.data;

        
    } catch (error) {
      this.logger.error(`Error al buscar carta: ${error.message}`);
      throw new InternalServerErrorException(`Error al buscar carta: ${error.message}`);
    }
  }

  async createNewMagicCardAndVariantToJumpseller(card: ScryfallCardResponse, condition: EnumCondition ): Promise<MagicCard> {
    const mappedCardData: MagicCard = mapCardData(card);
    //verificar si el condition para la carta que entra existe en staggingProductVariantModel
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
    const existingVariant = await this.stagingProductVariantModel.findOne(
      { 
        condition: condition || EnumCondition.NearMint,
        game: EnumGame.MAGIC,
        'fatherProduct.id': existingCard.id,
        'fatherProduct.set': existingCard.get('set'),
        'fatherProduct.collectorNumber': existingCard.collectorNumber,
        'fatherProduct.oracleId': existingCard.oracleId,
      }
    );
    if (existingVariant) {
      this.logger.warn(`La variante ya existe en el stock, omitiendo duplicado`);
      return;
    }
    //enviar carta a jumpseller como variante de la carta original
    if (existingCard && existingCard.idJumpSeller && !existingVariant) {
      const variantReq = await this.jumpsellerMapperService.mapVariantFromNewCardToJumpseller(
        existingCard,
        [
          { code: mappedCardData.lang as EnumLanguage, name: await this.jumpsellerMapperService.translatedLanguages(mappedCardData.lang) },
        ],
        condition
      );
      const varRes = await this.jumpsellerService.createJumpsellerVariant(
        existingCard.idJumpSeller,
        { variant: variantReq[0].variant }
      );
      await this.delay(300);
      //verificar si esta variante ya existe en el stageProductVariantModel antes de agregarla
      const cardWithStock : IStagingProductVariant = await this.stagingProductVariantModel.findOne({
        productId: existingCard.idJumpSeller,
        sku: varRes.variant.sku
      });
      
      if (!cardWithStock) {
        this.logger.log(`Agregando nueva variante al stock: ${varRes.variant.id}`);
        await this.stagingProductVariantModel.create(
          {
            productId: existingCard.idJumpSeller,
            variantId: varRes.variant.id,
            name: existingCard.name || "",
            anotherLangName: existingCard.printedName || "",
            sku: varRes.variant.sku,
            finish: "",
            rarity: existingCard.rarity || "",
            condition: condition || "",
            game: EnumGame.MAGIC,
            imageUrl: {
              large: existingCard.imageUris?.large || null,
              cardFacelarge1: existingCard.cardFaces?.[0]?.imageUris?.large || null,
              cardFacelarge2: existingCard.cardFaces?.[1]?.imageUris?.large || null,
              small: existingCard.imageUris?.small || null,
              cardFaceSmall1: existingCard.cardFaces?.[0]?.imageUris?.small || null,
              cardFaceSmall2: existingCard.cardFaces?.[1]?.imageUris?.small || null,
            },
            fatherProduct: {
              id: existingCard.id,
              collectorNumber: existingCard.collectorNumber || "",
              oracleId: existingCard.oracleId,
              description: existingCard.oracleText || "",
              setName: existingCard.setName || "",
              setId: existingCard.setId || "",
              set: existingCard.set || "",

            },
          }
        );
      } else {
        this.logger.log(`La variante ${varRes.variant.id} ya existe en el stock, omitiendo duplicado`);
      }
    }

    return { ...mappedCardData, idJumpSeller: existingCard?.idJumpSeller || null }; //enviar carta a jumpseller como variante de la carta original
   
  }

   async getAllCustomFields(): Promise<JumpsellerCustomField[]> {
      try{
        const response = await this.jumpsellerService.getAllCustomFields();
        return response.custom_fields;
      }catch (error) {
        this.logger.error('Error trayendo los custom fields', error);
        throw error;
      }
    }

}
