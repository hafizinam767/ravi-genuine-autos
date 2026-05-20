'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench,
  Car,
  Armchair,
  Zap,
  Disc3,
  Droplets,
  Gauge,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

// ─── Types ──────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  productCount: number;
}

// ─── Icon Mapping ───────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  engine: Wrench,
  body: Car,
  interior: Armchair,
  electrical: Zap,
  brakes: Disc3,
  'brake-parts': Disc3,
  cooling: Droplets,
  'ac-cooling': Droplets,
  transmission: Gauge,
  'transmission-parts': Gauge,
  suspension: Settings,
  'suspension-parts': Settings,
};

const imageMap: Record<string, string> = {
  'engine-parts': '/products/engine-parts.png',
  'body-parts': '/products/body-parts.png',
  'interior-parts': '/products/interior-parts.png',
  'electrical-parts': '/products/electrical-parts.png',
  'brake-parts': '/products/brake-parts.png',
  'ac-cooling': '/products/ac-cooling.png',
  'transmission-parts': '/products/transmission-parts.png',
  'suspension-parts': '/products/suspension-parts.png',
};

const fallbackIcons: LucideIcon[] = [Wrench, Car, Armchair, Zap, Disc3, Droplets, Gauge, Settings];

function getCategoryIcon(slug: string, index: number): LucideIcon {
  if (slug && iconMap[slug.toLowerCase()]) {
    return iconMap[slug.toLowerCase()];
  }
  return fallbackIcons[index % fallbackIcons.length];
}

// ─── Color mapping for category accents ─────────────────────────────────

const categoryColors = [
  { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'hover:border-orange-300' },
  { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'hover:border-emerald-300' },
  { bg: 'bg-sky-50', icon: 'text-sky-600', border: 'hover:border-sky-300' },
  { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'hover:border-violet-300' },
  { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'hover:border-rose-300' },
  { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'hover:border-teal-300' },
  { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'hover:border-amber-300' },
  { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'hover:border-cyan-300' },
];

// ─── Component ──────────────────────────────────────────────────────────

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setView, setFilters } = useAppStore();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data.categories ?? []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Could not load categories');
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setFilters({ categoryId, carModelId: '', condition: 'all', search: '', sortBy: 'default' });
    setView('catalog');
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Shop by Category
        </h2>
        <p className="mt-2 text-muted-foreground">
          Find the right parts for your vehicle
        </p>
      </motion.div>

      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="flex flex-col items-center gap-3 p-6">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category, index) => {
            const Icon = getCategoryIcon(category.slug, index);
            const color = categoryColors[index % categoryColors.length];
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] overflow-hidden ${color.border}`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <CardContent className="p-0">
                    {/* Category Image */}
                    <div className="relative h-28 w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {imageMap[category.slug] ? (
                        <img
                          src={imageMap[category.slug]}
                          alt={category.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className={`flex h-full items-center justify-center ${color.bg}`}>
                          <Icon className={`h-10 w-10 ${color.icon}`} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className="absolute bottom-2 left-3 text-xs font-medium text-white drop-shadow-md">
                        {category.productCount} {category.productCount === 1 ? 'part' : 'parts'}
                      </span>
                    </div>
                    {/* Category Name */}
                    <div className="px-4 py-3 text-center">
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
