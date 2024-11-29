import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './entities/order.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgilizarService } from '../agilizar/agilizar.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly model: Model<OrderDocument>,
    private readonly agilizar: AgilizarService,
  ) {}
  async checkNewOrders() {
    const { get_reporteComprasResult: data } = await this.agilizar.getCompras(
      '2024-09-01',
      '2024-11-10',
    );
    for (const order of data) {
      const orderExists = await this.model.exists({
        numero_documento: order.numero_documento,
      });
      if (!orderExists) await this.model.create(order);
    }
    return {
      message: 'Order checked',
    };
  }

  async findAll() {
    const sales = await this.model.find().exec();
    return sales;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
