import { Test, TestingModule } from '@nestjs/testing';
import { JumpsellerService } from './jumpseller.service';

describe('JumpsellerService', () => {
  let service: JumpsellerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JumpsellerService],
    }).compile();

    service = module.get<JumpsellerService>(JumpsellerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
