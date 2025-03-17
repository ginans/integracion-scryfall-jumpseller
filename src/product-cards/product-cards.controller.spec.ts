import { Test, TestingModule } from '@nestjs/testing';
import { ProductCardsController } from './product-cards.controller';
import { ProductCardsService } from './product-cards.service';

describe('ProductCardsController', () => {
  let controller: ProductCardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductCardsController],
      providers: [ProductCardsService],
    }).compile();

    controller = module.get<ProductCardsController>(ProductCardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
