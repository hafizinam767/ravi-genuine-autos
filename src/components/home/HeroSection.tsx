'use client';

import { motion } from 'framer-motion';
import { Phone, Search, ShoppingCart, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

export default function HeroSection() {
  const { setView, setShowChat } = useAppStore();

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-amber-600 via-orange-500 to-orange-600">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%),
              radial-gradient(circle at 60% 80%, rgba(255,255,255,0.15) 0%, transparent 45%)
            `,
          }}
        />
        {/* Gear/cog shapes */}
        <svg className="absolute -right-20 -top-20 h-96 w-96 text-white/10" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="4" />
          <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <rect
              key={angle}
              x="47"
              y="8"
              width="6"
              height="14"
              rx="2"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </svg>
        <svg className="absolute -left-10 bottom-0 h-64 w-64 text-white/10" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <rect
              key={angle}
              x="47.5"
              y="14"
              width="5"
              height="12"
              rx="2"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
          {/* Text content */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ShoppingCart className="h-4 w-4" />
              Trusted by thousands across Pakistan
            </motion.div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Pakistan&apos;s Trusted Source for{' '}
              <span className="text-amber-200">Genuine Auto Parts</span>
            </h1>

            <p className="mt-4 max-w-2xl text-lg text-orange-100 sm:text-xl lg:mt-6">
              New &amp; Used Parts for Suzuki, Toyota, Honda &amp; More
            </p>

            {/* CTA buttons */}
            <motion.div
              className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                size="lg"
                className="w-full bg-white text-orange-600 shadow-lg hover:bg-orange-50 sm:w-auto"
                onClick={() => setView('catalog')}
              >
                <Search className="mr-2 h-5 w-5" />
                Browse Parts
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-2 border-white/50 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                onClick={() => setShowChat(true)}
              >
                AI Part Finder
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>

            {/* Contact number */}
            <motion.div
              className="mt-8 flex items-center justify-center gap-2 lg:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex items-center gap-2 rounded-lg bg-white/15 px-5 py-2.5 backdrop-blur-sm">
                <Phone className="h-5 w-5 text-amber-200" />
                <span className="text-sm font-medium text-white sm:text-base">
                  Call Us:{' '}
                  <a
                    href="tel:0320-0408917"
                    className="font-bold text-amber-200 underline decoration-amber-200/50 underline-offset-2 hover:text-amber-100"
                  >
                    0320-0408917
                  </a>
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Illustration / visual side */}
          <motion.div
            className="flex flex-1 items-center justify-center"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
              <img
                src="/hero-banner.png"
                alt="Ravi Genuine Autos - Quality Auto Parts"
                className="h-auto w-full object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-900/40 via-transparent to-transparent rounded-2xl" />
              {/* Floating badges */}
              <motion.div
                className="absolute -right-2 top-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-lg sm:-right-4"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-700">N</span>
                </div>
                <span className="text-xs font-semibold text-gray-700">New Parts</span>
              </motion.div>

              <motion.div
                className="absolute -left-2 bottom-8 flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-lg sm:-left-4"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-700">U</span>
                </div>
                <span className="text-xs font-semibold text-gray-700">Used Parts</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
          <path
            d="M0 40L48 36C96 32 192 24 288 28C384 32 480 48 576 52C672 56 768 48 864 40C960 32 1056 24 1152 28C1248 32 1344 48 1392 56L1440 64V80H0V40Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
