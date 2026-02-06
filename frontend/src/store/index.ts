// Re-export all stores
export { useStudentStore } from './useStudentStore';
export { useGroupStore } from './useGroupStore';
export { useRuleStore } from './useRuleStore';
export { useRecordStore } from './useRecordStore';
export { useProductStore } from './useProductStore';
export { useSettingsStore } from './useSettingsStore';
export { useAuthStore } from './useAuthStore';

// Combined data export/import utilities
import { useStudentStore } from './useStudentStore';
import { useGroupStore } from './useGroupStore';
import { useRuleStore } from './useRuleStore';
import { useRecordStore } from './useRecordStore';
import { useProductStore } from './useProductStore';
import { useSettingsStore } from './useSettingsStore';
import type { ExportData } from '@/types';

export function exportAllData(): ExportData {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    classInfo: useSettingsStore.getState().classInfo,
    students: useStudentStore.getState().students,
    groups: useGroupStore.getState().groups,
    rules: useRuleStore.getState().rules,
    products: useProductStore.getState().products,
    scoreRecords: useRecordStore.getState().records,
    exchanges: useProductStore.getState().exchanges,
    rollCallHistory: useSettingsStore.getState().rollCallHistory,
    lotteryHistory: useSettingsStore.getState().lotteryHistory,
    settings: useSettingsStore.getState().settings,
  };
}

export function importAllData(data: ExportData): boolean {
  try {
    if (!data.version) {
      throw new Error('Invalid backup file');
    }
    
    if (data.classInfo) useSettingsStore.getState().setClassInfo(data.classInfo);
    if (data.students) useStudentStore.getState().setStudents(data.students);
    if (data.groups) useGroupStore.getState().setGroups(data.groups);
    if (data.rules) useRuleStore.getState().setRules(data.rules);
    if (data.products) useProductStore.getState().setProducts(data.products);
    if (data.scoreRecords) useRecordStore.getState().setRecords(data.scoreRecords);
    if (data.exchanges) useProductStore.getState().setExchanges(data.exchanges);
    if (data.rollCallHistory) useSettingsStore.getState().setRollCallHistory(data.rollCallHistory);
    if (data.lotteryHistory) useSettingsStore.getState().setLotteryHistory(data.lotteryHistory);
    if (data.settings) useSettingsStore.getState().setSettings(data.settings);
    
    return true;
  } catch (e) {
    console.error('Import error:', e);
    return false;
  }
}

export function clearAllData(): void {
  useStudentStore.getState().clearStudents();
  useGroupStore.getState().clearGroups();
  useRuleStore.getState().clearRules();
  useRecordStore.getState().clearRecords();
  useProductStore.getState().clearAll();
  useSettingsStore.getState().clearAll();
}

export function initDefaultData(): void {
  useRuleStore.getState().initDefaultRules();
  useProductStore.getState().initDefaultProducts();
}
