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
  | 'identify';

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
  authMode: 'login' | 'register';
  showChat: boolean;
  cartOpen: boolean;

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

  // UI State Actions
  setShowAuth: (show: boolean, mode?: 'login' | 'register') => void;
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

  // ── UI State ───────────────────────────────────────────────────

  setShowAuth: (show, mode) =>
    set({
      showAuth: show,
      ...(mode ? { authMode: mode } : {}),
    }),

  setShowChat: (show) => set({ showChat: show }),

  setCartOpen: (open) => set({ cartOpen: open }),
}));
