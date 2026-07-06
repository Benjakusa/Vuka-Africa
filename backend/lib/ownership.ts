import { NotFoundError, ForbiddenError } from './errors';

/**
 * Verifies that a resource exists and the requesting user owns it.
 * Throws NotFoundError if missing, ForbiddenError if not owner.
 */
export async function checkOwnership<T extends { userId: string }>(
  getResource: () => Promise<T | null>,
  userId: string,
  resourceName = 'Resource',
): Promise<T> {
  const resource = await getResource();
  if (!resource) throw new NotFoundError(resourceName);
  if (resource.userId !== userId) throw new ForbiddenError(`Not authorized to access this ${resourceName.toLowerCase()}`);
  return resource;
}

/**
 * Simplifies ownership checks for Trainer-relation resources.
 */
export function trainerOwnsResource(trainerUserId: string, userId: string): void {
  if (trainerUserId !== userId) throw new ForbiddenError('Not authorized to access this resource');
}

/**
 * Admin-or-owner guard for sensitive enrolment/admin data.
 */
export function adminOrOwner(userId: string, resourceUserId: string, isAdmin: boolean): void {
  if (resourceUserId !== userId && !isAdmin) {
    throw new ForbiddenError('Not authorized to access this resource');
  }
}
