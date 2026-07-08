import { Queue } from 'bullmq';
export declare const payoutQueue: Queue<any, any, string, any, any, string>;
export declare function addPayoutJob(data: {
    payoutId: string;
    trainerId: string;
    amountKes: number;
    phoneNumber: string;
    idempotencyKey: string;
}): Promise<void>;
