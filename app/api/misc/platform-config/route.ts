import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCached, setCached } from '@backend/lib/cache';
import { success } from '@backend/lib/api-response';
import { handleError } from '@frontend/utils/error-handler';
import { COMMISSION } from '@backend/lib/config';

export async function GET(req: NextRequest) {
  try {
    const cacheKey = 'platform:config';
    let config = await getCached<any>(cacheKey);

    if (!config) {
      const admin = createAdminClient();
      const { data: platformConfig } = await admin
        .from('PlatformConfig')
        .select('*')
        .eq('id', 1)
        .single();

      if (!platformConfig) {
        config = { freeTrainerLimit: COMMISSION.FREE_TRAINER_LIMIT, trainerCount: 0, remainingFreeSpots: COMMISSION.FREE_TRAINER_LIMIT };
      } else {
        config = {
          freeTrainerLimit: platformConfig.freeTrainerLimit,
          trainerCount: platformConfig.trainerCount,
          remainingFreeSpots: Math.max(0, platformConfig.freeTrainerLimit - platformConfig.trainerCount),
        };
      }
      await setCached(cacheKey, config, 300);
    }

    return success(config);
  } catch (err) {
    return handleError(err);
  }
}
