import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './entities/product.entity';
import { IdataProduct, IsetProduct } from './interface/product.interface';
import { JumpsellerGetAllProductResponse } from 'src/jumpseller/interfaces/jumpsellerProducts/jumpsellerGetAllProduct.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
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


  async findById(id: number):Promise<IdataProduct[]> {
    return await this.productModel.find({id}) as unknown as IdataProduct[];
  }

  update(id: string) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
