import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { IStockFromFront, StockJumpsellerRequest } from 'src/modules/jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { Model, ObjectId, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import { StagingProductVariant, StagingProductVariantDocument } from './entities/staging-product-variant.entity';
import { EnumPriceAndStockState } from './enums/price-and-stock-state.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { Product, ProductDocument } from '../entities/product.entity';
import e from 'express';
import { IPriceFromFront, IStagingProductVariant } from './interfaces/stagingProductVariant.interface';
import { JumpsellerUpdateVariantRequest } from 'src/modules/jumpseller/interfaces/jumpsellerVariants/jumpsellerUpdateVariantRequest.interface';
import { UsdPrice } from 'src/modules/prices/usd-prices/entities/usd-price.entity';
import { UsdPricesService } from 'src/modules/prices/usd-prices/usd-prices.service';
import { BasePricesService } from 'src/modules/prices/base-prices/base-prices.service';
import { MagicCard } from 'src/modules/magic/entities/magic-card.entity';
import { MappedMagicCard } from 'src/modules/jumpseller/interfaces/mapped-magic-card.interface';
import { BasePrice } from 'src/modules/prices/base-prices/entities/base-price.entity';
import { EnumGame } from 'src/common/enums/game.enum';

@Injectable()
export class StagingProductVariantService {
  constructor(
    @InjectModel(StagingProductVariant.name) private stagingProductVariantModel: Model<StagingProductVariantDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(MagicCard.name) private magicCardModel: Model<MagicCard>,
    @InjectModel(UsdPrice.name) private usdPriceModel: Model<UsdPrice>,
    @InjectModel(BasePrice.name) private basePriceModel: Model<BasePrice>,
    private readonly jumpsellerService: JumpsellerService,
    private readonly usdPricesService: UsdPricesService,
    private readonly basePricesService: BasePricesService,
    private readonly logger: LoggerService
  ) {}

  async findAllVariants(query: PaginationQueryDto) {
    const { limit, page, sortBy, sortOrder, to, from, search, jumpsellerStatus, priceUpdateStatus, stockUpdateStatus } = query;

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

    try {
      this.logger.log(`Buscando variantes con filtros: ${JSON.stringify(filters)}`);
      const [variants, total] = await Promise.all([
        this.stagingProductVariantModel.find(filters).sort(sort).skip(skip).limit(limit).exec(),
        this.stagingProductVariantModel.countDocuments(filters).exec()
      ]);

      this.logger.log(`Se encontraron ${variants.length} variantes de un total de ${total}`);

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
      this.logger.log(`Se encontraron ${variants.length} variantes`);
      return variants;
    } catch (error) {
      this.logger.error(`Error al buscar variantes: ${error.message}`);
      throw new InternalServerErrorException(`Error trayendo variantes: ${error.message}`);
    }
  }

