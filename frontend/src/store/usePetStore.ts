import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PetSpecies, PetStage, StudentPet, PetConfig } from '@/types';
import { generateId } from '@/lib/utils';

const DEFAULT_THRESHOLDS = [0, 20, 50, 100, 200];

const DEFAULT_SPECIES: PetSpecies[] = [
  {
    id: 'fire_dragon',
    name: '炎龙',
    element: 'fire',
    stages: [
      { level: 0, name: '神秘火蛋', emoji: '🥚', minScore: 0, description: '一颗散发着温暖光芒的蛋' },
      { level: 1, name: '小火苗', emoji: '🔥', minScore: 20, description: '刚孵化的小火精灵，尾巴上跳动着小火苗' },
      { level: 2, name: '烈焰兽', emoji: '🦎', minScore: 50, description: '充满活力的火焰蜥蜴，开始展现力量' },
      { level: 3, name: '炎翼龙', emoji: '🐉', minScore: 100, description: '展开火焰双翼的飞龙，威风凛凛' },
      { level: 4, name: '焚天神龙', emoji: '🌋', minScore: 200, description: '传说中的焚天神龙，炽热的烈焰可以融化一切' },
    ],
  },
  {
    id: 'water_spirit',
    name: '水灵',
    element: 'water',
    stages: [
      { level: 0, name: '神秘水蛋', emoji: '🥚', minScore: 0, description: '一颗闪烁着蓝色光芒的蛋' },
      { level: 1, name: '水滴精灵', emoji: '💧', minScore: 20, description: '可爱的水滴精灵，圆滚滚的' },
      { level: 2, name: '海豚宝宝', emoji: '🐬', minScore: 50, description: '优雅的海豚，在水中自由穿梭' },
      { level: 3, name: '蛟龙', emoji: '🐋', minScore: 100, description: '强大的海中蛟龙，掀起巨浪' },
      { level: 4, name: '沧海龙王', emoji: '🌊', minScore: 200, description: '统治四海的龙王，拥有无尽的力量' },
    ],
  },
  {
    id: 'grass_fairy',
    name: '草精灵',
    element: 'grass',
    stages: [
      { level: 0, name: '神秘种子', emoji: '🥚', minScore: 0, description: '一颗散发着绿色生机的种子' },
      { level: 1, name: '嫩芽精灵', emoji: '🌱', minScore: 20, description: '破土而出的小嫩芽，生机勃勃' },
      { level: 2, name: '花精灵', emoji: '🌸', minScore: 50, description: '美丽的花精灵，散发着芳香' },
      { level: 3, name: '森林守护者', emoji: '🌳', minScore: 100, description: '古老的森林守护者，与自然融为一体' },
      { level: 4, name: '世界之树', emoji: '🌍', minScore: 200, description: '传说中的世界之树，孕育万物生灵' },
    ],
  },
  {
    id: 'electric_beast',
    name: '雷兽',
    element: 'electric',
    stages: [
      { level: 0, name: '神秘雷蛋', emoji: '🥚', minScore: 0, description: '一颗闪烁着电光的蛋' },
      { level: 1, name: '电火花', emoji: '⚡', minScore: 20, description: '噼里啪啦的小电火花' },
      { level: 2, name: '雷猫', emoji: '🐱', minScore: 50, description: '浑身带电的小猫咪，毛发竖起' },
      { level: 3, name: '雷神兽', emoji: '🐯', minScore: 100, description: '威猛的雷神兽，掌控雷电之力' },
      { level: 4, name: '万雷天神', emoji: '🌩️', minScore: 200, description: '天空中的万雷天神，无人能敌' },
    ],
  },
  {
    id: 'ice_phoenix',
    name: '冰凰',
    element: 'ice',
    stages: [
      { level: 0, name: '神秘冰蛋', emoji: '🥚', minScore: 0, description: '一颗晶莹剔透的冰蛋' },
      { level: 1, name: '雪花精灵', emoji: '❄️', minScore: 20, description: '漂浮的小雪花，闪闪发光' },
      { level: 2, name: '冰鸟', emoji: '🐦', minScore: 50, description: '翅膀如冰晶般透明的小鸟' },
      { level: 3, name: '霜翼凤凰', emoji: '🦅', minScore: 100, description: '高贵的霜翼凤凰，寒气逼人' },
      { level: 4, name: '极光冰凰', emoji: '✨', minScore: 200, description: '传说中的极光冰凰，带来绚烂极光' },
    ],
  },
  {
    id: 'dragon_ancient',
    name: '远古龙',
    element: 'dragon',
    stages: [
      { level: 0, name: '远古龙蛋', emoji: '🥚', minScore: 0, description: '一颗蕴含远古力量的龙蛋' },
      { level: 1, name: '小龙崽', emoji: '🐣', minScore: 20, description: '刚破壳的小龙崽，懵懂可爱' },
      { level: 2, name: '翼龙', emoji: '🦕', minScore: 50, description: '学会飞翔的翼龙，展翅翱翔' },
      { level: 3, name: '暗影龙', emoji: '🐲', minScore: 100, description: '威严的暗影龙，令人敬畏' },
      { level: 4, name: '创世神龙', emoji: '🌟', minScore: 200, description: '创世神龙，拥有改变世界的力量' },
    ],
  },
];

