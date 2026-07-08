interface CreateCourseInput {
    trainerId: string;
    title: string;
    description: string;
    learningOutcomes: string[];
    category: string;
    mode: 'PHYSICAL' | 'VIRTUAL' | 'HYBRID';
    duration: string;
    sessionCount: number;
    priceKes: number;
    maxStudents?: number;
    location?: string;
    prerequisites?: string;
    imageUrl?: string;
}
export declare function createCourse(input: CreateCourseInput): Promise<any>;
export declare function getCourseBySlug(slug: string): Promise<any>;
export declare function updateCourse(courseId: string, userId: string, data: Partial<CreateCourseInput>): Promise<any>;
export declare function softDeleteCourse(courseId: string, userId: string): Promise<void>;
interface CourseListFilters {
    search?: string;
    category?: string;
    mode?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page: number;
    perPage: number;
}
export declare function listCourses(filters: CourseListFilters): Promise<any>;
export declare function getTrainerCourses(trainerId: string, includeUnpublished?: boolean): Promise<any>;
export {};
