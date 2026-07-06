import { NextRequest } from 'next/server';
import * as trainerService from '@backend/services/trainer.service';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const filters = {
      search: url.searchParams.get('search') || undefined,
      category: url.searchParams.get('category') || undefined,
      mode: url.searchParams.get('mode') || undefined,
      minPrice: url.searchParams.get('minPrice') ? Number(url.searchParams.get('minPrice')) : undefined,
      maxPrice: url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined,
      verifiedOnly: url.searchParams.get('verifiedOnly') === 'true',
      sortBy: url.searchParams.get('sortBy') || 'rating',
      page: Math.max(1, Number(url.searchParams.get('page')) || 1),
      perPage: Math.min(100, Math.max(1, Number(url.searchParams.get('perPage')) || 20)),
    };

    const result = await trainerService.listTrainers(filters);
    return success(result);
  } catch (err) { return handleError(err); }
}
