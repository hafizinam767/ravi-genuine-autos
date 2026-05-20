'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAppStore } from '@/lib/store';
import ProductCard from './ProductCard';
import ProductFilters, { ActiveFilterBadges } from './ProductFilters';
import {
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  Search,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  condition: string;
  images: string;
  stock: number;
  category: { id: string; name: string; slug: string };
  carModel: { id: string; name: string; make: string; slug: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PRODUCTS_PER_PAGE = 12;

export default function CatalogView() {
  const filters = useAppStore((s) => s.filters);
  const setView = useAppStore((s) => s.setView);
  const setFilters = useAppStore((s) => s.setFilters);

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PRODUCTS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Build query string from filters
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', PRODUCTS_PER_PAGE.toString());

    if (filters.carModelId) params.set('carModel', filters.carModelId);
    if (filters.categoryId) params.set('category', filters.categoryId);
    if (filters.condition && filters.condition !== 'all')
      params.set('condition', filters.condition);
    if (filters.search) params.set('search', filters.search);
    if (filters.sortBy && filters.sortBy !== 'default')
      params.set('sortBy', filters.sortBy);

    return params.toString();
  }, [page, filters]);

  // Fetch products whenever filters or page changes
  useEffect(() => {
    setPage(1); // Reset page when filters change
  }, [filters.carModelId, filters.categoryId, filters.condition, filters.search, filters.sortBy]);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setLoading(true);
      try {
        const qs = buildQueryString();
        const res = await fetch(`/api/products?${qs}`);
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products || []);
          setPagination(
            data.pagination || {
              page: 1,
              limit: PRODUCTS_PER_PAGE,
              total: 0,
              totalPages: 0,
            }
          );
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [buildQueryString]);

  // ─── Skeleton Loading Grid ───────────────────────────────────────
  const skeletonGrid = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-4 flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );

  // ─── Empty State ─────────────────────────────────────────────────
  const emptyState = (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <PackageOpen className="size-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No parts found</h3>
      <p className="text-muted-foreground max-w-sm mb-4">
        We couldn&apos;t find any parts matching your current filters. Try adjusting your search criteria.
      </p>
      <Button
        variant="outline"
        onClick={() => {
          setFilters({ search: '' });
          useAppStore.getState().resetFilters();
        }}
        className="text-amber-600 border-amber-300 hover:bg-amber-50"
      >
        <Search className="size-4" />
        Clear All Filters
      </Button>
    </div>
  );

  // ─── Pagination ──────────────────────────────────────────────────
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const totalPages = pagination.totalPages;
    const currentPage = page;

    // Always show first page
    pages.push(1);

    if (currentPage > 3) pages.push('...');

    // Pages around current
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push('...');

    // Always show last page
    if (totalPages > 1) pages.push(totalPages);

    return (
      <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1 mx-2">
          {pages.map((p, i) =>
            typeof p === 'string' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                className={
                  p === page
                    ? 'bg-amber-500 hover:bg-amber-600 text-white min-w-[36px]'
                    : 'min-w-[36px]'
                }
                onClick={() => setPage(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= pagination.totalPages}
          onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </nav>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Parts Catalog
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse our complete collection of genuine auto parts
        </p>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer text-amber-600 hover:text-amber-700"
              onClick={() => setView('home')}
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Parts Catalog</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile: Filter button + active badges */}
      <div className="lg:hidden flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ProductFilters mobile />
          <span className="text-sm text-muted-foreground ml-auto">
            {loading ? '...' : `${pagination.total} parts`}
          </span>
        </div>
      </div>

      {/* Desktop: Sidebar + Grid layout */}
      <div className="flex gap-6">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block">
          <ProductFilters />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Results count + active filters */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">
                {loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <>Showing {pagination.total} parts</>
                )}
              </p>
            </div>
            <ActiveFilterBadges />
          </div>

          {/* Product Grid / Loading / Empty */}
          {loading ? (
            skeletonGrid
          ) : products.length === 0 ? (
            emptyState
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
