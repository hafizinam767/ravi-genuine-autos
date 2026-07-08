'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HomeView from '@/components/home/HomeView';
import CatalogView from '@/components/catalog/CatalogView';
import ProductDetailView from '@/components/product/ProductDetailView';
import CheckoutView from '@/components/cart/CheckoutView';
import AccountView from '@/components/auth/AccountView';
import IdentifyView from '@/components/ai/IdentifyView';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AuthDialog from '@/components/auth/AuthDialog';
import ChatWidget from '@/components/ai/ChatWidget';

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setView = useAppStore((s) => s.setView);

  // Auto-restore auth from session cookie on page load
  useEffect(() => {
    if (user) return; // Already logged in
    fetch('/api/auth', { method: 'GET' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Silently ignore — user is not authenticated
      });
  }, []);

  // Guard: redirect away from admin view if user is not admin
  useEffect(() => {
    if (currentView === 'admin' && (!user || user.role !== 'admin')) {
      setView('home');
    }
  }, [currentView, user, setView]);

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
      case 'admin':
        return <AdminDashboard />;
      default:
        return <HomeView />;
    }
  };

  const isHome = currentView === 'home';
  const isAdmin = currentView === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className={`flex-1 w-full ${!isHome && !isAdmin ? 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8' : isAdmin ? '' : ''}`}>
        {renderView()}
      </main>

      {!isAdmin && <Footer />}

      {/* Global Dialogs & Widgets */}
      <AuthDialog />
      <ChatWidget />
    </div>
  );
}
