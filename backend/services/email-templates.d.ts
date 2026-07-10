interface EmailTemplate {
    subject: string;
    html: string;
}
export declare function adminPayoutRequested(trainerName: string, amount: number): EmailTemplate;
export declare function trainerPaymentProcessed(trainerName: string, amount: number, transactionId: string): EmailTemplate;
export declare function adminNewCoursePublished(trainerName: string, courseTitle: string): EmailTemplate;
export {};
