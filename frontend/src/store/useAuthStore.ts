import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BackendUser } from '@/types';

interface AuthStore {
  // State
  isAvailable: boolean;
  token: string | null;
  user: BackendUser | null;
  hasRemoteData: boolean;
  
  // Actions
  setAvailable: (available: boolean) => void;
  setAuth: (token: string, user: BackendUser, hasRemoteData?: boolean) => void;
  clearAuth: () => void;
  setHasRemoteData: (hasData: boolean) => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAvailable: false,
      token: null,
      user: null,
      hasRemoteData: false,
      
      setAvailable: (available) => {
        set({ isAvailable: available });
      },
      
      setAuth: (token, user, hasRemoteData = false) => {
        set({ token, user, hasRemoteData });
      },
      
      clearAuth: () => {
        set({ token: null, user: null, hasRemoteData: false });
      },
      
      setHasRemoteData: (hasData) => {
        set({ hasRemoteData: hasData });
      },
      
      isLoggedIn: () => {
        const state = get();
        return state.isAvailable && !!state.token && !!state.user;
      },
    }),
    {
      name: 'classScore_auth',
    }
  )
);
