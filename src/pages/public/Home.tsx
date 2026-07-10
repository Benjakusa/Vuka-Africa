import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  CheckCircle,
  ChefHat,
  Camera,
  Code,
  Dumbbell,
  Music,
  Languages,
  ArrowRight,
} from 'lucide-react';
import HeroCarousel from '@/components/shared/hero-carousel';
import { CourseCard } from '@/components/shared/course-card';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { getCourses } from '@/services/courseService';
import { courseKeys } from '@/lib/query-keys';
import { CATEGORIES } from '@/lib/categories';

const categoryIcons: Record<string, any> = {
  'Baking & Cake Decoration': ChefHat,
  'Photography & Videography': Camera,
  'Programming & Web Dev': Code,
  'Fitness & Wellness': Dumbbell,
  'Music & Instruments': Music,
  Languages: Languages,
};

export default function Home() {
  const { data: courses, isLoading } = useQuery({
    queryKey: courseKeys.list({ isPublished: true }),
    queryFn: () => getCourses({ isPublished: true, limit: 4 }),
  });

  const steps = [
    { icon: Search, step: '1', title: 'Browse', desc: 'Find the perfect skill and trainer for you' },
    { icon: BookOpen, step: '2', title: 'Learn', desc: 'Attend physical or virtual sessions' },
    { icon: CheckCircle, step: '3', title: 'Confirm & Release', desc: 'Trainer gets paid after you confirm' },
  ];

  return (
    <div>
      <HeroCarousel />

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((item) => (
              <div key={item.step} className="text-center p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon size={28} className="text-primary" />
                </div>
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-dark mb-1">{item.title}</h3>
                <p className="text-sm text-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-dark text-center mb-12">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.slice(0, 6).map((cat) => {
              const Icon = categoryIcons[cat] || BookOpen;
              return (
                <Link
                  key={cat}
                  to={`/trainers?category=${encodeURIComponent(cat)}`}
                  className="flex flex-col items-center p-6 bg-white rounded-card shadow-card hover:shadow-cardHover transition-shadow"
                >
                  <Icon size={40} className="text-primary mb-3" />
                  <span className="text-sm font-medium text-dark text-center">{cat}</span>
                  <span className="text-xs text-primary mt-2">Browse &rarr;</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {courses && courses.length > 0 && (
        <section id="courses" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-dark">Featured Courses</h2>
              <Link to="/trainers" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {courses.map((course: any) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    slug={course.slug}
                    mode={course.mode}
                    duration={course.duration}
                    sessionCount={course.sessionCount}
                    priceKes={Number(course.priceKes)}
                    imageUrl={course.imageUrl}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-20 text-center bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-dark mb-4">Ready to level up?</h2>
          <p className="text-body mb-8">Join thousands of learners mastering new skills with trusted trainers.</p>
          <Link
            to="/auth/register"
            className="px-8 py-3 bg-primary text-white font-medium rounded-btn inline-block hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
