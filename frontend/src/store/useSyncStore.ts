import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStudentStore } from './useStudentStore';
import { useGroupStore } from './useGroupStore';
import { useRuleStore } from './useRuleStore';
import { useRecordStore } from './useRecordStore';
import { useProductStore } from './useProductStore';
import { useSettingsStore } from './useSettingsStore';

interface SyncStore {
  lastSyncVersion: number;
  lastSyncAt: string | null;
  isDirty: boolean;

  markDirty: () => void;
  markClean: (serverVersion: number) => void;
  reset: () => void;
}

// Module-level flags to control dirty tracking
let _syncing = false;
let _ready = false;

export function setSyncing(value: boolean) {
  _syncing = value;
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      lastSyncVersion: 0,
      lastSyncAt: null,
      isDirty: false,

      markDirty: () => {
        set({ isDirty: true });
      },

      markClean: (serverVersion: number) => {
        set({
          isDirty: false,
          lastSyncVersion: serverVersion,
          lastSyncAt: new Date().toISOString(),
        });
      },

      reset: () => {
        set({ lastSyncVersion: 0, lastSyncAt: null, isDirty: false });
      },
    }),
    {
      name: 'classScore_sync',
    }
  )
);

// Subscribe to all data stores to auto-detect local changes.
// Subscriptions fire on hydration too, so we delay enabling via _ready flag.
if (typeof window !== 'undefined') {
  const dataStores = [
    useStudentStore,
    useGroupStore,
    useRuleStore,
    useRecordStore,
    useProductStore,
    useSettingsStore,
  ];

  dataStores.forEach((store) => {
    store.subscribe(() => {
      if (_ready && !_syncing) {
        useSyncStore.getState().markDirty();
      }
    });
  });

  // Allow hydration to settle before tracking changes
  setTimeout(() => {
    _ready = true;
  }, 1500);
}
