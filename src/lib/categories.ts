export interface Category {
  name: string;
  slug: string;
  icon: string; // Lucide icon name — mapped in components
}

export const CATEGORIES: Category[] = [
  { name: 'Baking & Cake Decoration', slug: 'baking-cake-decoration', icon: 'ChefHat' },
  { name: 'Photography & Videography', slug: 'photography-videography', icon: 'Camera' },
  { name: 'Programming & Web Development', slug: 'programming-web-dev', icon: 'Code' },
  { name: 'Fitness & Wellness', slug: 'fitness-wellness', icon: 'Dumbbell' },
  { name: 'Music & Instruments', slug: 'music-instruments', icon: 'Music' },
  { name: 'Languages', slug: 'languages', icon: 'Languages' },
  { name: 'Art & Painting', slug: 'art-painting', icon: 'Palette' },
  { name: 'Fashion & Design', slug: 'fashion-design', icon: 'Scissors' },
  { name: 'Cooking & Culinary Arts', slug: 'cooking-culinary-arts', icon: 'UtensilsCrossed' },
  { name: 'Beauty & Makeup', slug: 'beauty-makeup', icon: 'Sparkles' },
  { name: 'Business & Entrepreneurship', slug: 'business-entrepreneurship', icon: 'Briefcase' },
  { name: 'Marketing & Social Media', slug: 'marketing-social-media', icon: 'Megaphone' },
  { name: 'Writing & Content Creation', slug: 'writing-content-creation', icon: 'PenTool' },
  { name: 'Dance & Performing Arts', slug: 'dance-performing-arts', icon: 'Music2' },
  { name: 'Sports & Coaching', slug: 'sports-coaching', icon: 'Trophy' },
  { name: 'Finance & Accounting', slug: 'finance-accounting', icon: 'DollarSign' },
  { name: 'Personal Development', slug: 'personal-development', icon: 'UserCheck' },
  { name: 'Home & Garden', slug: 'home-garden', icon: 'Home' },
  { name: 'Technology & IT', slug: 'technology-it', icon: 'Monitor' },
  { name: 'Crafts & DIY', slug: 'crafts-diy', icon: 'Paintbrush' },
];

/**
 * Returns a category by its slug.
 * Useful for looking up category details from URL params.
 */
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * Returns a category by its display name.
 * Useful for looking up category details from database values.
 */
export function getCategoryByName(name: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.name === name);
}

/**
 * Sorted categories (alphabetically) for display in dropdowns/filters.
 */
export const CATEGORIES_SORTED = [...CATEGORIES].sort((a, b) => a.name.localeCompare(b.name));
