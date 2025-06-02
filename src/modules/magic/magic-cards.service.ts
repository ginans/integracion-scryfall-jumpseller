import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ScryfallCardResponse } from './submodules/scryfall/interfaces/scryfall.interface';
import { MagicCard, magicCardDocument as MagicCardEntity } from './entities/magic-card.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IsetMagic, MappedMagicCard } from '../../modules/jumpseller/interfaces/mapped-magic-card.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { IenumURLLang } from './submodules/scryfall/enums/lang.enum';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { ScryfallService } from './submodules/scryfall/scryfall.service';
import { EnumLanguage } from './enums/lang.enum';
import { StagingProductVariantService } from '../staging-product-variant/staging-product-variant.service';
import { IStagingProductVariant } from '../staging-product-variant/interfaces/stagingProductVariant.interface';
import { StagingProductVariant, StagingProductVariantDocument } from '../staging-product-variant/entities/staging-product-variant.entity';
import { EnumGame } from '../../common/enums/game.enum';
import { findByCollectorNumberAndLangDto } from './dto/find-by-collector-number-and-lang.dto';
import { EnumCondition } from './enums/condition.enum';
import { JumpsellerMapperService } from './mappers/jumpseller.mapper.service';
import { JumpsellerCustomField } from '../jumpseller/interfaces/jumpselllerCustomFields/getAllCustomFields.interface';
import { CustomFieldsMapperService } from './mappers/jumpseller.customfields.mapper.service';
import { mapCardData } from './mappers/scryfall-to-db.mapper';
import { mappedStaggingProductVariant} from './mappers/staging-product-variant.mapper';
import { ProcessService } from '../process/process.service';

@Injectable()
export class MagicCardsService {
  private readonly logger = new Logger(MagicCardsService.name);

  constructor(
    private readonly jumpsellerService: JumpsellerService,
    @InjectModel(MagicCard.name) private readonly model: Model<MagicCardEntity>,
    @InjectModel(StagingProductVariant.name) private stagingProductVariantModel: Model<StagingProductVariantDocument>,
    private readonly stagingProductVariantService: StagingProductVariantService,
    private readonly scryfallService: ScryfallService,
    private readonly jumpsellerMapperService: JumpsellerMapperService,
    private readonly customFieldsMapperService: CustomFieldsMapperService,
    private readonly processService: ProcessService,
  ) {}

