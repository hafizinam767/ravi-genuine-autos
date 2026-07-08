'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

// ─── Types ──────────────────────────────────────────────────────────────

interface CarModel {
  id: string;
  name: string;
  make: string;
  slug: string;
  image: string | null;
  productCount: number;
}

// ─── Make Color Mapping ─────────────────────────────────────────────────

const makeColors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  suzuki: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200 hover:border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-700',
  },
  toyota: {
    bg: 'bg-red-50',
    border: 'border-red-200 hover:border-red-400',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-700',
  },
  honda: {
    bg: 'bg-sky-50',
    border: 'border-sky-200 hover:border-sky-400',
    badge: 'bg-sky-100 text-sky-800',
    text: 'text-sky-700',
  },
  daihatsu: {
    bg: 'bg-violet-50',
    border: 'border-violet-200 hover:border-violet-400',
    badge: 'bg-violet-100 text-violet-800',
    text: 'text-violet-700',
  },
  hyundai: {
    bg: 'bg-red-50',
    border: 'border-red-200 hover:border-red-400',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-700',
  },
  kia: {
    bg: 'bg-teal-50',
    border: 'border-teal-200 hover:border-teal-400',
    badge: 'bg-teal-100 text-teal-800',
    text: 'text-teal-700',
  },
  mg: {
    bg: 'bg-rose-50',
    border: 'border-rose-200 hover:border-rose-400',
    badge: 'bg-rose-100 text-rose-800',
    text: 'text-rose-700',
  },
};

const defaultMakeColor = {
  bg: 'bg-gray-50',
  border: 'border-gray-200 hover:border-gray-400',
  badge: 'bg-gray-100 text-gray-800',
  text: 'text-gray-700',
};

const carImageMap: Record<string, string> = {
  'suzuki-wagonr': '/cars/wagonr.png',
  'toyota-corolla-xli': '/cars/corolla.png',
  'toyota-corolla-gli': '/cars/corolla.png',
  'honda-civic': '/cars/civic.png',
  'honda-city': '/cars/civic.png',
  'suzuki-alto': '/cars/wagonr.png',
  'suzuki-mehran': '/cars/wagonr.png',
  'suzuki-cultus': '/cars/wagonr.png',
  'daihatsu-coure': '/cars/corolla.png',
  'hyundai-tucson': '/cars/corolla.png',
  'mg-hs': '/cars/civic.png',
  'mg-zs': '/cars/civic.png',
};

function getMakeColor(make: string) {
  return makeColors[make.toLowerCase()] ?? defaultMakeColor;
}

// ─── Component ──────────────────────────────────────────────────────────

export default function CarModelSlider() {
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setView, setFilters } = useAppStore();

  useEffect(() => {
    async function fetchCarModels() {
      try {
        const res = await fetch('/api/car-models');
        if (!res.ok) throw new Error('Failed to fetch car models');
        const data = await res.json();
        setCarModels(data.carModels ?? []);
      } catch (err) {
        console.error('Error fetching car models:', err);
        setError('Could not load car models');
      } finally {
        setLoading(false);
      }
    }
    fetchCarModels();
  }, []);

  const handleCarModelClick = (carModelId: string) => {
    setFilters({ carModelId, categoryId: '', condition: 'all', search: '', sortBy: 'default' });
    setView('catalog');
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Popular Car Models
            </h2>
            <p className="mt-2 text-muted-foreground">
              Parts for the most popular vehicles in Pakistan
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="mt-8 flex gap-4 overflow-hidden pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-56 shrink-0">
              <Card>
                <CardContent className="p-4">
                  <Skeleton className="mb-3 h-6 w-16" />
                  <Skeleton className="mb-2 h-5 w-32" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="mt-8 flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent sm:pb-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          {carModels.map((model, index) => {
            const colors = getMakeColor(model.make);
            return (
              <motion.div
                key={model.id}
                className="w-56 shrink-0 sm:w-64"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 overflow-hidden ${colors.border}`}
                  onClick={() => handleCarModelClick(model.id)}
                >
                  <CardContent className="p-0">
                    {/* Car Image */}
                    <div className="relative h-32 w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {carImageMap[model.slug] ? (
                        <img
                          src={carImageMap[model.slug]}
                          alt={model.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className={`flex h-full items-center justify-center ${colors.bg}`}>
                          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                          </svg>
                        </div>
                      )}
                      <Badge className={`absolute top-2 left-2 ${colors.badge} border-0 text-xs font-semibold`}>
                        {model.make}
                      </Badge>
                    </div>
                    {/* Model Info */}
                    <div className={`px-4 py-3 ${colors.bg}`}>
                      <h3 className="text-lg font-bold text-gray-900">{model.name}</h3>
                      <p className={`mt-0.5 text-sm ${colors.text}`}>
                        {model.productCount} {model.productCount === 1 ? 'part' : 'parts'} available
                      </p>
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
