import { NextRequest } from 'next/server';
import * as reviewService from '@backend/services/review.service';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('perPage')) || 10));

    const result = await reviewService.getTrainerReviews(params.id, page, perPage);
    return success(result);
  } catch (err) { return handleError(err); }
}