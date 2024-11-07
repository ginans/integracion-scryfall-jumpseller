import { Test, TestingModule } from '@nestjs/testing';
import { AgilizarController } from './agilizar.controller';
import { AgilizarService } from './agilizar.service';

describe('AgilizarController', () => {
  let controller: AgilizarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgilizarController],
      providers: [AgilizarService],
    }).compile();

    controller = module.get<AgilizarController>(AgilizarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
