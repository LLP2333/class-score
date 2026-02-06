import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Student } from '@/types';
import { generateId } from '@/lib/utils';

interface StudentStore {
  students: Student[];
  
  // Actions
  addStudent: (data: Omit<Student, 'id' | 'createdAt'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => Student | null;
  deleteStudent: (id: string) => void;
  getStudentById: (id: string) => Student | undefined;
  getStudentsByGroupId: (groupId: string) => Student[];
  setStudents: (students: Student[]) => void;
  clearStudents: () => void;
}

export const useStudentStore = create<StudentStore>()(
  persist(
    (set, get) => ({
      students: [],
      
      addStudent: (data) => {
        const newStudent: Student = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          name: data.name,
          avatar: data.avatar || Math.floor(Math.random() * 8) + 1,
          groupId: data.groupId || null,
          totalScore: data.totalScore || 0,
        };
        set((state) => ({ students: [...state.students, newStudent] }));
        return newStudent;
      },
      
      updateStudent: (id, updates) => {
        const students = get().students;
        const index = students.findIndex(s => s.id === id);
        if (index === -1) return null;
        
        const updatedStudent = { ...students[index], ...updates };
        const newStudents = [...students];
        newStudents[index] = updatedStudent;
        set({ students: newStudents });
        return updatedStudent;
      },
      
      deleteStudent: (id) => {
        set((state) => ({
          students: state.students.filter(s => s.id !== id)
        }));
      },
      
      getStudentById: (id) => {
        return get().students.find(s => s.id === id);
      },
      
      getStudentsByGroupId: (groupId) => {
        return get().students.filter(s => s.groupId === groupId);
      },
      
      setStudents: (students) => {
        set({ students });
      },
      
      clearStudents: () => {
        set({ students: [] });
      },
    }),
    {
      name: 'classScore_students',
    }
  )
);
