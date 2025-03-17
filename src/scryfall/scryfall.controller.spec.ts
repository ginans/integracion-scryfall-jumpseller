import { Test, TestingModule } from '@nestjs/testing';
import { ScryfallController } from './scryfall.controller';
import { ScryfallService } from './scryfall.service';

describe('ScryfallController', () => {
  let controller: ScryfallController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScryfallController],
      providers: [ScryfallService],
    }).compile();

    controller = module.get<ScryfallController>(ScryfallController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
