import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IStockFromFront, StockJumpsellerRequest } from 'src/modules/jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { Model, ObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import { StagingProductVariant, StagingProductVariantDocument } from './entities/staging-product-variant.entity';
import { EnumPriceAndStockState } from './enums/price-and-stock-state.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { Product, ProductDocument } from '../entities/product.entity';
import e from 'express';
import { IPriceFromFront } from './interfaces/stagingProductVariant.interface';
import { JumpsellerUpdateVariantRequest } from 'src/modules/jumpseller/interfaces/jumpsellerVariants/jumpsellerUpdateVariantRequest.interface';

@Injectable()
export class StagingProductVariantService {
  constructor(
    @InjectModel(StagingProductVariant.name) private stagingProductVariantModel: Model<StagingProductVariantDocument>,
    @InjectModel(Product.name) private ProductModel: Model<ProductDocument>,
    private readonly jumpsellerService: JumpsellerService,
    private readonly logger: LoggerService
  ) {}

  
  async findAllVariants(query: PaginationQueryDto) {
   const { limit, page, sortBy, sortOrder, to, from, search, jumpsellerStatus, priceUpdateStatus, stockUpdateStatus } = query;
   
       const sort: { [key: string]: 1 | -1 } = {
         [sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
        };
   
        const skip = (page - 1) * limit;
        const filters: { $or?: any[], $and?: any[] } = {};
        
        
        if (search && search.length > 0) {
         const searchValue = search.trim();
         filters.$or = [];
         
         filters.$or.push({
           $expr: {
             $regexMatch: {
               input: { $toString: "$sku" },
               regex: searchValue,
               options: "i"
             }
           }
         });
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
               input: { $toString: "$priceUpdateStatus" },
               regex: searchValue,
               options: "i"
              }
           }
          });
         filters.$or.push({
           $expr: {
             $regexMatch: {
               input: { $toString: "$stockUpdateStatus" },
               regex: searchValue,
               options: "i"
              }
           }
          });
         filters.$or.push({
           $expr: {
             $regexMatch: {
               input: { $toString: "$jumpsellerStatus" },
               regex: searchValue,
               options: "i"
             }
            }
         });
   
         if (from && to) {
         filters.$and = [
           {
             createdAt: { //??
               $gte: new Date(`${from}T00:00:00.000Z`),
               $lte: new Date(`${to}T23:59:59.999Z`)
             }
           },
         ];
       }
       
       if (priceUpdateStatus) {
         const priceUpdateStatusFilter = { priceUpdateStatus: { $regex: `^${priceUpdateStatus}$`, $options: "i" } };
         filters.$and = filters.$and ? [...filters.$and, priceUpdateStatusFilter] : [priceUpdateStatusFilter];
       }
       if (stockUpdateStatus) {
         const stockUpdateStatusFilter = { stockUpdateStatus: { $regex: `^${stockUpdateStatus}$`, $options: "i" } };
         filters.$and = filters.$and ? [...filters.$and, stockUpdateStatusFilter] : [stockUpdateStatusFilter];
        }
       if (jumpsellerStatus) {
         const jumpsellerStatusFilter = { jumpsellerStatus: { $regex: `^${jumpsellerStatus}$`, $options: "i" } };
         filters.$and = filters.$and ? [...filters.$and, jumpsellerStatusFilter] : [jumpsellerStatusFilter];
       }
   
       try {
         const [variants, total] = await Promise.all([
           this.stagingProductVariantModel.find(filters).sort(sort).skip(skip).limit(limit).exec(),
           this.stagingProductVariantModel.countDocuments(filters).exec()
         ]);
         return {
           items: variants.map(user => user.toObject()),
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
         throw new InternalServerErrorException(`Error trayendo variantes: ${error.message}`);
       }
    }
  } 

  async findOne(_id: ObjectId) {
    const variantById = this.stagingProductVariantModel.findById(
      {_id})
    return variantById;
  }
