import { Queue } from 'bullmq';
export declare const mpesaQueue: Queue<any, any, string, any, any, string>;
export declare function addMpesaCallbackJob(job: {
    type: string;
    data: any;
}): Promise<void>;
