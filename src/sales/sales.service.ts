import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Sale } from './entities/sale.entity';
import { AgilizarService } from '../agilizar/agilizar.service';
import { Model } from 'mongoose';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name)
    private readonly model: Model<Sale>,
    private readonly agilizar: AgilizarService,
  ) {}
  async checkNewSales() {
    const { get_reporteVentasResult: data } = await this.agilizar.getVentas(
      '2024-09-01',
      '2024-09-05',
    );
    for (const sale of data) {
      const saleExists = await this.model.exists({ OBJECT_ID: sale.OBJECT_ID });
      if (!saleExists) await this.model.create(sale);
    }
    return {
      message: 'Sales checked',
    };
  }

  async findAll() {
    return await this.model.find().exec();
  }

  async findOne(id: string) {
    const sale = await this.model.findById(id).exec();
    if (sale) return sale;
    throw new NotFoundException('Sale not found');
  }
}
