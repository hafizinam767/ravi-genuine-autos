'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import {
  ShoppingCart,
  Cog,
  Car,
  Zap,
  Wrench,
  Disc3,
  Fan,
  Snowflake,
  Armchair,
  Package,
} from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    condition: string;
    images: string;
    carModel: { name: string; make: string };
    category: { name: string };
  };
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

const categoryImageMap: Record<string, string> = {
  'engine parts': '/products/engine-parts.png',
  'body parts': '/products/body-parts.png',
  'interior parts': '/products/interior-parts.png',
  'electrical parts': '/products/electrical-parts.png',
  'suspension parts': '/products/suspension-parts.png',
  'brake parts': '/products/brake-parts.png',
  'transmission parts': '/products/transmission-parts.png',
  'ac & cooling': '/products/ac-cooling.png',
  'cooling': '/products/ac-cooling.png',
};

function getCategoryIcon(categoryName: string): React.ElementType {
  const lower = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIconMap)) {
    if (lower.includes(key)) return icon;
  }
  return Package;
}

export default function ProductCard({ product }: ProductCardProps) {
  const selectProduct = useAppStore((s) => s.selectProduct);
  const addToCart = useAppStore((s) => s.addToCart);

  const categoryIconType = getCategoryIcon(product.category.name);
  const [imgError, setImgError] = useState(false);

  const getCategoryImage = (categoryName: string): string | null => {
    const lower = categoryName.toLowerCase();
    for (const [key, img] of Object.entries(categoryImageMap)) {
      if (lower.includes(key)) return img;
    }
    return null;
  };

  const categoryImage = getCategoryImage(product.category.name);

  // Use the first uploaded product image, falling back to category image
  const productImage = product.images?.split(',')[0]?.trim() || null;
  const displayImage = !imgError ? (productImage || categoryImage) : categoryImage;

  const handleCardClick = () => {
    selectProduct(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.split(',')[0] || '',
      condition: product.condition,
      carModel: `${product.carModel.make} ${product.carModel.name}`,
    });
  };

  const isNew = product.condition.toLowerCase() === 'new';

  return (
    <Card
      className="group cursor-pointer overflow-hidden py-0 gap-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/60"
      onClick={handleCardClick}
      role="article"
      aria-label={`Product: ${product.name}`}
    >
      {/* Image area */}
      <div className="relative aspect-square bg-muted/50 flex items-center justify-center overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          React.createElement(categoryIconType, { className: 'size-16 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110' })
        )}

        {/* Condition badge */}
        <Badge
          className={`absolute top-2 left-2 text-xs font-medium ${
            isNew
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0'
              : 'text-white border-0'
          }`}
          style={!isNew ? { backgroundColor: '#B91C1C' } : undefined}
        >
          {isNew ? 'New' : 'Used'}
        </Badge>
      </div>

      <CardContent className="p-4 flex flex-col gap-2">
        {/* Car model */}
        <p className="text-xs text-muted-foreground font-medium truncate">
          {product.carModel.make} {product.carModel.name}
        </p>

        {/* Product name */}
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price */}
        <p className="text-lg font-bold" style={{ color: '#B91C1C' }}>
          Rs. {product.price.toLocaleString()}
        </p>

        {/* Category tag */}
        <p className="text-xs text-muted-foreground/70">
          {product.category.name}
        </p>

        {/* Add to Cart button */}
        <Button
          size="sm"
          className="mt-1 w-full text-white font-medium"
          style={{ backgroundColor: '#B91C1C' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="size-4" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
