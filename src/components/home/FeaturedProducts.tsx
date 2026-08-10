'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cog } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import ProductCard from '@/components/catalog/ProductCard';

// ─── Types ──────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  condition: string;
  stock: number;
  images: string;
  sku: string | null;
  partNumber: string | null;
  categoryId: string;
  carModelId: string;
  featured: boolean;
  category: { id: string; name: string; slug: string };
  carModel: { id: string; name: string; make: string; slug: string };
}

// ─── Component ──────────────────────────────────────────────────────────

const INITIAL_FEATURED_PRODUCTS: Product[] = [
  {
    id: 'fp-1',
    name: 'Genuine Suzuki Alto Front Brake Pads Set',
    slug: 'suzuki-alto-front-brake-pads',
    description: 'High performance OEM front brake pad kit for Suzuki Alto.',
    price: 4800,
    condition: 'NEW',
    stock: 25,
    images: '/products/brake-parts.png',
    sku: 'BRK-SUZ-001',
    partNumber: '55810-68H00',
    categoryId: 'brake-parts',
    carModelId: 'suzuki-alto',
    featured: true,
    category: { id: 'brake-parts', name: 'Brake Parts', slug: 'brake-parts' },
    carModel: { id: 'suzuki-alto', name: 'Alto', make: 'Suzuki', slug: 'suzuki-alto' },
  },
  {
    id: 'fp-2',
    name: 'Toyota Corolla XLI / GLI Engine Oil Filter',
    slug: 'toyota-corolla-oil-filter',
    description: 'Original Toyota genuine oil filter element.',
    price: 1850,
    condition: 'NEW',
    stock: 40,
    images: '/products/engine-parts.png',
    sku: 'ENG-TOY-002',
    partNumber: '90915-YZZD2',
    categoryId: 'engine-parts',
    carModelId: 'toyota-corolla-gli',
    featured: true,
    category: { id: 'engine-parts', name: 'Engine Parts', slug: 'engine-parts' },
    carModel: { id: 'toyota-corolla-gli', name: 'Corolla GLI', make: 'Toyota', slug: 'toyota-corolla-gli' },
  },
  {
    id: 'fp-3',
    name: 'Honda Civic Air Cleaner Filter Element',
    slug: 'honda-civic-air-filter',
    description: 'Genuine Honda intake air cleaner element for maximum engine air flow.',
    price: 3200,
    condition: 'NEW',
    stock: 18,
    images: '/products/engine-parts.png',
    sku: 'ENG-HON-003',
    partNumber: '17220-5AA-A00',
    categoryId: 'engine-parts',
    carModelId: 'honda-civic',
    featured: true,
    category: { id: 'engine-parts', name: 'Engine Parts', slug: 'engine-parts' },
    carModel: { id: 'honda-civic', name: 'Civic', make: 'Honda', slug: 'honda-civic' },
  },
  {
    id: 'fp-4',
    name: 'Suzuki WagonR Front Shock Absorber Pair',
    slug: 'suzuki-wagonr-front-shock-absorber',
    description: 'Heavy duty OEM front suspension shocks for smooth driving stability.',
    price: 18500,
    condition: 'NEW',
    stock: 10,
    images: '/categories/suspension.jpg',
    sku: 'SUS-SUZ-004',
    partNumber: '41601-85K00',
    categoryId: 'chassis-suspension-parts',
    carModelId: 'suzuki-wagonr',
    featured: true,
    category: { id: 'chassis-suspension-parts', name: 'Chassis & Suspension', slug: 'chassis-suspension-parts' },
    carModel: { id: 'suzuki-wagonr', name: 'WagonR', make: 'Suzuki', slug: 'suzuki-wagonr' },
  },
];

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>(INITIAL_FEATURED_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setView } = useAppStore();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?featured=true&limit=8');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        if (data.products?.length) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
      }
    }
    fetchProducts();
  }, []);

  const handleViewAll = () => {
    setView('catalog');
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Featured Parts
            </h2>
            <p className="mt-2 text-muted-foreground">
              Handpicked quality parts for your vehicle
            </p>
          </div>
          <Button
            variant="outline"
            className="hidden sm:inline-flex"
            onClick={handleViewAll}
          >
            View All
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-2 h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <Cog className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-muted-foreground">No featured parts available yet</p>
          <Button variant="outline" className="mt-4" onClick={handleViewAll}>
            Browse All Parts
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Mobile view all button */}
      {!loading && !error && products.length > 0 && (
        <div className="mt-6 flex justify-center sm:hidden">
          <Button variant="outline" onClick={handleViewAll}>
            View All Parts
          </Button>
        </div>
      )}
    </section>
  );
}
