import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Kardex, KardexDocument } from './entities/kardex.entity';
import { CreateKardexDto } from './dto/create-kardex.dto';
import { UpdateKardexDto } from './dto/update-kardex.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class KardexService {
  constructor(
    @InjectModel(Kardex.name) private readonly kardexModel: Model<KardexDocument>,
  ) {}

  async createKardex(createKardexDto: CreateKardexDto): Promise<Kardex> {
    try {
      const transformedDto = plainToClass(CreateKardexDto, createKardexDto);
      const createdKardex = new this.kardexModel(transformedDto);
      return await createdKardex.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(`El idTransmission ya existe en la base de datos`);
      }
      throw new InternalServerErrorException(`Error al crear el Kardex: ${error.message}`);
    }
  }

  async getAllKardex(): Promise<Kardex[]> {
    try {
      return await this.kardexModel.find().exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching Kardex: ${error.message}`);
    }
  }

  async getKardexById(id: string): Promise<Kardex> {
    try {
      console.log(`Buscando Kardex con ID: ${id}`);
      
      let objectId;
      try {
        objectId = new Types.ObjectId(id);
      } catch (error) {
        throw new BadRequestException(`ID "${id}" no es un formato válido de MongoDB`);
      }
      
      const kardex = await this.kardexModel.collection.findOne({ _id: objectId });
      
      if (!kardex) {
        console.log('No se encontró el documento'); 
        throw new NotFoundException(`Kardex con ID "${id}" no encontrado`);
      }
      console.log('Documento encontrado:', kardex);
      return kardex as unknown as Kardex;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error completo:', error);
      throw new InternalServerErrorException(`Error al obtener el Kardex: ${error.message}`);
    }
  }

  async updateKardex(id: string, updateKardexDto: UpdateKardexDto): Promise<Kardex> {
    try {
      let objectId;
      try {
        objectId = new Types.ObjectId(id);
      } catch (error) {
        throw new BadRequestException(`ID "${id}" no es un formato válido de MongoDB`);
      }
  
      const result = await this.kardexModel.collection.updateOne(
        { _id: objectId },
        { $set: { ...updateKardexDto, updatedAt: new Date() } }
      );
      
      if (result.matchedCount === 0) {
        throw new NotFoundException(`Kardex con ID "${id}" no encontrado`);
      }
      
      return await this.getKardexById(id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error actualizando Kardex: ${error.message}`);
    }
  }

  async deleteKardex(id: string): Promise<any> {
    try {
      let objectId;
      try {
        objectId = new Types.ObjectId(id);
      } catch (error) {
        throw new BadRequestException(`ID "${id}" no es un formato válido de MongoDB`);
      }
      const kardex = await this.kardexModel.collection.findOne({ _id: objectId });
      if (!kardex) {
        throw new NotFoundException(`Kardex con ID "${id}" no encontrado`);
      }
      await this.kardexModel.collection.deleteOne({ _id: objectId });
      return `El Kardex con ID "${id}" fue eliminado exitosamente`;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error eliminando Kardex: ${error.message}`);
    }
  }
}