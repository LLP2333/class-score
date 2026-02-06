import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rule } from '@/types';
import { generateId } from '@/lib/utils';

const defaultRules: Rule[] = [
  { id: generateId(), name: '课堂回答问题', score: 5, type: 'add', category: '学习', icon: '✋' },
  { id: generateId(), name: '作业优秀', score: 3, type: 'add', category: '学习', icon: '📝' },
  { id: generateId(), name: '帮助同学', score: 2, type: 'add', category: '品德', icon: '🤝' },
  { id: generateId(), name: '课堂表现好', score: 2, type: 'add', category: '学习', icon: '⭐' },
  { id: generateId(), name: '值日认真', score: 2, type: 'add', category: '劳动', icon: '🧹' },
  { id: generateId(), name: '迟到早退', score: 3, type: 'minus', category: '纪律', icon: '⏰' },
  { id: generateId(), name: '作业未交', score: 5, type: 'minus', category: '学习', icon: '❌' },
  { id: generateId(), name: '上课说话', score: 2, type: 'minus', category: '纪律', icon: '🗣️' },
];

interface RuleStore {
  rules: Rule[];
  
  // Actions
  addRule: (data: Omit<Rule, 'id'>) => Rule;
  updateRule: (id: string, updates: Partial<Rule>) => Rule | null;
  deleteRule: (id: string) => void;
  getRuleById: (id: string) => Rule | undefined;
  getRulesByType: (type: 'add' | 'minus') => Rule[];
  setRules: (rules: Rule[]) => void;
  clearRules: () => void;
  initDefaultRules: () => void;
}

export const useRuleStore = create<RuleStore>()(
  persist(
    (set, get) => ({
      rules: [],
      
      addRule: (data) => {
        const newRule: Rule = {
          id: generateId(),
          name: data.name,
          score: Math.abs(data.score),
          type: data.type,
          category: data.category || '其他',
          icon: data.icon || '📌',
        };
        set((state) => ({ rules: [...state.rules, newRule] }));
        return newRule;
      },
      
      updateRule: (id, updates) => {
        const rules = get().rules;
        const index = rules.findIndex(r => r.id === id);
        if (index === -1) return null;
        
        const updatedRule = { ...rules[index], ...updates };
        const newRules = [...rules];
        newRules[index] = updatedRule;
        set({ rules: newRules });
        return updatedRule;
      },
      
      deleteRule: (id) => {
        set((state) => ({
          rules: state.rules.filter(r => r.id !== id)
        }));
      },
      
      getRuleById: (id) => {
        return get().rules.find(r => r.id === id);
      },
      
      getRulesByType: (type) => {
        return get().rules.filter(r => r.type === type);
      },
      
      setRules: (rules) => {
        set({ rules });
      },
      
      clearRules: () => {
        set({ rules: [] });
      },
      
      initDefaultRules: () => {
        if (get().rules.length === 0) {
          set({ rules: defaultRules });
        }
      },
    }),
    {
      name: 'classScore_rules',
    }
  )
);
