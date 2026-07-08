interface CreateReviewInput {
    enrolmentId: string;
    userId: string;
    rating: number;
    comment?: string;
}
export declare function createReview(input: CreateReviewInput): Promise<any>;
export declare function getTrainerReviews(trainerId: string, page?: number, perPage?: number): Promise<{
    data: any;
    meta: {
        page: number;
        perPage: number;
        total: any;
        totalPages: number;
    };
    averageRating: any;
    totalReviews: any;
    ratingBreakdown: Record<number, number>;
}>;
export {};
