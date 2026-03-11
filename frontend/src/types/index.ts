// Student type
export interface Student {
  id: string;
  name: string;
  avatar: number; // 1-8
  groupId: string | null;
  totalScore: number;
  createdAt: string;
}

// Group type
export interface Group {
  id: string;
  name: string;
  color: number; // 1-8
  leaderId: string | null;
  createdAt: string;
}

// Rule type
export interface Rule {
  id: string;
  name: string;
  score: number;
  type: 'add' | 'minus';
  category: string;
  icon: string;
}

// Score record type
export interface ScoreRecord {
  id: string;
  studentId: string;
  groupId: string | null;
  ruleId: string | null;
  score: number;
  reason: string;
  createdAt: string;
}

// Product type (for shop)
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  icon: string;
  exchangeCount: number;
}

// Exchange record type
export interface Exchange {
  id: string;
  studentId: string;
  productId: string;
  productName: string;
  price: number;
  createdAt: string;
}

// Roll call history type
export interface RollCallRecord {
  id: string;
  students: string[]; // student names
  createdAt: string;
}

// Class info type
export interface ClassInfo {
  name: string;
  teacher: string;
  createdAt: string;
}

// Settings type
export interface Settings {
  theme: 'light' | 'dark';
  animationSpeed: 'slow' | 'normal' | 'fast';
  soundEnabled: boolean;
}

// Statistics type
export interface Statistics {
  studentCount: number;
  groupCount: number;
  maxScore: number;
  avgScore: number;
  totalRecords: number;
}

// Weekly trend data
export interface WeeklyTrend {
  label: string;
  value: number;
}

// Category distribution data
export interface CategoryDistribution {
  name: string;
  value: number;
}

// Backend user type
export interface BackendUser {
  username: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  has_data?: boolean;
}

export interface RegisterResponse {
  token: string;
  username: string;
}

export interface SyncMetaResponse {
  version: number;
  last_modified_at: string;
}

export interface SyncUploadResponse {
  version: number;
  last_modified_at: string;
}

// Export data type (for backup/sync)
export interface ExportData {
  version: string;
  exportedAt: string;
  classInfo: ClassInfo;
  students: Student[];
  groups: Group[];
  rules: Rule[];
  products: Product[];
  scoreRecords: ScoreRecord[];
  exchanges: Exchange[];
  rollCallHistory: RollCallRecord[];
  settings: Settings;
}
