import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?fit=crop&w=1200&h=600&q=80',
    headline: "Learn from Africa's Best Trainers",
    subtitle: 'Hands-on skills taught by verified experts in baking, tech, fitness and more.',
    cta: { label: 'Find a Trainer', href: '/trainers' },
  },
  {
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?fit=crop&w=1200&h=600&q=80',
    headline: 'Master Skills That Earn You Money',
    subtitle: 'From coding to cake decoration — turn your passion into profit.',
    cta: { label: 'Start Learning', href: '/auth/register' },
  },
  {
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?fit=crop&w=1200&h=600&q=80',
    headline: 'Pay Safely with M-Pesa Escrow',
    subtitle: 'Your payment is protected. Funds release only when you confirm learning.',
    cta: { label: 'Browse Courses', href: '/trainers' },
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(next, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, next]);

  return (
    <section
      className="relative w-full overflow-hidden bg-dark"
      style={{ aspectRatio: '16 / 9', minHeight: '280px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SLIDES.map((slide, i) => (
          <div key={i} className="relative w-full h-full flex-shrink-0">
            <img
              src={slide.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-black/50" />
            {/* Content sits in the upper/center area, leaving room for dots at the bottom */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center max-w-2xl mx-auto pb-10 sm:pb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">{slide.headline}</h1>
              <p className="mt-4 text-base sm:text-lg text-white/80 max-w-lg">{slide.subtitle}</p>
              <Link
                to={slide.cta.href}
                className="mt-6 sm:mt-8 px-8 py-3 bg-[#ff3f34] text-white font-semibold rounded-lg hover:bg-[#e03029] transition-colors text-sm sm:text-base"
              >
                {slide.cta.label}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Dots sit at the bottom, outside the content area — never overlap the button */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-6' : 'bg-white/50 w-2.5'}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
