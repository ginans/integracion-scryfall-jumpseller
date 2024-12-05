import { Test, TestingModule } from '@nestjs/testing';
import { DefontanaService } from './defontana.service';

describe('DefontanaService', () => {
  let service: DefontanaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefontanaService],
    }).compile();

    service = module.get<DefontanaService>(DefontanaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
