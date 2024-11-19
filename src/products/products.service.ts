import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ProductInterface } from './interface/product.interface';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private model: Model<Product>,
  ) {}
  create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }

  async findAll() {
    return await this.model.find().exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
  async findProductByUuid(uuid: number) {
    return await this.model.findOne({ uuid }).exec();
  }
  async findProductBySku(sku: string) {
    return await this.model.findOne({ sku }).exec();
  }
  async createProduct(product: ProductInterface) {
    return await this.model.create(product);
  }
}
