import { create } from 'zustand';
import { api } from '@/lib/api';
import type { PetSpeciesData, PetStageData, StudentPetData, PetConfigData } from '@/lib/api';

interface PetStore {
  config: PetConfigData | null;
  species: PetSpeciesData[];
  studentPets: StudentPetData[];
  loading: boolean;

  fetchAll: (classId: number) => Promise<void>;
  fetchConfig: (classId: number) => Promise<void>;
  fetchSpecies: (classId: number) => Promise<void>;
  fetchStudentPets: (classId: number) => Promise<void>;

  setConfig: (config: PetConfigData) => void;
  updateConfig: (classId: number, updates: { enabled?: boolean; show_on_student_card?: boolean }) => Promise<void>;

  setSpecies: (species: PetSpeciesData[]) => void;
  addSpecies: (classId: number, data: { name: string; element: string; color?: string; stages: PetStageData[] }) => Promise<PetSpeciesData | null>;
  updateSpecies: (id: number, updates: { name?: string; element?: string; color?: string; stages?: PetStageData[] }) => Promise<PetSpeciesData | null>;
  deleteSpecies: (id: number) => Promise<boolean>;

  setStudentPets: (pets: StudentPetData[]) => void;
  assignPet: (classId: number, studentId: number, speciesId: number, nickname?: string) => Promise<void>;
  removePet: (studentId: number) => Promise<void>;

  getStudentPet: (studentId: number) => StudentPetData | undefined;
  getPetStage: (studentId: number, studentScore: number) => PetStageData | null;
  getPetSpecies: (speciesId: number) => PetSpeciesData | undefined;

  clearAll: () => void;
}

export const usePetStore = create<PetStore>()(
  (set, get) => ({
    config: null,
    species: [],
    studentPets: [],
    loading: false,

    fetchAll: async (classId) => {
      set({ loading: true });
      await Promise.all([
        get().fetchConfig(classId),
        get().fetchSpecies(classId),
        get().fetchStudentPets(classId),
      ]);
      set({ loading: false });
    },

    fetchConfig: async (classId) => {
      const result = await api.getPetConfig(classId);
      if (result.success && result.data) {
        set({ config: result.data });
      }
    },

    fetchSpecies: async (classId) => {
      const result = await api.listPetSpecies(classId);
      if (result.success && result.data) {
        set({ species: result.data });
      }
    },

    fetchStudentPets: async (classId) => {
      const result = await api.listStudentPets(classId);
      if (result.success && result.data) {
        set({ studentPets: result.data });
      }
    },

    setConfig: (config) => set({ config }),

    updateConfig: async (classId, updates) => {
      const result = await api.updatePetConfig(classId, updates);
      if (result.success && result.data) {
        set({ config: result.data });
      }
    },

    setSpecies: (species) => set({ species }),

    addSpecies: async (classId, data) => {
      const result = await api.createPetSpecies(classId, data);
      if (result.success && result.data) {
        set((state) => ({ species: [...state.species, result.data!] }));
        return result.data;
      }
      return null;
    },

    updateSpecies: async (id, updates) => {
      const result = await api.updatePetSpecies(id, updates);
      if (result.success && result.data) {
        const updated = result.data;
        set((state) => ({
          species: state.species.map(s => s.id === id ? updated : s),
        }));
        return updated;
      }
      return null;
    },

    deleteSpecies: async (id) => {
      const result = await api.deletePetSpecies(id);
      if (result.success) {
        set((state) => ({
          species: state.species.filter(s => s.id !== id),
          studentPets: state.studentPets.filter(p => p.species_id !== id),
        }));
        return true;
      }
      return false;
    },

    setStudentPets: (pets) => set({ studentPets: pets }),

    assignPet: async (classId, studentId, speciesId, nickname) => {
      const result = await api.assignPet(classId, { student_id: studentId, species_id: speciesId, nickname });
      if (result.success && result.data) {
        set((state) => {
          const filtered = state.studentPets.filter(p => p.student_id !== studentId);
          return { studentPets: [...filtered, result.data!] };
        });
      }
    },

    removePet: async (studentId) => {
      const result = await api.removeStudentPet(studentId);
      if (result.success) {
        set((state) => ({
          studentPets: state.studentPets.filter(p => p.student_id !== studentId),
        }));
      }
    },

    getStudentPet: (studentId) => get().studentPets.find(p => p.student_id === studentId),

    getPetStage: (studentId, studentScore) => {
      const pet = get().studentPets.find(p => p.student_id === studentId);
      if (!pet) return null;
      const sp = get().species.find(s => s.id === pet.species_id);
      if (!sp || !sp.stages || sp.stages.length === 0) return null;

      let currentStage = sp.stages[0];
      for (const stage of sp.stages) {
        if (studentScore >= stage.min_score) {
          currentStage = stage;
        }
      }
      return currentStage;
    },

    getPetSpecies: (speciesId) => get().species.find(s => s.id === speciesId),

    clearAll: () => set({ studentPets: [], config: null, species: [] }),
  })
);
