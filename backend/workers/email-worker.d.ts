import { Queue } from 'bullmq';
export declare const emailQueue: Queue<any, any, string, any, any, string>;
interface EmailJobData {
    to: string;
    subject: string;
    html: string;
    notificationId?: string;
    userId?: string;
}
export declare function addEmailToQueue(data: EmailJobData): Promise<void>;
export {};
