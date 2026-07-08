'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAppStore } from '@/lib/store';
import ProductCard from '@/components/catalog/ProductCard';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Package,
  Cog,
  Car,
  Zap,
  Wrench,
  Disc3,
  Fan,
  Snowflake,
  Armchair,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  Tag,
  Hash,
  Truck,
  Shield,
  Layers,
} from 'lucide-react';

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

interface Recommendation {
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

const categoryIconMap: Record<string, React.ElementType> = {
  engine: Cog,
  body: Car,
  interior: Armchair,
  electrical: Zap,
  suspension: Wrench,
  brake: Disc3,
  transmission: Fan,
  'ac & cooling': Snowflake,
  cooling: Snowflake,
};

function getCategoryIcon(categoryName: string): React.ElementType {
  const lower = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIconMap)) {
    if (lower.includes(key)) return icon;
  }
  return Package;
}

function getStockStatus(stock: number): {
  label: string;
  color: string;
  icon: React.ElementType;
} {
  if (stock <= 0) return { label: 'Out of Stock', color: 'text-red-500', icon: XCircle };
  if (stock <= 5) return { label: 'Low Stock', color: 'text-amber-500', icon: AlertTriangle };
  return { label: 'In Stock', color: 'text-emerald-500', icon: CheckCircle };
}

