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
export declare function parsePagination(params: PaginationParams): {
    page: number;
    perPage: number;
    skip: number;
    take: number;
};
export declare function buildMeta(total: number, page: number, perPage: number): PaginationMeta;
