import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { StockJumpsellerRequest } from 'src/modules/jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import { StagingProductVariant, StagingProductVariantDocument } from './entities/staging-product-variant.entity';
import { EnumPriceAndStockState } from './enums/price-and-stock-state.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { Product, ProductDocument } from '../entities/product.entity';
import { IStagingProductVariant } from './interfaces/stagingProductVariant.interface';
import { JumpsellerUpdateVariantRequest } from 'src/modules/jumpseller/interfaces/jumpsellerVariants/jumpsellerUpdateVariantRequest.interface';
import { UsdPrice } from 'src/modules/prices/usd-prices/entities/usd-price.entity';
import { MagicCard } from 'src/modules/magic/entities/magic-card.entity';
import { BasePrice } from 'src/modules/prices/base-prices/entities/base-price.entity';
import { EnumGame, EnumGamePrefix } from 'src/common/enums/game.enum';
import { CreateStockDto } from './dto/stock/create-stock.dto';
import { CreatePricesDto } from './dto/prices/create-prices.dto';

@Injectable()
export class StagingProductVariantService {
  constructor(
    @InjectModel(StagingProductVariant.name) private stagingProductVariantModel: Model<StagingProductVariantDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(MagicCard.name) private magicCardModel: Model<MagicCard>,
    @InjectModel(UsdPrice.name) private usdPriceModel: Model<UsdPrice>,
    @InjectModel(BasePrice.name) private basePriceModel: Model<BasePrice>,
    private readonly jumpsellerService: JumpsellerService,
    private readonly logger: LoggerService
  ) {}

