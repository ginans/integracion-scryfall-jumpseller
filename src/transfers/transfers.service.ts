import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transfers, TransfersDocument } from './entities/transfers.entity';
import { CreateTransfersDto } from './dto/create-transfers.dto';
import { UpdateTransfersDto } from './dto/update-transfers.dto';
// import { plainToClass } from 'class-transformer';
import { QueryTransfersDto } from './dto/query-transfers.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { SortOrder } from 'src/common/enums/sortOrder.enum'

@Injectable() 
export class TransfersService {
  constructor(
    @InjectModel(Transfers.name) private readonly transfersModel: Model<TransfersDocument>,
  ) {}

  async createTransfers(createTransfersDto: CreateTransfersDto): Promise<Transfers> {
    try {
      // const transformedDto = plainToClass(CreateTransfersDto, createTransfersDto);  
      const createdTransfers = new this.transfersModel(createTransfersDto);
      return await createdTransfers.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(`El idTransmission ya existe en la base de datos`);
      }
      throw new InternalServerErrorException(`Error al crear el Transfers: ${error.message}`);
    }
  }

  async getAllTransfers(query: QueryTransfersDto): Promise<PaginatedResponse<Transfers>> {
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
          createdAtData: {
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
      const [transfers, total] = await Promise.all([
        this.transfersModel.find(filters).sort(sort).skip(skip).limit(limit).exec(),
        this.transfersModel.countDocuments(filters).exec()
      ]);
      return {
        items: transfers,
        meta: {
          totalItems: total,
          itemsPerPage: transfers.length,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          hasNextPage: total > (page * limit),
          hasPreviousPage: page > 1,
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching Transfers: ${error.message}`);
    }
  }

  async getTransfersById(id: string): Promise<Transfers> {
    try {
      console.log(`Buscando Transfers con ID: ${id}`);
      
      let objectId;
      try {
        objectId = new Types.ObjectId(id);
      } catch (error) {
        throw new BadRequestException(`ID "${id}" no es un formato válido de MongoDB`);
      }
      
      const transfers = await this.transfersModel.collection.findOne({ _id: objectId });
      
      if (!transfers) {
        console.log('No se encontró el documento'); 
        throw new NotFoundException(`Transfers con ID "${id}" no encontrado`);
      }
      console.log('Documento encontrado:', transfers);
      return transfers as unknown as Transfers;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error completo:', error);
      throw new InternalServerErrorException(`Error al obtener el Transfers: ${error.message}`);
    }
  }

  async updateTransfers(id: string, updateTransfersDto: UpdateTransfersDto): Promise<Transfers> {
    try {
      let objectId;
      try {
        objectId = new Types.ObjectId(id);
      } catch (error) {
        throw new BadRequestException(`ID "${id}" no es un formato válido de MongoDB`);
      }
  
      const result = await this.transfersModel.collection.updateOne(
        { _id: objectId },
        { $set: { ...updateTransfersDto, updatedAt: new Date() } }
      );
      
      if (result.matchedCount === 0) {
        throw new NotFoundException(`Transfers con ID "${id}" no encontrado`);
      }
      
      return await this.getTransfersById(id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error actualizando Transfers: ${error.message}`);
    }
  }

}