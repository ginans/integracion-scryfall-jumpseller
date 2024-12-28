/**
 * Interfaz genérica para resultados paginados
 * @template T - Tipo de datos que contendrá la paginación
 */
export interface PaginatedResult<T> {
  items: T[];
  meta: {
    // Número total de elementos en toda la colección
    totalItems: number;
    // Cantidad de elementos por página
    itemsPerPage: number;
    // Número total de páginas disponibles
    totalPages: number;
    // Página actual
    currentPage: number;
    // Indica si existe una página siguiente
    hasNextPage: boolean;
    // Indica si existe una página anterior
    hasPreviousPage: boolean;
  };
}
