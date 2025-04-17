import { ConflictException, Injectable } from '@nestjs/common';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Price } from './entities/price.entity';
import { EnumGame } from './enums/games.enum';

@Injectable()
export class PricesService {
  constructor(
    @InjectModel(Price.name) private priceModel: Model<Price>,
  ) {}
  
  //funcion para guardar en base d datos
  async createPrice(createPriceDto: CreatePriceDto) {
    try{
      const existingPriceGame = await this.priceModel.findOne({ gameID: createPriceDto.gameID });
      if(existingPriceGame){
        throw new Error('Este juego ya se registro');
      }else{
        return await this.priceModel.create(createPriceDto);
      }
    }catch(error) {
      return error;
    }
  }

  findAllPrices() {
    try{
      return this.priceModel.find({}).exec();
    }catch(error) {
      return error;
    }
  }
  
  findOne(id: number) {
    return `This action returns a #${id} price`;
  }

  async updatePriceByGame(gameID: string, usdPrice: number) {
    try {
      const updatedPrice = await this.priceModel.findOneAndUpdate(
        { gameID },
        { usdPrice },
        { new: true }
      );
      
      if (!updatedPrice) {
        throw new Error('Game not found');
      }
      return updatedPrice;
    } catch (error) {
      return error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} price`;
  }
}
