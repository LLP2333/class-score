import { create } from 'zustand';
import { api } from '@/lib/api';
import type { ClassSettingsData, RollCallData } from '@/lib/api';

interface SettingsStore {
  settings: ClassSettingsData | null;
  rollCallHistory: RollCallData[];
  loading: boolean;

  fetchSettings: (classId: number) => Promise<void>;
  updateSettings: (classId: number, updates: { theme?: string; animation_speed?: string; sound_enabled?: boolean; roll_call_count?: number; roll_call_exclude_recent_count?: number }) => Promise<void>;

  fetchRollCallHistory: (classId: number) => Promise<void>;
  addRollCallRecord: (classId: number, students: string[]) => Promise<RollCallData | null>;
  createRandomRollCall: (classId: number, count: number, excludeRecentCount: number) => Promise<RollCallData>;

  setSettings: (settings: ClassSettingsData) => void;
  setRollCallHistory: (history: RollCallData[]) => void;
  clearAll: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  (set) => ({
    settings: null,
    rollCallHistory: [],
    loading: false,

    fetchSettings: async (classId) => {
      set({ loading: true });
      const result = await api.getSettings(classId);
      if (result.success && result.data) {
        set({ settings: result.data });
      }
      set({ loading: false });
    },

    updateSettings: async (classId, updates) => {
      const result = await api.updateSettings(classId, updates);
      if (result.success && result.data) {
        set({ settings: result.data });
        return;
      }
      throw new Error(result.error || '更新设置失败');
    },

    fetchRollCallHistory: async (classId) => {
      const result = await api.listRollCalls(classId);
      if (result.success && result.data) {
        set({ rollCallHistory: result.data });
      }
    },

    addRollCallRecord: async (classId, students) => {
      const result = await api.createRollCall(classId, students);
      if (result.success && result.data) {
        set((state) => ({
          rollCallHistory: [result.data!, ...state.rollCallHistory].slice(0, 50),
        }));
        return result.data;
      }
      return null;
    },

    createRandomRollCall: async (classId, count, excludeRecentCount) => {
      const result = await api.createRandomRollCall(classId, {
        count,
        exclude_recent_count: excludeRecentCount,
      });
      if (result.success && result.data) {
        set((state) => ({
          rollCallHistory: [result.data!, ...state.rollCallHistory].slice(0, 50),
        }));
        return result.data;
      }
      throw new Error(result.error || '点名失败');
    },

    setSettings: (settings) => set({ settings }),
    setRollCallHistory: (history) => set({ rollCallHistory: history }),
    clearAll: () => set({ settings: null, rollCallHistory: [] }),
  })
);
