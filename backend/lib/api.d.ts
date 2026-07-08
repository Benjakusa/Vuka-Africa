export declare class ApiError extends Error {
    code: string;
    status: number;
    details?: unknown;
    constructor(response: {
        error: {
            code: string;
            message: string;
            details?: unknown;
        };
    }, status: number);
}
export declare const api: {
    get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) => Promise<T>;
    post: <T>(path: string, body?: unknown) => Promise<T>;
    patch: <T>(path: string, body?: unknown) => Promise<T>;
    delete: <T>(path: string) => Promise<T>;
};
