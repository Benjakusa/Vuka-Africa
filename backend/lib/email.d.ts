export declare function sendEmail(to: string, subject: string, html: string): Promise<{
    messageId: string;
}>;
export declare function verifyEmailConnection(): Promise<boolean>;
