import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScoreRecord } from '@/types';
import { generateId } from '@/lib/utils';

interface RecordStore {
  records: ScoreRecord[];
  
  // Actions
  addRecord: (data: Omit<ScoreRecord, 'id' | 'createdAt'>) => ScoreRecord;
  updateRecord: (id: string, updates: Partial<Pick<ScoreRecord, 'score' | 'reason' | 'ruleId'>>) => ScoreRecord | null;
  deleteRecord: (id: string) => ScoreRecord | null;
  getRecordById: (id: string) => ScoreRecord | undefined;
  getRecordsByStudentId: (studentId: string) => ScoreRecord[];
  getRecordsByGroupId: (groupId: string) => ScoreRecord[];
  getRecentRecords: (limit?: number) => ScoreRecord[];
  setRecords: (records: ScoreRecord[]) => void;
  clearRecords: () => void;
  deleteRecordsByStudentId: (studentId: string) => void;
}

export const useRecordStore = create<RecordStore>()(
  persist(
    (set, get) => ({
      records: [],
      
      addRecord: (data) => {
        const newRecord: ScoreRecord = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          studentId: data.studentId,
          groupId: data.groupId || null,
          ruleId: data.ruleId || null,
          score: data.score,
          reason: data.reason || '',
        };
        set((state) => ({ records: [...state.records, newRecord] }));
        return newRecord;
      },

      updateRecord: (id, updates) => {
        const records = get().records;
        const index = records.findIndex(r => r.id === id);
        if (index === -1) return null;

        const updatedRecord = { ...records[index], ...updates };
        const newRecords = [...records];
        newRecords[index] = updatedRecord;
        set({ records: newRecords });
        return updatedRecord;
      },

      deleteRecord: (id) => {
        const record = get().records.find(r => r.id === id);
        if (!record) return null;
        set((state) => ({
          records: state.records.filter(r => r.id !== id)
        }));
        return record;
      },

      getRecordById: (id) => {
        return get().records.find(r => r.id === id);
      },

      getRecordsByStudentId: (studentId) => {
        return get().records
          .filter(r => r.studentId === studentId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      getRecordsByGroupId: (groupId) => {
        return get().records
          .filter(r => r.groupId === groupId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      getRecentRecords: (limit = 50) => {
        return [...get().records]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      },
      
      setRecords: (records) => {
        set({ records });
      },
      
      clearRecords: () => {
        set({ records: [] });
      },
      
      deleteRecordsByStudentId: (studentId) => {
        set((state) => ({
          records: state.records.filter(r => r.studentId !== studentId)
        }));
      },
    }),
    {
      name: 'classScore_scoreRecords',
    }
  )
);
