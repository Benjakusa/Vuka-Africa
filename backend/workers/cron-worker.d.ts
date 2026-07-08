import { Queue } from 'bullmq';
export declare const cronQueue: Queue<any, any, string, any, any, string>;
export declare function scheduleCronJobs(): Promise<void>;
