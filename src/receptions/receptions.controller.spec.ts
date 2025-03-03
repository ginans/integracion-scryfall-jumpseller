import { Test, TestingModule } from '@nestjs/testing';
import { ReceptionsController } from './receptions.controller';
import { ReceptionsService } from './receptions.service';

describe('ReceptionsController', () => {
  let controller: ReceptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReceptionsController],
      providers: [ReceptionsService],
    }).compile();

    controller = module.get<ReceptionsController>(ReceptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
