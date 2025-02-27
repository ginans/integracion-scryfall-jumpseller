import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Kardex, KardexDocument } from './entities/kardex.entity';
import { CreateKardexDto } from './dto/create-kardex.dto';
import { UpdateKardexDto } from './dto/update-kardex.dto';
import { plainToClass } from 'class-transformer';
import { QueryDto, SortBy } from './dto/query-kardex.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { SortOrder } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class KardexService {
  constructor(
    @InjectModel(Kardex.name) private readonly kardexModel: Model<KardexDocument>,
  ) {}

  async createKardex(createKardexDto: CreateKardexDto): Promise<Kardex> {
    try {
      //const transformedDto = plainToClass(CreateKardexDto, createKardexDto);  
      const createdKardex = new this.kardexModel(createKardexDto);
      return await createdKardex.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(`El idTransmission ya existe en la base de datos`);
      }
      throw new InternalServerErrorException(`Error al crear el Kardex: ${error.message}`);
    }
  }

  async getAllKardex(query: QueryDto): Promise<PaginatedResponse<Kardex>> {
    const {limit, page, sortBy, sortOrder , search, to, from} = query;
    console.log("query: ", query)
    const sort: { [key: string]: 1 | -1 } = {
      [sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
    };

    const skip = (page - 1) * limit;
    const filters: { $or?: any[], $and?: any[] } = {}

    if (search && search.length > 0) {
      const searchValue = search.trim();
      filters.$or = [];
      if (!isNaN(Number(searchValue))) {
        filters.$or.push({ idTransmission: Number(searchValue) });
      }
      filters.$or.push({ 
        $expr: { 
          $regexMatch: { 
            input: { $toString: "$idTransmission" }, 
            regex: searchValue,
            options: "i"
          }
        }
      });
    }

    if (from && to) {
      filters.$and = [
      { createdAtData: { 
        $gte: new Date(`${from}T00:00:00.000Z`), 
        $lte: new Date(`${to}T23:59:59.999Z`)
        } 
      },
      ];
    }   
   
    try {
      const [kardex, total] = await Promise.all([
        this.kardexModel.find(filters).sort(sort).skip(skip).limit(limit).exec(),
        this.kardexModel.countDocuments(filters).exec()
      ]);
      return {
        items: kardex,
        meta: {
          totalItems: total,
          itemsPerPage: kardex.length,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          hasNextPage: total > (page * limit),
          hasPreviousPage: page > 1,
      }
    }
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

}