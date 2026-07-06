import { vi, describe, it, expect, beforeEach } from 'vitest';
const mockPrisma = {
  course: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
  trainer: { findUnique: vi.fn() },
};
vi.mock('@backend/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@backend/lib/cache', () => ({ getCached: vi.fn(), setCached: vi.fn(), invalidateCache: vi.fn() }));

describe('Course Service', () => {
  let s: any;
  beforeEach(async () => { vi.clearAllMocks(); s = await import('@backend/services/course.service'); });

  it('should list published courses', async () => {
    mockPrisma.course.findMany.mockResolvedValue([{ id: 'c1', title: 'Test', isPublished: true, priceKes: 1000, trainer: { user: { name: 'John' } } }]);
    mockPrisma.course.count.mockResolvedValue(1);
    const r = await s.listCourses({ page: 1, perPage: 10 });
    expect(r.courses).toHaveLength(1);
  });

  it('should throw on unpublished course for non-owner', async () => {
    mockPrisma.course.findUnique.mockResolvedValue({ id: 'c1', isPublished: false, trainerId: 'tr1' });
    await expect(s.getCourseById('c1', 'other')).rejects.toThrow('not published');
  });

  it('should create course for trainer', async () => {
    mockPrisma.trainer.findUnique.mockResolvedValue({ id: 'tr1', userId: 'u1' });
    mockPrisma.course.create.mockResolvedValue({ id: 'c1', title: 'New', trainerId: 'tr1' });
    const r = await s.createCourse('tr1', { title: 'New', description: 'd', category: 'TECHNOLOGY', priceKes: 1000, maxStudents: 10 });
    expect(r.id).toBe('c1');
  });
});
