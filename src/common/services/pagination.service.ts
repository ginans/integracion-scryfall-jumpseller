import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';

@Injectable()
export class PaginationService {
  async paginate<T>(
    model: Model<T>,
    dto: PaginationQueryDto,
    searchableFields: string[] = [],
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10, sortBy, sortOrder, search, filters } = dto;
    const skip = (page - 1) * limit;
    // Construir el objeto de consulta
    const query: FilterQuery<T> = {};
    if (search && searchableFields.length > 0) {
      (query as any).$or = searchableFields.map((field) => ({
        [field]: { $regex: search, $options: 'i' },
      }));
    }
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          (query as any)[key] = value;
        }
      });
    }
    // Crear el sort object para Mongoose
    const sortObject = sortBy ? { [sortBy]: sortOrder } : {};

    // Ejecutar las consultas en paralelo
    const [items, totalItems] = await Promise.all([
      model.find(query).sort(sortObject).skip(skip).limit(limit).exec(),
      model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const meta = {
      totalItems,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return { items, meta };
  }
}
