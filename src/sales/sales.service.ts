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
      '2024-11-10',
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
    const sales = await this.model.find().exec();
    return sales.map((sale) => ({
      uuid: sale._id,
      order_id: sale.OBJECT_ID,
      client_name: sale?.Cliente?.[0]?.nombre ?? null,
      sucursal_name: sale?.Sucursal?.[0]?.nombre ?? null,
      sale_status: sale?.VentaEstado?.[0]?.nombre ?? null,
      status: sale.esta_activo,
      delivery_date: sale.fecha_entrega,
      checkin_date: sale.fecha_ingreso,
      iva: sale.iva,
      neto: sale.neto,
      nr_document: sale.numero_documento,
      status_payment: sale.pagado ? 'Pagado' : 'Pendiente',
      total: sale.total,
    }));
  }

  async findOne(id: string) {
    const sale = await this.model.findById(id).exec();
    if (sale) return sale;
    throw new NotFoundException('Sale not found');
  }
}
