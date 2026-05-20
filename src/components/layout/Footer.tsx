'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Separator } from '@/components/ui/separator';
import {
  Phone,
  Car,
  MapPin,
  Clock,
  Wrench,
  Home,
  Grid3X3,
  Cpu,
  User,
  Mail,
} from 'lucide-react';

// ─── Car Model type ──────────────────────────────────────────────────────

interface CarModel {
  id: string;
  name: string;
  make: string;
}

// ─── Quick Links ────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: 'Home', view: 'home' as const, icon: Home },
  { label: 'Parts Catalog', view: 'catalog' as const, icon: Grid3X3 },
  { label: 'Identify Part (AI)', view: 'identify' as const, icon: Cpu },
  { label: 'My Account', view: 'account' as const, icon: User },
];

// ─── Footer Component ───────────────────────────────────────────────────

export default function Footer() {
  const { setView, setFilters } = useAppStore();
  const [carModels, setCarModels] = useState<CarModel[]>([]);

  // Fetch car models from API to get correct database IDs
  useEffect(() => {
    async function fetchCarModels() {
      try {
        const res = await fetch('/api/car-models');
        const data = await res.json();
        setCarModels(data.carModels || []);
      } catch {
        // Silently fail - footer still works without car model links
      }
    }
    fetchCarModels();
  }, []);

  const handleCarModelClick = (modelId: string) => {
    setFilters({ carModelId: modelId, categoryId: '', condition: 'all', search: '', sortBy: 'default' });
    setView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (view: Parameters<typeof setView>[0]) => {
    setView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto bg-gray-900 text-gray-300">
      {/* ── Main Footer Content ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — About */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => handleNavClick('home')}
              className="mb-4 flex items-center transition-opacity hover:opacity-80"
              aria-label="Go to home"
            >
              <img
                src="/logo.png"
                alt="Ravi Genuine Autos"
                className="h-20 w-auto rounded-lg"
              />
            </button>
            <p className="mb-4 text-sm leading-relaxed text-gray-400">
              Your trusted source for genuine auto parts in Pakistan. We supply
              high-quality OEM and aftermarket parts for Suzuki, Toyota, Honda, KIA, MG, CHANGAN &amp; All Wheel Drive vehicles at competitive prices.
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="size-4 shrink-0 text-amber-400" />
                <a
                  href="tel:03200408917"
                  className="transition-colors hover:text-white"
                >
                  0320-0408917
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <User className="size-4 shrink-0 text-amber-400" />
                <span>M.Zulfiqar</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="size-4 shrink-0 text-amber-400" />
                <a
                  href="mailto:info@ravigenuineautos.com"
                  className="transition-colors hover:text-white"
                >
                  info@ravigenuineautos.com
                </a>
              </div>
            </div>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <Wrench className="size-4 text-amber-400" />
              Quick Links
            </h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.view}>
                    <button
                      onClick={() => handleNavClick(link.view)}
                      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                    >
                      <Icon className="size-4 shrink-0 text-amber-500/70" />
                      {link.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3 — Car Models */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <Car className="size-4 text-amber-400" />
              Car Models
            </h4>
            <ul className="space-y-1.5">
              {carModels.map((model) => (
                <li key={model.id}>
                  <button
                    onClick={() => handleCarModelClick(model.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-amber-300"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-amber-500/50" />
                    {model.make} {model.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Contact & Info */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <MapPin className="size-4 text-amber-400" />
              Contact & Info
            </h4>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-800 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Address</p>
                    <p className="mt-0.5 text-sm text-gray-400">
                      Thokar Niaz Baig, Raiwind Road,
                      <br />
                      Near Ali Town Orange Line Station,
                      <br />
                      Lahore, Pakistan
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-800 p-4">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Phone</p>
                    <a
                      href="tel:03200408917"
                      className="mt-0.5 block text-sm text-gray-400 transition-colors hover:text-amber-300"
                    >
                      0320-0408917
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-800 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Working Hours</p>
                    <p className="mt-0.5 text-sm text-gray-400">
                      Mon – Sat: 9:00 AM – 10:00 PM
                    </p>
                    <p className="text-sm text-gray-400">
                      Sunday: 10:00 AM – 10:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ───────────────────────────────────────────────── */}
      <Separator className="bg-gray-700" />
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-center text-xs text-gray-500 sm:text-left">
          &copy; {new Date().getFullYear()} Ravi Genuine Autos. All rights
          reserved.
        </p>
        <p className="text-center text-xs text-gray-600 sm:text-right">
          Genuine Auto Parts &mdash; Lahore, Pakistan
        </p>
      </div>
    </footer>
  );
}
