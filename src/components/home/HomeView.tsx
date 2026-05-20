'use client';

import HeroSection from './HeroSection';
import CategoryGrid from './CategoryGrid';
import CarModelSlider from './CarModelSlider';
import FeaturedProducts from './FeaturedProducts';
import AIFeaturesSection from './AIFeaturesSection';

export default function HomeView() {
  return (
    <main className="min-h-screen scroll-smooth">
      <HeroSection />
      <div className="space-y-16 py-16 sm:space-y-20 sm:py-20">
        <CategoryGrid />
        <CarModelSlider />
        <FeaturedProducts />
        <AIFeaturesSection />
      </div>
    </main>
  );
}
