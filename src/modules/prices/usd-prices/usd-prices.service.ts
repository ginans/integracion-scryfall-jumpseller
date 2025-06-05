import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUsdPriceDto } from './dto/create-usd-price.dto';
import { UpdatePriceDto } from './dto/update-usd-price.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsdPrice } from './entities/usd-price.entity';
import { IUsdPrice } from './interfaces/usd-prices.interface';

@Injectable()
export class UsdPricesService {
  constructor(
    @InjectModel(UsdPrice.name) private usdPriceModel: Model<UsdPrice>,
  ) {}
  
  //funcion para guardar en base d datos
  async createPrice(createUsdPriceDto: CreateUsdPriceDto) {
    try{
      const existingUsdPriceGame = await this.usdPriceModel.findOne({ gameID: createUsdPriceDto.gameID });
      if(existingUsdPriceGame){
        throw new Error('Este juego ya se registro');
      }else{
        return await this.usdPriceModel.create(createUsdPriceDto);
      }
    }catch(error) {
      return error;
    }
  }

  findAllPrices() {
    try{
      return this.usdPriceModel.find({}).exec();
    }catch(error) {
      return error;
    }
  }
  
  findOne(id: number) {
    return `This action returns a #${id} price`;
  }

  async updateUsdPriceByGame(gameID: string, usdPrice: number) : Promise<IUsdPrice> {
    try {
      const updatedPrice : IUsdPrice = await this.usdPriceModel.findOneAndUpdate(
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
