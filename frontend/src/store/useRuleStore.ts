import { create } from 'zustand';
import { api } from '@/lib/api';
import type { RuleData } from '@/lib/api';

interface RuleStore {
  rules: RuleData[];
  loading: boolean;

  fetchRules: (classId: number) => Promise<void>;
  addRule: (classId: number, data: { name: string; score: number; type: string; category?: string; icon?: string }) => Promise<RuleData | null>;
  updateRule: (id: number, updates: { name?: string; score?: number; type?: string; category?: string; icon?: string }) => Promise<RuleData | null>;
  deleteRule: (id: number) => Promise<boolean>;
  getRuleById: (id: number) => RuleData | undefined;
  getRulesByType: (type: 'add' | 'minus') => RuleData[];
  setRules: (rules: RuleData[]) => void;
  clearRules: () => void;
}

export const useRuleStore = create<RuleStore>()(
  (set, get) => ({
    rules: [],
    loading: false,

    fetchRules: async (classId) => {
      set({ loading: true });
      const result = await api.listRules(classId);
      if (result.success && result.data) {
        set({ rules: result.data });
      }
      set({ loading: false });
    },

    addRule: async (classId, data) => {
      const result = await api.createRule(classId, data);
      if (result.success && result.data) {
        set((state) => ({ rules: [...state.rules, result.data!] }));
        return result.data;
      }
      return null;
    },

    updateRule: async (id, updates) => {
      const result = await api.updateRule(id, updates);
      if (result.success && result.data) {
        const updated = result.data;
        set((state) => ({
          rules: state.rules.map(r => r.id === id ? updated : r),
        }));
        return updated;
      }
      return null;
    },

    deleteRule: async (id) => {
      const result = await api.deleteRule(id);
      if (result.success) {
        set((state) => ({
          rules: state.rules.filter(r => r.id !== id),
        }));
        return true;
      }
      return false;
    },

    getRuleById: (id) => get().rules.find(r => r.id === id),

    getRulesByType: (type) => get().rules.filter(r => r.type === type),

    setRules: (rules) => set({ rules }),

    clearRules: () => set({ rules: [] }),
  })
);
