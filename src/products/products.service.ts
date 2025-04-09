import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './entities/product.entity';
import { IdataProduct, IsetProduct } from './interface/product.interface';
import { JumpsellerGetAllProductResponse } from 'src/jumpseller/interfaces/jumpsellerProducts/jumpsellerGetAllProduct.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { JumpsellerWebhookSaleResponse } from 'src/jumpseller/interfaces/webhook/saleData.interface';
import { JumpsellerService } from 'src/jumpseller/jumpseller.service';

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
      const existingProduct = await this.productModel.findOne({
        $or: [
          { id: response.id },
          { oracleId: response.oracleId }
        ]
      });

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


    async findAllProductsWithoutFilters(): Promise<IdataProduct[]> {
    const products = await this.productModel.find({}).exec();  
        const productResponse= products as unknown as IdataProduct[];
        return productResponse;
    }


    async findProductById(_id: string): Promise<IdataProduct> {
       if (!Types.ObjectId.isValid(_id))
            throw new BadRequestException('Formato de ID inválido');
          const product = await this.productModel.findOne({ _id: new Types.ObjectId(_id) }).exec();
          if (!product) throw new NotFoundException('Producto no encontrado');
          const productResponse= product as unknown as IdataProduct;
          return productResponse;
    }

    

    //funcion para manejar descuento de stock
    async updateStock(webhookSaleData: JumpsellerWebhookSaleResponse) {
      const dataResponse = await this.jumpsellerService.jumpsellerWebhookSale(webhookSaleData.Body);
      
      const idProductFromWebhook= dataResponse.Body.products.map((product) => product.id);
      const existingId = await this.productModel.find({ id: { $in: idProductFromWebhook } }).exec();

      if (!existingId || existingId.length === 0) {
        throw new NotFoundException('No se encontró el producto en la base de datos');
      } else {
        // iterar sobre todos los productos del webhook
        for (const webhookProduct of dataResponse.Body.products) {
          const productToUpdate = existingId.find(product => product.id === webhookProduct.id);
          
          if (productToUpdate) {
            // carcular el nuevo stock general (stock en bd - cantidad vendida)
            const newStock = Math.max(0, productToUpdate.stock - webhookProduct.qty);
            
            // Crear registro de historial de stock
            const stockHistoryEntry = {
              quantityDiscounted: webhookProduct.qty,
              date: new Date(),
              orderId: dataResponse.Body.id || 'unknown',
              previousStock: productToUpdate.stock,
              newStock: newStock
            };

            // actualizar el stock del producto en bd y agregar historial
            await this.productModel.updateOne(
              { id: webhookProduct.id },
              { 
                $set: { stock: newStock },
                $push: { stockHistory: stockHistoryEntry }  // Agregar al historial
              }
            );
            
            this.logger.log(`stock actualizado para el id: ${webhookProduct.id}: el nuevo stock es ${newStock}`);
            
            // actualizar el stock de la variante si existe
            if (webhookProduct.variant_id && productToUpdate.variants && productToUpdate.variants.length > 0) {
              // Encontrar el stock anterior de la variante
              const variant = productToUpdate.variants.find(v => v.id === webhookProduct.variant_id);
              const previousVariantStock = variant ? variant.stock : 0;
              
              await this.productModel.updateOne(
                { 
                  id: webhookProduct.id,
                  "variants.id": webhookProduct.variant_id
                },
                { 
                  $inc: { "variants.$.stock": -webhookProduct.qty },
                  $push: { 
                    "variants.$.stockHistory": {
                      quantityDiscounted: webhookProduct.qty,
                      date: new Date(),
                      orderId: dataResponse.Body.id || 'unknown',
                      previousStock: previousVariantStock,
                      newStock: Math.max(0, previousVariantStock - webhookProduct.qty)
                    }
                  }
                }
              );
              
              this.logger.log(`sotck de variante actualizado para el producto con id 
                ${webhookProduct.id}, id de variante ${webhookProduct.variant_id}`);
            }
          }
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
