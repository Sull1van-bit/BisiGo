import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Language, Theme, User } from '../types';
import { CURRICULUM } from '../curriculum';
import { CURRENT_SCHEMA_VERSION, normalizeAndMigrateState } from '../utils/stateMigration';

interface AppContextType extends AppState {
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  loginAsGuest: () => void;
  loginUser: (name: string, email?: string) => void;
  registerUser: (name: string, email: string) => void;
  logout: () => void;
  completeLevel: (levelId: string) => { xpEarned: number; streakIncremented: boolean };
  recordCharacterPractice: (signClasses: string[], delta?: number) => void;
  getCharacterMastery: (signClass: string) => number;
  resetProgress: () => void;
  t: (idText: string, enText: string) => string;
}

const STORAGE_KEY = 'bisigo_state';

export const DEFAULT_UNLOCKED_LEVELS = ['1.1', '2.1', '3.1', '4.1'];

export const LEVEL_FLOW: Record<string, string> = {
  '1.1': '1.2',
  '1.2': '1.3',
  '1.3': '1.4',
  '2.1': '2.2',
  '2.2': '2.3',
  '2.3': '2.4',
  '3.1': '3.2',
  '3.2': '3.3',
  '3.3': '3.4',
  '4.1': '4.2',
  '4.2': '4.3',
  '4.3': '4.4',
};

const VALID_LEVEL_IDS = new Set(
  CURRICULUM.flatMap(unit => unit.levels.map(level => level.id))
);

const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const getInitialState = (): AppState => {
  const fallbackTheme = getSystemTheme();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      return normalizeAndMigrateState(
        parsed,
        VALID_LEVEL_IDS,
        DEFAULT_UNLOCKED_LEVELS,
        fallbackTheme
      );
    }
  } catch (e) {
    console.error('Failed to parse bisigo_state from localStorage:', e);
  }

  return normalizeAndMigrateState(
    null,
    VALID_LEVEL_IDS,
    DEFAULT_UNLOCKED_LEVELS,
    fallbackTheme
  );
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(getInitialState);

  // Synchronize theme class and browser theme-color with active state
  useEffect(() => {
    const isDark = state.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', isDark ? '#0F172A' : '#1A8CFF');
    }
  }, [state.theme]);

  // Synchronize state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save bisigo_state to localStorage:', e);
    }
  }, [state]);

  const setLanguage = (language: Language) => {
    setState(prev => ({ ...prev, language }));
  };

  const setTheme = (theme: Theme) => {
    setState(prev => ({ ...prev, theme }));
  };

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const loginAsGuest = () => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: state.language === 'en' ? 'Guest Learner' : 'Tamu Belajar',
      isGuest: true,
    };
    setState(prev => ({ ...prev, user: guestUser }));
  };

  const loginUser = (name: string, email?: string) => {
    const existing = state.user;
    const user: User = {
      id: existing?.id || `user_${Date.now()}`,
      name: name.trim() || 'Sahabat BISINDO',
      email: email?.trim(),
      isGuest: false,
    };
    setState(prev => ({ ...prev, user }));
  };

  const registerUser = (name: string, email: string) => {
    // Guest migration: preserves existing streak, xp, unlockedLevels, completedLevels, and characterMastery
    const user: User = {
      id: `user_${Date.now()}`,
      name: name.trim() || 'Sahabat BISINDO',
      email: email.trim(),
      isGuest: false,
    };
    setState(prev => ({ ...prev, user }));
  };

  const logout = () => {
    setState(prev => ({ ...prev, user: null }));
  };

  const completeLevel = (levelId: string): { xpEarned: number; streakIncremented: boolean } => {
    const today = new Date().toISOString().split('T')[0];
    const xpToAdd = 20;
    const streakIncremented = state.lastCompletedDate !== today;

    setState(prev => {
      // Calculate streak
      let newStreak = prev.streak;
      if (prev.lastCompletedDate !== today) {
        if (!prev.lastCompletedDate) {
          newStreak = 1;
        } else {
          const lastDate = new Date(prev.lastCompletedDate);
          const currentDate = new Date(today);
          const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            newStreak = prev.streak + 1;
          } else {
            newStreak = 1;
          }
        }
      }

      // Add to completed
      const newCompleted = prev.completedLevels.includes(levelId)
        ? prev.completedLevels
        : [...prev.completedLevels, levelId];

      // Unlock next level in sequence
      const nextLevelId = LEVEL_FLOW[levelId];
      const newUnlocked = [...prev.unlockedLevels];
      if (nextLevelId && !newUnlocked.includes(nextLevelId)) {
        newUnlocked.push(nextLevelId);
      }

      return {
        ...prev,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        xp: prev.xp + xpToAdd,
        streak: newStreak,
        lastCompletedDate: today,
        completedLevels: newCompleted,
        unlockedLevels: newUnlocked,
      };
    });

    return { xpEarned: xpToAdd, streakIncremented };
  };

  const recordCharacterPractice = (signClasses: string[], delta = 34) => {
    const uniqueClasses = Array.from(
      new Set(signClasses.map(s => s.trim()).filter(Boolean))
    );
    if (uniqueClasses.length === 0) return;

    const safeDelta = Number.isFinite(delta) ? Math.round(delta) : 34;

    setState(prev => {
      const nextMastery = { ...prev.characterMastery };
      for (const signClass of uniqueClasses) {
        const current = nextMastery[signClass] ?? 0;
        nextMastery[signClass] = Math.max(0, Math.min(100, current + safeDelta));
      }
      return {
        ...prev,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        characterMastery: nextMastery,
      };
    });
  };

  const getCharacterMastery = (signClass: string): number => {
    const trimmed = signClass.trim();
    if (!trimmed) return 0;
    const direct = state.characterMastery[trimmed];
    if (typeof direct === 'number') {
      return Math.max(0, Math.min(100, direct));
    }
    const lower = trimmed.toLowerCase();
    for (const [key, val] of Object.entries(state.characterMastery)) {
      if (key.toLowerCase() === lower) {
        return Math.max(0, Math.min(100, val));
      }
    }
    return 0;
  };

  const resetProgress = () => {
    setState(prev => ({
      ...prev,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      streak: 0,
      lastCompletedDate: null,
      xp: 0,
      unlockedLevels: [...DEFAULT_UNLOCKED_LEVELS],
      completedLevels: [],
      characterMastery: {},
    }));
  };

  // Quick translation helper
  const t = (idText: string, enText: string) => {
    return state.language === 'en' ? enText : idText;
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        setLanguage,
        setTheme,
        toggleTheme,
        loginAsGuest,
        loginUser,
        registerUser,
        logout,
        completeLevel,
        recordCharacterPractice,
        getCharacterMastery,
        resetProgress,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
