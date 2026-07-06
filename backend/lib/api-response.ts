import { NextResponse } from 'next/server';
import { AppError } from './errors';

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number
) {
  return NextResponse.json({
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  });
}

export function error(error: AppError) {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    },
    { status: error.statusCode }
  );
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    },
    { status: 500 }
  );
}
