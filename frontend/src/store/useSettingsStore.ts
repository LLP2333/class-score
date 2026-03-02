import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClassInfo, Settings, RollCallRecord } from '@/types';
import { generateId } from '@/lib/utils';

interface SettingsStore {
  // Class info
  classInfo: ClassInfo;
  setClassInfo: (info: Partial<ClassInfo>) => void;
  
  // Settings
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
  
  // Roll call history
  rollCallHistory: RollCallRecord[];
  addRollCallRecord: (students: string[]) => RollCallRecord;
  setRollCallHistory: (history: RollCallRecord[]) => void;
  
  // Clear all
  clearAll: () => void;
}

const defaultClassInfo: ClassInfo = {
  name: '我的班级',
  teacher: '班主任',
  createdAt: new Date().toISOString(),
};

const defaultSettings: Settings = {
  theme: 'light',
  animationSpeed: 'normal',
  soundEnabled: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      classInfo: defaultClassInfo,
      settings: defaultSettings,
      rollCallHistory: [],
      
      setClassInfo: (info) => {
        set((state) => ({
          classInfo: { ...state.classInfo, ...info }
        }));
      },
      
      setSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },
      
      addRollCallRecord: (students) => {
        const record: RollCallRecord = {
          id: generateId(),
          students,
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const history = [record, ...state.rollCallHistory];
          // Keep only last 50 records
          if (history.length > 50) history.pop();
          return { rollCallHistory: history };
        });
        return record;
      },
      
      setRollCallHistory: (history) => {
        set({ rollCallHistory: history });
      },
      
      clearAll: () => {
        set({
          classInfo: defaultClassInfo,
          settings: defaultSettings,
          rollCallHistory: [],
        });
      },
    }),
    {
      name: 'classScore_settings',
    }
  )
);