//----------------------------------------------------------------------------------------------------
  //Manejo de stock
  //primero guardar stock desde el front en stagingProductVariant
  async saveStockFromFront(variant: IStockFromFront) {
     //lo que me envia el front
     const existingVariant = await this.stagingProductVariantModel.findOne({
       variantId: variant.variantId,
       productId: variant.productId,
     });
  
     if (!existingVariant) {
       throw new Error(`Variant with variantId: ${variant.variantId} and productId: ${variant.productId} not found.`);
     }
  
     await this.stagingProductVariantModel.updateOne(
       { 
         variantId: variant.variantId,
         productId: variant.productId,
       },
       {
         $set: {
           variantStock: +existingVariant.variantStock + +variant.stock,
           locationId: variant.locationId,
           stockUnlimited: variant.stockUnlimited,
           stockUpdateStatus: EnumPriceAndStockState.PENDING,
           stockUpdateError: null,
         }
       }
     ); 
   }
  
   //segundo, enviar el stock a jumpseller desde stagingProductVariant
   async sendStockToJumpseller(variant: IStockFromFront) {
     try {
       // Traer la data de base de datos
       const productVariant = await this.stagingProductVariantModel.findOne({
         productId: variant.productId,
         variantId: variant.variantId,
       });
  
       if (!productVariant) {
         const errorMsg = `No se encontró el producto con productId: ${variant.productId} y variantId: ${variant.variantId}`;
         this.logger.error(errorMsg);
         throw new Error(errorMsg);
       }
  
       // Mapear el producto a la estructura requerida por Jumpseller
       const stockRequest: StockJumpsellerRequest = {
         stock: productVariant.variantStock,
         product_id: productVariant.productId,
         variant_id: productVariant.variantId,
         location_id: productVariant.locationId,
         stock_unlimited: productVariant.stockUnlimited,
       };
  
       // Actualizar estado a "En Progreso" antes de enviar
       await this.updateVariantStockStatus(
         variant.variantId, 
         variant.productId, 
         EnumPriceAndStockState.IN_PROGRESS,
         null 
       );
       
       this.logger.log(`🦍 Enviando stock a Jumpseller: ${JSON.stringify(stockRequest)}`);
       const response = await this.jumpsellerService.addStocktoJumpseller(stockRequest);
       
       // Verificar si la respuesta tiene un status y si es 200
       if (!response?.error && response?.status === 200) {
         await this.updateVariantStockStatus(
           variant.variantId, 
           variant.productId, 
           EnumPriceAndStockState.COMPLETED,
           null  
         );
         this.logger.log(`🦍 Respuesta exitosa de Jumpseller: ${JSON.stringify(response)}`);
         this.logger.log(`Se actualizó el stock de la variante ${variant.variantId} en Jumpseller`);
         
         //actualizar el stock en la coleccion products
         try {
           //me traigo el producto completo desde jumpseller por id
           const jumpsellerProduct = await this.jumpsellerService.getJumpsellerProductById(productVariant.productId);
           
           //actualizar el producto completo en la coleccion products
           await this.ProductModel.updateOne(
             { productId: jumpsellerProduct.product.id },
             { ...jumpsellerProduct }
           ); 
           this.logger.log(`😎 Se actualizó el producto ${jumpsellerProduct.product.id} en la coleccion products`);
         } catch (error) {
           this.logger.error(`Error al actualizar el producto en la coleccion products: ${error.message}`);
           // No cambiamos el estado principal porque el stock sí se actualizó correctamente
         }
       } else {
         // Si hay un error o la respuesta no es 200
         const errorMsg = `Status ${response?.status || 'desconocido'} - ${response?.message || 'Sin detalles'}`;
         this.logger.error(errorMsg);
         await this.updateVariantStockStatus(
           variant.variantId, 
           variant.productId, 
           EnumPriceAndStockState.ERROR, 
           errorMsg
         );
       }
       
       return response;
     } catch (error) {
       this.logger.error(`Error al enviar stock a Jumpseller: ${error.message}`);
       await this.updateVariantStockStatus(
         variant.variantId, 
         variant.productId, 
         EnumPriceAndStockState.ERROR, 
         error.message
       );
       throw new Error(`Error al enviar stock a Jumpseller: ${error.message}`);
     }
   }
  
   // Método auxiliar para actualizar el estado de la variante
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

