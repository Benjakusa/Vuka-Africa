export declare function getStats(): Promise<{
    totalUsers: any;
    totalTrainers: any;
    totalCourses: any;
    totalEnrolments: any;
    activeEnrolments: any;
    pendingVerifications: any;
    openDisputes: any;
    totalRevenue: any;
}>;
export declare function listVerifications(status?: string, page?: number, perPage?: number): Promise<{
    data: any;
    meta: {
        page: number;
        perPage: number;
        total: any;
        totalPages: number;
    };
}>;
export declare function approveVerification(trainerId: string, adminId: string): Promise<void>;
export declare function rejectVerification(trainerId: string, adminId: string, reason: string): Promise<void>;
export declare function listDisputes(status?: string, page?: number, perPage?: number): Promise<{
    data: any;
    meta: {
        page: number;
        perPage: number;
        total: any;
        totalPages: number;
    };
}>;
export declare function resolveDispute(disputeId: string, adminId: string, resolution: string, notes?: string): Promise<void>;
export declare function listTransactions(filters: {
    type?: string;
    userId?: string;
    from?: string;
    to?: string;
    page?: number;
    perPage?: number;
}): Promise<{
    data: any;
    meta: {
        page: number;
        perPage: number;
        total: any;
        totalPages: number;
    };
}>;
export declare function listUsers(search?: string, role?: string, isActive?: string, page?: number, perPage?: number): Promise<{
    data: any;
    meta: {
        page: number;
        perPage: number;
        total: any;
        totalPages: number;
    };
}>;
export declare function suspendUser(targetUserId: string): Promise<void>;
export declare function activateUser(targetUserId: string): Promise<void>;
