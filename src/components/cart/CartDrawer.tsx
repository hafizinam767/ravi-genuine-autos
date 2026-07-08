'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/lib/store';
import {
  ShoppingCart,
  Minus,
  Plus,
  X,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

export function CartDrawer() {
  const cart = useAppStore((s) => s.cart);
  const cartOpen = useAppStore((s) => s.cartOpen);
  const setCartOpen = useAppStore((s) => s.setCartOpen);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const updateCartQuantity = useAppStore((s) => s.updateCartQuantity);
  const getCartTotal = useAppStore((s) => s.getCartTotal);
  const getCartCount = useAppStore((s) => s.getCartCount);
  const setView = useAppStore((s) => s.setView);

  const itemCount = getCartCount();
  const subtotal = getCartTotal();

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="size-5" style={{ color: '#B91C1C' }} />
            <SheetTitle className="text-lg">Shopping Cart</SheetTitle>
            {itemCount > 0 && (
              <Badge className="text-white" style={{ backgroundColor: '#B91C1C' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </div>
          <SheetDescription className="sr-only">
            Your shopping cart items
          </SheetDescription>
        </SheetHeader>

        {cart.length === 0 ? (
          /* ── Empty Cart State ─────────────────────────────── */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
            <div className="flex size-24 items-center justify-center rounded-full" style={{ backgroundColor: '#FEF2F2' }}>
              <ShoppingBag className="size-10" style={{ color: '#FCA5A5' }} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                Your cart is empty
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Find the auto parts you need and add them to your cart
              </p>
            </div>
            <Button
              className="mt-2 text-white"
              style={{ backgroundColor: '#B91C1C' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
              onClick={() => {
                setCartOpen(false);
                setView('catalog');
              }}
            >
              <ShoppingBag className="size-4" />
              Browse Parts
            </Button>
          </div>
        ) : (
          <>
            {/* ── Cart Items ──────────────────────────────────── */}
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-0">
                {cart.map((item, index) => (
                  <div key={item.productId}>
                    <div className="flex gap-4 px-6 py-4">
                      {/* Product Image */}
                      <div className="size-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="size-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-medium leading-tight text-foreground">
                              {item.name}
                            </h4>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.carModel}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <X className="size-3.5" />
                            <span className="sr-only">Remove {item.name}</span>
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              item.condition === 'New'
                                ? 'border-green-300 bg-green-50 text-green-700'
                                : 'border-amber-300 bg-amber-50 text-amber-700'
                            }`}
                          >
                            {item.condition}
                          </Badge>
                        </div>

                        <div className="mt-1 flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-0 rounded-md border">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-none rounded-l-md"
                              onClick={() =>
                                updateCartQuantity(
                                  item.productId,
                                  item.quantity - 1
                                )
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="size-3" />
                              <span className="sr-only">Decrease quantity</span>
                            </Button>
                            <span className="flex size-7 items-center justify-center border-x text-xs font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-none rounded-r-md"
                              onClick={() =>
                                updateCartQuantity(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                            >
                              <Plus className="size-3" />
                              <span className="sr-only">Increase quantity</span>
                            </Button>
                          </div>

                          {/* Line Total */}
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              Rs. {(item.price * item.quantity).toLocaleString()}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-[10px] text-muted-foreground">
                                Rs. {item.price.toLocaleString()} each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < cart.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* ── Footer ──────────────────────────────────────── */}
            <SheetFooter className="border-t px-6 py-4">
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    Rs. {subtotal.toLocaleString()}
                  </span>
                </div>
                <Button
                  className="w-full text-white"
                  style={{ backgroundColor: '#B91C1C' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
                  size="lg"
                  onClick={() => {
                    setCartOpen(false);
                    setView('checkout');
                  }}
                >
                  Checkout
                  <ArrowRight className="size-4" />
                </Button>
                <button
                  className="w-full text-center text-sm text-muted-foreground hover:text-red-700 transition-colors"
                  onClick={() => setCartOpen(false)}
                >
                  Continue Shopping
                </button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
