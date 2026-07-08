'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Phone,
  X,
  Home,
  LogOut,
  ChevronDown,
  Minus,
  Plus,
  Trash2,
  Wrench,
  Mail,
  Cog,
  Car,
  Shield,
  Gauge,
  Zap,
  Settings2,
  Snowflake,
  LayoutDashboard,
} from 'lucide-react';

// ─── Navigation Links (like hyaparts.com category bar) ──────────────

const CATEGORY_LINKS = [
  { label: 'HOME', categorySlug: '', isHome: true, icon: Home },
  { label: 'MAINTENANCE PACKAGES', categorySlug: 'engine-parts', icon: Cog },
  { label: 'BODY PARTS', categorySlug: 'body-parts', icon: Car },
  { label: 'BRAKE SERVICE', categorySlug: 'brake-parts', icon: Shield },
  { label: 'SUSPENSIONS', categorySlug: 'suspension-parts', icon: Gauge },
  { label: 'ENGINE PARTS', categorySlug: 'engine-parts', icon: Cog },
  { label: 'CAR ACCESSORIES', categorySlug: 'interior-parts', icon: Car },
  { label: 'ELECTRICAL', categorySlug: 'electrical-parts', icon: Zap },
];

// ─── Header Component ──────────────────────────────────────────────────

