import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
// import { StockSchema, Stock } from './entities/stock.entity';

@Module({
  controllers: [StockController],
  providers: [StockService],
  imports: [
    // MongooseModule.forFeature([{ name: Stock.name, schema: StockSchema }]),
  ],
  exports: [StockService],
})
export class StockModule {}