  // helper para pausar entre llamadas
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  //procesar cada carta magic
  async procesarCardMagic(cards: ScryfallCardResponse, lg: IenumURLLang): Promise<void> {
    try {
      // 1. guardar en BD todas las versiones (fetchAndCreateCards)
      const versions: MappedMagicCard[] = [];
      
      // Guardar la carta original
      //TODO:CAMBIAR A card
      const originalCard = await this.createMagicCards(cards);
      versions.push(originalCard);
      //TODO: REVISAR
      // Verificación de seguridad: si la carta no está en inglés, buscarla 
      if (originalCard.lang?.toLowerCase() !== 'en') {
        this.logger.warn(`⚠️ Carta no está en inglés: ${originalCard.name}`);
        //TODO: revisar paginacion
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
        const baseReq = await this.jumpsellerMapperService.mapDBProductToJumpseller(enCard);
        const baseRes = await this.jumpsellerService.createJumpsellerProducts(baseReq);
        enCard.idJumpSeller = baseRes.product?.id;
        await this.updateByStatus(enCard.id, { idJumpSeller: enCard.idJumpSeller });
      }
      await this.delay(300);

      // 4. crear variantes para idiomas != 'en'
      this.logger.log(`👽 Creando variantes para idiomas diferentes a 'en'`);
      // construir array de todos los idiomas
      const langs = versions
        .map(version => {
          const code = version.lang! as EnumLanguage;
          const key = Object.entries(EnumLanguage).find(([, val]) => val === code)?.[0];
          const name = key
            ? key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')
            : version.lang!;
          return { code, name };
        });
      // generar todas las variantes de una vez
      const variantReqs = await this.jumpsellerMapperService.mapVariantsToJumpseller(enCard, langs);
      for (const { variant, finish, condition } of variantReqs) {
        if (enCard.idJumpSeller ) {
          const varRes = await this.jumpsellerService.createJumpsellerVariant(
            enCard.idJumpSeller,
            {variant}
          );
          // TODO: await this.updateByStatus(id de variante, { idJumpSeller: enCard.idJumpSeller });
          await this.delay(300);
          
          //verificar si esta variante ya existe en el stageProductVariantModel antes de agregarla
          const cardWithStock : IStagingProductVariant = await this.stagingProductVariantModel.findOne({
            variantId: varRes.variant.id,
            productId: enCard.idJumpSeller,
            sku: varRes.variant.sku
          });
          
          if (!cardWithStock) {
            //solo agregar al stock si no existe
            this.logger.log(`Agregando nueva variante al stock: ${varRes.variant.id}`);

            const saveStagingVariant =  mappedStaggingProductVariant(enCard, varRes, condition, finish)
            await this.stagingProductVariantModel.create( 
              saveStagingVariant
            );

          //job de calculo de precios 
          await this.processService.updateApiPricesQueue({ productId: enCard.idJumpSeller, variantId: varRes.variant.id })
          
        } else {
            this.logger.log(`La variante ${varRes.variant.id} ya existe en el stock, omitiendo duplicado`);
          }
          await this.delay(300);
        }
      }


      // 6. insertar imágenes
      if (enCard.idJumpSeller) {
        // Subir imagen principal solo si existe
        const imgReq = await this.jumpsellerMapperService.mapImageToJumpseller(enCard);
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
          const mappedCardFace1Image = await this.jumpsellerMapperService.mapCardFace1ImageToJumpseller(enCard);
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
          const mappedCardFace2Image = await this.jumpsellerMapperService.mapCardFace2ImageToJumpseller(enCard);
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

      // 7. enviar custom fields
      if (enCard.idJumpSeller) {
        const customFields = await this.getAllCustomFields();
        const mappedCFields = await this.customFieldsMapperService.mappedCustomFields(enCard, customFields)

        for (const customField of mappedCFields) {
          try {
            await this.jumpsellerService.addAnExistingCustomFieldToAProduct(
              enCard.idJumpSeller,
              customField
            );
            await this.delay(300);
            this.logger.log(`✅ Custom field ${customField.field.id} agregado a la carta ${enCard.name}`);
          } catch (error) {
            this.logger.error(`❌ Error al agregar custom field: ${error.message}`);
          }
        }
        
      }
      await this.delay(300);
      // 8. completar flujo
      await this.updateByStatus(enCard.id, { status: 'completed' });
      this.logger.log(`✅ Proceso completo para carta ${enCard.oracleId}`);
    } catch (error) {
      this.logger.error(error);
    }
  }

  //buscar actualizar o crear magic card
  async createMagicCards(cards: ScryfallCardResponse): Promise<MappedMagicCard> {
    //TODO: pasar cards a card
    const mappedCardData: MappedMagicCard = mapCardData(cards);
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
  async findByCollectorNumberAndLang( form: findByCollectorNumberAndLangDto, _id: string ) : Promise<{ oracleId: string; message: string } | ScryfallCardResponse[]> {
    try {
      //revisar si ya existe una copia exacta de la carta que se quiere crear en bd
      const existingCardByColNumberAndLang = await this.model.findOne({ collectorNumber: form.collectorNumber, lang: form.lenguaje, _id: new Types.ObjectId(_id)}).exec();
      if (existingCardByColNumberAndLang) {
        return { 
          oracleId: existingCardByColNumberAndLang.oracleId, 
          message: `La carta con collectorNumber ${existingCardByColNumberAndLang.collectorNumber} y lenguaje ${existingCardByColNumberAndLang.lang} ya existe en la base de datos` };
        }
        
        //consultar solo por id para tomar el oracleId en caso de que sea distinta
        const existingCard = await this.model.findOne({ _id: new Types.ObjectId(_id)  }).exec();
        if (!existingCard) {
          throw new NotFoundException(`No se encontró la carta con id: ${_id}`);
        }
        //busco por el oracleId de la carta que ya existe en base de datos
    
        const scryfallResponse = await this.scryfallService.getScryfallCardByOracleIdAndLang(
          //consulto con lo que me trajo la busqueda por id porque necesito el oracleId
          existingCard.oracleId,
          form.lenguaje,
          form.collectorNumber
        );
      
        if (!scryfallResponse || !scryfallResponse.data || scryfallResponse.data.length === 0) {
          throw new NotFoundException(`No se encontraron cartas para oracleId: ${existingCard.oracleId} y lang: ${form.lenguaje}`);
        }
        
        this.logger.log(`Se trajeron ${scryfallResponse.data.length} cartas ${scryfallResponse.data.length < 10? "😎": "💀"} de scryfall`);
        if (scryfallResponse.data.length == 0) {
          throw new NotFoundException(`No existe la carta para oracleId: ${existingCard.oracleId}, lang: ${form.lenguaje} y collectorNumber: ${form.collectorNumber}`);
        }
        return scryfallResponse.data;

        
    } catch (error) {
      this.logger.error(`Error al buscar carta: ${error.message}`);
      throw new InternalServerErrorException(`Error al buscar carta: ${error.message}`);
    }
  }

  async createNewMagicCardAndVariantToJumpseller(cards: ScryfallCardResponse, condition: EnumCondition ): Promise<MappedMagicCard> {
    const mappedCardData: MappedMagicCard = mapCardData(cards);
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
    //enviar carta a jumpseller como variante de la carta original
    const baseCard = await this.model.findOne({ oracleId: mappedCardData.oracleId });

    if (baseCard && baseCard.idJumpSeller) {
      const variantReq = await this.jumpsellerMapperService.mapVariantFromNewCardToJumpseller(
        baseCard,
        [
          { code: mappedCardData.lang as EnumLanguage, name: await this.jumpsellerMapperService.translatedLanguages(mappedCardData.lang) },
        ],
        condition
      );
      const varRes = await this.jumpsellerService.createJumpsellerVariant(
        baseCard.idJumpSeller,
        { variant: variantReq[0].variant }
      );
      await this.delay(300);
      //verificar si esta variante ya existe en el stageProductVariantModel antes de agregarla
      const cardWithStock : IStagingProductVariant = await this.stagingProductVariantModel.findOne({
        productId: baseCard.idJumpSeller,
        sku: varRes.variant.sku
      });
      
      if (!cardWithStock) {
        this.logger.log(`Agregando nueva variante al stock: ${varRes.variant.id}`);
        await this.stagingProductVariantModel.create(
          {
            productId: baseCard.idJumpSeller,
            variantId: varRes.variant.id,
            name: baseCard.name || "",
            anotherLangName: baseCard.printedName || "",
            sku: varRes.variant.sku,
            finish: "",
            rarity: baseCard.rarity || "",
            condition: condition || "",
            game: EnumGame.MAGIC,
            imageUrl: {
              large: baseCard.imageUris?.large || null,
              cardFacelarge1: baseCard.cardFaces?.[0]?.imageUris?.large || null,
              cardFacelarge2: baseCard.cardFaces?.[1]?.imageUris?.large || null,
              small: baseCard.imageUris?.small || null,
              cardFaceSmall1: baseCard.cardFaces?.[0]?.imageUris?.small || null,
              cardFaceSmall2: baseCard.cardFaces?.[1]?.imageUris?.small || null,
            },
            fatherProduct: {
              oracleId: baseCard.oracleId,
              description: baseCard.oracleText || "",
              setName: baseCard.setName || "",
              setId: baseCard.setId || "",
              set: baseCard.set || "",
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
        const response = await this.jumpsellerService.getAllJumpsellerCustomFields();
        return response.custom_fields;
      }catch (error) {
        this.logger.error('Error trayendo los custom fields', error);
        throw error;
      }
    }

}
