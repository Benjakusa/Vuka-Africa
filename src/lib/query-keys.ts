export const trainerKeys = {
  all: ['trainers'] as const,
  lists: () => [...trainerKeys.all, 'list'] as const,
  list: (filters: Record<string, string | number | boolean | undefined>) => [...trainerKeys.lists(), filters] as const,
  details: () => [...trainerKeys.all, 'detail'] as const,
  detail: (id: string) => [...trainerKeys.details(), id] as const,
  profile: (userId?: string) => ['trainer', 'profile', userId] as const,
  profileEdit: (userId?: string) => ['trainer', 'profile-edit', userId] as const,
  stats: (trainerId?: string) => ['trainer', 'stats', trainerId] as const,
  trainerReviews: (trainerId?: string) => ['trainer', 'reviews', trainerId] as const,
  trainerPayouts: (trainerId?: string) => ['trainer', 'payouts', trainerId] as const,
};

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (slug: string) => [...courseKeys.details(), slug] as const,
};

export const enrolmentKeys = {
  all: ['enrolments'] as const,
  lists: () => [...enrolmentKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...enrolmentKeys.lists(), filters] as const,
  details: () => [...enrolmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...enrolmentKeys.details(), id] as const,
};

export const payoutKeys = {
  all: ['payouts'] as const,
  lists: () => [...payoutKeys.all, 'list'] as const,
  list: (page?: number) => [...payoutKeys.lists(), page] as const,
};

export const reviewKeys = {
  all: ['reviews'] as const,
  list: (trainerId: string, page?: number) => [...reviewKeys.all, trainerId, page] as const,
};

export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  verifications: (status?: string, page?: number) => ['admin', 'verifications', status, page] as const,
  disputes: (status?: string, page?: number) => ['admin', 'disputes', status, page] as const,
  transactions: (filters?: Record<string, unknown>) => ['admin', 'transactions', filters] as const,
  users: (search?: string, page?: number) => ['admin', 'users', search, page] as const,
  earnings: ['admin', 'earnings'] as const,
  payouts: (status?: string, page?: number) => ['admin', 'payouts', status, page] as const,
  adminCourses: (filters?: Record<string, unknown>) => ['admin', 'courses', filters] as const,
  adminCourseDetail: (id: string) => ['admin', 'courses', id] as const,
  config: ['admin', 'config'] as const,
  commissions: ['admin', 'commissions'] as const,
  recentEnrolments: ['admin', 'recent-enrolments'] as const,
  recentPayouts: ['admin', 'recent-payouts'] as const,
  recentDisputes: ['admin', 'recent-disputes'] as const,
};

export const miscKeys = {
  platformConfig: ['platform', 'config'] as const,
  userTransactions: (userId?: string, role?: string) => ['transactions', userId, role] as const,
};
