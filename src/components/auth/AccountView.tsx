'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import type { User } from '@/lib/store';
import {
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
  ShieldCheck,
  ArrowRight,
  Package,
  Heart,
  Home,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Trash2,
  Star,
  ShoppingCart,
  X,
  ChevronDown,
  ChevronUp,
  Edit3,
  MapPinned,
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string;
    condition: string;
    category: string;
    carModel: string;
  } | null;
}

interface Order {
  id: string;
  status: string;
  total: number;
  userName: string;
  userPhone: string;
  userAddress: string | null;
  userCity: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string;
    condition: string;
    stock: number;
    category: string;
    carModel: string;
  } | null;
}

interface AddressItem {
  id: string;
  userId: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  isDefault: boolean;
}

// ─── Status Badge Color Map ──────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AccountView() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const logout = useAppStore((s) => s.logout);
  const setShowAuth = useAppStore((s) => s.setShowAuth);
  const setView = useAppStore((s) => s.setView);
  const addToCart = useAppStore((s) => s.addToCart);
  const setWishlist = useAppStore((s) => s.setWishlist);

  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'admin' : 'profile');

  // ── Admin State ──────────────────────────────────────────────────────
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminOrdersLoading, setAdminOrdersLoading] = useState(false);
  const [adminStats, setAdminStats] = useState<{
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    totalProducts: number;
  } | null>(null);
  const [adminStatsLoading, setAdminStatsLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // ── Orders State ──────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // ── Wishlist State ────────────────────────────────────────────────────
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ── Addresses State ───────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    isDefault: false,
  });

  // ── Profile State ─────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
  });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Password State ────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // ── Initialize profile form ───────────────────────────────────────────
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
      });
      // Set default tab for admin
      if (user.role === 'admin') {
        setActiveTab('admin');
      }
    }
  }, [user]);

  // ── Fetch Data ────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      // Admin users see all customer orders; regular users see their own
      const endpoint = user.role === 'admin' ? '/api/admin/orders?limit=50' : '/api/user/orders';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    setWishlistLoading(true);
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data.items || []);
        setWishlist((data.items || []).map((i: WishlistItem) => i.productId));
      }
    } catch {
      toast.error('Failed to load wishlist');
    } finally {
      setWishlistLoading(false);
    }
  }, [user, setWishlist]);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setAddressesLoading(true);
    try {
      const res = await fetch('/api/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setAddressesLoading(false);
    }
  }, [user]);

  // ── Admin Fetch ──────────────────────────────────────────────────────
  const fetchAdminData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setAdminOrdersLoading(true);
    setAdminStatsLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/admin/orders?limit=50'),
        fetch('/api/admin/stats'),
      ]);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setAdminOrders(ordersData.orders || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const overview = statsData.overview || {};
        const revenueBreakdown = statsData.revenueBreakdown || {};
        setAdminStats({
          totalOrders: overview.totalOrders || 0,
          pendingOrders: revenueBreakdown.pending?.count || 0,
          totalRevenue: overview.totalRevenue || 0,
          totalProducts: overview.totalProducts || 0,
        });
      }
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setAdminOrdersLoading(false);
      setAdminStatsLoading(false);
    }
  }, [user]);

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }
      setAdminOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'admin' && user.role === 'admin') {
      fetchAdminData();
    }
    if (activeTab === 'orders' && orders.length === 0 && !ordersLoading) {
      fetchOrders();
    }
    if (activeTab === 'wishlist' && wishlistItems.length === 0 && !wishlistLoading) {
      fetchWishlist();
    }
    if (activeTab === 'addresses' && addresses.length === 0 && !addressesLoading) {
      fetchAddresses();
    }
  }, [activeTab, user, orders.length, wishlistItems.length, addresses.length, ordersLoading, wishlistLoading, addressesLoading, fetchOrders, fetchWishlist, fetchAddresses, fetchAdminData]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setProfileSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setUser({ ...user!, ...data.user } as User);
      setProfileEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.oldPassword) {
      toast.error('Current password is required');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleWishlistRemove = async (productId: string) => {
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove');
      }
      setWishlistItems((prev) => prev.filter((i) => i.productId !== productId));
      setWishlist(wishlistItems.filter((i) => i.productId !== productId).map((i) => i.productId));
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove from wishlist');
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    if (!item.product) return;
    const firstImage = item.product.images?.split(',')[0] || '';
    addToCart({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: 1,
      image: firstImage,
      condition: item.product.condition,
      carModel: item.product.carModel,
    });
    toast.success('Added to cart');
  };

  const handleAddressSave = async () => {
    const form = editingAddress
      ? addressForm
      : addressForm;
    if (!form.label.trim() || !form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error('All fields are required');
      return;
    }

    try {
      if (editingAddress) {
        const res = await fetch('/api/addresses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingAddress.id, ...form }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update address');
        toast.success('Address updated');
      } else {
        const res = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add address');
        toast.success('Address added');
      }
      setShowAddressDialog(false);
      setEditingAddress(null);
      setAddressForm({ label: '', name: '', phone: '', address: '', city: '', isDefault: false });
      fetchAddresses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save address');
    }
  };

  const handleAddressDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Address deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const res = await fetch('/api/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to set default');
      }
      fetchAddresses();
      toast.success('Default address updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update default address');
    }
  };

  const openAddressDialog = (address?: AddressItem) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        label: address.label,
        name: address.name,
        phone: address.phone,
        address: address.address,
        city: address.city,
        isDefault: address.isDefault,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({ label: '', name: '', phone: '', address: '', city: '', isDefault: false });
    }
    setShowAddressDialog(true);
  };

  const getImageUrl = (images: string) => {
    const first = images?.split(',')[0];
    if (!first) return '/placeholder-product.png';
    return first.startsWith('http') ? first : first;
  };

  // ── Not Logged In ─────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl py-8 sm:py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-24 items-center justify-center rounded-full bg-red-50">
            <User className="size-10 text-[#B91C1C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Sign in to your account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Login to view your profile, track orders, and manage your account
            </p>
          </div>
          <Button
            className="bg-[#B91C1C] text-white hover:bg-[#DC2626]"
            size="lg"
            onClick={() => setShowAuth(true, 'login')}
          >
            Login / Register
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Logged In Dashboard ───────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-[#B91C1C]/10 text-[#B91C1C]">
            <User className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              My Account
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="size-3.5 text-green-600" />
              {user.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="self-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full justify-start overflow-x-auto sm:w-auto">
          {user.role === 'admin' && (
            <TabsTrigger value="admin" className="gap-1.5">
              <LayoutDashboard className="size-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="profile" className="gap-1.5">
            <Settings className="size-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <Package className="size-4" />
            <span className="hidden sm:inline">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-1.5">
            <Heart className="size-4" />
            <span className="hidden sm:inline">Wishlist</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-1.5">
            <MapPinned className="size-4" />
            <span className="hidden sm:inline">Addresses</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Admin Dashboard Tab ─────────────────────────────────── */}
        {user.role === 'admin' && (
          <TabsContent value="admin">
            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {adminStatsLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="mb-2 h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-[#B91C1C]/10">
                          <Package className="size-5 text-[#B91C1C]" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Orders</p>
                          <p className="text-2xl font-bold text-foreground">
                            {adminStats?.totalOrders ?? 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-100">
                          <TrendingUp className="size-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pending Orders</p>
                          <p className="text-2xl font-bold text-foreground">
                            {adminStats?.pendingOrders ?? 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
                          <DollarSign className="size-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Revenue</p>
                          <p className="text-2xl font-bold text-foreground">
                            Rs. {(adminStats?.totalRevenue ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                          <ShoppingCart className="size-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Products</p>
                          <p className="text-2xl font-bold text-foreground">
                            {adminStats?.totalProducts ?? 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* All Customer Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">All Customer Orders</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-[#B91C1C] border-[#B91C1C]/30 hover:bg-[#B91C1C]/10 hover:text-[#B91C1C]"
                    onClick={fetchAdminData}
                    disabled={adminOrdersLoading}
                  >
                    <RefreshCw className={`size-3.5 ${adminOrdersLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {adminOrdersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : adminOrders.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <Package className="size-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No orders found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-3 pr-4 font-medium">Order ID</th>
                            <th className="pb-3 pr-4 font-medium">Customer</th>
                            <th className="pb-3 pr-4 font-medium">Phone</th>
                            <th className="pb-3 pr-4 font-medium">Total</th>
                            <th className="pb-3 pr-4 font-medium">Status</th>
                            <th className="pb-3 pr-4 font-medium">Update Status</th>
                            <th className="pb-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminOrders.map((order) => (
                            <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-3 pr-4 font-mono text-xs font-semibold">
                                #{order.id.slice(-8).toUpperCase()}
                              </td>
                              <td className="py-3 pr-4 font-medium">{order.userName}</td>
                              <td className="py-3 pr-4 text-muted-foreground">{order.userPhone}</td>
                              <td className="py-3 pr-4 font-semibold text-[#B91C1C]">
                                Rs. {order.total.toLocaleString()}
                              </td>
                              <td className="py-3 pr-4">
                                <Badge
                                  className={`text-xs ${
                                    statusColors[order.status] || 'bg-gray-100 text-gray-800 border-gray-200'
                                  }`}
                                  variant="outline"
                                >
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3 pr-4">
                                <select
                                  className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
                                  value={order.status}
                                  disabled={updatingOrderId === order.id}
                                  onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="py-3 text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString('en-PK', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile List */}
                    <div className="space-y-3 md:hidden">
                      {adminOrders.map((order) => (
                        <div key={order.id} className="rounded-lg border p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="font-mono text-xs font-semibold">
                              #{order.id.slice(-8).toUpperCase()}
                            </p>
                            <Badge
                              className={`text-xs ${
                                statusColors[order.status] || 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}
                              variant="outline"
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Customer</span>
                              <span className="font-medium">{order.userName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Phone</span>
                              <span>{order.userPhone}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total</span>
                              <span className="font-semibold text-[#B91C1C]">
                                Rs. {order.total.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Date</span>
                              <span className="text-xs">
                                {new Date(order.createdAt).toLocaleDateString('en-PK', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="mb-1 block text-xs text-muted-foreground">
                              Update Status
                            </label>
                            <select
                              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#B91C1C]"
                              value={order.status}
                              disabled={updatingOrderId === order.id}
                              onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ─── Profile Tab ──────────────────────────────────────────── */}
        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Profile Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#B91C1C] hover:text-[#DC2626] hover:bg-[#B91C1C]/10"
                    onClick={() => setProfileEditing(!profileEditing)}
                  >
                    {profileEditing ? (
                      <>
                        <X className="size-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit3 className="size-4" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="profile-name"
                          className="pl-10"
                          value={profileForm.name}
                          onChange={(e) =>
                            setProfileForm((p) => ({ ...p, name: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="profile-email"
                          className="pl-10 bg-muted"
                          value={user.email}
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="profile-phone"
                          className="pl-10"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm((p) => ({ ...p, phone: e.target.value }))
                          }
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                        <Input
                          id="profile-address"
                          className="pl-10"
                          value={profileForm.address}
                          onChange={(e) =>
                            setProfileForm((p) => ({ ...p, address: e.target.value }))
                          }
                          placeholder="Enter street address"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-city">City</Label>
                      <Input
                        id="profile-city"
                        value={profileForm.city}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, city: e.target.value }))
                        }
                        placeholder="Enter city"
                      />
                    </div>
                    <Button
                      className="w-full bg-[#B91C1C] text-white hover:bg-[#DC2626]"
                      onClick={handleProfileSave}
                      disabled={profileSaving}
                    >
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <User className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Full Name</p>
                        <p className="text-sm font-medium">{user.name}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <Mail className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{user.email}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <Phone className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{user.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <MapPin className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="text-sm font-medium">
                          {user.address
                            ? `${user.address}${user.city ? `, ${user.city}` : ''}`
                            : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="size-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="current-password"
                      type={showOldPassword ? 'text' : 'password'}
                      className="pl-10 pr-10"
                      value={passwordForm.oldPassword}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))
                      }
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      className="pl-10 pr-10"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                      }
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      className="pl-10"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                      }
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-[#B91C1C] text-white hover:bg-[#DC2626]"
                  onClick={handlePasswordChange}
                  disabled={passwordSaving}
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Orders Tab ───────────────────────────────────────────── */}
        <TabsContent value="orders">
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="mt-3 h-4 w-48" />
                    <Skeleton className="mt-2 h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <Package className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">No orders yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your order history will appear here after your first purchase
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-[#B91C1C] text-[#B91C1C] hover:bg-[#B91C1C]/10"
                  onClick={() => setView('catalog')}
                >
                  Browse Parts
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order Header */}
                    <button
                      className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors sm:p-6"
                      onClick={() =>
                        setExpandedOrder(expandedOrder === order.id ? null : order.id)
                      }
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                        <p className="text-sm font-semibold text-foreground">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <Badge
                          className={`w-fit text-xs ${
                            statusColors[order.status] || 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                          variant="outline"
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#B91C1C]">
                            Rs. {order.total.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('en-PK', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Order Details (Expandable) */}
                    {expandedOrder === order.id && (
                      <div className="border-t bg-muted/30">
                        <div className="p-4 sm:p-6">
                          {/* Shipping Info */}
                          <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
                            <div>
                              <p className="text-muted-foreground">Name</p>
                              <p className="font-medium">{order.userName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Phone</p>
                              <p className="font-medium">{order.userPhone}</p>
                            </div>
                            {order.userAddress && (
                              <div>
                                <p className="text-muted-foreground">Address</p>
                                <p className="font-medium">
                                  {order.userAddress}
                                  {order.userCity ? `, ${order.userCity}` : ''}
                                </p>
                              </div>
                            )}
                            {order.notes && (
                              <div>
                                <p className="text-muted-foreground">Notes</p>
                                <p className="font-medium">{order.notes}</p>
                              </div>
                            )}
                          </div>

                          <Separator className="my-4" />

                          {/* Items */}
                          <div className="space-y-3">
                            <p className="text-sm font-semibold">Order Items</p>
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 rounded-lg border bg-background p-3"
                              >
                                {item.product ? (
                                  <>
                                    <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                                      <img
                                        src={getImageUrl(item.product.images)}
                                        alt={item.product.name}
                                        className="size-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium">
                                        {item.product.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.product.category} • {item.product.carModel}
                                      </p>
                                    </div>
                                    <div className="text-right text-sm">
                                      <p className="font-medium">
                                        Rs. {item.price.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        × {item.quantity}
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex-1">
                                    <p className="text-sm text-muted-foreground italic">
                                      Product no longer available
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Rs. {item.price.toLocaleString()} × {item.quantity}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <Separator className="my-4" />

                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Total</p>
                            <p className="text-lg font-bold text-[#B91C1C]">
                              Rs. {order.total.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Wishlist Tab ─────────────────────────────────────────── */}
        <TabsContent value="wishlist">
          {wishlistLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="mb-3 h-36 w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : wishlistItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <Heart className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Wishlist is empty</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Save your favorite parts for later
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-[#B91C1C] text-[#B91C1C] hover:bg-[#B91C1C]/10"
                  onClick={() => setView('catalog')}
                >
                  Browse Parts
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlistItems.map((item) =>
                item.product ? (
                  <Card key={item.id} className="group overflow-hidden">
                    <div className="relative aspect-square bg-muted">
                      <img
                        src={getImageUrl(item.product.images)}
                        alt={item.product.name}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                      <button
                        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-red-50 hover:text-[#B91C1C] transition-colors"
                        onClick={() => handleWishlistRemove(item.productId)}
                        title="Remove from wishlist"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <CardContent className="p-4">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">
                        {item.product.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.product.category} • {item.product.carModel}
                      </p>
                      <p className="mt-2 text-base font-bold text-[#B91C1C]">
                        Rs. {item.product.price.toLocaleString()}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-[#B91C1C] text-white hover:bg-[#DC2626]"
                          onClick={() => handleAddToCart(item)}
                          disabled={item.product.stock <= 0}
                        >
                          <ShoppingCart className="size-3.5" />
                          {item.product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleWishlistRemove(item.productId)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null
              )}
            </div>
          )}
        </TabsContent>

        {/* ─── Addresses Tab ────────────────────────────────────────── */}
        <TabsContent value="addresses">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Saved Addresses</h2>
            <Button
              size="sm"
              className="bg-[#B91C1C] text-white hover:bg-[#DC2626]"
              onClick={() => openAddressDialog()}
            >
              <Plus className="size-4" />
              Add Address
            </Button>
          </div>

          {addressesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="mb-2 h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mt-1 h-4 w-3/4" />
                    <Skeleton className="mt-1 h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <Home className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">No saved addresses</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add addresses for faster checkout
                  </p>
                </div>
                <Button
                  className="bg-[#B91C1C] text-white hover:bg-[#DC2626]"
                  onClick={() => openAddressDialog()}
                >
                  <Plus className="size-4" />
                  Add Address
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((addr) => (
                <Card
                  key={addr.id}
                  className={`relative overflow-hidden ${
                    addr.isDefault ? 'border-[#B91C1C]/30 ring-1 ring-[#B91C1C]/20' : ''
                  }`}
                >
                  {addr.isDefault && (
                    <div className="flex items-center gap-1 bg-[#B91C1C] px-3 py-1 text-xs font-medium text-white">
                      <Star className="size-3" />
                      Default
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">{addr.label}</p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-[#B91C1C]"
                          onClick={() => openAddressDialog(addr)}
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleAddressDelete(addr.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-medium">{addr.name}</p>
                    <p className="text-sm text-muted-foreground">{addr.phone}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {addr.address}, {addr.city}
                    </p>
                    {!addr.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 h-auto p-0 text-xs text-[#B91C1C] hover:text-[#DC2626]"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                      >
                        <Star className="size-3" />
                        Set as default
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Address Dialog ──────────────────────────────────────────── */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? 'Update your saved address details'
                : 'Add a new address for faster checkout'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addr-label">Label</Label>
              <Input
                id="addr-label"
                placeholder="e.g., Home, Office"
                value={addressForm.label}
                onChange={(e) =>
                  setAddressForm((p) => ({ ...p, label: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-name">Recipient Name</Label>
              <Input
                id="addr-name"
                placeholder="Full name"
                value={addressForm.name}
                onChange={(e) =>
                  setAddressForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-phone">Phone Number</Label>
              <Input
                id="addr-phone"
                placeholder="03XX-XXXXXXX"
                value={addressForm.phone}
                onChange={(e) =>
                  setAddressForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-street">Street Address</Label>
              <Input
                id="addr-street"
                placeholder="Enter full address"
                value={addressForm.address}
                onChange={(e) =>
                  setAddressForm((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-city">City</Label>
              <Input
                id="addr-city"
                placeholder="Enter city"
                value={addressForm.city}
                onChange={(e) =>
                  setAddressForm((p) => ({ ...p, city: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="addr-default"
                checked={addressForm.isDefault}
                onChange={(e) =>
                  setAddressForm((p) => ({ ...p, isDefault: e.target.checked }))
                }
                className="size-4 rounded border-gray-300 accent-[#B91C1C]"
              />
              <Label htmlFor="addr-default" className="text-sm">
                Set as default address
              </Label>
            </div>
            <Button
              className="w-full bg-[#B91C1C] text-white hover:bg-[#DC2626]"
              onClick={handleAddressSave}
            >
              {editingAddress ? 'Update Address' : 'Add Address'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
