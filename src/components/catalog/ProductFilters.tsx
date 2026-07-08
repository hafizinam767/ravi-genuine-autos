'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { useAppStore } from '@/lib/store';
import { Filter, X, SlidersHorizontal, Car, Layers, Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount: number;
}

interface CarModel {
  id: string;
  name: string;
  make: string;
  slug: string;
  productCount: number;
}

interface ProductFiltersProps {
  /** If true, renders as a Sheet trigger (mobile). Otherwise renders inline (desktop). */
  mobile?: boolean;
}

export default function ProductFilters({ mobile = false }: ProductFiltersProps) {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);

  const [categories, setCategories] = useState<Category[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Fetch categories and car models on mount
  useEffect(() => {
    async function fetchFilterData() {
      try {
        const [catRes, modelRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/car-models'),
        ]);
        const catData = await catRes.json();
        const modelData = await modelRes.json();
        setCategories(catData.categories || []);
        setCarModels(modelData.carModels || []);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    }
    fetchFilterData();
  }, []);

  const hasActiveFilters =
    filters.carModelId !== '' ||
    filters.categoryId !== '' ||
    filters.condition !== 'all' ||
    filters.sortBy !== 'default';

  const activeFilterCount = [
    filters.carModelId,
    filters.categoryId,
    filters.condition !== 'all' ? filters.condition : '',
    filters.sortBy !== 'default' ? filters.sortBy : '',
  ].filter(Boolean).length;

  // Group car models by make
  const carModelsByMake = carModels.reduce<Record<string, CarModel[]>>((acc, model) => {
    if (!acc[model.make]) acc[model.make] = [];
    acc[model.make].push(model);
    return acc;
  }, {});

  const handleClearAll = () => {
    resetFilters();
    if (mobile) setSheetOpen(false);
  };

  const getCarModelName = (id: string) => {
    const model = carModels.find((m) => m.id === id);
    return model ? `${model.make} ${model.name}` : '';
  };

  const getCategoryName = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.name || '';
  };

  const removeFilter = (key: string) => {
    if (key === 'condition') {
      setFilters({ condition: 'all' });
    } else if (key === 'sortBy') {
      setFilters({ sortBy: 'default' });
    } else {
      setFilters({ [key]: '' });
    }
  };

  // ─── Filter Content (shared between desktop and mobile) ──────────
  const filterContent = (
    <div className="flex flex-col gap-6">
      {/* Car Model Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Car className="size-4 text-red-700" />
          <h3 className="text-sm font-semibold">Car Model</h3>
        </div>
        <Select
          value={filters.carModelId || '__all__'}
          onValueChange={(value) =>
            setFilters({ carModelId: value === '__all__' ? '' : value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Car Models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Car Models</SelectItem>
            {Object.entries(carModelsByMake).map(([make, models]) => (
              <React.Fragment key={make}>
                <SelectItem value={`__group_${make}`} disabled className="font-semibold text-red-700">
                  {make}
                </SelectItem>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} ({model.productCount})
                  </SelectItem>
                ))}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Category Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-red-700" />
          <h3 className="text-sm font-semibold">Category</h3>
        </div>
        <Select
          value={filters.categoryId || '__all__'}
          onValueChange={(value) =>
            setFilters({ categoryId: value === '__all__' ? '' : value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name} ({cat.productCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Condition Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-red-700" />
          <h3 className="text-sm font-semibold">Condition</h3>
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'new', label: 'New' },
            { value: 'used', label: 'Used' },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={filters.condition === opt.value ? 'default' : 'outline'}
              size="sm"
              className={
                filters.condition === opt.value
                  ? 'text-white'
                  : ''
              }
              style={filters.condition === opt.value ? { backgroundColor: '#B91C1C' } : undefined}
              onMouseEnter={filters.condition === opt.value ? (e) => (e.currentTarget.style.backgroundColor = '#991B1B') : undefined}
              onMouseLeave={filters.condition === opt.value ? (e) => (e.currentTarget.style.backgroundColor = '#B91C1C') : undefined}
              onClick={() => setFilters({ condition: opt.value })}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Sort By Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-red-700" />
          <h3 className="text-sm font-semibold">Sort By</h3>
        </div>
        <Select
          value={filters.sortBy || 'default'}
          onValueChange={(value) => setFilters({ sortBy: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          className="w-full text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
        >
          <X className="size-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  // ─── Active Filter Badges ────────────────────────────────────────
  const activeFilterBadges = (
    <div className="flex flex-wrap gap-2">
      {filters.carModelId && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
        >
          {getCarModelName(filters.carModelId)}
          <button
            onClick={() => removeFilter('carModelId')}
            className="ml-1 rounded-full p-0.5 hover:bg-red-100"
            aria-label={`Remove car model filter: ${getCarModelName(filters.carModelId)}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}
      {filters.categoryId && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
        >
          {getCategoryName(filters.categoryId)}
          <button
            onClick={() => removeFilter('categoryId')}
            className="ml-1 rounded-full p-0.5 hover:bg-red-100"
            aria-label={`Remove category filter: ${getCategoryName(filters.categoryId)}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}
      {filters.condition !== 'all' && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
        >
          {filters.condition === 'new' ? 'New' : 'Used'}
          <button
            onClick={() => removeFilter('condition')}
            className="ml-1 rounded-full p-0.5 hover:bg-red-100"
            aria-label="Remove condition filter"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}
      {filters.sortBy !== 'default' && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
        >
          Sort:{' '}
          {filters.sortBy === 'price-asc'
            ? 'Price ↑'
            : filters.sortBy === 'price-desc'
              ? 'Price ↓'
              : 'Newest'}
          <button
            onClick={() => removeFilter('sortBy')}
            className="ml-1 rounded-full p-0.5 hover:bg-red-100"
            aria-label="Remove sort filter"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}
    </div>
  );

  // ─── Mobile: Sheet-based filter ──────────────────────────────────
  if (mobile) {
    return (
      <>
        {/* Mobile filter trigger button */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="text-white border-0 ml-1 px-1.5 py-0 text-xs" style={{ backgroundColor: '#B91C1C' }}>
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <SlidersHorizontal className="size-5 text-red-700" />
                Filters
              </SheetTitle>
              <SheetDescription>Narrow down your search</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 px-4">
              <div className="py-4">{filterContent}</div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Active filter badges */}
        {activeFilterBadges}
      </>
    );
  }

  // ─── Desktop: Inline sidebar ─────────────────────────────────────
  return (
    <aside className="w-64 shrink-0" aria-label="Product filters">
      <div className="sticky top-4 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <SlidersHorizontal className="size-5 text-red-700" />
            Filters
          </h2>
          {hasActiveFilters && (
            <Badge className="text-white border-0 text-xs px-2" style={{ backgroundColor: '#B91C1C' }}>
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {filterContent}
      </div>
    </aside>
  );
}

// Export the active filter badges helper as a named export for use in CatalogView
export function ActiveFilterBadges() {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const [categories, setCategories] = useState<Category[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);

  useEffect(() => {
    async function fetchFilterData() {
      try {
        const [catRes, modelRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/car-models'),
        ]);
        const catData = await catRes.json();
        const modelData = await modelRes.json();
        setCategories(catData.categories || []);
        setCarModels(modelData.carModels || []);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    }
    fetchFilterData();
  }, []);

  const hasActiveFilters =
    filters.carModelId !== '' ||
    filters.categoryId !== '' ||
    filters.condition !== 'all' ||
    filters.sortBy !== 'default';

  const getCarModelName = (id: string) => {
    const model = carModels.find((m) => m.id === id);
    return model ? `${model.make} ${model.name}` : '';
  };

  const getCategoryName = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.name || '';
  };

  const removeFilter = (key: string) => {
    if (key === 'condition') {
      setFilters({ condition: 'all' });
    } else if (key === 'sortBy') {
      setFilters({ sortBy: 'default' });
    } else {
      setFilters({ [key]: '' });
    }
  };

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {filters.carModelId && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
        >
          {getCarModelName(filters.carModelId)}
          <button
            onClick={() => removeFilter('carModelId')}
            className="ml-1 rounded-full p-0.5 hover:bg-red-100"
            aria-label={`Remove car model filter`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}
      {filters.categoryId && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
        >
          {getCategoryName(filters.categoryId)}
          <button
            onClick={() => removeFilter('categoryId')}
            className="ml-1 rounded-full p-0.5 hover:bg-red-100"
            aria-label={`Remove category filter`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}
      {filters.condition !== 'all' && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
        >
          {filters.condition === 'new' ? 'New' : 'Used'}
          <button
            onClick={() => removeFilter('condition')}
            className="ml-1 rounded-full p-0.5 hover:bg-red-100"
            aria-label="Remove condition filter"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}
      {filters.sortBy !== 'default' && (
        <Badge
          variant="secondary"
          className="gap-1 pr-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
        >
          Sort:{' '}
          {filters.sortBy === 'price-asc'
            ? 'Price ↑'
            : filters.sortBy === 'price-desc'
              ? 'Price ↓'
              : 'Newest'}
          <button
            onClick={() => removeFilter('sortBy')}
            className="ml-1 rounded-full p-0.5 hover:bg-red-100"
            aria-label="Remove sort filter"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}
