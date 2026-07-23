'use client';

import HeroSection from './HeroSection';
import AIFeaturesSection from './AIFeaturesSection';
import CategoryGrid from './CategoryGrid';
import CarModelSlider from './CarModelSlider';
import FeaturedProducts from './FeaturedProducts';

export default function HomeView() {
  return (
    <main className="min-h-screen scroll-smooth space-y-12 pb-12">
      {/* Vehicle Selector + Part Number Search */}
      <HeroSection />

      {/* AI Features Section */}
      <AIFeaturesSection />

      {/* Category Images Grid */}
      <CategoryGrid />

      {/* Popular Car Models Slider */}
      <CarModelSlider />

      {/* Featured Products */}
      <FeaturedProducts />
    </main>
  );
}