//----------------------------------------------------------------------------------------------------
  //Manejo de precios
   //calculo de todos los precios desde la api a jumpseller

   //Calcular precio de todas las cartas
  // async calculatePricesForAllCards( variant: IPriceFromFront): Promise<{ updated: number; errors: number }> {
  //   let updated = 0;
  //   let errors = 0;

  //   const usdPricesArr = await this.usdPricesService.findAllPrices();
  //   const usdPriceDoc = Array.isArray(usdPricesArr)
  //     ? usdPricesArr.find(p => p.game === "Magic: The Gathering")
  //     : null;
  //   if (!usdPriceDoc || !usdPriceDoc.usdPrice) throw new NotFoundException('Valor del dólar no encontrado');
  //   const dollarValue = usdPriceDoc.usdPrice;

  //   const basePricesArr = await this.basePricesService.findAllBasePrices();
  //   const basePriceObj = Array.isArray(basePricesArr)
  //     ? basePricesArr.find(bp => bp.game === "Magic: The Gathering" && bp.type === "rarity")
  //     : null;
  //   if (!basePriceObj || !basePriceObj.basePrices) throw new NotFoundException('Precios base no encontrados');

  //   const cards = await this.model.find({}).exec();

  //   for (const card of cards) {
  //     try {
  //       const rarity = card.rarity?.toLowerCase() || '';
  //       let labelBase = '';
  //       if (rarity === 'rare') labelBase = 'rareR';
  //       else if (rarity === 'mythic') labelBase = 'mythicM';
  //       else if (rarity === 'common') labelBase = 'commonC';
  //       else if (rarity === 'uncommon') labelBase = 'uncommonU';

  //       let precioApiNonFoil = card.prices.usd ? parseFloat(card.prices.usd) : 0;
  //       let precioFinalNonFoilmultiploCien = 0;
  //       if (precioApiNonFoil > 0) {
  //         const precioCalculadoNonFoil = Math.round(precioApiNonFoil * dollarValue);
  //         let basePriceNonFoil = 0;
  //         if (labelBase) {
  //           const baseItem = basePriceObj.basePrices.find(bp => bp.label === labelBase);
  //           basePriceNonFoil = baseItem ? baseItem.price : 0;
  //         }
  //         const precioFinalNonFoil = Math.max(precioCalculadoNonFoil, basePriceNonFoil);
  //         precioFinalNonFoilmultiploCien = Math.ceil(precioFinalNonFoil / 100) * 100;
  //       } else {
  //         this.logger.warn(`Precio API en dolar para nonfoil no disponible para carta ${card.oracleId}`);
  //       }

  //       let precioApiFoil = card.prices.usdFoil ? parseFloat(card.prices.usdFoil) : 0;
  //       let precioFinalFoilmultiploCien = 0;
  //       if (precioApiFoil > 0) {
  //         const precioCalculadoFoil = Math.round(precioApiFoil * dollarValue);
  //         let basePriceFoil = 0;
  //         if (labelBase) {
  //           const baseItemFoil = basePriceObj.basePrices.find(bp => bp.label === `${labelBase}-Foil`);
  //           basePriceFoil = baseItemFoil ? baseItemFoil.price : 0;
  //         }
  //         const precioFinalFoil = Math.max(precioCalculadoFoil, basePriceFoil);
  //         precioFinalFoilmultiploCien = Math.ceil(precioFinalFoil / 100) * 100;
  //       } else {
  //         this.logger.warn(`Precio API en dolar para foil no disponible para carta ${card.oracleId}`);
  //       }

  //       let precioApiEtched = card.prices.usdEtched ? parseFloat(card.prices.usdEtched) : 0;
  //       let precioFinalEtchedmultiploCien = 0;
  //       if (precioApiEtched > 0) {
  //         const precioCalculadoEtched = Math.round(precioApiEtched * dollarValue);
  //         let basePriceEtched = 0;
  //         if (labelBase) {
  //           const baseItemEtched = basePriceObj.basePrices.find(bp => bp.label === `${labelBase}-Etched`);
  //           basePriceEtched = baseItemEtched ? baseItemEtched.price : 0;
  //         }
  //         const precioFinalEtched = Math.max(precioCalculadoEtched, basePriceEtched);
  //         precioFinalEtchedmultiploCien = Math.ceil(precioFinalEtched / 100) * 100;
  //       } else {
  //         this.logger.warn(`Precio API en dolar para etched no disponible para carta ${card.oracleId}`);
  //       }

  //       if (precioApiNonFoil > 0) {
  //         card.prices.valorPesoChilenoCalculado = precioFinalNonFoilmultiploCien.toString();
  //       }
  //       if (precioApiFoil > 0) {
  //         card.prices.valorPesoChilenoCalculadoFoil = precioFinalFoilmultiploCien.toString();
  //       }
  //       if (precioApiEtched > 0) {
  //         card.prices.valorPesoChilenoCalculadoEtched = precioFinalEtchedmultiploCien.toString();
  //       }

  //       await this.model.updateOne({ oracleId: card.oracleId }, { prices: card.prices });
  //       this.logger.log(`Actualizado precio para carta ${card.oracleId}: NonFoil: ${precioFinalNonFoilmultiploCien}, Foil: ${precioFinalFoilmultiploCien}, Etched: ${precioFinalEtchedmultiploCien}`);
  //       updated++;
        
  //     } catch (e) {
  //       this.logger.error(`Error al calcular precio para carta ${card.oracleId}: ${e.message}`);
  //       errors++;
  //     }
  //   }

  //   return { updated, errors };
  // }

