import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './entities/product.entity';
import { IdataProduct, IsetProduct } from './interfaces/product.interface';
import { JumpsellerGetAllProductResponse } from 'src/modules/jumpseller/interfaces/jumpsellerProducts/jumpsellerGetAllProduct.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { Order } from 'src/modules/jumpseller/interfaces/webhook/saleData.interface';
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly jumpsellerService: JumpsellerService,
  ) {
    this.logger = new Logger(ProductsService.name);
  }

  private readonly logger: Logger;

  //funcion para guardar en base d datos
  async createOrUpdateProduct(response: IsetProduct) {
    try {
      // Buscar producto por id o por oracleId
      const existingProduct = await this.productModel.findOne({ oracleId: response.oracleId });

      // Si existe el producto, se actualiza
      if (existingProduct) {
        const updatedProduct = await this.productModel.findByIdAndUpdate(
          existingProduct._id,
          response,
          { new: true }
        );
        this.logger.log(`Producto actualizado en bd, ID: ${existingProduct._id}`);
        return updatedProduct;
      } else {
        // Si no existe, se crea
        const newProduct = await this.productModel.create(response);
        this.logger.log(`Se creó producto en base de datos, ID: ${newProduct._id}`);
        return newProduct;
      }
    } catch (error) {
      this.logger.error(`Error en createOrUpdateProduct: ${error.message}`);
      throw new InternalServerErrorException(
        `Error al crear/actualizar producto: ${error.message}`
      );
    }
  }

  async updateProductById(id: string, updateData: JumpsellerGetAllProductResponse): Promise<IdataProduct> {
    try {
      const updatedProduct = await this.productModel.findOneAndUpdate(
        { id },
        updateData,
        { new: true }
      );

      if (!updatedProduct) {
        this.logger.warn(`Product with ID ${id} not found for update`);
        return null;
      }

      this.logger.log(`Product with ID ${id} updated successfully`);
      return updatedProduct as unknown as IdataProduct;
    } catch (error) {
      this.logger.error(`Error updating product with ID ${id}: ${error.message}`);
      throw error;
    }
  }

  async findAllProducts(query: PaginationQueryDto) {
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
            input: { $toString: "$sku" },
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
            input: { $toString: "$name" },
            regex: searchValue,
            options: "i"
          }
        }
      });
      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$page_title" },
            regex: searchValue,
            options: "i"
          }
        }
      });
      filters.$or.push({
        categories: {
          $elemMatch: {
        name: { $regex: searchValue, $options: "i" }
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
        this.productModel.find(filters).sort(sort).skip(skip).limit(limit).exec(),
        this.productModel.countDocuments(filters).exec() 
      ]);
      return {
        items: productCards,
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


  async findAllProductsWithoutFilters(): Promise<IdataProduct[]> {
    const products = await this.productModel.find({}).exec();
    const productResponse = products as unknown as IdataProduct[];
    return productResponse;
  }


  async findProductById(_id: string): Promise<IdataProduct> {
    if (!Types.ObjectId.isValid(_id))
      throw new BadRequestException('Formato de ID inválido');
    const product = await this.productModel.findOne({ _id: new Types.ObjectId(_id) }).exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    const productResponse = product as unknown as IdataProduct;
    return productResponse;
  }

  //funcion para manejar descuento de stock
  async updateStock(order: Order) {
    // iterar sobre todos los productos del webhook
    for (const webhookProduct of order.products) {
      const productToUpdate = await this.productModel.findOne({ id: webhookProduct.id });
      if (productToUpdate) {
        // carcular el nuevo stock general (stock en bd - cantidad vendida)
        const newStock = Math.max(0, productToUpdate.stock - webhookProduct.qty);
        
        // Calcular el nuevo historySales (historial de ventas + cantidad vendida)
        const newHistorySales = (productToUpdate.historySales || 0) + webhookProduct.qty;

        // Crear registro de historial de stock
        const stockHistoryEntry = {
          quantityDiscounted: webhookProduct.qty,
          date: new Date(order.completed_at),//asignar fecha de junpseller
          orderId: order.id,
          previousStock: productToUpdate.stock,
          newStock: newStock
        };

        // actualizar el stock del producto en bd y agregar historial
        await this.productModel.findOneAndUpdate(
          { id: webhookProduct.id },
          {
            $set: { 
              stock: newStock,
              historySales: newHistorySales //ventas historicas generales
            }, 
            $push: { stockHistory: stockHistoryEntry },  // Actualizar stock y agregar al historial
          }
        );

        this.logger.log(`stock actualizado para el id: ${webhookProduct.id}: el nuevo stock es ${newStock}, historySales: ${newHistorySales}`);

        // actualizar el stock de la variante si existe
        if (webhookProduct.variant_id && productToUpdate.variants && productToUpdate.variants.length > 0) {
          // Encontrar el stock anterior de la variante
          const variant = productToUpdate.variants.find(v => v.id === webhookProduct.variant_id);
          const previousVariantStock = variant ? variant.stock : 0;
          const previousVariantHistorySales = variant ? (variant.historySales || 0) : 0;
          
          // Calcular el nuevo stock asegurando que no sea negativo
          const newVariantStock = Math.max(0, previousVariantStock - webhookProduct.qty);
          
          // calcular el nuevo historySales de la variante ventas historicas = ventas anteriores + cantidad vendida
          const newVariantHistorySales = previousVariantHistorySales + webhookProduct.qty;
          
          // Preparar el nuevo registro de historial
          const newStockHistoryEntry = {
            quantityDiscounted: webhookProduct.qty,
            date: new Date(order.completed_at),
            orderId: order.id,
            previousStock: previousVariantStock,
            newStock: newVariantStock
          };

          //encontrar y actualizar el stock de la variante y las ventas historicas
          await this.productModel.findOneAndUpdate(
            {
              id: webhookProduct.id,
              "variants.id": webhookProduct.variant_id
            },
            {
              $set: { 
                "variants.$.stock": newVariantStock, //nuevo stock de variante
                "variants.$.historySales": newVariantHistorySales//ventas historicas por variante
              },
              $push: { 
                "variants.$.stockHistory": newStockHistoryEntry 
              }
            }
          );

          this.logger.log(`stock de variante actualizado para el producto con id 
                ${webhookProduct.id}, id de variante ${webhookProduct.variant_id}, 
                nuevo stock: ${newVariantStock}, historySales: ${newVariantHistorySales}`);
        }
      } else {
        this.logger.warn(`id producto no encontrado ${webhookProduct.id}`);
      }
      return { success: true, message: 'Stock actualizado correctamente' };
    }
  }

  update(id: string) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
