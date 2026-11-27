import type { AppState, Language, Theme, User } from '../types.ts';

export const CURRENT_SCHEMA_VERSION = 2;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeUser(rawUser: unknown): User | null {
  if (!isPlainObject(rawUser)) return null;
  const id = typeof rawUser.id === 'string' ? rawUser.id.trim() : '';
  const name = typeof rawUser.name === 'string' ? rawUser.name.trim() : '';
  if (!id || !name) return null;

  const email =
    typeof rawUser.email === 'string' && rawUser.email.trim().length > 0
      ? rawUser.email.trim()
      : undefined;

  return {
    id,
    name,
    ...(email ? { email } : {}),
    isGuest: Boolean(rawUser.isGuest),
  };
}

function normalizeCharacterMastery(rawMastery: unknown): Record<string, number> {
  if (!isPlainObject(rawMastery)) return {};
  const mastery: Record<string, number> = {};
  for (const [key, val] of Object.entries(rawMastery)) {
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;
    if (typeof val === 'number' && Number.isFinite(val)) {
      mastery[trimmedKey] = Math.max(0, Math.min(100, Math.round(val)));
    }
  }
  return mastery;
}

export function normalizeAndMigrateState(
  raw: unknown,
  validLevelIds: Set<string>,
  defaultUnlocked: string[],
  fallbackTheme: Theme = 'light'
): AppState {
  const normalizedDefaults = Array.from(new Set(defaultUnlocked));

  const fallbackState: AppState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    user: null,
    language: 'id',
    theme: fallbackTheme,
    streak: 0,
    lastCompletedDate: null,
    xp: 0,
    unlockedLevels: [...normalizedDefaults],
    completedLevels: [],
    characterMastery: {},
  };

  if (!isPlainObject(raw)) {
    return fallbackState;
  }

  const user = normalizeUser(raw.user);
  const language: Language = raw.language === 'en' ? 'en' : 'id';
  const theme: Theme =
    raw.theme === 'dark' || raw.theme === 'light' ? raw.theme : fallbackTheme;
  const streak =
    typeof raw.streak === 'number' && Number.isFinite(raw.streak) && raw.streak >= 0
      ? Math.floor(raw.streak)
      : 0;
  const xp =
    typeof raw.xp === 'number' && Number.isFinite(raw.xp) && raw.xp >= 0
      ? Math.floor(raw.xp)
      : 0;
  const lastCompletedDate =
    typeof raw.lastCompletedDate === 'string' && raw.lastCompletedDate.trim().length > 0
      ? raw.lastCompletedDate
      : null;

  if (raw.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    // Legacy 3-unit state migration: preserve profile/XP/streak/preferences,
    // clear stale completedLevels so new 4-unit levels aren't falsely marked done,
    // and ensure starter levels for all 4 units are unlocked.
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      user,
      language,
      theme,
      streak,
      lastCompletedDate,
      xp,
      unlockedLevels: [...normalizedDefaults],
      completedLevels: [],
      characterMastery: {},
    };
  }

  const completedLevels = Array.isArray(raw.completedLevels)
    ? Array.from(
        new Set(
          raw.completedLevels.filter(
            (id): id is string => typeof id === 'string' && validLevelIds.has(id)
          )
        )
      )
    : [];

  const savedUnlocked = Array.isArray(raw.unlockedLevels)
    ? raw.unlockedLevels.filter(
        (id): id is string => typeof id === 'string' && validLevelIds.has(id)
      )
    : [];

  const unlockedLevels = Array.from(new Set([...normalizedDefaults, ...savedUnlocked]));

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    user,
    language,
    theme,
    streak,
    lastCompletedDate,
    xp,
    unlockedLevels,
    completedLevels,
    characterMastery: normalizeCharacterMastery(raw.characterMastery),
  };
}
