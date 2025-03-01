import { Test, TestingModule } from '@nestjs/testing';
import { ReceptionsService } from './receptions.service';

describe('ReceptionsService', () => {
  let service: ReceptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReceptionsService],
    }).compile();

    service = module.get<ReceptionsService>(ReceptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
