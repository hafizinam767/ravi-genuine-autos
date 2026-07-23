'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Car,
  ShoppingCart,
  Users,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import ProductForm from './ProductForm';
import CategoryForm from './CategoryForm';
import CarModelForm from './CarModelForm';
import UserForm from './UserForm';

// ─── Types ────────────────────────────────────────────────────────────

interface StatsOverview {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  userName: string;
  userPhone: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  price: number;
  category: string;
  carModel: string;
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  condition: string;
  stock: number;
  featured: boolean;
  images: string;
  category: { id: string; name: string };
  carModel: { id: string; name: string; make: string };
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  image: string | null;
  productCount: number;
}

interface CarModelRow {
  id: string;
  name: string;
  make: string;
  slug: string;
  image: string | null;
  productCount: number;
}

interface OrderRow {
  id: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  emailVerified: boolean;
  address: string | null;
  city: string | null;
  createdAt: string;
  orderCount: number;
  wishlistCount: number;
}

interface OrderEditRow {
  id: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  userAddress: string;
  userCity: string;
  notes: string;
  status: string;
}

type AdminTab = 'overview' | 'products' | 'categories' | 'car-models' | 'orders' | 'customers';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// ─── Component ────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { setView, user } = useAppStore();

  // ── Auth Guard: redirect non-admins away ─────────────────────────────
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setView('home');
    }
  }, [user, setView]);

  // Don't render dashboard if not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  return <AdminDashboardContent />;
}

// ─── Inner Dashboard Content (only rendered for authenticated admins) ──

