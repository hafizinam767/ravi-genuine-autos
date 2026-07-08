'use client';

import HeroSection from './HeroSection';
import CategoryGrid from './CategoryGrid';
import FeaturedProducts from './FeaturedProducts';

export default function HomeView() {
  return (
    <main className="min-h-screen scroll-smooth">
      {/* Vehicle Selector + Part Number Search (like hyaparts.com top sections) */}
      <HeroSection />

      {/* Category Images Grid (like hyaparts.com features section) */}
      <CategoryGrid />

      {/* Featured Products */}
      <FeaturedProducts />
    </main>
  );
}
