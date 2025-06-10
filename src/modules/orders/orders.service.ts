import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Order, OrderDocument, Products } from './entities/order.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SortOrder } from 'src/common/enums/query.enum';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async createOrders(order: IMappedOrders ): Promise<OrderDocument> {
    this.logger.log('ENTRO AQUI A GUARDAR', order);
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

  async findAllFullOrders(query: PaginationQueryDto) {
     const { limit, page, sortBy, sortOrder, to, from, search } = query;
    
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
                input: { $toString: "$name" },
                regex: searchValue,
                options: "i"
              }
            }
          });
        

          // filters.$or.push({
          //   products: {
          //     $elemMatch: {
          //       sku: { $regex: searchValue, $options: "i" }
          //     }
          //   }
          // });
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

  //TODO:refactorizar
  async findAllOrders(query: PaginationQueryDto) {
     const { limit, page, sortBy, sortOrder, to, from, search } = query;
    
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
                input: { $toString: "$sku" },
                regex: searchValue,
                options: "i"
              }
            }
          });
        

          // filters.$or.push({
          //   products: {
          //     $elemMatch: {
          //       sku: { $regex: searchValue, $options: "i" }
          //     }
          //   }
          // });
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
          // Primero obtener todas las órdenes que coinciden con los filtros (sin limit para contar productos)
          const allOrders = await this.orderModel.find(filters).exec();
          
          // Expandir todos los productos para contar el total real
          const allProducts = allOrders.map((order: OrderDocument) => {
            return order.products.map((product: Products) => ({
              _id: order._id,
              orderId: order.orderId,
              productId: product.id,
              variantId: product.variantId,
              sku: product.sku,
              name: product.name,
              image: product.image,
              price: product.price,
              discount: product.discount,
              qty: product.qty,
              shipping: order.shipping,
              total: order.total,
              orderStatus: order.statusJumpseller,
              saleCreationDate: order.saleCreationDate,
              saleCompletedDate: order.saleCompletedDate,
            }))
          }).flat();

          // Aplicar paginación sobre los productos expandidos
          const skip = (page - 1) * limit;
          const paginatedProducts = allProducts
            .sort((a, b) => {
              const field = sortBy;
              if (sortOrder === SortOrder.ASC) {
                return a[field] > b[field] ? 1 : -1;
              } else {
                return a[field] < b[field] ? 1 : -1;
              }
            })
            .slice(skip, skip + limit);

          const totalProducts = allProducts.length;

          return {
            items: paginatedProducts,
            meta: {
              totalItems: totalProducts,
              itemsPerPage: paginatedProducts.length,
              totalPages: Math.ceil(totalProducts / limit),
              currentPage: page,
              hasNextPage: totalProducts > (page * limit),
              hasPreviousPage: page > 1,
            }
          }
        } catch (error) {
          throw new InternalServerErrorException(`Error fetching Orders: ${error.message}`);
        }
  }

  async findOneOrder(_id: string): Promise<Order> {
    try {
      if (!Types.ObjectId.isValid(_id))
        throw new BadRequestException('Formato de ID inválido');
      const order = await this.orderModel.findOne({ _id: new Types.ObjectId(_id) }).exec();
      if (!order) throw new NotFoundException('Order no encontrada');
      return order;
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching Order: ${error.message}`);
    }
  }

}
