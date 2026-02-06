import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Group } from '@/types';
import { generateId } from '@/lib/utils';

interface GroupStore {
  groups: Group[];
  
  // Actions
  addGroup: (data: Omit<Group, 'id' | 'createdAt'>) => Group;
  updateGroup: (id: string, updates: Partial<Group>) => Group | null;
  deleteGroup: (id: string) => void;
  getGroupById: (id: string) => Group | undefined;
  setGroups: (groups: Group[]) => void;
  clearGroups: () => void;
}

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: [],
      
      addGroup: (data) => {
        const groups = get().groups;
        const existingColors = groups.map(g => g.color);
        let color = data.color || 1;
        while (existingColors.includes(color) && color <= 8) {
          color++;
        }
        
        const newGroup: Group = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          name: data.name,
          color: color,
          leaderId: data.leaderId || null,
        };
        set((state) => ({ groups: [...state.groups, newGroup] }));
        return newGroup;
      },
      
      updateGroup: (id, updates) => {
        const groups = get().groups;
        const index = groups.findIndex(g => g.id === id);
        if (index === -1) return null;
        
        const updatedGroup = { ...groups[index], ...updates };
        const newGroups = [...groups];
        newGroups[index] = updatedGroup;
        set({ groups: newGroups });
        return updatedGroup;
      },
      
      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter(g => g.id !== id)
        }));
      },
      
      getGroupById: (id) => {
        return get().groups.find(g => g.id === id);
      },
      
      setGroups: (groups) => {
        set({ groups });
      },
      
      clearGroups: () => {
        set({ groups: [] });
      },
    }),
    {
      name: 'classScore_groups',
    }
  )
);
