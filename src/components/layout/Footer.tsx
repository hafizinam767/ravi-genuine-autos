'use client';

import { useAppStore } from '@/lib/store';
import {
  Phone,
  Home,
  Grid3X3,
  Cpu,
  User,
  Mail,
  MessageCircle,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Clock,
} from 'lucide-react';

// ─── Navigation Links ───────────────────────────────────────────────────

const EXPLORE_LINKS = [
  { label: 'Home', view: 'home' as const, icon: Home },
  { label: 'Parts Catalog', view: 'catalog' as const, icon: Grid3X3 },
  { label: 'Identify Part (AI)', view: 'identify' as const, icon: Cpu },
  { label: 'My Account', view: 'account' as const, icon: User },
];

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: '#',
    icon: Facebook,
  },
  {
    label: 'Instagram',
    href: '#',
    icon: Instagram,
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/923324131636',
    icon: MessageCircle,
  },
  {
    label: 'YouTube',
    href: '#',
    icon: Youtube,
  },
];

// ─── Footer Component ───────────────────────────────────────────────────

export default function Footer() {
  const { setView } = useAppStore();

  const handleNavClick = (view: Parameters<typeof setView>[0]) => {
    setView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="mt-auto">
      {/* ── Red Accent Top Border ──────────────────────────────────── */}
      <div className="h-1" style={{ backgroundColor: '#DC2626' }} />

      {/* ── Main Footer Content ──────────────────────────────────────── */}
      <div className="bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Column 1 — Explore */}
            <div>
              <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
                Explore
              </h4>
              <ul className="space-y-2.5">
                {EXPLORE_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.view}>
                      <button
                        onClick={() => handleNavClick(link.view)}
                        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <Icon className="size-4 shrink-0" style={{ color: '#EF4444' }} />
                        {link.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Column 2 — WhatsApp Inquiries */}
            <div>
              <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
                WhatsApp Inquiries
              </h4>
              <div className="space-y-4">
                <a
                  href="https://wa.me/923200408917"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <MessageCircle className="size-4 shrink-0 text-green-500" />
                  <span>+92-320-0408917</span>
                </a>
                <a
                  href="https://wa.me/923324131636"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <MessageCircle className="size-4 shrink-0 text-green-500" />
                  <span>+92-332-4131636</span>
                </a>
                <a
                  href="https://wa.me/923200408917"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  <MessageCircle className="size-4" />
                  Order via WhatsApp
                </a>
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="inline-block size-1.5 rounded-full bg-green-500" />
                  Fast Response Guaranteed
                </p>
              </div>
            </div>

            {/* Column 3 — Follow Us */}
            <div>
              <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
                Follow Us
              </h4>
              <ul className="space-y-2.5">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <Icon className="size-4 shrink-0" style={{ color: '#EF4444' }} />
                        {social.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Column 4 — Get In Touch */}
            <div>
              <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
                Get In Touch
              </h4>
              <div className="space-y-3.5">
                <a
                  href="mailto:info@ravigenuineautos.com"
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Mail className="size-4 shrink-0" style={{ color: '#EF4444' }} />
                  <span className="break-all">info@ravigenuineautos.com</span>
                </a>
                <a
                  href="tel:03200408917"
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Phone className="size-4 shrink-0" style={{ color: '#EF4444' }} />
                  +92-320-0408917
                </a>
                <a
                  href="tel:03324131636"
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Phone className="size-4 shrink-0" style={{ color: '#EF4444' }} />
                  +92-332-4131636
                </a>
                <div className="flex items-center gap-2.5 text-sm text-gray-400">
                  <User className="size-4 shrink-0" style={{ color: '#EF4444' }} />
                  Mehar Zulfeqar Ali
                </div>
              </div>
            </div>

            {/* Column 5 — Ravi Genuine Autos Info */}
            <div>
              <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
                RAVI GENUINE AUTOS
              </h4>
              <div className="mb-4">
                <button
                  onClick={() => handleNavClick('home')}
                  className="transition-opacity hover:opacity-80"
                  aria-label="Go to home"
                >
                  <img
                    src="/logo.png"
                    alt="Ravi Genuine Autos"
                    className="h-16 w-auto rounded-lg"
                  />
                </button>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-gray-400">
                Genuine Parts for Suzuki, Toyota, Honda, KIA, MG, CHANGAN &amp; ALL Wheel Drive Models.
              </p>
              <div className="flex items-start gap-2.5 text-sm text-gray-400">
                <MapPin className="mt-0.5 size-4 shrink-0" style={{ color: '#EF4444' }} />
                <span>
                  Near Ali Town Orange Line Station,
                  <br />
                  Thokar Niaz Baig, Raiwind Road,
                  <br />
                  Lahore, Pakistan
                </span>
              </div>
              <div className="mt-3 flex items-start gap-2.5 text-sm text-gray-400">
                <Clock className="mt-0.5 size-4 shrink-0" style={{ color: '#EF4444' }} />
                <div className="space-y-0.5">
                  <p>Mon – Sat: 9:00 AM – 10:00 PM</p>
                  <p>Sunday: 10:00 AM – 10:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Copyright Bar ─────────────────────────────────────── */}
      <div className="bg-gray-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500 sm:text-left">
            &copy; 2025 Ravi Genuine Autos. All rights reserved.
          </p>
          <p className="text-center text-xs text-gray-600 sm:text-right">
            Genuine Auto Parts &mdash; Lahore, Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
}