//-----------------------------------------------------------------------------------------------------
   //precios individuales desde el front 
  //primero guardar precios desde el front en stagingProductVariant
  async savePricesFromFront(variant: IPriceFromFront) {
    const existingVariant = await this.stagingProductVariantModel.findOne({
      variantId: variant.variantId,
      productId: variant.productId,
    });
  
    if (!existingVariant) {
      throw new Error(`Variant with variantId: ${variant.variantId} and productId: ${variant.productId} not found.`);
    }
  
    await this.stagingProductVariantModel.updateOne(
      { 
        variantId: variant.variantId,
        productId: variant.productId,
      },
      {
        $set: {
          variantPrice: +variant.variantPrice,
          isPriceUpdateable: variant.isPriceUpdateable,
          priceUpdateStatus: EnumPriceAndStockState.PENDING,
          priceUpdateError: null,
        }
      }
    ); 
  }

  //segundo, enviar el precio a jumpseller desde stagingProductVariant
  async sendPriceToJumpseller(variant: IPriceFromFront) {
    try {
      // Traer la data de base de datos
      const productVariant = await this.stagingProductVariantModel.findOne({
        productId: variant.productId,
        variantId: variant.variantId,
      });
  
      if (!productVariant) {
        const errorMsg = `No se encontró el producto con productId: ${variant.productId} y variantId: ${variant.variantId}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Actualizar estado a "En Progreso" antes de enviar
      await this.updateVariantPriceStatus(
        variant.variantId, 
        variant.productId, 
        EnumPriceAndStockState.IN_PROGRESS,
        null 
      );
 
      //actualizar precios con endpoint de actualizacion de variantes

      //armar mapeo para el endpoint de actualizacion de variantes
      const variantTo: JumpsellerUpdateVariantRequest = {
        variant: {
          price: productVariant.variantPrice,
          sku: productVariant.sku,
          stock: productVariant.variantStock,
          stock_unlimited: productVariant.stockUnlimited
        }
      };

      const response = await this.jumpsellerService.updateVariant(productVariant.productId, productVariant.variantId, variantTo);

      // Verificar si la respuesta tiene un status y si es 200
      if (!response?.error && response?.status === 200) {
        await this.updateVariantPriceStatus(
          variant.variantId, 
          variant.productId, 
          EnumPriceAndStockState.COMPLETED,
          null  
        );
        this.logger.log(`🦍 Respuesta exitosa de Jumpseller: ${JSON.stringify(response)}`);
        this.logger.log(`Se actualizó el precio de la variante ${variant.variantId} en Jumpseller`);
        
        //actualizar el stock en la coleccion products
         try {
           //me traigo el producto completo desde jumpseller por id
           const jumpsellerProduct = await this.jumpsellerService.getJumpsellerProductById(productVariant.productId);
           
           //actualizar el producto completo en la coleccion products
           await this.ProductModel.updateOne(
             { productId: jumpsellerProduct.product.id },
             { ...jumpsellerProduct }
           ); 
           this.logger.log(`😎 Se actualizó el producto ${jumpsellerProduct.product.id} en la coleccion products`);
         } catch (error) {
           this.logger.error(`Error al actualizar el producto en la coleccion products: ${error.message}`);
           // No cambiamos el estado principal porque el stock sí se actualizó correctamente
         }
         } else {
          // Si hay un error o la respuesta no es 200
          const errorMsg = `Status ${response?.status || 'desconocido'} - ${response?.message || 'Sin detalles'}`;
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

  // Método auxiliar para actualizar el estado del precio de la variante
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


}
