import { PAGINATION } from './config';

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export function parsePagination(params: PaginationParams) {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(PAGINATION.MAX_PER_PAGE, Math.max(1, params.perPage ?? PAGINATION.DEFAULT_PER_PAGE));
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

export function buildMeta(total: number, page: number, perPage: number): PaginationMeta {
  return { page, perPage, total, totalPages: Math.ceil(total / perPage) };
}
