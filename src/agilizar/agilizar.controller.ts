import { Controller, Get } from '@nestjs/common';
import { AgilizarService } from './agilizar.service';
import { SellResponse } from './interface/SellResponse.interface';

@Controller('agilizar')
export class AgilizarController {
  constructor(private readonly agilizarService: AgilizarService) {}
  @Get('obtener-ventas')
  getSell(): Promise<SellResponse> {
    return this.agilizarService.getVentas();
  }
}
