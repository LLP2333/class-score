export type {
  ClassData as Class,
  StudentData as Student,
  GroupData as Group,
  RuleData as Rule,
  RecordData as ScoreRecord,
  ProductData as Product,
  ExchangeData as Exchange,
  PetSpeciesData as PetSpecies,
  PetStageData as PetStage,
  StudentPetData as StudentPet,
  PetConfigData as PetConfig,
  ClassSettingsData as ClassSettings,
  RollCallData as RollCallRecord,
  LoginData,
  MigrateResult,
} from '@/lib/api';

export type UserRole = 'teacher' | 'student';

export interface Statistics {
  studentCount: number;
  groupCount: number;
  maxScore: number;
  avgScore: number;
  totalRecords: number;
}

export interface WeeklyTrend {
  label: string;
  value: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
}
