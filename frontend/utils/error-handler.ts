import { AppError } from '@backend/lib/errors';
import { error, serverError } from '@backend/lib/api-response';

export function handleError(err: unknown) {
  if (err instanceof AppError) {
    return error(err);
  }

  console.error('Unhandled error:', err);
  return serverError();
}

export function withErrorHandler(handler: (...args: any[]) => Promise<Response>) {
  return async (...args: any[]): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      return handleError(err);
    }
  };
}
