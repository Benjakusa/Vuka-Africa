import { Queue } from 'bullmq';
export declare const milestoneQueue: Queue<any, any, string, any, any, string>;
export declare function addMilestoneReleaseJob(data: {
    milestoneId: string;
    enrolmentId: string;
    trainerId: string;
    amountKes: number;
}): Promise<void>;
export declare function processDelayedRelease(milestoneId: string): Promise<any>;
