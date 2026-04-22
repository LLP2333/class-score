import { create } from 'zustand';
import { api } from '@/lib/api';
import type { RecordData } from '@/lib/api';

interface RecordStore {
  records: RecordData[];
  loading: boolean;

  fetchRecords: (classId: number, limit?: number) => Promise<void>;
  addRecord: (classId: number, data: { student_id: number; group_id?: number | null; rule_id?: number | null; score: number; reason?: string }) => Promise<RecordData | null>;
  updateRecord: (id: number, updates: { score?: number; reason?: string; rule_id?: number | null }) => Promise<RecordData | null>;
  deleteRecord: (id: number) => Promise<RecordData | null>;
  getRecordById: (id: number) => RecordData | undefined;
  getRecordsByStudentId: (studentId: number) => RecordData[];
  getRecordsByGroupId: (groupId: number) => RecordData[];
  getRecentRecords: (limit?: number) => RecordData[];
  setRecords: (records: RecordData[]) => void;
  clearRecords: () => void;
}

export const useRecordStore = create<RecordStore>()(
  (set, get) => ({
    records: [],
    loading: false,

    fetchRecords: async (classId, limit) => {
      set({ loading: true });
      const result = await api.listRecords(classId, limit);
      if (result.success && result.data) {
        set({ records: result.data });
      }
      set({ loading: false });
    },

    addRecord: async (classId, data) => {
      const result = await api.createRecord(classId, data);
      if (result.success && result.data) {
        set((state) => ({ records: [result.data!, ...state.records] }));
        return result.data;
      }
      return null;
    },

    updateRecord: async (id, updates) => {
      const result = await api.updateRecord(id, updates);
      if (result.success && result.data) {
        const updated = result.data;
        set((state) => ({
          records: state.records.map(r => r.id === id ? updated : r),
        }));
        return updated;
      }
      return null;
    },

    deleteRecord: async (id) => {
      const record = get().records.find(r => r.id === id);
      if (!record) return null;
      const result = await api.deleteRecord(id);
      if (result.success) {
        set((state) => ({
          records: state.records.filter(r => r.id !== id),
        }));
        return record;
      }
      return null;
    },

    getRecordById: (id) => get().records.find(r => r.id === id),

    getRecordsByStudentId: (studentId) =>
      get().records
        .filter(r => r.student_id === studentId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),

    getRecordsByGroupId: (groupId) =>
      get().records
        .filter(r => r.group_id === groupId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),

    getRecentRecords: (limit = 50) =>
      [...get().records]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit),

    setRecords: (records) => set({ records }),

    clearRecords: () => set({ records: [] }),
  })
);
