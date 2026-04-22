import { create } from 'zustand';
import { api } from '@/lib/api';
import type { StudentData } from '@/lib/api';

interface StudentStore {
  students: StudentData[];
  loading: boolean;

  fetchStudents: (classId: number) => Promise<void>;
  addStudent: (classId: number, data: { name: string; avatar?: number; group_id?: number | null; password?: string }) => Promise<StudentData | null>;
  updateStudent: (id: number, updates: { name?: string; avatar?: number; group_id?: number | null }) => Promise<StudentData | null>;
  deleteStudent: (id: number) => Promise<boolean>;
  getStudentById: (id: number) => StudentData | undefined;
  getStudentsByGroupId: (groupId: number) => StudentData[];
  setStudents: (students: StudentData[]) => void;
  clearStudents: () => void;
}

export const useStudentStore = create<StudentStore>()(
  (set, get) => ({
    students: [],
    loading: false,

    fetchStudents: async (classId) => {
      set({ loading: true });
      const result = await api.listStudents(classId);
      if (result.success && result.data) {
        set({ students: result.data });
      }
      set({ loading: false });
    },

    addStudent: async (classId, data) => {
      const result = await api.createStudent(classId, data);
      if (result.success && result.data) {
        set((state) => ({ students: [...state.students, result.data!] }));
        return result.data;
      }
      return null;
    },

    updateStudent: async (id, updates) => {
      const result = await api.updateStudent(id, updates);
      if (result.success && result.data) {
        const updated = result.data;
        set((state) => ({
          students: state.students.map(s => s.id === id ? updated : s),
        }));
        return updated;
      }
      return null;
    },

    deleteStudent: async (id) => {
      const result = await api.deleteStudent(id);
      if (result.success) {
        set((state) => ({
          students: state.students.filter(s => s.id !== id),
        }));
        return true;
      }
      return false;
    },

    getStudentById: (id) => get().students.find(s => s.id === id),

    getStudentsByGroupId: (groupId) => get().students.filter(s => s.group_id === groupId),

    setStudents: (students) => set({ students }),

    clearStudents: () => set({ students: [] }),
  })
);
