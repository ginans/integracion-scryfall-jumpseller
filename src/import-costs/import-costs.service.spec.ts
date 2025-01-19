import { Test, TestingModule } from '@nestjs/testing';
import { ImportCostsService } from './import-costs.service';

describe('ImportCostsService', () => {
  let service: ImportCostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportCostsService],
    }).compile();

    service = module.get<ImportCostsService>(ImportCostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
