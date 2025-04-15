import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { ScryfallCard, ScryfallCardResponse } from './scryfall/interfaces/scryfall.interface';
import { MagicCard, magicCardDocument, magicCardDocument as MagicCardEntity } from './entities/magic-card.entity';
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
import { CreateCustomFieldResponse } from 'src/jumpseller/interfaces/jumpselllerCustomFields/createCustomFieldResponse.interface';
import { ScryfallService } from './scryfall/scryfall.service';
import { UpdateCustomFieldRequest } from 'src/jumpseller/interfaces/jumpselllerCustomFields/updateCustomFieldRequest.interface';
import { CreateMagicCardDto } from './dto/create-magic-card.dto';

@Injectable()
export class MagicCardsService {
  private readonly logger = new Logger(MagicCardsService.name);

  constructor(

    private readonly jumpsellerService: JumpsellerService,
    private readonly productsService: ProductsService,
    @InjectModel(MagicCard.name)
    private readonly model: Model<MagicCardEntity>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly scryfallService: ScryfallService,
  ) { }


  //procesar  cada carta magic
  async procesarCardMagic(cards: ScryfallCardResponse): Promise<void> {
    try {
      //crear o actualizar cartas magic
      const req = await this.fetchAndCreateCards(cards);
      // Si no tiene ID crear nuevo producto
      if (!req?.idJumpSeller) {
        const requestJumpseller = this.mappedDBProductToJumpseller(req);
        const response = await this.jumpsellerService.createJumpsellerProducts(requestJumpseller);
        if (response?.product?.id) {
          req.idJumpSeller = response.product.id;
          await this.updateByStatus(req.id, { idJumpSeller: req.idJumpSeller });
          await this.productsService.createOrUpdateProduct({ oracleId: req.oracleId, ...response.product });
          //crear version de español
          let versionES = await this.scryfallService.getScryfallCards(IenumURLLang.ES, 1, req.oracleId);
          if (versionES?.data?.length) {
            //grabar version españo
            const producversion = await this.fetchAndCreateCards(versionES.data[0]);
            await this.updateByStatus(producversion.id, { idJumpSeller: req.idJumpSeller });
            // const mapperCardES = this.mappedDBProductToJumpseller(cardES);
            // const productEs = await this.jumpsellerService.createJumpsellerProducts(mapperCardES);
          }
        }
      }
      // Actualizar el producto existente
      if (req?.idJumpSeller) {
        const mappedUpdateToJumpseller = this.mappedDBUpdateProductToJumpseller(req);
        await this.jumpsellerService.updateJumpsellerProduct(req.idJumpSeller, mappedUpdateToJumpseller);
        this.logger.log(`✅ Producto actualizado en Jumpseller con ID: ${req.idJumpSeller}`);
        // Crear variantes según el idioma
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
        if (req.cardFaces && req.cardFaces.length >= 2 && req.cardFaces[0].imageUris && req.cardFaces[1].imageUris) {
          const mappedCardFace2Image = this.mappedCardFace2ImageToJumpseller(req);
          await this.jumpsellerService.insertJumpsellerImages(req.idJumpSeller, mappedCardFace2Image);
          const mappedCardFace1Image = this.mappedCardFace1ImageToJumpseller(req);
          await this.jumpsellerService.insertJumpsellerImages(req.idJumpSeller, mappedCardFace1Image);
        }
        //buscar variable de espapañol para actualizar
        if (req?.oracleId) {
          const versionES = await this.scryfallService.getScryfallCards(IenumURLLang.ES, 1, req.oracleId);
          if (versionES?.data?.length) {
            const reqES: MappedMagicCard = this.mapCardData(versionES.data[0]);
            this.logger.log(`✅ Se comienza a crear variantes en Jumpseller en Español`);
            const mappedESFVariants = this.mappedESFVariantsToJumpseller(reqES);
            this.logger.log(`mappedESFVariantsToJumpseller: ${JSON.stringify(mappedESFVariants)}`);
            await this.jumpsellerService.createJumpsellerVariants(req.idJumpSeller, mappedESFVariants);

            const mappedESFNVariants = this.mappedESFNVariantsToJumpseller(reqES);
            await this.jumpsellerService.createJumpsellerVariants(req.idJumpSeller, mappedESFNVariants);
            this.logger.log(`mappedESFNVariantsToJumpseller: ${JSON.stringify(mappedESFNVariants)}`);

            this.logger.log(`✅ Se comienza a crear imágenes en Español en Jumpseller`);
            const mappedImage = this.mappedImageToJumpseller(reqES);
            await this.jumpsellerService.insertJumpsellerImages(req.idJumpSeller, mappedImage);
            //verificar si tiene cardfaces y enviar
            if (req.cardFaces && req.cardFaces.length >= 2 && req.cardFaces[0].imageUris && req.cardFaces[1].imageUris) {
              const mappedCardFace2Image = this.mappedCardFace2ImageToJumpseller(req);
              await this.jumpsellerService.insertJumpsellerImages(req.idJumpSeller, mappedCardFace2Image);
              const mappedCardFace1Image = this.mappedCardFace1ImageToJumpseller(req);
              await this.jumpsellerService.insertJumpsellerImages(req.idJumpSeller, mappedCardFace1Image);
            }
            this.logger.log(`mappedImageToJumpseller: ${JSON.stringify(mappedImage)}`);
          }
          
          // Procesar los campos personalizados para el producto
          this.logger.log(`✅ Se comienza a procesar campos personalizados para el producto`);
          await this.getAndUpdateCustomFields(req);
          
          // Guardar la respuesta completa de Jumpseller en products
          this.logger.log(`✅ Se comienza a guardar la respuesta completa de Jumpseller en products`);
          const fullResponse = await this.jumpsellerService.getAllJumpsellerProducts(req.idJumpSeller);
          const product = fullResponse.product;
          const checkProduct = await this.productsService.createOrUpdateProduct({ oracleId: req.oracleId, ...product });
          this.logger.log(`✅ Estado actualizado para el producto a 'completed'`);
          await this.updateByStatus(req.id, { status: 'completed' });
        }
      }
    } catch (error) {
      this.logger.error(error)
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  
  //mapeo de cartas completas de la db magic a jumpseller
  private mappedDBProductToJumpseller(card: MappedMagicCard): JumpsellerProductRequest {
    const isfoil = (card.foil === true);
    const cardFacesColors = card.cardFaces?.map((face) => face.colors).flat() || [];
    const cardFaceOracleText = card.oracleText || card.cardFaces?.map((face) => face.oracleText).join('. ') || '';
    let product = {
      name: card.name || '',
      description: `
        Nombre en Ingles: ${card.name}. 
        Nombre en español: ${card.printedName? card.printedName : ''}.
        Tipo: ${card.typeLine}.
        Texto: ${card.oracleText || cardFaceOracleText}.
        Edición: ${card.setName}.
        Color: ${card.colors?.join(', ') || cardFacesColors }.
        Rareza: ${card.rarity}.
        Artista: ${card.artist}.
        Habilidades: ${card.keywords?.join(', ') || ''}.
        Legal en: ${Object.entries(card.legalities || {})
          .filter(([_, value]) => value === 'legal')
          .map(([format]) => format)
          .join(', ') || 'No legal'}.
        `,
      price: parseFloat(isfoil ? card.prices?.usdFoil || '0.00' : card.prices?.usd || '0.00'),
      //numeros siempre con 4 digitos
      sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber ? 
        (card.collectorNumber.length <= 4 ? card.collectorNumber.padStart(4, '0') : card.collectorNumber) : ''}`,
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
    const cardFacesColors = card.cardFaces?.map((face) => face.colors).flat() || [];
    // // Precios mínimos por rareza:
    // const basePricesBy = {
    //   "comunC-NF": 200,
    //   "comunC-F": 400,
    //   "uncommonU-NF": 300,
    //   "uncommonU-F": 500,
    //   "rareR-NF": 500,
    //   "rareR-F": 1000,
    //   "mythicM-NF": 1000,
    //   "mythicM-F": 2000
    // };
    
    let productDetails = {
      name: card.name || '',
      description: `
        Nombre en Ingles: ${card.name}. 
        Nombre en español: ${card.printedName? card.printedName : ''}.
        Tipo: ${card.typeLine}.
        Texto: ${card.oracleText}.
        Edición: ${card.setName}.
        Color: ${card.colors?.join(', ') || cardFacesColors}.
        Rareza: ${card.rarity}.
        Artista: ${card.artist}.
        Habilidades: ${card.keywords?.join(', ') || ''}.
        Legal en: ${Object.entries(card.legalities || {})
          .filter(([_, value]) => value === 'legal')
          .map(([format]) => format)
          .join(', ') || 'No legal'}.
        `,
      price: parseFloat(isfoil ? card.prices?.usdFoil || '0.00' : card.prices?.usd || '0.00'),
      sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber ? 
        (card.collectorNumber.length <= 4 ? card.collectorNumber.padStart(4, '0') : card.collectorNumber) : ''}`,
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
  //mapeo de imagenes en caso de cardfaces 1
  private mappedCardFace1ImageToJumpseller(card: MappedMagicCard): JumpsellerCreateImageRequest {
    let imageRequest: JumpsellerCreateImageRequest = {
      image: {
        url: card.cardFaces[0].imageUris.large || "",
        position: 0,
      }
    };
    return imageRequest;
  }
  //mapeo de imagenes en caso de cardfaces 1
  private mappedCardFace2ImageToJumpseller(card: MappedMagicCard): JumpsellerCreateImageRequest {
    let imageRequest: JumpsellerCreateImageRequest = {
      image: {
        url: card.cardFaces[1].imageUris.large || "",
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
            sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber ? 
              (card.collectorNumber.length <= 4 ? card.collectorNumber.padStart(4, '0') : card.collectorNumber) + '-EN-F' : ''}`,
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

      if (card.foil && card.lang === "es") {
        return {
          variant: {
            sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber ? 
              (card.collectorNumber.length <= 4 ? card.collectorNumber.padStart(4, '0') : card.collectorNumber) + '-ES-F' : ''}`,
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
            sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber ? 
              (card.collectorNumber.length <= 4 ? card.collectorNumber.padStart(4, '0') : card.collectorNumber) + '-EN-NF' : ''}`,
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

      if (card.nonfoil && card.lang === "es") {
        return {
          variant: {
            sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber ? 
              (card.collectorNumber.length <= 4 ? card.collectorNumber.padStart(4, '0') : card.collectorNumber) + '-ES-NF' : ''}`,
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
  //crear funcion que me traiga los custom field existentes, tome el id y se lo pase a la funcion de actualizacion se custom fields en jumpseller

  private async getAndUpdateCustomFields(card: MappedMagicCard): Promise<void> {
    try {
      // Obtener los custom fields existentes de Jumpseller
      const customFields = await this.jumpsellerService.getAllJumpsellerCustomFields();
      
      if (!customFields || !Array.isArray(customFields)) {
        this.logger.error('No se pudieron obtener los campos personalizados de Jumpseller');
        return;
      }

      // Definir los mapeos que vamos a procesar usando las funciones existentes
      const customFieldMappings = [
        { 
          label: "CMC", 
          requestFunction: this.mappedCMCcustomfield.bind(this),
        },
        { 
          label: "Tipo", 
          requestFunction: this.mappedTypeLineCustomField.bind(this),
        },
        { 
          label: "Color", 
          requestFunction: this.mappedColorCustomField.bind(this),
        },
        { 
          label: "Color Identity", 
          requestFunction: this.mappedColorIdentityCustomField.bind(this),
        },
        { 
          label: "Habilidades", 
          requestFunction: this.mappedKeywordsCustomField.bind(this),
        },
        { 
          label: "Legalidades", 
          requestFunction: this.mappedLegalitiesCustomField.bind(this),
        },
        { 
          label: "Game Changer", 
          requestFunction: this.mappedGameChangerCustomField.bind(this),
        },
        { 
          label: "Rareza", 
          requestFunction: this.mappedRarityCustomField.bind(this),
        },
        { 
          label: "Artista", 
          requestFunction: this.mappedArtistCustomField.bind(this),
        },
        // { 
        //   label: "Estado", 
        //   requestFunction: this.mappedStateCustomField.bind(this),
        // }
      ];

      // Procesar cada campo personalizado
      for (const mapping of customFieldMappings) {
        // Usar la función de mapeo existente para obtener la petición
        const updateRequest = mapping.requestFunction(card);
        const fieldValue = updateRequest.custom_field.values[0];
        
        // Buscar si el campo ya existe en Jumpseller
        const existingField = customFields.find(cf => 
          cf.custom_field?.label === mapping.label
        );

        if (existingField) {
          // El campo existe, verificar si el valor ya está en la lista
          const existingValues = existingField.custom_field.values || [];
          
          if (!existingValues.includes(fieldValue)) {
            // Actualizar con todos los valores existentes más el nuevo
            updateRequest.custom_field.values = [...existingValues, fieldValue];
            
            await this.jumpsellerService.updateJumpsellerCustomFields(
              existingField.custom_field.id, 
              updateRequest
            );
            this.logger.log(`Campo personalizado "${mapping.label}" actualizado con valor: ${fieldValue}`);
          }
          
          // Si el producto tiene ID, asociar el campo personalizado
          if (card.idJumpSeller) {
            const addFieldRequest: AddAnExistingCustomFieldToAProductRequest = {
              field: {
                id: existingField.custom_field.id,
                value: fieldValue,
                variants: []
              }
            };
            
            await this.jumpsellerService.addAnExistingCustomFieldToAProduct(
              card.idJumpSeller,
              addFieldRequest
            );
            this.logger.log(`Campo "${mapping.label}" asociado al producto ID: ${card.idJumpSeller}`);
          }
        } else {
          // El campo no existe, crearlo
          const createResponse = await this.jumpsellerService.createJumpsellerCustomFields({
            custom_field: updateRequest.custom_field
          });
          
          this.logger.log(`Campo personalizado "${mapping.label}" creado con valor: ${fieldValue}`);
          
          // Si se creó y el producto tiene ID, asociarlo
          if (createResponse?.custom_field?.id && card.idJumpSeller) {
            const addFieldRequest: AddAnExistingCustomFieldToAProductRequest = {
              field: {
                id: createResponse.custom_field.id,
                value: fieldValue,
                variants: []
              }
            };
            
            await this.jumpsellerService.addAnExistingCustomFieldToAProduct(
              card.idJumpSeller,
              addFieldRequest
            );
            this.logger.log(`Campo nuevo "${mapping.label}" asociado al producto ID: ${card.idJumpSeller}`);
          }
        }
      }
      
      this.logger.log(`✅ Campos personalizados procesados correctamente para: ${card.name}`);
    } catch (error) {
      this.logger.error(`❌ Error al procesar campos personalizados: ${error.message}`);
    }
  }

  //mapeo de custom fields de la db magic a jumpseller
  //cmc, type_line, color, color_identity, keywords, legalities (solo legales),  game_changer, rarity, artist
  //mapeo de custom field CMC
  //TODO: MAPEAR DATOS PREVIAMENTE A LA CREACION DE CUSTOMFIELDS Y ENTREGAR A LOS VALUES VALORES CONOCIDOS
  private mappedCMCcustomfield(card: MappedMagicCard): UpdateCustomFieldRequest {
    let updateCustomFieldRequest: UpdateCustomFieldRequest = {
      custom_field: {
        label: "CMC",
        type: "selection",
        values: [card.cmc.toString()],
        product_visibility: true,
      },
    };
    return updateCustomFieldRequest;
  }
  //mapeo de custom field type_line
  private mappedTypeLineCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
    let updateCustomFieldRequest: UpdateCustomFieldRequest = {
      custom_field: {
        label: "Tipo",
        type: "selection",
        values: [card.typeLine],
        product_visibility: true,
      },
    };
    return updateCustomFieldRequest;
  }
  //mapeo de custom field color
  private mappedColorCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
    let updateCustomFieldRequest: UpdateCustomFieldRequest = {
      custom_field: {
        label: "Color",
        type: "selection",
        values: [card.colors.join(', ')],
        product_visibility: true,
      },
    };
    return updateCustomFieldRequest;
  }
  //mapeo de custom field color_identity
  private mappedColorIdentityCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
    let updateCustomFieldRequest: UpdateCustomFieldRequest = {
      custom_field: {
        label: "Color Identity",
        type: "selection",
        values: [card.colorIdentity.join(', ')],
        product_visibility: true,
      },
    };
    return updateCustomFieldRequest;
  }
  //mapeo de custom field keywords
  private mappedKeywordsCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
    let updateCustomFieldRequest: UpdateCustomFieldRequest = {
      custom_field: {
        label: "Habilidades",
        type: "selection",
        values: [card.keywords.join(', ')], 
        product_visibility: true,
      },
    };
    return updateCustomFieldRequest;
  }
  //mapeo de custom field legalities
  private mappedLegalitiesCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
    let legalities = Object.entries(card.legalities || {})
      .filter(([_, value]) => value === 'legal')
      .map(([format]) => format)
      .join(', ');
    let updateCustomFieldRequest: UpdateCustomFieldRequest = {
      custom_field: {
        label: "Legalidades",
        type: "selection",
        values: [legalities],
        product_visibility: true,
      },
    };
    return updateCustomFieldRequest;
  }
  //mapeo de custom field game_changer
  private mappedGameChangerCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
    let updateCustomFieldRequest: UpdateCustomFieldRequest = {
      custom_field: {
        label: "Game Changer",
        type: "selection",
        values: [card.gameChanger ? "Si" : "No"],
        product_visibility: true,
      },
    };
    return updateCustomFieldRequest;
  }
  //mapeo de custom field rarity
  private mappedRarityCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
    let updateCustomFieldRequest: UpdateCustomFieldRequest = {
      custom_field: {
        label: "Rareza",
        type: "selection",
        values: [card.rarity],
        product_visibility: true,
      },
    };
    return updateCustomFieldRequest;
  }
  //mapeo de custom field artist
  private mappedArtistCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
    let updateCustomFieldRequest: UpdateCustomFieldRequest = {
      custom_field: {
        label: "Artista",
        type: "selection",
        values: [card.artist],
        product_visibility: true,
      },
    };
    return updateCustomFieldRequest;
  }

  //mapeo custom field por estado
  private mappedStateCustomField(card: MappedMagicCard): UpdateCustomFieldRequest {
    let updateCustomFieldRequest: UpdateCustomFieldRequest = {
      custom_field: {
        label: "Estado",
        type: "selection",
        values: ["NM"],
        product_visibility: true,
      },
    };
    return updateCustomFieldRequest;
  }

  //TODO: mapear por cada custom field y agregar posibles id de variantes
  private mappedAddCustomFieldsToJumpseller(card: MappedMagicCard): AddAnExistingCustomFieldToAProductRequest {
    let customfieldsRequest: AddAnExistingCustomFieldToAProductRequest = {
      field: {
        id: 0,
        value: "",
        variants: [], //Array de id de variantes
      }
    };
    return customfieldsRequest;
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
      games: card.games || [],
    };
  }
  //buscar actuzalizar o crear magic card
  async fetchAndCreateCards(cards: ScryfallCardResponse): Promise<MappedMagicCard> {
    // Mapeo de los datos por pagina
    let idJumpSeller = null
    const mappedCardData: MappedMagicCard = this.mapCardData(cards);
    // Verificar duplicados por ID y actualizar o insertar
    const existingCard = await this.model.findOne({ id: mappedCardData.id });
    if (existingCard) {
      idJumpSeller = existingCard?.idJumpSeller;
      this.logger.log(`actualizar id ${mappedCardData.id}`)
      const data = await this.model.updateOne({ id: mappedCardData.id });
      //idJumpSeller = data.idJumpSeller;
    } else {
      this.logger.log(`crear card magic ${mappedCardData.id}`)
      await this.model.create({...mappedCardData}); // Insertar si no existe
    }
    return {...mappedCardData , idJumpSeller};
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

      //que siempre lo que se ingrese quede en minusculas
      const lang = card.lenguaje.toLowerCase();
      const oracle_id = card.oracle_id.toLowerCase();
      
      this.logger.log(`Buscando carta con oracle_id: ${card.oracle_id} en idioma: ${lang}`);
      
      //llamar api y pasarle los parametros oracle_id y lang
      const scryfallResponse = await this.scryfallService.getScryfallCardByOracleIdAndLang(
        oracle_id,
        lang
      );
      
      //verificar en la api que sea el mismo oracle_id y lang
      const exactMatch = scryfallResponse.data.find(card => 
        card.oracle_id === card.oracle_id && 
        card.lang.toLowerCase() === lang
      );
      
      if (!exactMatch) {
        throw new NotFoundException(`No se encontró una coincidencia exacta para oracle_id: ${card.oracle_id} y lenguaje: ${lang}`);
      }
      
      // usar la carta que coincide exactamente
      const cardData = exactMatch;
      
      //mapear los datos de la carta
      const mappedCardData: MappedMagicCard = this.mapCardData(cardData);
      
      //verificar si la carta ya existe en la base de datos
      const existingCard = await this.model.findOne({ 
        oracleId: mappedCardData.oracleId,
        lang: mappedCardData.lang
      });
      
      if (existingCard) {
        this.logger.log(`La carta con ID ${mappedCardData.id} ya existe, actualizando`);

        //si la carta existe actualizarla
        await this.model.updateOne({ 
          oracleId: mappedCardData.oracleId,
        lang: mappedCardData.lang }, 
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
}
