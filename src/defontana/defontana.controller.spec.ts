import { Test, TestingModule } from '@nestjs/testing';
import { DefontanaController } from './defontana.controller';
import { DefontanaService } from './defontana.service';

describe('DefontanaController', () => {
  let controller: DefontanaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefontanaController],
      providers: [DefontanaService],
    }).compile();

    controller = module.get<DefontanaController>(DefontanaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
