import { Injectable } from '@nestjs/common';
import { CreateBasePriceDto } from './dto/create-base-price.dto';
import { BasePrice } from './entities/base-price.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IBasePrices } from './interface/base-prices.interface';
import { IBasePriceUpdate } from './interface/base-prices.interface';

@Injectable()
export class BasePricesService {
  constructor(
      @InjectModel(BasePrice.name) private basePriceModel: Model<BasePrice>,
    ) {}

  async createBasePrice (createBasePriceDto: CreateBasePriceDto) {
    try {
      const existingBasePriceGame = await this.basePriceModel.findOne({ game: createBasePriceDto.game, type: createBasePriceDto.type });
      if(existingBasePriceGame){
        throw new Error('Estos precios base ya se registraron');
      }else{
        return await this.basePriceModel.create(createBasePriceDto);
      }
    } catch (error) { 
      return error.message;
    }
  }

  async findAllBasePrices() {
    try {
      const basePrices = await this.basePriceModel.find().exec();
      if (basePrices.length === 0) {
        throw new Error("No hay precios base registrados");
      } else {
        return basePrices;
      }
    } catch (error) {
      return error.message;
    }
  }

  async findOne(id: string) {
    try{
      const existingBasePrice = await this.basePriceModel.findById(id);
        if (!existingBasePrice) {
          throw new Error('Este precio base no existe');
        }else{
          return existingBasePrice;   
        }
    }catch (error) {
      return error.message;
    }
  }

  

  async updateBasePrices(id: string, subId: string, basePrice: number): Promise< IBasePriceUpdate > {
    try {  
      const existingBasePrice = await this.basePriceModel.findById(id);
      if (!existingBasePrice) {
        throw new Error('Este precio base no existe');
      }
      // Acceso y actualización del _id de un objeto dentro del array basePrices
      const response: IBasePrices = await this.basePriceModel.findOneAndUpdate(
          { _id: id },
          { $set: { "basePrices.$[elem].price": basePrice } },
          {
            arrayFilters: [{ "elem._id": new Types.ObjectId(subId) }],
            new: true
          }
        );
        
      return  {
        game: response.game,
        details: response.basePrices.find(item => item._id === subId) || null
      } 
    } catch (error) {
      throw new Error(`Error al actualizar el precio base: ${error.message}`);
    }
  }
  
  remove(id: number) {
    return `This action removes a #${id} basePrice`;
  }
}