  // Manejo de stock
  async saveStockFromFront(variant: IStockFromFront) {
    const existingVariant = await this.stagingProductVariantModel.findOne({
      variantId: variant.variantId,
      productId: variant.productId,
    });

    if (!existingVariant) {
      throw new Error(`Variant with variantId: ${variant.variantId} and productId: ${variant.productId} not found.`);
    }
    const nullErrorMsg = ""
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
          stockUpdateError: nullErrorMsg,
        }
      }
    );
  }

  async sendStockToJumpseller(variant: IStockFromFront) {
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

      const nullErrorMsg= ""
      await this.updateVariantStockStatus(
        variant.variantId,
        variant.productId,
        EnumPriceAndStockState.IN_PROGRESS,
        nullErrorMsg
      );

      this.logger.log(`🦍 Enviando stock a Jumpseller: ${JSON.stringify(stockRequest)}`);
      const response = await this.jumpsellerService.addStocktoJumpseller(stockRequest);

      if (!response?.error && response?.status === 200) {

        await this.updateVariantStockStatus(
          variant.variantId,
          variant.productId,
          EnumPriceAndStockState.COMPLETED,
          nullErrorMsg
        );
        this.logger.log(`🦍 Respuesta exitosa de Jumpseller: ${JSON.stringify(response)}`);
        this.logger.log(`Se actualizó el stock de la variante ${variant.variantId} en Jumpseller`);

        try {
          const jumpsellerProduct = await this.jumpsellerService.getJumpsellerProductById(productVariant.productId);

          await this.productModel.updateOne(
            { productId: jumpsellerProduct.product.id },
            { ...jumpsellerProduct }
          );
          this.logger.log(`😎 Se actualizó el producto ${jumpsellerProduct.product.id} en la coleccion products`);
        } catch (error) {
          this.logger.error(`Error al actualizar el producto en la coleccion products: ${error.message}`);
        }
      } else {
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

  // Manejo de precios
  async calculatePricesForAllCards() {
    //TODO: QUE EL CALCULO DEL PRECIO SEA DINAMICO EN BASE AL JUEGO
    try {
      const variantes = await this.stagingProductVariantModel.find({ isPriceUpdateable: true });
      this.logger.log(`Procesando ${variantes.length} variantes para actualizar precios...`);

      const usdPriceDoc = await this.usdPriceModel.findOne({ gameID: "MG" });
      if (!usdPriceDoc) {
        throw new Error("No se encontró el precio del dólar para Magic");
      }
      const usdPrice = usdPriceDoc.usdPrice;
      this.logger.log(`Precio del dólar: ${usdPrice} CLP`);
      
      const basePrice = await this.basePriceModel.findOne({ game: EnumGame.MAGIC });
      if (!basePrice) {
        throw new Error("No se encontraron precios base para Magic");
      }

      const rarityPrices = {};
      basePrice.basePrices.forEach(item => {
        rarityPrices[item.label] = item.price;
      });

      let updatedCount = 0;

      for (const variante of variantes) {
        try {
          const matchingPrice = await this.magicCardModel.findOne({ idJumpSeller: variante.productId });

          if (!matchingPrice) {
            this.logger.warn(`No se encontró carta para productId: ${variante.productId}`);
            await this.stagingProductVariantModel.updateOne(
              { _id: variante._id },
              {
                $set: {
                  priceUpdateError: 'Carta base no encontrada en colección Magic',
                  priceUpdateStatus: EnumPriceAndStockState.ERROR
                }
              }
            );
            continue;
          }

          let precioUSD = 0;
          const isFoil = variante.finish?.toLowerCase().includes('foil');
          const isEtched = variante.finish?.toLowerCase().includes('etched');

          if (matchingPrice.prices) {
            if (isEtched && matchingPrice.prices.usdEtched) {
              precioUSD = parseFloat(matchingPrice.prices.usdEtched);
              this.logger.log(`Precio Etched encontrado: $${precioUSD} USD`);
            } else if (isFoil && matchingPrice.prices.usdFoil) {
              precioUSD = parseFloat(matchingPrice.prices.usdFoil);
              this.logger.log(`Precio Foil encontrado: $${precioUSD} USD`);
            } else if (matchingPrice.prices.usd) {
              precioUSD = parseFloat(matchingPrice.prices.usd);
              this.logger.log(`Precio regular encontrado: $${precioUSD} USD`);
            } else {
              this.logger.warn(`No se encontraron precios para la carta ${matchingPrice.oracleId} con finish ${variante.finish}`);
              continue;
            }
          } else {
            this.logger.warn(`No hay información de precios para la carta ${matchingPrice.oracleId}`);
            continue;
          }

          let rarezaKey = '';

          switch (variante.rarity?.toLowerCase()) {
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
          this.logger.log(`Precio base por rareza (${rarezaKey}): ${precioBaseRareza} CLP`);

          let precioCLP = precioUSD * usdPrice;

          precioCLP = Math.ceil(precioCLP / 100) * 100;

          precioCLP = Math.max(precioCLP, precioBaseRareza);

          this.logger.log(`Precio final calculado: ${precioCLP} CLP`);

          //SI EL PRECIO EN IGUAL O MENOR A 0 NO SE ACTUALIZA
          if (precioCLP <= 0) {
            this.logger.warn(`Precio calculado es <= 0, no se actualizará para variante ${variante.variantId} con sku ${variante.sku}`);
            continue;
          }
          const nullErrorMsg = ""
          await this.stagingProductVariantModel.updateOne(
            { _id: variante._id },
            {
              $set: {
                variantPrice: precioCLP,
                priceUpdateStatus: EnumPriceAndStockState.PENDING,
                priceUpdateError: nullErrorMsg
              }
            }
          );

          this.logger.log(`Precio actualizado para variante ${variante.variantId}: ${precioCLP} CLP, estado: PENDING`);
          await this.updateVariantPriceStatus(
            variante.variantId,
            variante.productId,
            EnumPriceAndStockState.IN_PROGRESS,
            nullErrorMsg
          );

          const variantTo: JumpsellerUpdateVariantRequest = {
            variant: {
              price: precioCLP,
              sku: variante.sku,
              stock: null,
              stock_unlimited: null,
            }
          };

          const response = await this.jumpsellerService.updateVariant(variante.productId, variante.variantId, variantTo);

          if (!response?.error && response?.status === 200) {
            await this.updateVariantPriceStatus(
              variante.variantId,
              variante.productId,
              EnumPriceAndStockState.COMPLETED,
              nullErrorMsg
            );
            this.logger.log(`🦍 Respuesta exitosa de Jumpseller: ${JSON.stringify(response)}`);
            this.logger.log(`Se actualizó el precio de la variante ${variante.variantId} en Jumpseller`);

            try {
              const jumpsellerProduct = await this.jumpsellerService.getJumpsellerProductById(variante.productId);

              await this.productModel.updateOne(
                { productId: jumpsellerProduct.product.id },
                { ...jumpsellerProduct }
              );
              this.logger.log(`😎 Se actualizó el producto ${jumpsellerProduct.product.id} en la coleccion products`);
              updatedCount++;
            } catch (error) {
              this.logger.error(`Error al actualizar el producto en la coleccion products: ${error.message}`);
            }
          } else {
            const errorMsg = `Status ${response?.status || 'desconocido'} - ${response?.message || 'Sin detalles'}`;
            this.logger.error(errorMsg);
            await this.updateVariantPriceStatus(
              variante.variantId,
              variante.productId,
              EnumPriceAndStockState.ERROR,
              errorMsg
            );
          }
        } catch (varianteError) {
          this.logger.error(`Error procesando variante ${variante.variantId}: ${varianteError.message}`);
          await this.stagingProductVariantModel.updateOne(
            { _id: variante._id },
            {
              $set: {
                priceUpdateError: varianteError.message,
                priceUpdateStatus: EnumPriceAndStockState.ERROR
              }
            }
          );
        }
      }

      return { success: true, message: `Se actualizaron los precios de ${updatedCount} variantes de ${variantes.length} procesadas` };
    } catch (error) {
      this.logger.error(`Error al calcular precios para todas las cartas: ${error.message}`);
      throw new InternalServerErrorException(`Error al calcular precios para todas las cartas: ${error.message}`);
    }
  }

  async savePricesFromFront(variant: IPriceFromFront) {
    const existingVariant = await this.stagingProductVariantModel.findOne({
      variantId: variant.variantId,
      productId: variant.productId,
    });

    if (!existingVariant) {
      throw new Error(`Variant with variantId: ${variant.variantId} and productId: ${variant.productId} not found.`);
    }

    const nullErrorMsg = ""
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
  }

  async sendPriceToJumpseller(variant: IPriceFromFront) {
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

      const nullErrorMsg= ""
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

      if (!response?.error && response?.status === 200) {
        await this.updateVariantPriceStatus(
          variant.variantId,
          variant.productId,
          EnumPriceAndStockState.COMPLETED,
          nullErrorMsg
        );
        this.logger.log(`🦍 Respuesta exitosa de Jumpseller: ${JSON.stringify(response)}`);
        this.logger.log(`Se actualizó el precio de la variante ${variant.variantId} en Jumpseller`);

        try {
          const jumpsellerProduct = await this.jumpsellerService.getJumpsellerProductById(productVariant.productId);

          await this.productModel.updateOne(
            { productId: jumpsellerProduct.product.id },
            { ...jumpsellerProduct }
          );
          this.logger.log(`😎 Se actualizó el producto ${jumpsellerProduct.product.id} en la coleccion products`);
        } catch (error) {
          this.logger.error(`Error al actualizar el producto en la coleccion products: ${error.message}`);
        }
      } else {
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