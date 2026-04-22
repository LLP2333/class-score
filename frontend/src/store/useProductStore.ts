import { create } from 'zustand';
import { api } from '@/lib/api';
import type { ProductData, ExchangeData } from '@/lib/api';

interface ProductStore {
  products: ProductData[];
  exchanges: ExchangeData[];
  loading: boolean;

  fetchProducts: (classId: number) => Promise<void>;
  fetchExchanges: (classId: number) => Promise<void>;
  addProduct: (classId: number, data: { name: string; price: number; stock?: number; icon?: string }) => Promise<ProductData | null>;
  updateProduct: (id: number, updates: { name?: string; price?: number; stock?: number; icon?: string }) => Promise<ProductData | null>;
  deleteProduct: (id: number) => Promise<boolean>;
  getProductById: (id: number) => ProductData | undefined;
  addExchange: (classId: number, data: { student_id: number; product_id: number }) => Promise<ExchangeData | null>;
  getExchangesByStudentId: (studentId: number) => ExchangeData[];
  setProducts: (products: ProductData[]) => void;
  setExchanges: (exchanges: ExchangeData[]) => void;
  clearAll: () => void;
}

export const useProductStore = create<ProductStore>()(
  (set, get) => ({
    products: [],
    exchanges: [],
    loading: false,

    fetchProducts: async (classId) => {
      set({ loading: true });
      const result = await api.listProducts(classId);
      if (result.success && result.data) {
        set({ products: result.data });
      }
      set({ loading: false });
    },

    fetchExchanges: async (classId) => {
      const result = await api.listExchanges(classId);
      if (result.success && result.data) {
        set({ exchanges: result.data });
      }
    },

    addProduct: async (classId, data) => {
      const result = await api.createProduct(classId, data);
      if (result.success && result.data) {
        set((state) => ({ products: [...state.products, result.data!] }));
        return result.data;
      }
      return null;
    },

    updateProduct: async (id, updates) => {
      const result = await api.updateProduct(id, updates);
      if (result.success && result.data) {
        const updated = result.data;
        set((state) => ({
          products: state.products.map(p => p.id === id ? updated : p),
        }));
        return updated;
      }
      return null;
    },

    deleteProduct: async (id) => {
      const result = await api.deleteProduct(id);
      if (result.success) {
        set((state) => ({
          products: state.products.filter(p => p.id !== id),
        }));
        return true;
      }
      return false;
    },

    getProductById: (id) => get().products.find(p => p.id === id),

    addExchange: async (classId, data) => {
      const result = await api.createExchange(classId, data);
      if (result.success && result.data) {
        set((state) => ({ exchanges: [result.data!, ...state.exchanges] }));
        // Refresh products to get updated stock
        const prodResult = await api.listProducts(classId);
        if (prodResult.success && prodResult.data) {
          set({ products: prodResult.data });
        }
        return result.data;
      }
      return null;
    },

    getExchangesByStudentId: (studentId) =>
      get().exchanges
        .filter(e => e.student_id === studentId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),

    setProducts: (products) => set({ products }),

    setExchanges: (exchanges) => set({ exchanges }),

    clearAll: () => set({ products: [], exchanges: [] }),
  })
);
