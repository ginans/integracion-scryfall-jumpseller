import { Test, TestingModule } from '@nestjs/testing';
import { ProductCardsService } from './product-cards.service';

describe('ProductCardsService', () => {
  let service: ProductCardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductCardsService],
    }).compile();

    service = module.get<ProductCardsService>(ProductCardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