export default function ProductDetailView() {
  const selectedProductId = useAppStore((s) => s.selectedProductId);
  const setView = useAppStore((s) => s.setView);
  const addToCart = useAppStore((s) => s.addToCart);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recsReasoning, setRecsReasoning] = useState<string | null>(null);
  const [recsTips, setRecsTips] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  // Fetch product details
  useEffect(() => {
    if (!selectedProductId) return;
    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setQuantity(1);
      setSelectedImageIndex(0);
      try {
        const res = await fetch(`/api/products/${selectedProductId}`);
        const data = await res.json();
        if (!cancelled && data.product) {
          setProduct(data.product);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [selectedProductId]);

  // Fetch AI recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!product) return;
    setRecsLoading(true);

    const params = new URLSearchParams();
    params.set('currentProductId', product.id);
    if (product.carModelId) params.set('carModelId', product.carModelId);
    if (product.categoryId) params.set('categoryId', product.categoryId);

    try {
      const res = await fetch(`/api/recommendations?${params.toString()}`);
      const data = await res.json();
      setRecommendations(data.recommendations || []);
      setRecsReasoning(data.reasoning || null);
      setRecsTips(data.tips || null);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setRecsLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (product) {
      fetchRecommendations();
    }
  }, [product, fetchRecommendations]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.split(',')[0] || '',
      condition: product.condition,
      carModel: `${product.carModel.make} ${product.carModel.name}`,
    });
    // Brief visual feedback - reset quantity
    setQuantity(1);
  };

  const imageList = product?.images ? product.images.split(',').map((s) => s.trim()).filter(Boolean) : [];

  // Get the currently displayable images (excluding errored ones)
  const validImages = imageList.filter((_, i) => !imgErrors.has(i));
  const handleImageError = (index: number) => {
    setImgErrors((prev) => new Set(prev).add(index));
  };
  const isNew = product?.condition?.toLowerCase() === 'new';
  const stockStatus = product ? getStockStatus(product.stock) : null;
  const MainImageIcon = product ? getCategoryIcon(product.category.name) : Package;

  // ─── Loading Skeleton ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton className="h-6 w-64" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="size-16 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Package className="size-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-4">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => setView('catalog')} className="text-white" style={{ backgroundColor: '#B91C1C' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}>
          <ArrowLeft className="size-4" />
          Back to Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer hover:opacity-80"
              style={{ color: '#B91C1C' }}
              onClick={() => setView('home')}
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer hover:opacity-80"
              style={{ color: '#B91C1C' }}
              onClick={() => setView('catalog')}
            >
              Catalog
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1 max-w-[200px]">
              {product.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => setView('catalog')}
      >
        <ArrowLeft className="size-4" />
        Back to Catalog
      </Button>

      {/* ─── Product Main Section ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Image Gallery */}
        <div className="w-full lg:w-1/2">
          {/* Main Image */}
          <div className="relative aspect-square bg-muted/50 rounded-xl flex items-center justify-center overflow-hidden border">
            {validImages.length > 0 ? (
              <img
                src={validImages[Math.min(selectedImageIndex, validImages.length - 1)] || validImages[0]}
                alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                className="h-full w-full object-cover"
                onError={() => {
                  // Find which original index this corresponds to and mark as errored
                  const src = validImages[Math.min(selectedImageIndex, validImages.length - 1)] || validImages[0];
                  const origIndex = imageList.indexOf(src);
                  if (origIndex >= 0) handleImageError(origIndex);
                }}
              />
            ) : (
              <MainImageIcon className="size-32 text-muted-foreground/20" />
            )}

            {/* Condition badge */}
            <Badge
              className={`absolute top-4 left-4 text-sm font-medium ${
                isNew
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0'
                  : 'text-white border-0'
              }`}
              style={!isNew ? { backgroundColor: '#B91C1C' } : undefined}
            >
              {isNew ? 'New' : 'Used'}
            </Badge>

            {/* Featured badge */}
            {product.featured && (
              <Badge className="absolute top-4 right-4 text-white border-0 text-sm" style={{ backgroundColor: '#DC2626' }}>
                <Sparkles className="size-3" />
                Featured
              </Badge>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {validImages.length > 1 && (
            <div className="flex gap-2 mt-3">
              {validImages.map((imgUrl, vi) => (
                <button
                  key={vi}
                  onClick={() => setSelectedImageIndex(vi)}
                  className={`size-16 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all ${
                    selectedImageIndex === vi
                      ? 'ring-2'
                      : 'border-transparent'
                  }`}
                  style={selectedImageIndex === vi ? { borderColor: '#B91C1C', boxShadow: '0 0 0 2px rgba(185,28,28,0.2)' } : undefined}
                  aria-label={`View image ${vi + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} thumbnail ${vi + 1}`}
                    className="h-full w-full object-cover"
                    onError={() => {
                      const origIndex = imageList.indexOf(imgUrl);
                      if (origIndex >= 0) handleImageError(origIndex);
                    }}
                  />
                </button>
              ))}
            </div>
          )}
          {/* Show single thumbnail if only one valid image */}
          {validImages.length === 1 && (
            <div className="flex gap-2 mt-3">
              <button
                className="size-16 rounded-lg border-2 flex items-center justify-center overflow-hidden"
                style={{ borderColor: '#B91C1C', boxShadow: '0 0 0 2px rgba(185,28,28,0.2)' }}
                aria-label="View image 1"
              >
                <img
                  src={validImages[0]}
                  alt={`${product.name} thumbnail 1`}
                  className="h-full w-full object-cover"
                  onError={() => {
                    const origIndex = imageList.indexOf(validImages[0]);
                    if (origIndex >= 0) handleImageError(origIndex);
                  }}
                />
              </button>
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          {/* Product Name */}
          <h1 className="text-2xl lg:text-3xl font-bold leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <p className="text-3xl font-bold" style={{ color: '#B91C1C' }}>
            Rs. {product.price.toLocaleString()}
          </p>

          {/* Condition & Stock */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={
                isNew
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : ''
              }
              style={!isNew ? { backgroundColor: '#FEF2F2', color: '#991B1B', borderColor: '#FECACA' } : undefined}
            >
              {isNew ? 'New' : 'Used'} Condition
            </Badge>

            {stockStatus && (
              <span className={`flex items-center gap-1 text-sm font-medium ${stockStatus.color}`}>
                <stockStatus.icon className="size-4" />
                {stockStatus.label}
              </span>
            )}
          </div>

          {/* Car Model Compatibility */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
            <Car className="size-5" style={{ color: '#B91C1C' }} />
            <div>
              <p className="text-xs text-muted-foreground">Compatible With</p>
              <p className="font-semibold">
                {product.carModel.make} {product.carModel.name}
              </p>
            </div>
          </div>

          <Separator />

          {/* Quantity Selector + Add to Cart */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-none hover:bg-muted"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-12 text-center font-semibold text-sm tabular-nums">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-none hover:bg-muted"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(product.stock > 0 ? product.stock : 99, q + 1)
                    )
                  }
                  disabled={product.stock > 0 && quantity >= product.stock}
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full text-white font-semibold text-base h-12"
              style={{ backgroundColor: '#B91C1C' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <ShoppingCart className="size-5" />
              {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Truck className="size-3.5" />
              Nationwide Delivery
            </span>
            <span className="flex items-center gap-1">
              <Shield className="size-3.5" />
              Quality Guaranteed
            </span>
          </div>

          <Separator />

          {/* SKU & Part Number */}
          <div className="flex flex-wrap gap-4 text-sm">
            {product.sku && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Hash className="size-3.5" />
                <span>SKU:</span>
                <span className="font-mono font-medium text-foreground">{product.sku}</span>
              </div>
            )}
            {product.partNumber && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Tag className="size-3.5" />
                <span>Part #:</span>
                <span className="font-mono font-medium text-foreground">{product.partNumber}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          <Separator />

          {/* Category & Car Model Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" style={{ backgroundColor: '#FEF2F2', color: '#991B1B', borderColor: '#FECACA' }}>
              <Layers className="size-3" />
              {product.category.name}
            </Badge>
            <Badge variant="secondary" style={{ backgroundColor: '#FEF2F2', color: '#991B1B', borderColor: '#FECACA' }}>
              <Car className="size-3" />
              {product.carModel.make} {product.carModel.name}
            </Badge>
          </div>
        </div>
      </div>

      {/* ─── AI Recommendations Section ────────────────────────────── */}
      <Separator className="my-4" />

      <section aria-label="Product recommendations">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5" style={{ color: '#B91C1C' }} />
          <h2 className="text-xl font-bold">You May Also Need</h2>
          {recsLoading && (
            <span className="text-xs text-muted-foreground animate-pulse">
              AI is finding recommendations...
            </span>
          )}
        </div>

        {/* AI Reasoning/Tips */}
        {!recsLoading && (recsReasoning || recsTips) && (
          <div className="mb-4 p-4 rounded-lg border text-sm" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
            {recsReasoning && (
              <p className="mb-1" style={{ color: '#7F1D1D' }}>
                <span className="font-semibold">AI Insight:</span> {recsReasoning}
              </p>
            )}
            {recsTips && (
              <p style={{ color: '#991B1B' }}>
                <span className="font-semibold">Pro Tip:</span> {recsTips}
              </p>
            )}
          </div>
        )}

        {/* Recommendations Scroll */}
        {recsLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[220px] max-w-[220px]">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <div className="mt-2 flex flex-col gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="min-w-[220px] max-w-[220px]">
                  <ProductCard product={rec} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">
            No recommendations available at this time.
          </p>
        )}
      </section>
    </div>
  );
}
