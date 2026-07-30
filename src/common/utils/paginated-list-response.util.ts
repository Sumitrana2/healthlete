import type { PaginationMeta } from "../dto/pagination.dto";

/** Shape accepted by both admin (`item`/`items`) and brand frontend (`items` + flat meta). */
export function toClientPaginatedData<T>(items: T[], meta: PaginationMeta) {
  return {
    items,
    item: items,
    page: meta.page,
    limit: meta.limit,
    total: meta.total,
    totalPages: meta.totalPages,
    meta,
  };
}
