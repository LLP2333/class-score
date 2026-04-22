const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

let _token: string | null = null;

export function setApiToken(token: string | null) {
  _token = token;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<APIResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (_token) {
      headers['Authorization'] = `Bearer ${_token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (data.success) {
      return { success: true, data: data.data, message: data.message };
    }

    return { success: false, error: data.error || '请求失败' };
  } catch {
    return { success: false, error: '网络错误' };
  }
}

function get<T>(url: string) {
  return request<T>(url);
}

function post<T>(url: string, body?: unknown) {
  return request<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

function put<T>(url: string, body?: unknown) {
  return request<T>(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

function del<T>(url: string) {
  return request<T>(url, { method: 'DELETE' });
}

// ---- Auth ----

export interface LoginData {
  token: string;
  username: string;
  role: string;
  classes?: ClassData[];
  class_id?: number;
  student_id?: number;
  has_legacy_data?: boolean;
}

export interface ClassData {
  id: number;
  name: string;
  teacher_name: string;
  teacher_id: number;
  created_at: string;
}

export interface StudentData {
  id: number;
  name: string;
  avatar: number;
  class_id: number;
  group_id: number | null;
  user_id?: number;
  username?: string;
  total_score: number;
  created_at: string;
}

export interface GroupData {
  id: number;
  name: string;
  color: number;
  leader_id: number | null;
  class_id: number;
  created_at: string;
}

export interface RuleData {
  id: number;
  name: string;
  score: number;
  type: 'add' | 'minus';
  category: string;
  icon: string;
  class_id: number;
}

export interface RecordData {
  id: number;
  student_id: number;
  group_id: number | null;
  rule_id: number | null;
  score: number;
  reason: string;
  created_at: string;
}

export interface ProductData {
  id: number;
  name: string;
  price: number;
  stock: number;
  icon: string;
  exchange_count: number;
  class_id: number;
}

export interface ExchangeData {
  id: number;
  student_id: number;
  product_id: number;
  product_name: string;
  price: number;
  created_at: string;
}

export interface PetStageData {
  id: number;
  species_id: number;
  level: number;
  name: string;
  emoji: string;
  image?: string;
  min_score: number;
  description: string;
}

export interface PetSpeciesData {
  id: number;
  name: string;
  element: string;
  color?: string;
  class_id: number;
  stages: PetStageData[];
}

export interface StudentPetData {
  id: number;
  student_id: number;
  species_id: number;
  nickname: string;
  assigned_at: string;
}

export interface PetConfigData {
  id: number;
  class_id: number;
  enabled: boolean;
  show_on_student_card: boolean;
}

export interface ClassSettingsData {
  id: number;
  class_id: number;
  theme: string;
  animation_speed: string;
  sound_enabled: boolean;
}

export interface RollCallData {
  id: number;
  class_id: number;
  student_names: string[];
  created_at: string;
}

export interface MigrateResult {
  class_id: number;
  student_count: number;
  group_count: number;
  rule_count: number;
  record_count: number;
  product_count: number;
  exchange_count: number;
  pet_species_count: number;
  student_accounts: Record<string, string>;
}

export const api = {
  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (response.ok) {
        const data = await response.json();
        return data.success === true;
      }
      return false;
    } catch {
      return false;
    }
  },

  register: (username: string, password: string) =>
    post<LoginData>('/api/register', { username, password }),

  login: (username: string, password: string) =>
    post<LoginData>('/api/login', { username, password }),

  changePassword: (oldPassword: string, newPassword: string) =>
    post<null>('/api/change-password', { oldPassword, newPassword }),

  // Classes
  listClasses: () => get<ClassData[]>('/api/classes'),
  createClass: (name: string, teacher_name: string) =>
    post<ClassData>('/api/classes', { name, teacher_name }),
  getClass: (id: number) => get<ClassData>(`/api/classes/${id}`),
  updateClass: (id: number, data: { name?: string; teacher_name?: string }) =>
    put<ClassData>(`/api/classes/${id}`, data),
  deleteClass: (id: number) => del<null>(`/api/classes/${id}`),

  // Students
  listStudents: (classId: number) => get<StudentData[]>(`/api/classes/${classId}/students`),
  createStudent: (classId: number, data: { name: string; avatar?: number; group_id?: number | null; password?: string }) =>
    post<StudentData>(`/api/classes/${classId}/students`, data),
  updateStudent: (id: number, data: { name?: string; avatar?: number; group_id?: number | null }) =>
    put<StudentData>(`/api/students/${id}`, data),
  deleteStudent: (id: number) => del<null>(`/api/students/${id}`),
  resetStudentPassword: (id: number, newPassword: string) =>
    post<null>(`/api/students/${id}/reset-password`, { newPassword }),

  // Groups
  listGroups: (classId: number) => get<GroupData[]>(`/api/classes/${classId}/groups`),
  createGroup: (classId: number, data: { name: string; color?: number; leader_id?: number | null }) =>
    post<GroupData>(`/api/classes/${classId}/groups`, data),
  updateGroup: (id: number, data: { name?: string; color?: number; leader_id?: number | null }) =>
    put<GroupData>(`/api/groups/${id}`, data),
  deleteGroup: (id: number) => del<null>(`/api/groups/${id}`),

  // Rules
  listRules: (classId: number) => get<RuleData[]>(`/api/classes/${classId}/rules`),
  createRule: (classId: number, data: { name: string; score: number; type: string; category?: string; icon?: string }) =>
    post<RuleData>(`/api/classes/${classId}/rules`, data),
  updateRule: (id: number, data: { name?: string; score?: number; type?: string; category?: string; icon?: string }) =>
    put<RuleData>(`/api/rules/${id}`, data),
  deleteRule: (id: number) => del<null>(`/api/rules/${id}`),

  // Records
  listRecords: (classId: number, limit?: number) =>
    get<RecordData[]>(`/api/classes/${classId}/records${limit ? `?limit=${limit}` : ''}`),
  createRecord: (classId: number, data: { student_id: number; group_id?: number | null; rule_id?: number | null; score: number; reason?: string }) =>
    post<RecordData>(`/api/classes/${classId}/records`, data),
  updateRecord: (id: number, data: { score?: number; reason?: string; rule_id?: number | null }) =>
    put<RecordData>(`/api/records/${id}`, data),
  deleteRecord: (id: number) => del<null>(`/api/records/${id}`),

  // Products
  listProducts: (classId: number) => get<ProductData[]>(`/api/classes/${classId}/products`),
  createProduct: (classId: number, data: { name: string; price: number; stock?: number; icon?: string }) =>
    post<ProductData>(`/api/classes/${classId}/products`, data),
  updateProduct: (id: number, data: { name?: string; price?: number; stock?: number; icon?: string }) =>
    put<ProductData>(`/api/products/${id}`, data),
  deleteProduct: (id: number) => del<null>(`/api/products/${id}`),

  // Exchanges
  listExchanges: (classId: number) => get<ExchangeData[]>(`/api/classes/${classId}/exchanges`),
  createExchange: (classId: number, data: { student_id: number; product_id: number }) =>
    post<ExchangeData>(`/api/classes/${classId}/exchanges`, data),

  // Pet Species
  listPetSpecies: (classId: number) => get<PetSpeciesData[]>(`/api/classes/${classId}/pet-species`),
  createPetSpecies: (classId: number, data: { name: string; element: string; color?: string; stages: PetStageData[] }) =>
    post<PetSpeciesData>(`/api/classes/${classId}/pet-species`, data),
  updatePetSpecies: (id: number, data: { name?: string; element?: string; color?: string; stages?: PetStageData[] }) =>
    put<PetSpeciesData>(`/api/pet-species/${id}`, data),
  deletePetSpecies: (id: number) => del<null>(`/api/pet-species/${id}`),

  // Student Pets
  listStudentPets: (classId: number) => get<StudentPetData[]>(`/api/classes/${classId}/student-pets`),
  assignPet: (classId: number, data: { student_id: number; species_id: number; nickname?: string }) =>
    post<StudentPetData>(`/api/classes/${classId}/student-pets`, data),
  removeStudentPet: (studentId: number) => del<null>(`/api/student-pets/${studentId}`),

  // Pet Config
  getPetConfig: (classId: number) => get<PetConfigData>(`/api/classes/${classId}/pet-config`),
  updatePetConfig: (classId: number, data: { enabled?: boolean; show_on_student_card?: boolean }) =>
    put<PetConfigData>(`/api/classes/${classId}/pet-config`, data),

  // Settings
  getSettings: (classId: number) => get<ClassSettingsData>(`/api/classes/${classId}/settings`),
  updateSettings: (classId: number, data: { theme?: string; animation_speed?: string; sound_enabled?: boolean }) =>
    put<ClassSettingsData>(`/api/classes/${classId}/settings`, data),

  // Roll calls
  listRollCalls: (classId: number) => get<RollCallData[]>(`/api/classes/${classId}/roll-calls`),
  createRollCall: (classId: number, studentNames: string[]) =>
    post<RollCallData>(`/api/classes/${classId}/roll-calls`, { student_names: studentNames }),

  // Student profile
  getStudentProfile: () => get<{ student: StudentData; class: ClassData }>('/api/student/profile'),

  // Migration
  checkLegacyData: () => get<{ has_legacy_data: boolean }>('/api/migrate/check'),
  migrateLegacy: () => post<MigrateResult>('/api/migrate/legacy'),
  migrateImport: (data: unknown) => post<MigrateResult>('/api/migrate/import', data),
};
