import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResult } from '../interface/paginated-result.interface';
import { ExportService } from './export.service';

@Injectable()
export class PaginationService {
  constructor(private readonly exportService: ExportService) {}

  async paginate<T>(
    model: Model<T>,
    query: PaginationQueryDto,
    filterQuery: FilterQuery<T> = {},
    populate: string[] = [],
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Construir el objeto de ordenamiento
    const sort: Record<string, 'asc' | 'desc'> = {};
    if (sortBy) {
      sort[sortBy] = sortOrder;
    }

    // Ejecutar consultas en paralelo
    const [items, totalItems] = await Promise.all([
      model
        .find(filterQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate(populate)
        .exec(),
      model.countDocuments(filterQuery).exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      meta: {
        totalItems,
        itemsPerPage: +limit,
        totalPages,
        currentPage: +page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  private buildFilterQuery<T>(query: PaginationQueryDto): FilterQuery<T> {
    const {} = query;
    const filterQuery: FilterQuery<T> = {};
    if (filters) {
      for (const key in filters) {
        if (filters.hasOwnProperty(key)) {
          filterQuery[key] = new RegExp(filters[key], 'i');
        }
      }
    }
    return filterQuery;
  }
}
