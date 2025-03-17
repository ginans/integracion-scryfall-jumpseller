import { Injectable } from '@nestjs/common';
import { CreateProductCardDto } from './dto/create-product-card.dto';
import { UpdateProductCardDto } from './dto/update-product-card.dto';

@Injectable()
export class ProductCardsService {
  create(createProductCardDto: CreateProductCardDto) {
    return 'This action adds a new productCard';
  }

  findAll() {
    return `This action returns all productCards`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productCard`;
  }

  update(id: number, updateProductCardDto: UpdateProductCardDto) {
    return `This action updates a #${id} productCard`;
  }

  remove(id: number) {
    return `This action removes a #${id} productCard`;
  }
}
