import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBasePriceDto } from './dto/create-base-price.dto';
import { BasePrice } from './entities/base-price.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IBasePrices } from './interface/base-prices.interface';
import { IBasePriceUpdate } from './interface/base-prices.interface';
import { RedisCacheService } from 'src/common/services/redis-cache.service';

@Injectable()
export class BasePricesService {
  constructor(
    @InjectModel(BasePrice.name) private basePriceModel: Model<BasePrice>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async createBasePrice(createBasePriceDto: CreateBasePriceDto) {
    try {
      const existingBasePriceGame = await this.basePriceModel.findOne({
        game: createBasePriceDto.game,
        type: createBasePriceDto.type,
      });
      if (existingBasePriceGame) {
        throw new Error('Estos precios base ya se registraron');
      } else {
        return await this.basePriceModel.create(createBasePriceDto);
      }
    } catch (error) {
      return error.message;
    }
  }

  async findAllBasePrices() {
    // Usar cache para los precios base ya que no cambian frecuentemente
    return this.redisCacheService.getOrSet(
      'prices:base_prices',
      async () => {
        try {
          const basePrices = await this.basePriceModel.find().exec();
          if (basePrices.length === 0) {
            throw new Error('No hay precios base registrados');
          } else {
            // Log para debug - muestra los IDs reales
            console.log(
              'IDs encontrados:',
              basePrices.map((bp) => ({
                id: bp._id.toString(),
                game: bp.game,
              })),
            );
            return basePrices;
          }
        } catch (error) {
          throw new Error(error.message);
        }
      },
      300, // 5 minutos de cache para precios base
    );
  }

  async findOne(id: string) {
    try {
      // Validar que el ID sea un ObjectId válido
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID no es válido');
      }

      const existingBasePrice = await this.basePriceModel.findById(id);
      if (!existingBasePrice) {
        throw new NotFoundException('Este precio base no existe');
      }
      return existingBasePrice;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error(`Error al buscar precio base: ${error.message}`);
    }
  }

  async updateBasePrices(
    id: string,
    subId: string,
    basePrice: number,
  ): Promise<IBasePriceUpdate> {
    try {
      // Validar que los IDs sean ObjectId válidos
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID principal no es válido');
      }
      if (!Types.ObjectId.isValid(subId)) {
        throw new BadRequestException('SubID no es válido');
      }

      const existingBasePrice = await this.basePriceModel.findById(id);
      if (!existingBasePrice) {
        throw new NotFoundException('Este precio base no existe');
      }

      // Acceso y actualización del _id de un objeto dentro del array basePrices
      const response: IBasePrices = await this.basePriceModel.findOneAndUpdate(
        { _id: id },
        { $set: { 'basePrices.$[elem].price': basePrice } },
        {
          arrayFilters: [{ 'elem._id': new Types.ObjectId(subId) }],
          new: true,
        },
      );

      console.log('Respuesta de la actualización:', response);

      const updatedItem = response.basePrices.find(
        (item) => item._id.toString() === subId.toString(),
      );

      console.log('Elemento actualizado:', updatedItem);
      return {
        game: response.game,
        details: updatedItem || null,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error(`Error al actualizar el precio base: ${error.message}`);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} basePrice`;
  }
}
