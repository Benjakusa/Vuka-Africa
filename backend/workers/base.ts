import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

export interface WorkerConfig {
  name: string;
  processor: (job: Job) => Promise<void>;
  connection: Redis;
  concurrency?: number;
  stalledInterval?: number;
  maxStalledCount?: number;
}

export function createManagedWorker(config: WorkerConfig): Worker {
  const worker = new Worker(config.name, config.processor, {
    connection: config.connection,
    concurrency: config.concurrency ?? 1,
    stalledInterval: config.stalledInterval ?? 30_000,
    maxStalledCount: config.maxStalledCount ?? 1,
    lockDuration: 60_000,
  });

  worker.on('completed', (job) => {
    console.log(`[${config.name}] Job ${job?.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[${config.name}] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`[${config.name}] Error:`, err.message);
  });

  worker.on('drained', () => {
    console.log(`[${config.name}] Queue drained`);
  });

  return worker;
}

export function setupGracefulShutdown(worker: Worker, label: string): void {
  const shutdown = async () => {
    console.log(`[${label}] Shutting down gracefully...`);
    await worker.close();
    console.log(`[${label}] Worker closed`);
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
