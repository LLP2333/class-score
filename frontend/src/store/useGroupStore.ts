import { create } from 'zustand';
import { api } from '@/lib/api';
import type { GroupData } from '@/lib/api';

interface GroupStore {
  groups: GroupData[];
  loading: boolean;

  fetchGroups: (classId: number) => Promise<void>;
  addGroup: (classId: number, data: { name: string; color?: number; leader_id?: number | null }) => Promise<GroupData | null>;
  updateGroup: (id: number, updates: { name?: string; color?: number; leader_id?: number | null }) => Promise<GroupData | null>;
  deleteGroup: (id: number) => Promise<boolean>;
  getGroupById: (id: number) => GroupData | undefined;
  setGroups: (groups: GroupData[]) => void;
  clearGroups: () => void;
}

export const useGroupStore = create<GroupStore>()(
  (set, get) => ({
    groups: [],
    loading: false,

    fetchGroups: async (classId) => {
      set({ loading: true });
      const result = await api.listGroups(classId);
      if (result.success && result.data) {
        set({ groups: result.data });
      }
      set({ loading: false });
    },

    addGroup: async (classId, data) => {
      const result = await api.createGroup(classId, data);
      if (result.success && result.data) {
        set((state) => ({ groups: [...state.groups, result.data!] }));
        return result.data;
      }
      return null;
    },

    updateGroup: async (id, updates) => {
      const result = await api.updateGroup(id, updates);
      if (result.success && result.data) {
        const updated = result.data;
        set((state) => ({
          groups: state.groups.map(g => g.id === id ? updated : g),
        }));
        return updated;
      }
      return null;
    },

    deleteGroup: async (id) => {
      const result = await api.deleteGroup(id);
      if (result.success) {
        set((state) => ({
          groups: state.groups.filter(g => g.id !== id),
        }));
        return true;
      }
      return false;
    },

    getGroupById: (id) => get().groups.find(g => g.id === id),

    setGroups: (groups) => set({ groups }),

    clearGroups: () => set({ groups: [] }),
  })
);
