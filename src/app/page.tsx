'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HomeView from '@/components/home/HomeView';
import CatalogView from '@/components/catalog/CatalogView';
import ProductDetailView from '@/components/product/ProductDetailView';
import CheckoutView from '@/components/cart/CheckoutView';
import AccountView from '@/components/auth/AccountView';
import IdentifyView from '@/components/ai/IdentifyView';
import AuthDialog from '@/components/auth/AuthDialog';
import ChatWidget from '@/components/ai/ChatWidget';

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'catalog':
        return <CatalogView />;
      case 'product':
        return <ProductDetailView />;
      case 'checkout':
        return <CheckoutView />;
      case 'account':
        return <AccountView />;
      case 'identify':
        return <IdentifyView />;
      default:
        return <HomeView />;
    }
  };

  const isHome = currentView === 'home';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className={`flex-1 w-full ${!isHome ? 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8' : ''}`}>
        {renderView()}
      </main>

      <Footer />

      {/* Global Dialogs & Widgets */}
      <AuthDialog />
      <ChatWidget />
    </div>
  );
}