function AdminDashboardContent() {
  const { setView } = useAppStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);

  // Overview data
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

  // Products data
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsPage, setProductsPage] = useState(1);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productSearch, setProductSearch] = useState('');

  // Categories data
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  // Car Models data
  const [carModels, setCarModels] = useState<CarModelRow[]>([]);

  // Orders data
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);

  // Customers data
  const [customers, setCustomers] = useState<UserRow[]>([]);

  // Form dialogs
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [carModelFormOpen, setCarModelFormOpen] = useState(false);
  const [editingCarModel, setEditingCarModel] = useState<CarModelRow | null>(null);

  // User form
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  // Order edit dialog
  const [orderEditTarget, setOrderEditTarget] = useState<OrderEditRow | null>(null);
  const [orderEditSaving, setOrderEditSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'category' | 'car-model' | 'user' | 'order'; id: string; name: string } | null>(null);

  // ── Fetch overview stats ───────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setOverview(data.overview);
      setRecentOrders(data.recentOrders || []);
      setLowStockProducts(data.lowStockProducts || []);
    } catch {
      toast.error('Failed to load dashboard stats');
    }
  }, []);

  // ── Fetch products ─────────────────────────────────────────────────
  const fetchProducts = useCallback(async (page = productsPage) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (productSearch) params.set('search', productSearch);
      const res = await fetch(`/api/products?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setProducts(data.products || []);
      setProductsTotal(data.pagination?.total || 0);
      setProductsPage(page);
    } catch {
      toast.error('Failed to load products');
    }
  }, [productsPage, productSearch]);

  // ── Fetch categories ───────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      toast.error('Failed to load categories');
    }
  }, []);

  // ── Fetch car models ───────────────────────────────────────────────
  const fetchCarModels = useCallback(async () => {
    try {
      const res = await fetch('/api/car-models', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCarModels(data.carModels || []);
    } catch {
      toast.error('Failed to load car models');
    }
  }, []);

  // ── Fetch orders (admin) ───────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders?page=${ordersPage}&limit=10`, { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setOrders(data.orders || []);
      setOrdersTotal(data.total || 0);
    } catch {
      // Fallback: use stats recent orders for overview
      setOrders([]);
    }
  }, [ordersPage]);

  // ── Fetch users (customers + admins) ──────────────────────────────
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCustomers(data.users || []);
    } catch {
      setCustomers([]);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    }
    load();
  }, [fetchStats]);

  // ── Tab-based data loading ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'car-models') fetchCarModels();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'customers') fetchCustomers();
  }, [activeTab, fetchProducts, fetchCategories, fetchCarModels, fetchOrders, fetchCustomers]);

  // ── Delete handler ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'product') {
        // Optimistically remove the product from UI for immediate feedback
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        const res = await fetch(`/api/products/${deleteTarget.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to delete product');
          fetchProducts(productsPage);
          return;
        }
        toast.success('Product deleted');
        fetchStats();
        if (products.length === 1 && productsPage > 1) {
          setProductsPage(productsPage - 1);
        } else {
          fetchProducts(productsPage);
        }
      } else if (deleteTarget.type === 'category') {
        const res = await fetch(`/api/categories?id=${deleteTarget.id}`, { method: 'DELETE', credentials: 'include' });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to delete category');
          return;
        }
        toast.success('Category deleted');
        fetchCategories();
      } else if (deleteTarget.type === 'car-model') {
        const res = await fetch(`/api/car-models?id=${deleteTarget.id}`, { method: 'DELETE', credentials: 'include' });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to delete car model');
          return;
        }
        toast.success('Car model deleted');
        fetchCarModels();
      } else if (deleteTarget.type === 'user') {
        const res = await fetch(`/api/admin/users?id=${deleteTarget.id}`, { method: 'DELETE', credentials: 'include' });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to delete user');
          return;
        }
        toast.success('User deleted');
        fetchCustomers();
        fetchStats();
      } else if (deleteTarget.type === 'order') {
        const res = await fetch(`/api/admin/orders/${deleteTarget.id}`, { method: 'DELETE', credentials: 'include' });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to delete order');
          return;
        }
        toast.success('Order deleted');
        fetchOrders();
        fetchStats();
      }
    } catch {
      toast.error('Delete failed');
    }
    setDeleteTarget(null);
  };

  // ── Order status change ────────────────────────────────────────────
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update order status');
        return;
      }
      toast.success('Order status updated');
      fetchOrders();
      fetchStats();
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ── Save order edit ────────────────────────────────────────────────
  const handleOrderEditSave = async () => {
    if (!orderEditTarget) return;
    setOrderEditSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderEditTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: orderEditTarget.status,
          userName: orderEditTarget.userName,
          userPhone: orderEditTarget.userPhone,
          userEmail: orderEditTarget.userEmail,
          userAddress: orderEditTarget.userAddress,
          userCity: orderEditTarget.userCity,
          notes: orderEditTarget.notes,
        }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update order');
        return;
      }
      toast.success('Order updated successfully');
      setOrderEditTarget(null);
      fetchOrders();
      fetchStats();
    } catch {
      toast.error('Failed to save order changes');
    } finally {
      setOrderEditSaving(false);
    }
  };

  // ─── Sidebar Navigation Items ────────────────────────────────────────
  const navItems: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'categories', label: 'Categories', icon: FolderOpen },
    { key: 'car-models', label: 'Car Models', icon: Car },
    { key: 'orders', label: 'Orders', icon: ShoppingCart },
    { key: 'customers', label: 'Customers', icon: Users },
  ];

  // ─── Render Functions ────────────────────────────────────────────────

  const renderOverview = () => {
    if (!overview) return null;
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <Package className="size-5" style={{ color: '#B91C1C' }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Products</p>
                  <p className="text-lg font-bold sm:text-2xl" style={{ color: '#1a1a2e' }}>
                    {overview.totalProducts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <ShoppingCart className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Orders</p>
                  <p className="text-lg font-bold sm:text-2xl" style={{ color: '#1a1a2e' }}>
                    {overview.totalOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#DCFCE7' }}
                >
                  <Users className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Customers</p>
                  <p className="text-lg font-bold sm:text-2xl" style={{ color: '#1a1a2e' }}>
                    {overview.totalUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#DBEAFE' }}
                >
                  <DollarSign className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Revenue</p>
                  <p className="text-lg font-bold sm:text-2xl" style={{ color: '#1a1a2e' }}>
                    Rs. {overview.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders & Low Stock */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: '#1a1a2e' }}>
                <TrendingUp className="size-4" style={{ color: '#B91C1C' }} />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet</p>
              ) : (
                <div className="max-h-72 space-y-3 overflow-y-auto">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{order.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.itemCount} item(s) &middot;{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="text-sm font-semibold" style={{ color: '#B91C1C' }}>
                          Rs. {order.total.toLocaleString()}
                        </p>
                        <Badge
                          className={`text-[10px] ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}
                          variant="secondary"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: '#1a1a2e' }}>
                <AlertTriangle className="size-4 text-amber-500" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">All products are well-stocked</p>
              ) : (
                <div className="max-h-72 space-y-3 overflow-y-auto">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.category} &middot; {product.carModel}
                        </p>
                      </div>
                      <Badge
                        className="ml-3 bg-red-100 text-red-800"
                        variant="secondary"
                      >
                        {product.stock} left
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderProducts = () => {
    const totalPages = Math.ceil(productsTotal / 10);
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setProductsPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setProductFormOpen(true);
            }}
            className="text-white"
            style={{ backgroundColor: '#B91C1C' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
          >
            <Plus className="mr-2 size-4" />
            Add Product
          </Button>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">Car Model</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden sm:table-cell">Stock</TableHead>
                <TableHead className="hidden lg:table-cell">Condition</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => {
                  const img = p.images ? p.images.split(',')[0] : null;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                          {img ? (
                            <img src={img} alt={p.name} className="size-full object-cover" />
                          ) : (
                            <Package className="size-4 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          {p.featured && (
                            <Badge className="mt-0.5 bg-amber-100 text-amber-700 text-[10px]" variant="secondary">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {p.category?.name || '-'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {p.carModel ? `${p.carModel.make} ${p.carModel.name}` : '-'}
                      </TableCell>
                      <TableCell className="text-sm font-semibold" style={{ color: '#B91C1C' }}>
                        Rs. {p.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          className={
                            p.stock < 5
                              ? 'bg-red-100 text-red-800'
                              : p.stock < 20
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }
                          variant="secondary"
                        >
                          {p.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          className={
                            p.condition === 'new'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }
                          variant="secondary"
                        >
                          {p.condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/products/${p.id}`);
                                if (!res.ok) throw new Error('Failed to fetch product');
                                const data = await res.json();
                                const prod = data.product;
                                setEditingProduct(prod);
                                setProductFormOpen(true);
                              } catch (err) {
                                toast.error('Failed to load product details');
                              }
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-500 hover:text-red-700"
                            onClick={() =>
                              setDeleteTarget({ type: 'product', id: p.id, name: p.name })
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(productsPage - 1) * 10 + 1}-{Math.min(productsPage * 10, productsTotal)} of{' '}
              {productsTotal}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={productsPage <= 1}
                onClick={() => setProductsPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm">
                {productsPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={productsPage >= totalPages}
                onClick={() => setProductsPage((p) => p + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCategories = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: '#1a1a2e' }}>
          All Categories ({categories.length})
        </h3>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setCategoryFormOpen(true);
          }}
          className="text-white"
          style={{ backgroundColor: '#B91C1C' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
        >
          <Plus className="mr-2 size-4" />
          Add Category
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="size-full object-cover" />
                      ) : (
                        <FolderOpen className="size-4 text-gray-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{cat.name}</p>
                    {cat.icon && (
                      <p className="text-xs text-muted-foreground">Icon: {cat.icon}</p>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {cat.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cat.productCount}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px]">
                    <p className="truncate text-sm text-muted-foreground">
                      {cat.description || '-'}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryFormOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-500 hover:text-red-700"
                        onClick={() =>
                          setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderCarModels = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: '#1a1a2e' }}>
          All Car Models ({carModels.length})
        </h3>
        <Button
          onClick={() => {
            setEditingCarModel(null);
            setCarModelFormOpen(true);
          }}
          className="text-white"
          style={{ backgroundColor: '#B91C1C' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
        >
          <Plus className="mr-2 size-4" />
          Add Car Model
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Image</TableHead>
              <TableHead>Make</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="hidden sm:table-cell">Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carModels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No car models found
                </TableCell>
              </TableRow>
            ) : (
              carModels.map((cm) => (
                <TableRow key={cm.id}>
                  <TableCell>
                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                      {cm.image ? (
                        <img src={cm.image} alt={`${cm.make} ${cm.name}`} className="size-full object-cover" />
                      ) : (
                        <Car className="size-4 text-gray-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{cm.make}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{cm.name}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {cm.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cm.productCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                          setEditingCarModel(cm);
                          setCarModelFormOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-500 hover:text-red-700"
                        onClick={() =>
                          setDeleteTarget({ type: 'car-model', id: cm.id, name: `${cm.make} ${cm.name}` })
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderOrders = () => {
    const totalPages = Math.ceil(ordersTotal / 10);
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold" style={{ color: '#1a1a2e' }}>
          All Orders ({ordersTotal})
        </h3>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="text-xs font-mono text-muted-foreground">
                        {order.id.slice(0, 8)}...
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{order.userName}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {order.userPhone}
                    </TableCell>
                    <TableCell className="text-sm font-semibold" style={{ color: '#B91C1C' }}>
                      Rs. {order.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}
                        variant="secondary"
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Select
                          value={order.status}
                          onValueChange={(val) => handleStatusChange(order.id, val)}
                        >
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Edit order details"
                          onClick={() =>
                            setOrderEditTarget({
                              id: order.id,
                              userName: (order as any).userName ?? order.userName,
                              userPhone: (order as any).userPhone ?? order.userPhone,
                              userEmail: (order as any).userEmail ?? '',
                              userAddress: (order as any).userAddress ?? '',
                              userCity: (order as any).userCity ?? '',
                              notes: (order as any).notes ?? '',
                              status: order.status,
                            })
                          }
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-red-500 hover:text-red-700"
                          title="Delete order"
                          onClick={() =>
                            setDeleteTarget({ type: 'order', id: order.id, name: `Order #${order.id.slice(0, 8)}` })
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(ordersPage - 1) * 10 + 1}-{Math.min(ordersPage * 10, ordersTotal)} of{' '}
              {ordersTotal}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={ordersPage <= 1}
                onClick={() => setOrdersPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm">
                {ordersPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={ordersPage >= totalPages}
                onClick={() => setOrdersPage((p) => p + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCustomers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: '#1a1a2e' }}>
          All Users ({customers.length})
        </h3>
        <Button
          onClick={() => { setEditingUser(null); setUserFormOpen(true); }}
          className="text-white"
          style={{ backgroundColor: '#B91C1C' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
        >
          <Plus className="mr-2 size-4" />
          Add User
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Orders</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{user.name}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {user.phone || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                      variant="secondary"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {(user as any).orderCount ?? 0}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Edit user"
                        onClick={() => { setEditingUser(user); setUserFormOpen(true); }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-500 hover:text-red-700"
                        title="Delete user"
                        onClick={() => setDeleteTarget({ type: 'user', id: user.id, name: user.name })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  // ─── Main Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin" style={{ color: '#B91C1C' }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] gap-0">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="hidden w-60 shrink-0 lg:block"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="border-b border-white/10 p-4">
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              <span className="text-sm">Back to Store</span>
            </button>
          </div>
          <nav className="flex-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                  }`}
                  style={isActive ? { backgroundColor: '#B91C1C' } : undefined}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-4">
            <p className="text-xs text-white/40">Ravi Genuine Autos</p>
            <p className="text-xs text-white/30">Admin Dashboard</p>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Nav ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        {/* Mobile tab bar */}
        <div
          className="flex items-center gap-1 overflow-x-auto px-2 py-2 lg:hidden"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          <button
            onClick={() => setView('home')}
            className="shrink-0 rounded-md px-2 py-1.5 text-xs text-white/70 hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </button>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-white/60 hover:text-white/90'
                }`}
                style={isActive ? { backgroundColor: '#B91C1C' } : undefined}
              >
                <Icon className="size-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ── Content Area ─────────────────────────────────────────────────── */}
        <div className="flex-1 p-4 lg:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'products' && 'Product Management'}
              {activeTab === 'categories' && 'Category Management'}
              {activeTab === 'car-models' && 'Car Model Management'}
              {activeTab === 'orders' && 'Order Management'}
              {activeTab === 'customers' && 'User & Admin Management'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'overview' && 'Welcome back! Here is your store summary.'}
              {activeTab === 'products' && 'Manage your product inventory'}
              {activeTab === 'categories' && 'Organize your product categories'}
              {activeTab === 'car-models' && 'Manage car makes and models for your catalog'}
              {activeTab === 'orders' && 'Track, edit, and manage all customer orders'}
              {activeTab === 'customers' && 'Create, edit, and delete customer and admin accounts'}
            </p>
          </div>

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'categories' && renderCategories()}
          {activeTab === 'car-models' && renderCarModels()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'customers' && renderCustomers()}
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <ProductForm
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        product={
          editingProduct
            ? {
                id: editingProduct.id,
                name: editingProduct.name,
                description: (editingProduct as any).description || '',
                price: editingProduct.price,
                condition: (editingProduct as any).condition || 'new',
                stock: editingProduct.stock,
                images: editingProduct.images || '',
                sku: (editingProduct as any).sku || null,
                partNumber: (editingProduct as any).partNumber || null,
                categoryId: editingProduct.category?.id || '',
                carModelId: editingProduct.carModel?.id || '',
                featured: editingProduct.featured || false,
              }
            : null
        }
        onSuccess={async () => {
          setProductsPage(1);
          await fetchProducts(1);
          fetchStats();
        }}
      />

      <CategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        category={editingCategory}
        onSuccess={() => {
          fetchCategories();
          fetchStats();
        }}
      />

      {/* User Create/Edit Dialog */}
      <UserForm
        open={userFormOpen}
        onOpenChange={setUserFormOpen}
        user={editingUser}
        onSuccess={() => {
          fetchCustomers();
          fetchStats();
        }}
      />

      {/* Order Edit Dialog */}
      {orderEditTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOrderEditTarget(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-gray-900">Edit Order Details</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Customer Name</label>
                  <Input value={orderEditTarget.userName} onChange={(e) => setOrderEditTarget({ ...orderEditTarget, userName: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Phone</label>
                  <Input value={orderEditTarget.userPhone} onChange={(e) => setOrderEditTarget({ ...orderEditTarget, userPhone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
                <Input type="email" value={orderEditTarget.userEmail} onChange={(e) => setOrderEditTarget({ ...orderEditTarget, userEmail: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Address</label>
                  <Input value={orderEditTarget.userAddress} onChange={(e) => setOrderEditTarget({ ...orderEditTarget, userAddress: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">City</label>
                  <Input value={orderEditTarget.userCity} onChange={(e) => setOrderEditTarget({ ...orderEditTarget, userCity: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Notes</label>
                <Input value={orderEditTarget.notes} onChange={(e) => setOrderEditTarget({ ...orderEditTarget, notes: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
                <Select value={orderEditTarget.status} onValueChange={(v) => setOrderEditTarget({ ...orderEditTarget, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOrderEditTarget(null)} disabled={orderEditSaving}>Cancel</Button>
              <Button onClick={handleOrderEditSave} disabled={orderEditSaving} style={{ backgroundColor: '#B91C1C' }} className="text-white hover:opacity-90">
                {orderEditSaving ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CarModelForm
        open={carModelFormOpen}
        onOpenChange={setCarModelFormOpen}
        carModel={editingCarModel}
        onSuccess={() => {
          fetchCarModels();
          fetchStats();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-semibold">{deleteTarget?.name}</span>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
