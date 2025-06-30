import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Order, OrderDocument, Products } from './entities/order.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';
import { StateOrderEnum } from './enums/state-order.enum';
import { OrderStateDto } from './dto/order-state.dto';
import { PaginationOrdersQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async createOrders(order: IMappedOrders ): Promise<OrderDocument> {
   try{
     // Validar si la orden ya existe
     const existingOrder = await this.orderModel.findOne({ orderId: order.orderId }).exec();
     if (existingOrder) {
       throw new Error("La orden ya existe en la base de datos");
     }
     // Crear la nueva orden en la base de datos
     const newOrder = new this.orderModel(order);
     await newOrder.save();
     return newOrder;
    } catch (error) {
      throw new Error(`Error creando la orden: ${error.message}`);
    }
  }

  async findAllOrders(query: PaginationOrdersQueryDto) {
     const { limit, page, sortBy, sortOrder, to, from, search, state } = query;

        const sort: { [key: string]: 1 | -1 } = {
          [sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
        };
    
        const skip = (page - 1) * limit;
        const filters: { $or?: any[], $and?: any[] } = {};
    
        if (search && search.length > 0) {
          const searchValue = search.trim();
          filters.$or = [];
          if (!isNaN(Number(searchValue))) {
            filters.$or.push({ orderId: Number(searchValue) });
          }
          filters.$or.push({
            $expr: {
              $regexMatch: {
                input: "$shippingMethodName",
                regex: searchValue,
                options: "i"
              }
            }
          });
          filters.$or.push({
            products: {
              $elemMatch: {
                sku: { $regex: searchValue, $options: "i" }
              }
            }
          });
        }

        //filtro por estado
        if (state) {
          const stateFilter = { state: { $regex: `^${state}$`, $options: "i" } };
          filters.$and = filters.$and ? [...filters.$and, stateFilter] : [stateFilter];
        }

    
        if (from && to) {
          filters.$and = [
            {
              createdAt: {
                $gte: new Date(`${from}T00:00:00.000Z`),
                $lte: new Date(`${to}T23:59:59.999Z`)
              }
            },
          ];
        }
        try {
          const [orders, total] = await Promise.all([
            this.orderModel.find(filters).sort(sort).skip(skip).limit(limit).exec(),
            this.orderModel.countDocuments(filters).exec()
          ]);
          return {
            items: orders,
            meta: {
              totalItems: total,
              itemsPerPage: orders.length,
              totalPages: Math.ceil(total / limit),
              currentPage: page,
              hasNextPage: total > (page * limit),
              hasPreviousPage: page > 1,
            }
          }
        } catch (error) {
          throw new InternalServerErrorException(`Error fetching Orders: ${error.message}`);
        }
  }

  async findOneOrder(_id: string) {
    try {
      if (!Types.ObjectId.isValid(_id))
        throw new BadRequestException('Formato de ID inválido');
      const order = await this.orderModel.findOne({ _id: new Types.ObjectId(_id) }).exec();
      if (!order) throw new NotFoundException('Order no encontrada');
      return order
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching Order: ${error.message}`);
    }
  }

  async changeOrderStates(_id: string, state: OrderStateDto): Promise<OrderDocument> {
    try {
      if (!Types.ObjectId.isValid(_id)) {
        throw new BadRequestException('Formato de ID inválido');
      }

      let newState: StateOrderEnum;
      switch (state.state) {
        case StateOrderEnum.PENDING:
          newState = StateOrderEnum.PENDING;
          break;
        case StateOrderEnum.PREPARING:
          newState = StateOrderEnum.PREPARING;
          break;
        case StateOrderEnum.UNDER_REVIEW:
          newState = StateOrderEnum.UNDER_REVIEW;
          break;
        case StateOrderEnum.READY_FOR_PICKUP:
          newState = StateOrderEnum.READY_FOR_PICKUP;
          break;
        case StateOrderEnum.READY_FOR_DISPATCH:
          newState = StateOrderEnum.READY_FOR_DISPATCH;
          break;
        case StateOrderEnum.DELIVERED:
          newState = StateOrderEnum.DELIVERED;
          break;
        default:
          throw new BadRequestException('Estado de orden no válido');
      }

      const order = await this.orderModel.findOneAndUpdate(
        { _id: new Types.ObjectId(_id) },
        { $set: { state: newState } },
        { new: true }
      );

      if (!order) throw new NotFoundException('Order no encontrada');
      return order;
    } catch (error) {
      throw new InternalServerErrorException(`Error updating Order: ${error.message}`);
    }
  }
}
