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
  SheetClose,
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
  Car,
  Wrench,
  Home,
  Grid3X3,
  LogOut,
  ChevronDown,
  Minus,
  Plus,
  Trash2,
  Cpu,
} from 'lucide-react';

// ─── Navigation Links ──────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Home', view: 'home' as const, icon: Home },
  { label: 'Parts Catalog', view: 'catalog' as const, icon: Grid3X3 },
  { label: 'Identify Part (AI)', view: 'identify' as const, icon: Cpu },
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
    setCartOpen,
    setShowAuth,
    selectProduct,
  } = useAppStore();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // ── Cart count ─────────────────────────────────────────────────────
  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="hidden md:block bg-amber-600 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" />
              0320-0408917
            </span>
            <Separator orientation="vertical" className="h-4 bg-amber-400/50" />
            <span>M.Zulfiqar</span>
          </div>
          <div className="flex items-center gap-2 text-amber-100">
            <Car className="size-3.5" />
            <span>Genuine Auto Parts — Lahore, Pakistan</span>
          </div>
        </div>
      </div>

      {/* ── Main Header ─────────────────────────────────────────────── */}
      <div
        className={`transition-shadow duration-200 ${
          scrolled ? 'shadow-md' : 'shadow-sm'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-6">
          {/* Logo */}
          <button
            onClick={() => setView('home')}
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
            aria-label="Go to home"
          >
            <img
              src="/logo-white.png"
              alt="Ravi Genuine Autos"
              className="h-12 w-auto lg:h-14"
            />
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
                className="h-10 rounded-l-lg rounded-r-none border-r-0 pr-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
              />
              <Button
                onClick={handleSearch}
                className="h-10 rounded-l-none rounded-r-lg bg-amber-500 px-4 hover:bg-amber-600"
                size="default"
              >
                <Search className="size-4" />
              </Button>
            </div>
          </div>

          {/* Search Toggle — Mobile */}
          <div className="ml-auto flex items-center gap-1 lg:hidden">
            {searchOpen && (
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  placeholder="Search parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus
                  className="h-9 w-40 text-sm sm:w-56"
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
                className="size-9"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search className="size-5" />
              </Button>
            )}
          </div>

          {/* Navigation — Desktop */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = currentView === link.view;
              return (
                <Button
                  key={link.view}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setView(link.view)}
                  className={`gap-1.5 text-sm font-medium ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="size-4" />
                  {link.label}
                </Button>
              );
            })}
          </nav>

          {/* Actions — Cart & User */}
          <div className="flex items-center gap-1">
            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative size-10"
              onClick={() => setCartOpen(true)}
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart className="size-5" />
              {cartCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-amber-500 p-0 text-[10px] font-bold text-white hover:bg-amber-500">
                  {cartCount > 99 ? '99+' : cartCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden gap-1.5 lg:flex"
                  >
                    <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setUser(null)}
                    className="cursor-pointer text-red-600"
                  >
                    <LogOut className="mr-2 size-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-1.5 lg:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuth(true, 'login')}
                  className="text-sm"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowAuth(true, 'register')}
                  className="bg-amber-500 text-sm hover:bg-amber-600"
                >
                  Register
                </Button>
              </div>
            )}

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
      </div>

      {/* ── Mobile Navigation Sheet ─────────────────────────────────── */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="border-b bg-amber-50 px-4 py-4">
            <SheetTitle className="flex items-center gap-2">
              <img
                src="/logo-white.png"
                alt="Ravi Genuine Autos"
                className="h-12 w-auto"
              />
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-80px)]">
            {/* Nav Links */}
            <div className="p-2">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = currentView === link.view;
                return (
                  <button
                    key={link.view}
                    onClick={() => {
                      setView(link.view);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
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
                  <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-amber-500 text-white">
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
                  <button
                    onClick={() => {
                      setUser(null);
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
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    onClick={() => {
                      setShowAuth(true, 'login');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-amber-500 text-amber-600 hover:bg-amber-50"
                    onClick={() => {
                      setShowAuth(true, 'register');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Create Account
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
                    <Phone className="size-3.5 text-amber-500" />
                    0320-0408917
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-700">
                    <Car className="size-3.5 text-amber-500" />
                    M.Zulfiqar
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
              <ShoppingCart className="size-5 text-amber-500" />
              Shopping Cart
              {cartCount > 0 && (
                <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
              <div className="flex size-20 items-center justify-center rounded-full bg-amber-50">
                <ShoppingCart className="size-10 text-amber-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">
                Your cart is empty
              </p>
              <p className="text-sm text-gray-400">
                Browse our catalog to find genuine auto parts
              </p>
              <Button
                className="mt-2 bg-amber-500 hover:bg-amber-600"
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
                          <p className="text-sm font-semibold text-amber-600">
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
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  size="lg"
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
