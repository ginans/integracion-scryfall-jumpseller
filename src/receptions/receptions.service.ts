import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reception, ReceptionDocument } from './entities/reception.entity';
import { CreateReceptionDto } from './dto/create-reception.dto';
import { UpdateReceptionDto } from './dto/update-reception.dto';
import { QueryReceptionDto } from './dto/query-reception.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { SortOrder } from 'src/common/enums/sortOrder.enum'

@Injectable() 
export class ReceptionsService {
  constructor(
    @InjectModel(Reception.name) private readonly receptionModel: Model<ReceptionDocument>,
  ) {}

  async createReceptions(createReceptionDto: CreateReceptionDto): Promise<Reception> {
    try { 
      const createdReception = new this.receptionModel(createReceptionDto);
      return await createdReception.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(`El receptionNbr ya existe en la base de datos`);
      }
      throw new InternalServerErrorException(`Error al crear el Reception: ${error.message}`);
    }
  }

  async getAllReceptions(query: QueryReceptionDto): Promise<PaginatedResponse<Reception>> {
    const { limit, page, sortBy, sortOrder, search, to, from, state } = query;
    console.log("query: ", query);
    const sort: { [key: string]: 1 | -1 } = {
      [sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
    };

    const skip = (page - 1) * limit;
    const filters: { $or?: any[], $and?: any[] } = {};

    if (search && search.length > 0) {
      const searchValue = search.trim();
      filters.$or = [];
      // if (!isNaN(Number(searchValue))) {
      //   filters.$or.push({ receptionNbr: Number(searchValue) });
      // }
      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$receptionNbr" },
            regex: searchValue,
            options: "i"
          }
        }
      });
      filters.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$state" },
            regex: searchValue,
            options: "i"
          }
        }
      });
    }

    if (from && to) {
      filters.$and = [
        {
          createdAt: { //preguntar
            $gte: new Date(`${from}T00:00:00.000Z`),
            $lte: new Date(`${to}T23:59:59.999Z`)
          }
        },
      ];
    }

    if (state) {
      const stateFilter = { state };
      filters.$and = filters.$and ? [...filters.$and, stateFilter] : [stateFilter];
    }

    console.log('Filtros:', filters);
    console.log('Orden:', sort);
    console.log('Saltar:', skip);
    console.log('Limit:', limit);
    console.log('Página:', page);
    console.log('Búsqueda:', search);

    try {
      const [reception, total] = await Promise.all([
        this.receptionModel.find(filters).sort(sort).skip(skip).limit(limit).exec(),
        this.receptionModel.countDocuments(filters).exec()
      ]);
      return {
        items: reception,
        meta: {
          totalItems: total,
          itemsPerPage: reception.length,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          hasNextPage: total > (page * limit),
          hasPreviousPage: page > 1,
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching Receptions: ${error.message}`);
    }
  }

  async getReceptionById(id: string): Promise<Reception> {
    try {
      console.log(`Buscando Reception con ID: ${id}`);
      
      let objectId;
      try {
        objectId = new Types.ObjectId(id);
      } catch (error) {
        throw new BadRequestException(`ID "${id}" no es un formato válido de MongoDB`);
      }
      
      const reception = await this.receptionModel.collection.findOne({ _id: objectId });
      
      if (!reception) {
        console.log('No se encontró el documento'); 
        throw new NotFoundException(`Reception con ID "${id}" no encontrado`);
      }
      console.log('Documento encontrado:', reception);
      return reception as unknown as Reception;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error completo:', error);
      throw new InternalServerErrorException(`Error al obtener el Reception: ${error.message}`);
    }
  }

  async updateReception(id: string, updateReceptionDto: UpdateReceptionDto): Promise<Reception> {
    try {
      let objectId;
      try {
        objectId = new Types.ObjectId(id);
      } catch (error) {
        throw new BadRequestException(`ID "${id}" no es un formato válido de MongoDB`);
      }
  
      const result = await this.receptionModel.collection.updateOne(
        { _id: objectId },
        { $set: { ...updateReceptionDto, updatedAt: new Date() } }
      );
      
      if (result.matchedCount === 0) {
        throw new NotFoundException(`Reception con ID "${id}" no encontrado`);
      }
      
      return await this.getReceptionById(id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error actualizando Reception: ${error.message}`);
    }
  }

}