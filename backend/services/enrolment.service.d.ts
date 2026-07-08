interface CreateEnrolmentInput {
    traineeId: string;
    courseId: string;
}
export declare function createEnrolment(input: CreateEnrolmentInput): Promise<{
    enrolmentId: any;
    checkoutRequestID: string;
}>;
export declare function getEnrolmentStatus(enrolmentId: string, userId: string): Promise<any>;
export declare function getEnrolmentDetail(enrolmentId: string, userId: string): Promise<any>;
export declare function listUserEnrolments(userId: string, role: 'TRAINEE' | 'TRAINER', status?: string, page?: number, perPage?: number): Promise<{
    data: any;
    meta: {
        page: number;
        perPage: number;
        total: any;
        totalPages: number;
    };
}>;
export {};
