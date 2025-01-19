import { Test, TestingModule } from '@nestjs/testing';
import { ImportCostsController } from './import-costs.controller';
import { ImportCostsService } from './import-costs.service';

describe('ImportCostsController', () => {
  let controller: ImportCostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportCostsController],
      providers: [ImportCostsService],
    }).compile();

    controller = module.get<ImportCostsController>(ImportCostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
