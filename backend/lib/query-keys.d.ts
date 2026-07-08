export declare const trainerKeys: {
    all: readonly ["trainers"];
    lists: () => readonly ["trainers", "list"];
    list: (filters: Record<string, string | number | boolean | undefined>) => readonly ["trainers", "list", Record<string, string | number | boolean | undefined>];
    details: () => readonly ["trainers", "detail"];
    detail: (id: string) => readonly ["trainers", "detail", string];
};
export declare const courseKeys: {
    all: readonly ["courses"];
    lists: () => readonly ["courses", "list"];
    list: (filters: Record<string, unknown>) => readonly ["courses", "list", Record<string, unknown>];
    details: () => readonly ["courses", "detail"];
    detail: (slug: string) => readonly ["courses", "detail", string];
};
export declare const enrolmentKeys: {
    all: readonly ["enrolments"];
    lists: () => readonly ["enrolments", "list"];
    list: (filters?: Record<string, unknown>) => readonly ["enrolments", "list", Record<string, unknown> | undefined];
    details: () => readonly ["enrolments", "detail"];
    detail: (id: string) => readonly ["enrolments", "detail", string];
};
export declare const payoutKeys: {
    all: readonly ["payouts"];
    lists: () => readonly ["payouts", "list"];
    list: (page?: number) => readonly ["payouts", "list", number | undefined];
};
export declare const reviewKeys: {
    all: readonly ["reviews"];
    list: (trainerId: string, page?: number) => readonly ["reviews", string, number | undefined];
};
export declare const adminKeys: {
    stats: readonly ["admin", "stats"];
    verifications: (status?: string, page?: number) => readonly ["admin", "verifications", string | undefined, number | undefined];
    disputes: (status?: string, page?: number) => readonly ["admin", "disputes", string | undefined, number | undefined];
    transactions: (filters?: Record<string, unknown>) => readonly ["admin", "transactions", Record<string, unknown> | undefined];
    users: (search?: string, page?: number) => readonly ["admin", "users", string | undefined, number | undefined];
};
export declare const miscKeys: {
    platformConfig: readonly ["platform", "config"];
};
