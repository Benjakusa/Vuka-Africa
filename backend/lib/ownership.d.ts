/**
 * Verifies that a resource exists and the requesting user owns it.
 * Throws NotFoundError if missing, ForbiddenError if not owner.
 */
export declare function checkOwnership<T extends {
    userId: string;
}>(getResource: () => Promise<T | null>, userId: string, resourceName?: string): Promise<T>;
/**
 * Simplifies ownership checks for Trainer-relation resources.
 */
export declare function trainerOwnsResource(trainerUserId: string, userId: string): void;
/**
 * Admin-or-owner guard for sensitive enrolment/admin data.
 */
export declare function adminOrOwner(userId: string, resourceUserId: string, isAdmin: boolean): void;
