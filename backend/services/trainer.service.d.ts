interface ApplyInput {
    userId: string;
    bio?: string;
    skills: string[];
    idDocumentUrl?: string;
}
export declare function apply(input: ApplyInput): Promise<any>;
export declare function getPublicProfile(trainerId: string): Promise<any>;
export declare function updateProfile(userId: string, data: {
    bio?: string;
    skills?: string[];
    idDocumentUrl?: string;
}): Promise<any>;
export declare function initiateVerificationPayment(userId: string): Promise<{
    checkoutRequestID: string;
    amount: 5000;
}>;
export declare function getVerificationStatus(userId: string): Promise<any>;
export declare function processVerificationCallback(trainerId: string, mpesaTransactionId: string): Promise<void>;
interface TrainerListFilters {
    search?: string;
    category?: string;
    mode?: string;
    minPrice?: number;
    maxPrice?: number;
    verifiedOnly?: boolean;
    sortBy?: string;
    page: number;
    perPage: number;
}
export declare function listTrainers(filters: TrainerListFilters): Promise<any>;
export {};
