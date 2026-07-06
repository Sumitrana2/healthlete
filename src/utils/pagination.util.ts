import type { LookupFilters } from "../modules/core/lookup/lookup.types";

export function parsePagination(
  filters: LookupFilters
): Required<Pick<LookupFilters, "page" | "limit">> & LookupFilters {
  return {
    ...filters,
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
  };
}

export async function paginate<T>(
  filters: LookupFilters,
  getData: (filters: LookupFilters) => Promise<T>,
  getCount: (filters: LookupFilters) => Promise<number>
) {
  if (!filters.page && !filters.limit) {
    return getData(filters);
  }

  const f = parsePagination(filters);

  const [data, total] = await Promise.all([getData(f), getCount(f)]);

  return {
    data,
    total,
    page: f.page,
    limit: f.limit,
    totalPages: Math.ceil(total / f.limit),
  };
}


export function toNumber(value: unknown) {
    return value ? Number(value) : undefined;
}