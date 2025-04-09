import { Controller, Get,Query, Param, Post, HttpCode, Body} from '@nestjs/common';
import { JumpsellerService } from './jumpseller.service';
import { Order } from './interfaces/webhook/saleData.interface';

@Controller('jumpseller')
export class JumpsellerController {
  constructor(private readonly jumpsellerService: JumpsellerService,
  ) {}
  
@Post("webhook/sale")
@HttpCode(200)
async jumpsellerWebhookSale(@Body() jumpsellerWebhookSaleData: Order){
    return this.jumpsellerService.jumpsellerWebhookSale(jumpsellerWebhookSaleData); 
}
}