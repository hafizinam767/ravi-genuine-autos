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

// ─── Icon Mapping (fallback) ────────────────────────────────────────────

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

const fallbackIcons: LucideIcon[] = [Wrench, Car, Armchair, Zap, Disc3, Droplets, Gauge, Settings];

function getCategoryIcon(slug: string, index: number): LucideIcon {
  if (slug && iconMap[slug.toLowerCase()]) {
    return iconMap[slug.toLowerCase()];
  }
  return fallbackIcons[index % fallbackIcons.length];
}

// ─── Category Image Mapping ──────────────────────────────────────────────

const categoryImageMap: Record<string, string> = {
  'body-parts': '/categories/body-parts.jpg',
  'engine-parts': '/categories/engine-parts.png',
  'suspension-parts': '/categories/suspension.jpg',
  'brake-parts': '/categories/brake-service.png',
  'interior-parts': '/products/interior-parts.png',
  'electrical-parts': '/products/electrical-parts.png',
  'ac-cooling': '/products/ac-cooling.png',
  'transmission-parts': '/products/transmission-parts.png',
};

// ─── Featured category slugs ──────────────────────────────────────────────

const FEATURED_SLUGS = ['body-parts', 'engine-parts', 'suspension-parts', 'brake-parts'];

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

  const handleViewAll = () => {
    setFilters({ categoryId: '', carModelId: '', condition: 'all', search: '', sortBy: 'default' });
    setView('catalog');
  };

  // Sort: featured slugs first in defined order, then remaining
  const featuredCategories = FEATURED_SLUGS
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is Category => !!c);

  const otherCategories = categories.filter(
    (c) => !FEATURED_SLUGS.includes(c.slug)
  );

  return (
    <section className="bg-gray-50 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Title ───────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Shop by <span style={{ color: '#DC2626' }}>Category</span>
          </h2>
          <p className="mt-2 text-sm text-gray-500">Find the right parts for your vehicle</p>
        </div>

        {/* ── Loading State ───────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="aspect-square w-full animate-pulse rounded-xl bg-gray-200" />
                <div className="mt-3 h-5 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          <>
            {/* ── Featured 4-Category Grid ────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {featuredCategories.map((category, index) => {
                const imageSrc = categoryImageMap[category.slug];
                const Icon = getCategoryIcon(category.slug, index);

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="text-center"
                  >
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCategoryClick(category.id);
                      }}
                      className="group block"
                    >
                      {/* Category Image */}
                      <div className="relative mx-auto w-full overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.03] ring-1 ring-gray-200/60">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={category.name}
                            className="aspect-square w-full object-cover rounded-xl transition-all duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gray-100">
                            <Icon className="h-16 w-16 text-gray-300" />
                          </div>
                        )}
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition-all duration-300 group-hover:bg-black/10" />
                      </div>

                      {/* Category Title */}
                      <h3 className="mt-3 text-base font-bold text-gray-800 sm:text-lg group-hover:text-red-600 transition-colors">
                        {category.name}
                      </h3>
                    </a>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Other Categories (smaller cards) ────────────────────── */}
            {otherCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-10 sm:mt-12"
              >
                <h3 className="mb-5 text-center text-lg font-semibold text-gray-700 sm:text-xl">
                  More Categories
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {otherCategories.map((category, index) => {
                    const imageSrc = categoryImageMap[category.slug];
                    const Icon = getCategoryIcon(category.slug, index + FEATURED_SLUGS.length);

                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-20px' }}
                        transition={{ duration: 0.35, delay: index * 0.06 }}
                      >
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCategoryClick(category.id);
                          }}
                          className="group block overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200/60 transition-all hover:shadow-md hover:ring-red-200"
                        >
                          <div className="flex items-center gap-3 p-3 sm:p-4">
                            {/* Category Image or Icon */}
                            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 sm:size-16">
                              {imageSrc ? (
                                <img
                                  src={imageSrc}
                                  alt={category.name}
                                  className="size-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Icon className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            {/* Category Info */}
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-sm font-semibold text-gray-800 sm:text-base group-hover:text-red-600 transition-colors">
                                {category.name}
                              </h3>
                              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                                {category.productCount} {category.productCount === 1 ? 'part' : 'parts'}
                              </p>
                            </div>
                          </div>
                        </a>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
