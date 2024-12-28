import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class FilterService {
  buildFilterQuery(
    filters: Record<string, any> = {},
    searchTerm?: string,
    searchableFields: string[] = [],
  ): FilterQuery<any> {
    const filterQuery: FilterQuery<any> = {};

    // Procesar filtros específicos
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        // Manejar diferentes tipos de filtros
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Para filtros de rango, ej: { price: { $gte: 100, $lte: 200 } }
          filterQuery[key] = value;
        } else if (Array.isArray(value)) {
          // Para filtros con múltiples valores, ej: { status: ['active', 'pending'] }
          filterQuery[key] = { $in: value };
        } else if (typeof value === 'string') {
          // Para búsquedas parciales en strings
          filterQuery[key] = new RegExp(value, 'i');
        } else {
          // Para valores exactos
          filterQuery[key] = value;
        }
      }
    });

    // Añadir búsqueda global si se proporciona
    if (searchTerm && searchableFields.length > 0) {
      filterQuery.$or = searchableFields.map((field) => ({
        [field]: new RegExp(searchTerm, 'i'),
      }));
    }

    return filterQuery;
  }
}
