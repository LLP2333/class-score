import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Exchange } from '@/types';
import { generateId } from '@/lib/utils';

const defaultProducts: Product[] = [
  { id: generateId(), name: '笔记本', price: 30, stock: 10, icon: '📓', exchangeCount: 0 },
  { id: generateId(), name: '彩色笔', price: 40, stock: 8, icon: '🖍️', exchangeCount: 0 },
  { id: generateId(), name: '文具套装', price: 50, stock: 5, icon: '✏️', exchangeCount: 0 },
  { id: generateId(), name: '免作业卡', price: 100, stock: 3, icon: '🎫', exchangeCount: 0 },
];

interface ProductStore {
  products: Product[];
  exchanges: Exchange[];
  
  // Product Actions
  addProduct: (data: Omit<Product, 'id' | 'exchangeCount'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => Product | null;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  setProducts: (products: Product[]) => void;
  initDefaultProducts: () => void;
  
  // Exchange Actions
  addExchange: (data: Omit<Exchange, 'id' | 'createdAt'>) => Exchange;
  getExchangesByStudentId: (studentId: string) => Exchange[];
  setExchanges: (exchanges: Exchange[]) => void;
  clearAll: () => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],
      exchanges: [],
      
      addProduct: (data) => {
        const newProduct: Product = {
          id: generateId(),
          name: data.name,
          price: data.price,
          stock: data.stock || 10,
          icon: data.icon || '🎁',
          exchangeCount: 0,
        };
        set((state) => ({ products: [...state.products, newProduct] }));
        return newProduct;
      },
      
      updateProduct: (id, updates) => {
        const products = get().products;
        const index = products.findIndex(p => p.id === id);
        if (index === -1) return null;
        
        const updatedProduct = { ...products[index], ...updates };
        const newProducts = [...products];
        newProducts[index] = updatedProduct;
        set({ products: newProducts });
        return updatedProduct;
      },
      
      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter(p => p.id !== id)
        }));
      },
      
      getProductById: (id) => {
        return get().products.find(p => p.id === id);
      },
      
      setProducts: (products) => {
        set({ products });
      },
      
      initDefaultProducts: () => {
        if (get().products.length === 0) {
          set({ products: defaultProducts });
        }
      },
      
      addExchange: (data) => {
        const newExchange: Exchange = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          studentId: data.studentId,
          productId: data.productId,
          productName: data.productName,
          price: data.price,
        };
        
        // Update product stock and exchange count
        const product = get().getProductById(data.productId);
        if (product) {
          get().updateProduct(data.productId, {
            stock: product.stock - 1,
            exchangeCount: product.exchangeCount + 1,
          });
        }
        
        set((state) => ({ exchanges: [...state.exchanges, newExchange] }));
        return newExchange;
      },
      
      getExchangesByStudentId: (studentId) => {
        return get().exchanges
          .filter(e => e.studentId === studentId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      setExchanges: (exchanges) => {
        set({ exchanges });
      },
      
      clearAll: () => {
        set({ products: [], exchanges: [] });
      },
    }),
    {
      name: 'classScore_products',
    }
  )
);
