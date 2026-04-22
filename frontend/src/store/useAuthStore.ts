import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setApiToken } from '@/lib/api';
import type { ClassData } from '@/lib/api';
import type { UserRole } from '@/types';

interface AuthStore {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  userId: number | null;

  classes: ClassData[];
  currentClassId: number | null;

  // Student-specific
  studentId: number | null;

  hasLegacyData: boolean;

  setAuth: (token: string, username: string, role: UserRole) => void;
  clearAuth: () => void;

  setClasses: (classes: ClassData[]) => void;
  setCurrentClassId: (id: number | null) => void;
  setStudentId: (id: number | null) => void;
  setHasLegacyData: (v: boolean) => void;

  isLoggedIn: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;

  initToken: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      username: null,
      role: null,
      userId: null,
      classes: [],
      currentClassId: null,
      studentId: null,
      hasLegacyData: false,

      setAuth: (token, username, role) => {
        setApiToken(token);
        set({ token, username, role });
      },

      clearAuth: () => {
        setApiToken(null);
        set({
          token: null,
          username: null,
          role: null,
          userId: null,
          classes: [],
          currentClassId: null,
          studentId: null,
          hasLegacyData: false,
        });
      },

      setClasses: (classes) => {
        set({ classes });
        const state = get();
        if (classes.length > 0 && !state.currentClassId) {
          set({ currentClassId: classes[0].id });
        }
      },

      setCurrentClassId: (id) => set({ currentClassId: id }),
      setStudentId: (id) => set({ studentId: id }),
      setHasLegacyData: (v) => set({ hasLegacyData: v }),

      isLoggedIn: () => {
        const s = get();
        return !!s.token && !!s.username;
      },

      isTeacher: () => get().role === 'teacher',
      isStudent: () => get().role === 'student',

      initToken: () => {
        const { token } = get();
        if (token) {
          setApiToken(token);
        }
      },
    }),
    {
      name: 'classScore_auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setApiToken(state.token);
        }
      },
    }
  )
);

// Initialize token on module load (client-side)
if (typeof window !== 'undefined') {
  const state = useAuthStore.getState();
  if (state.token) {
    setApiToken(state.token);
  }
}

// Helper for login flow
export async function loginUser(username: string, password: string) {
  const result = await api.login(username, password);
  if (!result.success || !result.data) {
    return { success: false, error: result.error || '登录失败' };
  }

  const d = result.data;
  const store = useAuthStore.getState();
  store.setAuth(d.token, d.username, d.role as UserRole);

  if (d.role === 'teacher') {
    store.setClasses(d.classes || []);
    store.setHasLegacyData(d.has_legacy_data || false);
  }

  if (d.role === 'student' && d.class_id) {
    store.setCurrentClassId(d.class_id);
    store.setStudentId(d.student_id || null);
  }

  return { success: true };
}

export async function registerUser(username: string, password: string) {
  const result = await api.register(username, password);
  if (!result.success || !result.data) {
    return { success: false, error: result.error || '注册失败' };
  }

  const d = result.data;
  const store = useAuthStore.getState();
  store.setAuth(d.token, d.username, d.role as UserRole);

  return { success: true };
}
