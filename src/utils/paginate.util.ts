export interface PaginationFilters {
    page?: number;
    limit?: number;
  }
  
  export async function paginate<T, F extends PaginationFilters>(
    filters: F,
    getData: (filters: F & { page: number; limit: number }) => Promise<T>,
    getCount: (filters: F) => Promise<number>
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const f = { ...filters, page, limit };
  
    const [data, total] = await Promise.all([getData(f), getCount(f)]);
  
    return {
      items: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }