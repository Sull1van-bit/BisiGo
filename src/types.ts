export type Language = 'id' | 'en';
export type Theme = 'light' | 'dark';
export type ThemeMode = Theme;

export interface User {
  id: string;
  name: string;
  email?: string;
  isGuest: boolean;
}

export interface AppState {
  schemaVersion?: number;
  user: User | null;
  language: Language;
  theme: Theme;
  streak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  xp: number;
  unlockedLevels: string[];
  completedLevels: string[];
  characterMastery: Record<string, number>;
}

export type PatuliModelCategory = 'angka' | 'kata' | 'abjad';

export interface SignData {
  roboflowClass: string;
  modelCategory: PatuliModelCategory;
  wordId: string;
  wordEn: string;
  hintId: string;
  hintEn: string;
  unitId: string;
  scenarioId?: string;
  scenarioEn?: string;
}

export interface SentenceData {
  id: string;
  signs: string[];
  meaningId: string;
  meaningEn: string;
  hintId?: string;
  hintEn?: string;
}

export interface LevelData {
  id: string;
  title: { id: string; en: string };
  isUnitReview?: boolean;
  signs: SignData[];
  sentences?: SentenceData[];
}

export interface UnitData {
  id: string;
  modelCategory: PatuliModelCategory;
  theme: 'emerald' | 'blue' | 'gold' | 'violet' | 'teal';
  title: { id: string; en: string };
  description: { id: string; en: string };
  levels: LevelData[];
}

export type ExerciseType = 'study' | 'quiz' | 'camera' | 'word-bank' | 'chained-camera';

export interface ExerciseStep {
  id?: string;
  type: ExerciseType;
  sign: SignData;
  sentence?: SentenceData;
  sentenceSigns?: SignData[];
  wordBankOptions?: string[];
  questionId?: string;
  questionEn?: string;
  options?: string[]; // IDs or words
  correctOptionIndex?: number;
}

export interface RoboflowPrediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id?: number;
  detection_id?: string;
}

export interface RoboflowResponse {
  inference_id?: string;
  time?: number;
  image?: {
    width: number;
    height: number;
  };
  predictions?: RoboflowPrediction[];
  error?: string;
  message?: string;
}