export default function Header() {
  const {
    currentView,
    cart,
    user,
    cartOpen,
    setView,
    setFilters,
    getCartCount,
    getCartTotal,
    removeFromCart,
    updateCartQuantity,
    setUser,
    logout,
    setCartOpen,
    setShowAuth,
    selectProduct,
  } = useAppStore();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  // ── Fetch category IDs on mount ────────────────────────────────────
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        const cats = Array.isArray(data) ? data : data.categories || [];
        const map: Record<string, string> = {};
        for (const cat of cats) {
          map[cat.slug] = cat.id;
        }
        setCategoryMap(map);
      } catch {
        // Silently fail — category nav will still work with search fallback
      }
    }
    fetchCategories();
  }, []);

  // ── Scroll shadow effect ───────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Search handler ─────────────────────────────────────────────────
  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (query) {
      setFilters({ search: query });
      setView('catalog');
      setSearchOpen(false);
      setSearchQuery('');
    }
  }, [searchQuery, setFilters, setView]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch]
  );

  // ── Category nav click handler ─────────────────────────────────────
  const handleCategoryClick = useCallback(
    (link: (typeof CATEGORY_LINKS)[number]) => {
      if (link.isHome) {
        setView('home');
      } else {
        const categoryId = categoryMap[link.categorySlug] || '';
        if (categoryId) {
          useAppStore.getState().resetFilters();
          setFilters({ categoryId });
        } else {
          setFilters({ search: link.label });
        }
        setView('catalog');
      }
      setMobileMenuOpen(false);
    },
    [categoryMap, setFilters, setView]
  );

  // ── Cart count ─────────────────────────────────────────────────────
  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* ── Top Tagline Bar (like hyaparts.com) ─────────────────────────── */}
      <div
        className="hidden md:block"
        style={{ backgroundColor: '#B91C1C' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <p className="text-sm font-bold tracking-wide text-white">
            PAKISTAN&apos;S BIGGEST RANGE OF GENUINE AUTO PARTS!!
          </p>
          <div className="flex items-center gap-4">
            <a
              href="tel:0320-0408917"
              className="flex items-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              <Phone className="size-3.5" />
              0320-0408917
            </a>
            <a
              href="tel:0332-4131636"
              className="flex items-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              <Phone className="size-3.5" />
              0332-4131636
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Header ─────────────────────────────────────────────── */}
      <div
        className={`bg-white transition-shadow duration-200 ${
          scrolled ? 'shadow-lg' : 'shadow-sm'
        }`}
      >
        {/* Upper Row: Logo + Tagline Text, Search, Actions (like hyaparts) */}
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-4">
          {/* Logo */}
          <button
            onClick={() => setView('home')}
            className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-80"
            aria-label="Go to home"
          >
            <img
              src="/logo.png"
              alt="Ravi Genuine Autos"
              className="h-12 w-auto lg:h-14"
            />
            <span className="hidden lg:block text-xs font-semibold text-gray-600 leading-tight max-w-[160px]">
              Biggest Range of<br />
              <span style={{ color: '#B91C1C' }}>Genuine Auto Parts</span> in Pakistan!!
            </span>
          </button>

          {/* Search Bar — Desktop */}
          <div className="mx-auto hidden max-w-xl flex-1 lg:flex">
            <div className="relative flex w-full items-center">
              <Input
                type="text"
                placeholder="Search auto parts by name, model, or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="h-10 rounded-l-lg rounded-r-none border-r-0 pr-2 focus-visible:ring-red-500/30 focus-visible:border-red-500"
              />
              <Button
                onClick={handleSearch}
                className="h-10 rounded-l-none rounded-r-lg px-4 text-white"
                style={{ backgroundColor: '#DC2626' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#B91C1C')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#DC2626')
                }
                size="default"
              >
                <Search className="size-4" />
              </Button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-1 lg:gap-2">
            {/* Sign In Button (like hyaparts) */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <div
                        className="flex size-7 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: '#B91C1C' }}
                      >
                        <User className="size-4" />
                      </div>
                      <span className="max-w-[100px] truncate text-sm">
                        {user.name}
                      </span>
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-normal">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setView('account')}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 size-4" />
                      Account
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem
                        onClick={() => setView('admin')}
                        className="cursor-pointer"
                      >
                        <LayoutDashboard className="mr-2 size-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="cursor-pointer text-red-600"
                    >
                      <LogOut className="mr-2 size-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAuth(true, 'login')}
                    className="text-sm"
                    style={{ borderColor: '#DC2626', color: '#DC2626' }}
                  >
                    Sign in
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowAuth(true, 'register')}
                    className="text-sm text-white"
                    style={{ backgroundColor: '#B91C1C' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = '#991B1B')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = '#B91C1C')
                    }
                  >
                    Register
                  </Button>
                </>
              )}
            </div>

            {/* Contact Us Button (like hyaparts) */}
            <Button
              className="hidden gap-1.5 text-white lg:flex"
              size="sm"
              style={{ backgroundColor: '#B91C1C' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#991B1B')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = '#B91C1C')
              }
              onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Mail className="size-4" />
              Contact Us
            </Button>

            {/* Cart Icon (like hyaparts nav cart) */}
            <Button
              variant="ghost"
              size="icon"
              className="relative size-10"
              onClick={() => setCartOpen(true)}
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart className="size-5" />
              {cartCount > 0 && (
                <Badge
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold text-white hover:text-white"
                  style={{ backgroundColor: '#DC2626' }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </Badge>
              )}
            </Button>

            {/* Search Toggle — Mobile */}
            <div className="flex items-center lg:hidden">
              {searchOpen && (
                <div className="flex items-center gap-1">
                  <Input
                    type="text"
                    placeholder="Search parts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    autoFocus
                    className="h-9 w-36 text-sm sm:w-48"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    onClick={handleSearch}
                    aria-label="Search"
                  >
                    <Search className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    aria-label="Close search"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
              {!searchOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 lg:hidden"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                >
                  <Search className="size-5" />
                </Button>
              )}
            </div>

            {/* Mobile User Icon */}
            <Button
              variant="ghost"
              size="icon"
              className="size-10 lg:hidden"
              onClick={() => {
                if (user) {
                  setView('account');
                } else {
                  setShowAuth(true, 'login');
                }
              }}
              aria-label={user ? 'Account' : 'Login'}
            >
              <User className="size-5" />
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="size-10 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>

        {/* Lower Row: Category Navigation Bar (like hyaparts) */}
        <div
          className="hidden lg:block"
          style={{ backgroundColor: '#B91C1C' }}
        >
          <nav className="mx-auto flex max-w-7xl items-center px-2">
            {CATEGORY_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleCategoryClick(link)}
                className="px-3 py-2.5 text-xs font-bold tracking-wider text-white/90 transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Mobile Navigation Sheet ─────────────────────────────────── */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader
            className="border-b px-4 py-4"
            style={{ backgroundColor: '#B91C1C' }}
          >
            <SheetTitle className="flex items-center gap-2 text-white">
              <img
                src="/logo-white.png"
                alt="Ravi Genuine Autos"
                className="h-10 w-auto"
              />
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-80px)]">
            {/* Category Nav Links */}
            <div className="p-2">
              {CATEGORY_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = link.isHome
                  ? currentView === 'home'
                  : currentView === 'catalog';
                return (
                  <button
                    key={link.label}
                    onClick={() => handleCategoryClick(link)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={isActive ? { backgroundColor: '#FEE2E2', color: '#B91C1C' } : undefined}
                  >
                    <Icon className="size-5" />
                    {link.label}
                  </button>
                );
              })}
            </div>

            <Separator />

            {/* Mobile Auth Section */}
            <div className="p-4">
              {user ? (
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-3 rounded-lg p-3"
                    style={{ backgroundColor: '#FEE2E2' }}
                  >
                    <div
                      className="flex size-10 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: '#B91C1C' }}
                    >
                      <User className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setView('account');
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="size-4" />
                    My Account
                  </button>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setView('admin');
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LayoutDashboard className="size-4" style={{ color: '#B91C1C' }} />
                      Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    style={{ borderColor: '#DC2626', color: '#DC2626' }}
                    onClick={() => {
                      setShowAuth(true, 'login');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign in
                  </Button>
                  <Button
                    className="w-full text-white"
                    style={{ backgroundColor: '#B91C1C' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = '#991B1B')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = '#B91C1C')
                    }
                    onClick={() => {
                      setShowAuth(true, 'register');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Contact info on mobile */}
            <div className="p-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Contact Us
                </p>
                <div className="mt-2 space-y-1.5">
                  <p className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="size-3.5" style={{ color: '#B91C1C' }} />
                    0320-0408917
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="size-3.5" style={{ color: '#B91C1C' }} />
                    0332-4131636
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-700">
                    <Car className="size-3.5" style={{ color: '#B91C1C' }} />
                    Mehar Zulfeqar Ali
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ── Cart Drawer ─────────────────────────────────────────────── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="size-5" style={{ color: '#B91C1C' }} />
              Shopping Cart
              {cartCount > 0 && (
                <Badge
                  className="text-white hover:text-white"
                  style={{ backgroundColor: '#B91C1C' }}
                >
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
              <div
                className="flex size-20 items-center justify-center rounded-full"
                style={{ backgroundColor: '#FEE2E2' }}
              >
                <ShoppingCart className="size-10" style={{ color: '#FCA5A5' }} />
              </div>
              <p className="text-lg font-medium text-gray-500">
                Your cart is empty
              </p>
              <p className="text-sm text-gray-400">
                Browse our catalog to find genuine auto parts
              </p>
              <Button
                className="mt-2 text-white"
                style={{ backgroundColor: '#B91C1C' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#991B1B')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#B91C1C')
                }
                onClick={() => {
                  setCartOpen(false);
                  setView('catalog');
                }}
              >
                Browse Parts
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div className="space-y-0">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-3 border-b px-4 py-3"
                    >
                      {/* Product Image */}
                      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <Wrench className="size-6 text-gray-400" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {item.carModel} &middot;{' '}
                          <span
                            className={
                              item.condition === 'New'
                                ? 'text-green-600'
                                : 'text-amber-600'
                            }
                          >
                            {item.condition}
                          </span>
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={() =>
                                updateCartQuantity(
                                  item.productId,
                                  item.quantity - 1
                                )
                              }
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={() =>
                                updateCartQuantity(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                          <p className="text-sm font-semibold" style={{ color: '#B91C1C' }}>
                            Rs. {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Remove */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 self-start text-gray-400 hover:text-red-500"
                        onClick={() => removeFromCart(item.productId)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Cart Footer */}
              <div className="border-t bg-gray-50 px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-lg font-bold text-gray-900">
                    Rs. {cartTotal.toLocaleString()}
                  </span>
                </div>
                <Button
                  className="w-full text-white"
                  size="lg"
                  style={{ backgroundColor: '#B91C1C' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#991B1B')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = '#B91C1C')
                  }
                  onClick={() => {
                    setCartOpen(false);
                    setView('checkout');
                  }}
                >
                  Proceed to Checkout
                </Button>
                <Button
                  variant="ghost"
                  className="mt-1 w-full text-gray-600"
                  size="sm"
                  onClick={() => {
                    setCartOpen(false);
                    setView('catalog');
                  }}
                >
                  Continue Shopping
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}
