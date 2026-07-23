import { create } from 'zustand';

// ─── Type Definitions ────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  condition: string;
  carModel: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  role?: string;
}

export interface AppFilters {
  carModelId: string;
  categoryId: string;
  condition: string; // "all" | "new" | "used"
  search: string;
  sortBy: string; // "default" | "price-asc" | "price-desc" | "newest"
}

export type ViewType =
  | 'home'
  | 'catalog'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'account'
  | 'identify'
  | 'admin';

// ─── Default Values ──────────────────────────────────────────────────

const defaultFilters: AppFilters = {
  carModelId: '',
  categoryId: '',
  condition: 'all',
  search: '',
  sortBy: 'default',
};

// ─── Store Interface ─────────────────────────────────────────────────

interface AppStore {
  // State
  currentView: ViewType;
  selectedProductId: string | null;
  filters: AppFilters;
  cart: CartItem[];
  user: User | null;
  showAuth: boolean;
  authMode: 'login' | 'register' | 'forgot-password';
  showChat: boolean;
  cartOpen: boolean;
  wishlist: string[];

  // Navigation Actions
  setView: (view: ViewType) => void;
  selectProduct: (id: string) => void;

  // Filter Actions
  setFilters: (filters: Partial<AppFilters>) => void;
  resetFilters: () => void;

  // Cart Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;

  // User Actions
  setUser: (user: User | null) => void;
  logout: () => void;

  // Wishlist Actions
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  setWishlist: (productIds: string[]) => void;

  // UI State Actions
  setShowAuth: (show: boolean, mode?: 'login' | 'register' | 'forgot-password') => void;
  setShowChat: (show: boolean) => void;
  setCartOpen: (open: boolean) => void;
}

// ─── Store ───────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({
  // ── Initial State ──────────────────────────────────────────────

  currentView: 'home',
  selectedProductId: null,
  filters: { ...defaultFilters },
  cart: [],
  user: null,
  showAuth: false,
  authMode: 'login',
  showChat: false,
  cartOpen: false,
  wishlist: [],

  // ── Navigation ─────────────────────────────────────────────────

  setView: (view) => set({ currentView: view }),

  selectProduct: (id) => set({ selectedProductId: id, currentView: 'product' }),

  // ── Filters ────────────────────────────────────────────────────

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  // ── Cart ───────────────────────────────────────────────────────

  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find(
        (ci) => ci.productId === item.productId
      );

      if (existing) {
        return {
          cart: state.cart.map((ci) =>
            ci.productId === item.productId
              ? { ...ci, quantity: ci.quantity + item.quantity }
              : ci
          ),
        };
      }

      return { cart: [...state.cart, item] };
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((ci) => ci.productId !== productId),
    })),

  updateCartQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((ci) => ci.productId !== productId) };
      }
      return {
        cart: state.cart.map((ci) =>
          ci.productId === productId ? { ...ci, quantity } : ci
        ),
      };
    }),

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getCartCount: () => {
    const { cart } = get();
    return cart.reduce((count, item) => count + item.quantity, 0);
  },

  // ── User ───────────────────────────────────────────────────────

  setUser: (user) => set({ user }),

  logout: () => {
    // Clear server session cookie first
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    }).catch(() => {
      // Silently ignore network errors
    });
    // Immediately clear client state and navigate away from any protected views
    set({ user: null, currentView: 'home' });
  },

  // ── Wishlist ──────────────────────────────────────────────────

  toggleWishlist: (productId) =>
    set((state) => {
      const exists = state.wishlist.includes(productId);
      if (exists) {
        return { wishlist: state.wishlist.filter((id) => id !== productId) };
      }
      return { wishlist: [...state.wishlist, productId] };
    }),

  isInWishlist: (productId) => {
    const { wishlist } = get();
    return wishlist.includes(productId);
  },

  setWishlist: (productIds) => set({ wishlist: productIds }),

  // ── UI State ───────────────────────────────────────────────────

  setShowAuth: (show, mode) =>
    set({
      showAuth: show,
      ...(mode ? { authMode: mode } : {}),
    }),

  setShowChat: (show) => set({ showChat: show }),

  setCartOpen: (open) => set({ cartOpen: open }),
}));
