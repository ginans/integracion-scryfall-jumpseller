import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ScryfallService } from '../scryfall/scryfall.service';
import { IenumURLLang } from '../scryfall/enums/lang.enum';
import { ScryfallCard, ScryfallCardResponse } from '../scryfall/interfaces/scryfall.interface';
import { CreateProductCardDto } from './dto/create-product-card.dto';
import { ProductCard, productCardDocument } from './entities/product-card.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MappedProductCard } from './interfaces/mapped-product-card.interface';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/sortOrder.enum';

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
            lang: card.lang || '',
            uri: card.uri || '',
            layout: card.layout || '',
            imageUris: card.image_uris ? {
                large: card.image_uris.large || '',
                small: card.image_uris.small || ''
            } : undefined,  // Si no hay imagen, lo dejamos como undefined
            typeLine: card.type_line || '',
            printedTypeLine: card.printed_type_line || '',
            cmc: card.cmc || 0,
            manaCost: card.mana_cost || '',
            colors: card.colors || [],
            colorIdentity: card.color_identity || [],
            keywords: card.keywords || [],
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
                } : undefined,  // Si no hay imagen, lo dejamos como undefined
            })),
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
            sku: `M-${card.set?.toUpperCase() || ''}${card.collector_number || ''}-${card.lang?.toUpperCase() || ''}`,
        };
    }

    async fetchAndCreateCards(createProductCardDto: CreateProductCardDto) {
        const onPageFetched = async (cards: ScryfallCardResponse[]) => {
            // Mapeo y guardado de los datos de la página actual
            const mappedCardData: MappedProductCard[] = cards.map(this.mapCardData);
            await this.productCardModel.insertMany(mappedCardData);  // Guardar los datos
        };
    
        // Obtener cartas de Scryfall
        const cardsInSpanish = await this.scryfallService.getScryfallCards(IenumURLLang.ES, onPageFetched);
        this.logger.log(`✅ Cartas en español obtenidas: ${cardsInSpanish.length}`);
    
        const cardsInEnglish = await this.scryfallService.getScryfallCards(IenumURLLang.EN, onPageFetched);
        this.logger.log(`✅ Cartas en inglés obtenidas: ${cardsInEnglish.length}`);
    
        this.logger.log("Todos los datos han sido guardados.");
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

    // findOne(id: number) {
    //     return `This action returns a #${id} productCard`;
    // }

    // update(id: number, updateProductCardDto: UpdateProductCardDto) {
    //     return `This action updates a #${id} productCard`;
    // }

}
