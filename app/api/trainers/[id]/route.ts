import { NextRequest } from 'next/server';
import * as trainerService from '@backend/services/trainer.service';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await trainerService.getPublicProfile(params.id);
    return success(result);
  } catch (err) { return handleError(err); }
}
