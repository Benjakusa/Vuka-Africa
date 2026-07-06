import Link from 'next/link';
import { Search, BookOpen, CheckCircle, ChefHat, Camera, Code, Dumbbell, Music, Languages } from 'lucide-react';
import HeroCarousel from '@frontend/components/shared/hero-carousel';

async function getFeaturedTrainers() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/trainers?verifiedOnly=true&sortBy=rating&perPage=4`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.data || [];
  } catch { return null; }
}

export default async function HomePage() {
  const featuredTrainers = await getFeaturedTrainers();

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
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon size={28} className="text-primary" />
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold text-primary">
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
            {[
              { icon: ChefHat, label: 'Baking & Cake Decoration', slug: 'Baking & Cake Decoration' },
              { icon: Camera, label: 'Photography', slug: 'Photography & Videography' },
              { icon: Code, label: 'Programming & Web Dev', slug: 'Programming & Web Dev' },
              { icon: Dumbbell, label: 'Fitness & Wellness', slug: 'Fitness & Wellness' },
              { icon: Music, label: 'Music & Instruments', slug: 'Music & Instruments' },
              { icon: Languages, label: 'Languages', slug: 'Languages' },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/trainers?category=${encodeURIComponent(cat.slug)}`}
                className="flex flex-col items-center p-6 bg-white rounded-card shadow-card hover:shadow-cardHover transition-shadow"
              >
                <cat.icon size={40} className="text-primary mb-3" />
                <span className="text-sm font-medium text-dark text-center">{cat.label}</span>
                <span className="text-xs text-primary mt-2">Browse &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featuredTrainers && featuredTrainers.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-dark mb-8">Featured Trainers</h2>
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory">
              {featuredTrainers.map((t: any) => (
                <Link key={t.id} href={`/trainer/${t.id}`} className="snap-start flex-shrink-0 w-56">
                  <div className="rounded-card bg-white shadow-card hover:shadow-cardHover transition-shadow p-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-primary font-bold mb-3 mx-auto">
                      {t.fullName?.[0]}
                    </div>
                    <h3 className="font-semibold text-dark text-center truncate">{t.fullName}</h3>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className="text-primary text-sm">{'★'.repeat(Math.round(t.averageRating))}</span>
                      <span className="text-xs text-muted-foreground">({t.totalReviews})</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {t.skills?.slice(0, 2).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 text-primary text-xs rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 text-center bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-dark mb-4">Ready to level up?</h2>
          <p className="text-body mb-8">Join thousands of learners mastering new skills with trusted trainers.</p>
          <Link
            href="/auth/register"
            className="px-8 py-3 bg-primary text-white font-medium rounded-btn inline-block hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