interface PetStore {
  config: PetConfig;
  species: PetSpecies[];
  studentPets: StudentPet[];

  setConfig: (config: Partial<PetConfig>) => void;
  setSpecies: (species: PetSpecies[]) => void;
  setStudentPets: (pets: StudentPet[]) => void;

  assignPet: (studentId: string, speciesId: string, nickname?: string) => void;
  removePet: (studentId: string) => void;
  updatePetNickname: (studentId: string, nickname: string) => void;
  getStudentPet: (studentId: string) => StudentPet | undefined;
  getPetStage: (studentId: string, studentScore: number) => PetStage | null;
  getPetSpecies: (speciesId: string) => PetSpecies | undefined;

  updateSpeciesStageThreshold: (speciesId: string, level: number, minScore: number) => void;
  updateAllThresholds: (thresholds: number[]) => void;

  initDefaultSpecies: () => void;
  clearAll: () => void;
}

export const usePetStore = create<PetStore>()(
  persist(
    (set, get) => ({
      config: {
        enabled: true,
        showOnStudentCard: true,
        evolutionThresholds: DEFAULT_THRESHOLDS,
      },
      species: DEFAULT_SPECIES,
      studentPets: [],

      setConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates },
        }));
      },

      setSpecies: (species) => set({ species }),
      setStudentPets: (pets) => set({ studentPets: pets }),

      assignPet: (studentId, speciesId, nickname) => {
        const existing = get().studentPets.find((p) => p.studentId === studentId);
        if (existing) {
          set((state) => ({
            studentPets: state.studentPets.map((p) =>
              p.studentId === studentId
                ? { ...p, speciesId, nickname: nickname || p.nickname }
                : p
            ),
          }));
        } else {
          const species = get().species.find((s) => s.id === speciesId);
          const pet: StudentPet = {
            studentId,
            speciesId,
            nickname: nickname || species?.name || '我的宠物',
            assignedAt: new Date().toISOString(),
          };
          set((state) => ({
            studentPets: [...state.studentPets, pet],
          }));
        }
      },

      removePet: (studentId) => {
        set((state) => ({
          studentPets: state.studentPets.filter((p) => p.studentId !== studentId),
        }));
      },

      updatePetNickname: (studentId, nickname) => {
        set((state) => ({
          studentPets: state.studentPets.map((p) =>
            p.studentId === studentId ? { ...p, nickname } : p
          ),
        }));
      },

      getStudentPet: (studentId) => {
        return get().studentPets.find((p) => p.studentId === studentId);
      },

      getPetStage: (studentId, studentScore) => {
        const pet = get().studentPets.find((p) => p.studentId === studentId);
        if (!pet) return null;

        const species = get().species.find((s) => s.id === pet.speciesId);
        if (!species) return null;

        let currentStage = species.stages[0];
        for (const stage of species.stages) {
          if (studentScore >= stage.minScore) {
            currentStage = stage;
          }
        }
        return currentStage;
      },

      getPetSpecies: (speciesId) => {
        return get().species.find((s) => s.id === speciesId);
      },

      updateSpeciesStageThreshold: (speciesId, level, minScore) => {
        set((state) => ({
          species: state.species.map((s) =>
            s.id === speciesId
              ? {
                  ...s,
                  stages: s.stages.map((st) =>
                    st.level === level ? { ...st, minScore } : st
                  ),
                }
              : s
          ),
        }));
      },

      updateAllThresholds: (thresholds) => {
        set((state) => ({
          config: { ...state.config, evolutionThresholds: thresholds },
          species: state.species.map((s) => ({
            ...s,
            stages: s.stages.map((st, i) => ({
              ...st,
              minScore: thresholds[i] ?? st.minScore,
            })),
          })),
        }));
      },

      initDefaultSpecies: () => {
        const { species } = get();
        if (species.length === 0) {
          set({ species: DEFAULT_SPECIES });
        }
      },

      clearAll: () => {
        set({
          studentPets: [],
          config: {
            enabled: true,
            showOnStudentCard: true,
            evolutionThresholds: DEFAULT_THRESHOLDS,
          },
        });
      },
    }),
    {
      name: 'classScore_pets',
    }
  )
);
