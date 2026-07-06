import { z } from 'zod';
import { NextRequest } from 'next/server';
import { ValidationError } from './errors';

type ValidationSchemas = {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
};

export function validate(schemas: ValidationSchemas) {
  return async (req: NextRequest, context?: { params?: Record<string, string> }) => {
    const errors: Record<string, string[]> = {};

    if (schemas.body) {
      try {
        const body = await req.json().catch(() => ({}));
        const result = schemas.body.safeParse(body);
        if (!result.success) {
          errors.body = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
        }
      } catch {
        errors.body = ['Invalid JSON body'];
      }
    }

    if (schemas.query) {
      const url = new URL(req.url);
      const query = Object.fromEntries(url.searchParams.entries());
      const result = schemas.query.safeParse(query);
      if (!result.success) {
        errors.query = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      }
    }

    if (schemas.params && context?.params) {
      const result = schemas.params.safeParse(context.params);
      if (!result.success) {
        errors.params = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }
  };
}

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.issues.map(i => ({
      path: i.path.join('.'),
      message: i.message,
    })));
  }
  return result.data;
}

export const commonSchemas = {
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  }),
  phone: z.string().regex(/^\+254\d{9}$/, 'Phone must be in format +2547XXXXXXXX'),
  uuid: z.string().uuid('Invalid UUID format'),
};
