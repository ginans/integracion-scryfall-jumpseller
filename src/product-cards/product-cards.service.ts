import { BadRequestException, Body, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ScryfallService } from '../scryfall/scryfall.service';
import { IenumURLLang } from '../scryfall/enums/lang.enum';
import { ScryfallCard, ScryfallCardResponse } from '../scryfall/interfaces/scryfall.interface';
import { CreateProductCardDto } from './dto/create-product-card.dto';
import { ProductCard, productCardDocument } from './entities/product-card.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MappedProductCard } from './interfaces/mapped-product-card.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/sortOrder.enum';
import { JumpsellerProductRequest } from './interfaces/jumpsellerProductRequest.interface';
import axios from 'axios';
import { GetJumpsellerProduct } from './interfaces/getJumpsellerProducts';

@Injectable()
export class ProductCardsService {
    private readonly logger = new Logger(ProductCardsService.name);

    constructor(
        private readonly scryfallService: ScryfallService,
        @InjectModel(ProductCard.name) 
        private productCardModel: Model<productCardDocument>
    ) {}

    private mapCardData(card: Partial<ScryfallCard>): MappedProductCard {
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
            } : { small: '', large: ''},  // Si no hay imagen, lo dejamos como ""
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
            } : {},  // Si legalities no existe, devolver un objeto vacío
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

    async fetchAndCreateCards(createProductCardDto: CreateProductCardDto) {
      const onPageFetched = async (cards: ScryfallCardResponse[]) => {
        // Mapeo de los datos por pagina
        const mappedCardData: MappedProductCard[] = cards.map(this.mapCardData);

        // Verificar duplicados por ID y actualizar o insertar
        for (const card of mappedCardData) {
          const existingCard = await this.productCardModel.findOne({ id: card.id });
          if (existingCard) {
        await this.productCardModel.updateOne({ id: card.id }, card); // Actualizar si existe
          } else {
        await this.productCardModel.create(card); // Insertar si no existe
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

      // Mapeo a JumpsellerProduct
      private jumpsellerProduct(card: Partial<MappedProductCard>): JumpsellerProductRequest[] {
        const products: JumpsellerProductRequest[] = [];
      
        // Crear producto para la variante foil si foil es true
        if (card.foil) {
            products.push({
            name: card.name || '',
            description: `${card.oracleText}. ${card.printedText ? card.printedText : ""}.  Costo de maná:${card.manaCost}, Costo de maná convertido:${card.cmc}, Finish: Foil` || '',
            price: parseFloat(card.prices?.usd || '0.00'), 
            sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber?.toUpperCase() || ''}-${card.lang?.toUpperCase() || ''}-F`,
            stock: 0,
            categories: card.setId ? [{ name: card.setName, id: 1 }] : [],
            });
        }
      
        // Crear producto para la variante nonfoil si nonfoil es true 
        if (card.nonfoil) {
          products.push({
            name: card.name || '',
            description: `${card.oracleText}. ${card.printedText ? card.printedText : ""}.  Costo de maná:${card.manaCost}, Costo de maná convertido:${card.cmc}, Finish: Non foil` || '',
            price: parseFloat(card.prices?.usd || '0.00'), 
            sku: `M-${card.set?.toUpperCase() || ''}${card.collectorNumber?.toUpperCase() || ''}-${card.lang?.toUpperCase() || ''}-NF`,
            stock: 0,
            categories: card.setId ? [{ name: card.setName, id: 1 }] : [],
          });
        }
      
        return products;
      }
      
      // Crear productos en Jumpseller usando datos de la base de datos y actualizar la base de datos con el ID de Jumpseller
      async createJumpsellerProducts(card: Partial<MappedProductCard>): Promise<JumpsellerProductRequest[]> { 
        const query = { limit: 10000000000000000000, page: 1, sortBy: 'sku', sortOrder: SortOrder.ASC };
        const { items: cards } = await this.findAllCards(query); 

        const jumpsellerApiUrl = 'https://api.jumpseller.com/v1/products.json';
        const login = '96562eb2a4eb81e37f9ac714b71923bf';
        const authtoken = 'a7597b834a8ba025e2b3f69570cf29c8';
        const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  

        const products = cards.flatMap(card => this.jumpsellerProduct(card));

        for (const product of products) {
          try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        this.logger.debug(`Cuerpo de la solicitud: ${JSON.stringify(product)}`);
      
        const { data }: { data: GetJumpsellerProduct } = await axios.post<ProductCard, { data: GetJumpsellerProduct }>(
          jumpsellerApiUrl, 
          { product }, 
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        // Sacar el id de jumpseller
        const jumpsellerData = data.product;
        const jumpsellerId = jumpsellerData.id;

        // Actualizar el jumpsellerId en la base de datos
        const mappedCardData: MappedProductCard[] = cards.map(this.mapCardData);
        
        for (const card of mappedCardData) {
          const existingCard = await this.productCardModel.findOne({ id: card.id });
          if (existingCard) {
        await this.productCardModel.updateOne({ id: card.id }, { jumpsellerId, status: "completed" }); // Actualizar si existe
        }

      } 
        this.logger.log(`✅ Jumpseller ID actualizado para el producto con ID: ${card.id}`); 

        this.logger.log(`✅ Base de datos actualizada con Jumpseller ID: ${jumpsellerId}`);
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
      
        return products;
      }
       
    async findAllCards(query: PaginationQueryDto) {
        const { limit, page, sortBy, sortOrder, to, from } = query;
           
            const sort: { [key: string]: 1 | -1 } = {
              [sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
            };
        
            const skip = (page - 1) * limit;
            const filters: { $or?: any[], $and?: any[] } = {};
             
            //implementar filtros de fecha a futuro

            //   if (from && to) {
            //     filters.$and = [
            //       {
            //         lastLogin: {
            //           $gte: new Date(`${from}T00:00:00.000Z`),
            //           $lte: new Date(`${to}T23:59:59.999Z`)
            //         }
            //       },
            //     ];
            //   }

              try {
                const [productCards, total] = await Promise.all([
                  this.productCardModel.find(filters).sort(sort).skip(skip).limit(limit).exec(),
                  this.productCardModel.countDocuments(filters).exec()
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

    async findOneCard(_id: string): Promise<ProductCard | null> {
      if (!Types.ObjectId.isValid(_id))
            throw new BadRequestException('Formato de ID inválido');
          const card = await this.productCardModel.findOne({ _id: new Types.ObjectId(_id) }).exec();
          if (!card) throw new NotFoundException('Card no encontrada');
          return card;
    }
    }

    // update(id: number, updateProductCardDto: UpdateProductCardDto) {
    //     return `This action updates a #${id} productCard`;
    // }


