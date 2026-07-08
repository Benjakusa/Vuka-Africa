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
export declare function createManagedWorker(config: WorkerConfig): Worker;
export declare function setupGracefulShutdown(worker: Worker, label: string): void;
