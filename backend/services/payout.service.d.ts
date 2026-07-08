export declare function request2fa(userId: string, trainerId?: string): Promise<{
    message: string;
}>;
export declare function requestPayout(input: {
    userId: string;
    amount: number;
    phone: string;
    code: string;
}): Promise<any>;
export declare function getPayoutHistory(userId: string, page?: number, perPage?: number): Promise<{
    data: any;
    meta: {
        page: number;
        perPage: number;
        total: any;
        totalPages: number;
    };
}>;
export declare function getEarningsSummary(userId: string): Promise<{
    availableBalance: any;
    pendingRelease: any;
    totalEarned: any;
    totalStudents: any;
    averageRating: any;
    totalReviews: any;
}>;
