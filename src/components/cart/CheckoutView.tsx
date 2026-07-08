'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Truck,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  email: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  email?: string;
}

export default function CheckoutView() {
  const cart = useAppStore((s) => s.cart);
  const user = useAppStore((s) => s.user);
  const getCartTotal = useAppStore((s) => s.getCartTotal);
  const clearCart = useAppStore((s) => s.clearCart);
  const setView = useAppStore((s) => s.setView);
  const setCartOpen = useAppStore((s) => s.setCartOpen);

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    address: '',
    city: '',
    email: '',
    notes: '',
  });

  // Pre-fill form with user data when logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
        city: user.city || prev.city,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && !showSuccess) {
      setView('home');
    }
  }, [cart, showSuccess, setView]);

  const subtotal = getCartTotal();
  const freeDeliveryThreshold = 5000;

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const errors: FormErrors = {};

    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\d+\-\s()]{7,15}$/.test(form.phone.trim())) {
      errors.phone = 'Enter a valid phone number';
    }
    if (!form.address.trim()) errors.address = 'Address is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: cart.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            condition: item.condition,
            carModel: item.carModel,
          })),
          total: subtotal,
          userId: user?.id || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to place order');
      }

      const data = await res.json();
      setOrderId(data.orderId);
      setShowSuccess(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Don't render if cart is empty and no success dialog
  if (cart.length === 0 && !showSuccess) return null;

  return (
    <>
      <div className="mx-auto max-w-6xl py-6">
        {/* Back to Cart */}
        <button
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-red-700 transition-colors"
          onClick={() => { setView('catalog'); setCartOpen(true); }}
        >
          <ArrowLeft className="size-4" />
          Back to Cart
        </button>

        <h1 className="mb-8 text-2xl font-bold text-foreground sm:text-3xl">
          Checkout
        </h1>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* ── Order Form ─────────────────────────────────── */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="checkout-name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="checkout-name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    aria-invalid={!!formErrors.name}
                    className={formErrors.name ? 'border-destructive' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive">{formErrors.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="checkout-phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="checkout-phone"
                    type="tel"
                    placeholder="03XX-XXXXXXX"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    aria-invalid={!!formErrors.phone}
                    className={formErrors.phone ? 'border-destructive' : ''}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-destructive">
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="checkout-address">
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="checkout-address"
                    placeholder="House/flat no, street, area"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    aria-invalid={!!formErrors.address}
                    className={formErrors.address ? 'border-destructive' : ''}
                  />
                  {formErrors.address && (
                    <p className="text-xs text-destructive">
                      {formErrors.address}
                    </p>
                  )}
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="checkout-city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="checkout-city"
                    placeholder="e.g. Lahore, Karachi, Islamabad"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    aria-invalid={!!formErrors.city}
                    className={formErrors.city ? 'border-destructive' : ''}
                  />
                  {formErrors.city && (
                    <p className="text-xs text-destructive">{formErrors.city}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="checkout-email">Email (optional)</Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    aria-invalid={!!formErrors.email}
                    className={formErrors.email ? 'border-destructive' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-destructive">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="checkout-notes">
                    Order Notes (optional)
                  </Label>
                  <Textarea
                    id="checkout-notes"
                    placeholder="Any special instructions for delivery..."
                    value={form.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Order Summary ──────────────────────────────── */}
          <div className="lg:col-span-2">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="size-5" style={{ color: '#B91C1C' }} />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items list */}
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {item.carModel}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              item.condition === 'New'
                                ? 'border-green-300 text-green-700'
                                : 'border-amber-300 text-amber-700'
                            }`}
                          >
                            {item.condition}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × Rs. {item.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Delivery note */}
                <div
                  className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                    subtotal >= freeDeliveryThreshold
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  <Truck className="size-4 shrink-0" />
                  {subtotal >= freeDeliveryThreshold ? (
                    <span>You qualify for free delivery!</span>
                  ) : (
                    <span>
                      Free delivery on orders above Rs. 5,000. Add Rs.{' '}
                      {(freeDeliveryThreshold - subtotal).toLocaleString()} more
                    </span>
                  )}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      Rs. {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span
                      className={`font-medium ${
                        subtotal >= freeDeliveryThreshold
                          ? 'text-green-600'
                          : ''
                      }`}
                    >
                      {subtotal >= freeDeliveryThreshold
                        ? 'FREE'
                        : 'Calculated at next step'}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-xl font-bold" style={{ color: '#B91C1C' }}>
                    Rs. {subtotal.toLocaleString()}
                  </span>
                </div>

                {/* Place Order Button */}
                <Button
                  className="w-full text-white"
                  style={{ backgroundColor: '#B91C1C' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
                  size="lg"
                  onClick={handleSubmit}
                  disabled={loading || cart.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>

                <p className="text-center text-[11px] text-muted-foreground">
                  By placing this order, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Success Dialog ──────────────────────────────── */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="items-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl">Order Placed!</DialogTitle>
            <DialogDescription className="text-center">
              Your order has been placed successfully. We will contact you
              shortly to confirm your order.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="text-lg font-bold" style={{ color: '#B91C1C' }}>{orderId}</p>
          </div>
          <Button
            className="w-full text-white"
            style={{ backgroundColor: '#B91C1C' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
            onClick={() => {
              setShowSuccess(false);
              setView('home');
            }}
          >
            Continue Shopping
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