  async findAllVariants(query: PaginationQueryDto) {
    const { 
      limit, 
      page, 
      sortBy, 
      sortOrder, 
      to, 
      from, 
      search, 
      jumpsellerStatus, 
      priceUpdateStatus, 
      stockUpdateStatus,
      set,
      setName
    } = query;

    const sort: { [key: string]: 1 | -1 } = {
      [sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
    };

    const skip = (page - 1) * limit;
    const filters: any = {};

    // Aplicar filtros de búsqueda si existe el parámetro search
    if (search && search.length > 0) {
      const searchValue = search.trim();
      filters.$or = [
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$sku" },
              regex: searchValue,
              options: "i"
            }
          }
        },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$name" },
              regex: searchValue,
              options: "i"
            }
          }
        },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$priceUpdateStatus" },
              regex: searchValue,
              options: "i"
            }
          }
        },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$stockUpdateStatus" },
              regex: searchValue,
              options: "i"
            }
          }
        },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$jumpsellerStatus" },
              regex: searchValue,
              options: "i"
            }
          }
        },
        {
        $expr: {
          $regexMatch: {
            input: { $toString: "$fatherProduct.set" },
            regex: searchValue,
            options: "i"
          }
        }
      },
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$fatherProduct.setName" },
            regex: searchValue,
            options: "i"
          }
        }
      }
        ];
      }

    // Aplicar filtros de rango de fechas
    if (from && to) {
      filters.createdAt = {
        $gte: new Date(`${from}T00:00:00.000Z`),
        $lte: new Date(`${to}T23:59:59.999Z`)
      };
    }

    // Aplicar filtros de estado
    if (priceUpdateStatus) {
      filters.priceUpdateStatus = { $regex: `^${priceUpdateStatus}$`, $options: "i" };
    }

    if (stockUpdateStatus) {
      filters.stockUpdateStatus = { $regex: `^${stockUpdateStatus}$`, $options: "i" };
    }

    if (jumpsellerStatus) {
      filters.jumpsellerStatus = { $regex: `^${jumpsellerStatus}$`, $options: "i" };
    }
    
    if (set) {
      filters['fatherProduct.set'] = { $regex: `^${set}$`, $options: 'i' };
    }

    if (setName) {
      filters['fatherProduct.setName'] = { $regex: `^${setName}$`, $options: 'i' };
    }

    try {
      const [variants, total] = await Promise.all([
        this.stagingProductVariantModel.find(filters).sort(sort).skip(skip).limit(limit).exec(),
        this.stagingProductVariantModel.countDocuments(filters).exec()
      ]);

      return {
        items: variants,
        meta: {
          totalItems: total,
          itemsPerPage: variants.length,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          hasNextPage: total > (page * limit),
          hasPreviousPage: page > 1,
        }
      }
    } catch (error) {
      this.logger.error(`Error al buscar variantes: ${error.message}`);
      throw new InternalServerErrorException(`Error trayendo variantes: ${error.message}`);
    }
  }


  async findAllVariantsWithoutPagination() {
    try {
      const variants = await this.stagingProductVariantModel.find({}).exec();
      return variants;
    } catch (error) {
      this.logger.error(`Error al buscar variantes: ${error.message}`);
      throw new InternalServerErrorException(`Error trayendo variantes: ${error.message}`);
    }
  }

  // Manejo de stock
  async saveStockFromFront(variant: CreateStockDto) {
    try{
      const existingVariant = await this.stagingProductVariantModel.findOne({
        variantId: variant.variantId,
        productId: variant.productId,
      });
  
      if (!existingVariant) {
        throw new Error(`Variant with variantId: ${variant.variantId} and productId: ${variant.productId} not found.`);
      }
      const nullErrorMsg = null
      await this.stagingProductVariantModel.updateOne(
        {
          variantId: variant.variantId,
          productId: variant.productId,
        },
        {
          $set: {
            variantStock: parseInt(existingVariant.variantStock?.toString()) + parseInt(variant.variantStock?.toString()),
            locationId: variant.locationId,
            stockUnlimited: variant.stockUnlimited,
            stockUpdateStatus: EnumPriceAndStockState.PENDING,
            stockUpdateError: nullErrorMsg,
          }
        }
      );
    }catch(error){
      this.logger.error(`Error al guardar stock desde el front: ${error.message}`);

      this.updateVariantStockStatus(
        variant.variantId,
        variant.productId,
        EnumPriceAndStockState.ERROR,
        error.message
      );

      throw new InternalServerErrorException(`Error al guardar stock desde el front: ${error.message}`);
    }
  }

  async sendStockToJumpseller(variant: CreateStockDto) {
    try {
      const productVariant = await this.stagingProductVariantModel.findOne({
        productId: variant.productId,
        variantId: variant.variantId,
      });

      if (!productVariant) {
        const errorMsg = `No se encontró el producto con productId: ${variant.productId} y variantId: ${variant.variantId}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      const stockRequest: StockJumpsellerRequest = {
        stock: productVariant.variantStock,
        product_id: productVariant.productId,
        variant_id: productVariant.variantId,
        location_id: productVariant.locationId,
        stock_unlimited: productVariant.stockUnlimited,
      };

      const nullErrorMsg= null
      await this.updateVariantStockStatus(
        variant.variantId,
        variant.productId,
        EnumPriceAndStockState.IN_PROGRESS,
        nullErrorMsg
      );
      
      this.logger.log(`🦍 Enviando stock a Jumpseller: ${JSON.stringify(stockRequest)}`);
      const response = await this.jumpsellerService.addStocktoJumpseller(stockRequest);

      if (response.status !== 201 && response.message) {      
        await this.updateVariantStockStatus(
          variant.variantId,
          variant.productId,
          EnumPriceAndStockState.COMPLETED,
          nullErrorMsg
        );
        this.logger.log(`Se actualizó el stock de la variante ${variant.variantId} en Jumpseller`);

      
          const jumpsellerProduct = await this.jumpsellerService.getJumpsellerProductById(productVariant.productId);

          await this.productModel.updateOne(
            { id: jumpsellerProduct.product.id },
            { ...jumpsellerProduct }
          );
          this.logger.log(`😎 Se actualizó el producto ${jumpsellerProduct.product.id} en la coleccion products`);
      
        return response;
        }else {
          const errorMsg = `Status ${response.status} - ${response?.message || 'Sin detalles'}`;
          this.logger.error(errorMsg);
          await this.updateVariantStockStatus(
            variant.variantId,
            variant.productId,
            EnumPriceAndStockState.ERROR,
            errorMsg
          );
          throw new Error(`Error al enviar stock a Jumpseller: ${response.message}`);
        }
    } catch (error) {
      const errorMsg = `Status ${error?.status || 'desconocido'} - ${error?.message || 'Sin detalles'}`;
        this.logger.error(errorMsg);
        await this.updateVariantStockStatus(
          variant.variantId,
          variant.productId,
          EnumPriceAndStockState.ERROR,
          errorMsg
        );
        this.logger.error(`Error al enviar stock a Jumpseller: ${error.message}`);
        throw new Error(`Error al enviar stock a Jumpseller: ${error.message}`);
      }
    }


  private async updateVariantStockStatus(
    variantId: number,
    productId: number,
    status: EnumPriceAndStockState,
    errorMsg: string = null
  ) {
    await this.stagingProductVariantModel.updateOne(
      { variantId, productId },
      {
        $set: {
          stockUpdateStatus: status,
          stockUpdateError: errorMsg,
        }
      }
    );
  }
// QUE RECIBA VARIANTID Y PRODUCTID
  // Manejo de precios
  async calculatePricesForAllCards(variantId?: number, productId?: number, game?: EnumGame, type?: string) {
    try {
      let variantes: IStagingProductVariant[] = [];
      
      // Buscar variantes según los parámetros recibidos
      if (variantId && productId) {
        const variante = await this.stagingProductVariantModel.findOne({
          isPriceUpdateable: true,
          variantId: variantId,
          productId: productId,
        }).exec();
        // lo meto igual en un array para poder procesar todas las variantes de la misma forma
        if (variante) variantes = [variante]; 
      } else if (game && type) {
        variantes = await this.stagingProductVariantModel.find({
          isPriceUpdateable: true,
          game: game,
          rarity: type
        }).exec();
      } else if (game && !type) {
        variantes = await this.stagingProductVariantModel.find({
          isPriceUpdateable: true,
          game: game
        }).exec();
      } else {
        this.logger.error(`
          ❌ No se encontraron variantes con ${variantId ? "variantId: " + variantId : "game: " + game} 
          y ${productId ? "productId: " + productId : "rareza: " + type || ""}`);
        return null;
      }

      if (variantes.length === 0) {
        this.logger.warn('No se encontraron variantes para procesar');
        return null;
      }else{
        this.logger.log(`Se encontraron ${variantes.length} variantes para procesar`);
      }

      // Obtener el precio del dólar
      const usdPriceDoc = await this.usdPriceModel.findOne({ gameID: EnumGamePrefix.MAGIC });
      if (!usdPriceDoc || !usdPriceDoc.usdPrice) {
        throw new Error("No se encontraron valores del dolar para la colección Magic");
      }
      const usdPrice = usdPriceDoc.usdPrice;
      this.logger.log(`Precio del dólar: ${usdPrice} CLP`);
      
      // Obtener precios base por rareza
      const basePrice = await this.basePriceModel.findOne({ game: EnumGame.MAGIC });
      if (!basePrice) {
        throw new Error("No se encontraron precios base para Magic");
      }

      const rarityPrices = {};
      basePrice.basePrices.forEach(item => {
        rarityPrices[item.label] = item.price;
      });

      // Procesar cada variante individualmente
      for (const variante of variantes) {
        try {
          // Buscar la carta correspondiente
          const matchingCard = await this.magicCardModel.findOne({ idJumpSeller: variante.productId });

          if (!matchingCard) {
            this.logger.warn(`No se encontró carta para productId: ${variante.productId}`);
            await this.stagingProductVariantModel.updateOne(
              { productId: variante.productId, variantId: variante.variantId },
              {
                $set: {
                  priceUpdateError: 'Carta base no encontrada en colección Magic',
                  priceUpdateStatus: EnumPriceAndStockState.ERROR
                }
              }
            );
            continue; // Pasar a la siguiente variante
          }

          // Determinar precio USD según el finish
          let precioUSD = 0;
          const isFoil = variante.finish?.toLowerCase() === "foil";
          const isNonFoil = variante.finish?.toLowerCase() === 'nonfoil';

          if (matchingCard.prices) {
            if (isNonFoil && matchingCard.prices.usd) {
              precioUSD = parseFloat(matchingCard.prices.usd);
              this.logger.log(`Precio No Foil encontrado para ${variante.sku}: $${precioUSD} USD`);
            } else if (isFoil && matchingCard.prices.usdFoil) {
              precioUSD = parseFloat(matchingCard.prices.usdFoil);
              this.logger.log(`Precio Foil encontrado para ${variante.sku}: $${precioUSD} USD`);
            } else if (matchingCard.prices.usdEtched) {
              precioUSD = parseFloat(matchingCard.prices.usdEtched);
              this.logger.log(`Precio Etched encontrado para ${variante.sku}: $${precioUSD} USD`);
            } else {
              this.logger.warn(`No se encontraron precios para la carta ${matchingCard.oracleId} con finish ${variante.finish}`);
            }
          } else {
            this.logger.warn(`No hay información de precios para la carta ${matchingCard.oracleId}`);
          }

          // Determinar la clave de rareza
          let rarezaKey = '';
          const rareza = variante.rarity?.toLowerCase();

          switch (rareza) {
            case 'common':
              rarezaKey = 'commonC';
              break;
            case 'uncommon':
              rarezaKey = 'uncommonU';
              break;
            case 'rare':
              rarezaKey = 'rareR';
              break;
            case 'mythic':
              rarezaKey = 'mythicM';
              break;
            default:
              rarezaKey = 'commonC';
          }

          if (isFoil) {
            rarezaKey += '-Foil';
          }

          const precioBaseRareza = rarityPrices[rarezaKey] || 0;
          this.logger.log(`Precio base por rareza (${rarezaKey}): ${precioBaseRareza} CLP para ${variante.sku}`);

          // Calcular precio final en CLP
          let precioCLP = (precioUSD === 0 || precioUSD === null) ? 0 : precioUSD * usdPrice;
          precioCLP = Math.ceil(precioCLP / 100) * 100; // Redondear al múltiplo de 100 más cercano
          const precioFinal = (precioCLP === 0) ? 0 : Math.max(precioCLP, precioBaseRareza);

          // Actualizar precio solo si es mayor a cero
          if (precioFinal > 0) {
            this.logger.log(`Actualizando precio para variante ${variante.variantId} (${variante.sku}): ${precioFinal} CLP`);
            
            const nullErrorMsg = null;
            
            // Actualizar estado a PENDING
            await this.stagingProductVariantModel.updateOne(
              { variantId: variante.variantId, productId: variante.productId },
              {
                $set: {
                  variantPrice: precioFinal,
                  priceUpdateStatus: EnumPriceAndStockState.PENDING,
                  priceUpdateError: nullErrorMsg
                }
              }
            );
            
            // Actualizar estado a IN_PROGRESS
            await this.updateVariantPriceStatus(
              variante.variantId,
              variante.productId,
              EnumPriceAndStockState.IN_PROGRESS,
              nullErrorMsg
            );

            // Enviar a Jumpseller
            const variantTo: JumpsellerUpdateVariantRequest = {
              variant: {
                price: precioFinal,
                sku: variante.sku,
                stock: null,
                stock_unlimited: null,
              }
            };
            
            const response = await this.jumpsellerService.updateVariant(variante.productId, variante.variantId, variantTo);
            
            if (!('message' in response)) {
              await this.updateVariantPriceStatus(
                variante.variantId,
                variante.productId,
                EnumPriceAndStockState.COMPLETED,
                nullErrorMsg
              );
              this.logger.log(`Se actualizó el precio de la variante ${variante.variantId} en Jumpseller`);
              return `Se actualizo el precio de la variante ${response.variant.id}, con sku ${response.variant.sku} en Jumpseller`;

            } else {
              const errorMsg = `Status 400 - ${'message' in response ? response.message : 'Sin detalles'}`;
              this.logger.error(errorMsg);
              await this.updateVariantPriceStatus(
                variante.variantId,
                variante.productId,
                EnumPriceAndStockState.ERROR,
                errorMsg
              );
            }
          } else {
            this.logger.warn(`Precio calculado es <= 0, no se actualizará para variante ${variante.variantId} con sku ${variante.sku}`);
          }
          
        } catch (varianteError) {
          this.logger.error(`Error procesando variante ${variante.variantId}: ${varianteError.message}`);
          await this.stagingProductVariantModel.updateOne(
            { variantId: variante.variantId, productId: variante.productId },
            {
              $set: {
                priceUpdateError: varianteError.message,
                priceUpdateStatus: EnumPriceAndStockState.ERROR
              }
            }
          );
        }
      }
      
      // return variantes.length; // Retornar la cantidad de variantes procesadas
      
    } catch (error) {
      this.logger.error(`Error al calcular precios para todas las cartas: ${error.message}`);
      throw new InternalServerErrorException(`Error al calcular precios para todas las cartas: ${error.message}`);
    }
  }

  async savePricesFromFront(variant: CreatePricesDto) {
    try{

      const existingVariant = await this.stagingProductVariantModel.findOne({
        variantId: variant.variantId,
        productId: variant.productId,
      });
  
      if (!existingVariant) {
        throw new Error(`Variant with variantId: ${variant.variantId} and productId: ${variant.productId} not found.`);
      }
  
      const nullErrorMsg = null
      const updatedVariant = await this.stagingProductVariantModel.updateOne(
        { variantId: variant.variantId, productId: variant.productId },
        {
          $set: {
            variantPrice: variant.variantPrice,
            isPriceUpdateable: false,
            priceUpdateStatus: EnumPriceAndStockState.PENDING,
            priceUpdateError: nullErrorMsg,
          }
        }
      );
  
      if (updatedVariant.modifiedCount === 0) {
        throw new Error(`Failed to update variant with variantId: ${variant.variantId} and productId: ${variant.productId}.`);
      }
  
      return updatedVariant;
    }catch(error){
      this.logger.error(`Error al guardar precios desde el front: ${error.message}`);
      await this.updateVariantPriceStatus(
        variant.variantId,
        variant.productId,
        EnumPriceAndStockState.ERROR,
        error.message
      );
      throw new InternalServerErrorException(`Error al guardar precios desde el front: ${error.message}`);
    }
  }

  async sendPriceToJumpseller(variant: CreatePricesDto) {
    try {
      const productVariant = await this.stagingProductVariantModel.findOne({
        productId: variant.productId,
        variantId: variant.variantId,
      });

      if (!productVariant) {
        const errorMsg = `No se encontró el producto con productId: ${variant.productId} y variantId: ${variant.variantId}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      const nullErrorMsg= null
      await this.updateVariantPriceStatus(
        variant.variantId,
        variant.productId,
        EnumPriceAndStockState.IN_PROGRESS,
        nullErrorMsg
      );

      const variantTo: JumpsellerUpdateVariantRequest = {
        variant: {
          price: productVariant.variantPrice,
          sku: productVariant.sku,
          stock: null,
          stock_unlimited: null,
        }
      };

      const response = await this.jumpsellerService.updateVariant(productVariant.productId, productVariant.variantId, variantTo);

      if (!('message' in response)) {
        await this.updateVariantPriceStatus(
          variant.variantId,
          variant.productId,
          EnumPriceAndStockState.COMPLETED,
          nullErrorMsg
        );
        this.logger.log(`Se actualizó el precio de la variante ${variant.variantId} en Jumpseller`);

       
         const jumpsellerProduct = await this.jumpsellerService.getJumpsellerProductById(productVariant.productId);

         const updatedProduct = await this.productModel.updateOne(
            {
              id: jumpsellerProduct.product.id },
            { ...jumpsellerProduct }
          );
          this.logger.log(`😎 Se actualizó el producto ${jumpsellerProduct.product.id} en la coleccion products`);
          return updatedProduct;
      } else {
        const errorMsg = `Status 400 - ${response?.message || 'Sin detalles'}`;
        this.logger.error(errorMsg);
        await this.updateVariantPriceStatus(
          variant.variantId,
          variant.productId,
          EnumPriceAndStockState.ERROR,
          errorMsg
        );
      }
    } catch (error) {
      this.logger.error(`Error al enviar precio a Jumpseller: ${error.message}`);
      await this.updateVariantPriceStatus(
        variant.variantId,
        variant.productId,
        EnumPriceAndStockState.ERROR,
        error.message
      );
    }
  }

  //crear job para recalculo de precios, que el sendpricestoJumpseller 
  // reciba la respuesta de calculatePricesForAllCards

  private async updateVariantPriceStatus(
    variantId: number,
    productId: number,
    status: EnumPriceAndStockState,
    errorMsg: string = null
  ) {
    await this.stagingProductVariantModel.updateOne(
      { variantId, productId },
      {
        $set: {
          priceUpdateStatus: status,
          priceUpdateError: errorMsg,
        }
      }
    );
  }

  //encontrar variante por id
  async findVariantById(_id: string): Promise<IStagingProductVariant> {
    if (!Types.ObjectId.isValid(_id))
      throw new BadRequestException('Formato de ID inválido');
    const variant = await this.stagingProductVariantModel.findOne({ _id: new Types.ObjectId(_id) }).exec();
    if (!variant) throw new NotFoundException('Variante no encontrada');
    const variantResponse = variant as unknown as IStagingProductVariant;
    return variantResponse;
  }

  //actualizar variante por id
  async updateVariantById(_id: string, variant: Partial<IStagingProductVariant>) {
    if (!Types.ObjectId.isValid(_id)) {
      throw new BadRequestException('ID no es válido');
    }
    
    this.logger.log(`Actualizando variante con ID ${_id} con datos: ${JSON.stringify(variant)}`);
    
    try {
      // Usar directamente el string del OID sin convertirlo
     const variante = await this.stagingProductVariantModel.findById(new Types.ObjectId(_id)).exec();
      if (!variante) {
        this.logger.error(`No se encontró la variante con ID ${_id}`);
        throw new NotFoundException(`Variant with ID ${_id} not found.`);
      }

      // Actualizar la variante con los nuevos datos
      const updatedVariant = await this.stagingProductVariantModel.updateOne(
        { _id: new Types.ObjectId(_id) },
        {
          $set: {
            ...variant,
          }
        },
        { new: true }
      );
      
      this.logger.log(`Variante actualizada exitosamente: ${updatedVariant}`);
      return updatedVariant;
    } catch (error) {
      this.logger.error(`Error al actualizar variante: ${error.message}`);
      throw new InternalServerErrorException(`Error al actualizar variante: ${error.message}`);
    }
  }

  //actualizar todos los isPriceUpdateable a true o false
  async updateAllIsPriceUpdateable(isPriceUpdateable: boolean) {
    try{
      await this.stagingProductVariantModel.updateMany(
        {},
        {
          $set: {
            isPriceUpdateable: isPriceUpdateable,
          }
        }
      );
      if (isPriceUpdateable === true) {
        this.logger.log(`Se actualizaron todos los isPriceUpdateable a true`);
      }else {
        this.logger.log(`Se actualizaron todos los isPriceUpdateable a false`);
      }
      return { message: `Se actualizaron todos los isPriceUpdateable a ${isPriceUpdateable}` };
    }catch(error){
      this.logger.error(`Error al actualizar isPriceUpdateable: ${error.message}`);
      throw new InternalServerErrorException(`Error al actualizar isPriceUpdateable: ${error.message}`);
    }
  }
  
}