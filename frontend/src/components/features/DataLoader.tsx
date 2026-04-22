'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore, useStudentStore, useGroupStore, useRuleStore, useRecordStore, useProductStore, useSettingsStore, usePetStore } from '@/store';

export function DataLoader() {
  const currentClassId = useAuthStore((s) => s.currentClassId);
  const loaded = useRef<number | null>(null);

  useEffect(() => {
    if (!currentClassId || loaded.current === currentClassId) return;
    loaded.current = currentClassId;

    Promise.all([
      useStudentStore.getState().fetchStudents(currentClassId),
      useGroupStore.getState().fetchGroups(currentClassId),
      useRuleStore.getState().fetchRules(currentClassId),
      useRecordStore.getState().fetchRecords(currentClassId),
      useProductStore.getState().fetchProducts(currentClassId),
      useProductStore.getState().fetchExchanges(currentClassId),
      useSettingsStore.getState().fetchSettings(currentClassId),
      useSettingsStore.getState().fetchRollCallHistory(currentClassId),
      usePetStore.getState().fetchAll(currentClassId),
    ]);
  }, [currentClassId]);

  return null;
}
