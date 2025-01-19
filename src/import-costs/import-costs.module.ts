import { Module } from '@nestjs/common';
import { ImportCostsService } from './import-costs.service';
import { ImportCostsController } from './import-costs.controller';
import {MongooseModule} from "@nestjs/mongoose";
import {ImportCost, ImportCostSchema} from "./entities/import-cost.entity";

@Module({
  controllers: [ImportCostsController],
  providers: [ImportCostsService],
  imports: [
      MongooseModule.forFeature([{ name: ImportCost.name, schema: ImportCostSchema }]),
  ],
})
export class ImportCostsModule {}
