import { Test, TestingModule } from '@nestjs/testing';
import { AgilizarService } from './agilizar.service';

describe('AgilizarService', () => {
  let service: AgilizarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgilizarService],
    }).compile();

    service = module.get<AgilizarService>(AgilizarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
