import { Test, TestingModule } from '@nestjs/testing';
import { RegistersController } from './registers.controller';
import { RegistersService } from './registers.service';

describe('RegistersController', () => {
  let controller: RegistersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistersController],
      providers: [RegistersService],
    }).compile();

    controller = module.get<RegistersController>(RegistersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
