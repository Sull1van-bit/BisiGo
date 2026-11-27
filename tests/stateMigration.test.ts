import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM } from '../src/curriculum.ts';
import { CURRENT_SCHEMA_VERSION, normalizeAndMigrateState } from '../src/utils/stateMigration.ts';

const VALID_LEVEL_IDS = new Set(
  CURRICULUM.flatMap(unit => unit.levels.map(level => level.id))
);
const DEFAULT_UNLOCKED = ['1.1', '2.1', '3.1', '4.1'];

test('migrates legacy 3-unit bisigo_state safely without stale completedLevels', () => {
  const legacySaved = {
    user: { id: 'user_123', name: 'Ayu', email: 'ayu@example.com', isGuest: false },
    language: 'en',
    theme: 'dark',
    streak: 5,
    lastCompletedDate: '2026-11-25',
    xp: 140,
    unlockedLevels: ['1.1', '1.2', '1.3', '1.4', '2.1', '3.1', '3.6'],
    completedLevels: ['1.1', '1.2', '1.4', '3.6'],
  };

  const migrated = normalizeAndMigrateState(legacySaved, VALID_LEVEL_IDS, DEFAULT_UNLOCKED);

  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.deepEqual(migrated.user, legacySaved.user);
  assert.equal(migrated.language, 'en');
  assert.equal(migrated.theme, 'dark');
  assert.equal(migrated.streak, 5);
  assert.equal(migrated.lastCompletedDate, '2026-11-25');
  assert.equal(migrated.xp, 140);
  assert.deepEqual(migrated.unlockedLevels, ['1.1', '2.1', '3.1', '4.1']);
  assert.deepEqual(migrated.completedLevels, []);
  assert.deepEqual(migrated.characterMastery, {});
});

test('preserves valid schema v2 state and clamps characterMastery', () => {
  const v2Saved = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    user: { id: 'guest_1', name: 'Guest Learner', isGuest: true },
    language: 'id',
    theme: 'light',
    streak: 2,
    lastCompletedDate: '2026-11-26',
    xp: 60,
    unlockedLevels: ['1.1', '1.2', '9.9'],
    completedLevels: ['1.1', 'invalid-lvl'],
    characterMastery: {
      A: 68,
      B: 150,
      Nol: -10,
      C: 'not-a-number',
    },
  };

  const normalized = normalizeAndMigrateState(v2Saved, VALID_LEVEL_IDS, DEFAULT_UNLOCKED);

  assert.equal(normalized.schemaVersion, 2);
  assert.deepEqual(normalized.unlockedLevels, ['1.1', '2.1', '3.1', '4.1', '1.2']);
  assert.deepEqual(normalized.completedLevels, ['1.1']);
  assert.deepEqual(normalized.characterMastery, {
    A: 68,
    B: 100,
    Nol: 0,
  });
});

test('handles null, primitive, array, and corrupted object inputs without throwing', () => {
  for (const corrupted of [null, undefined, 'bad-json-value', 123, ['1.1']]) {
    const state = normalizeAndMigrateState(corrupted, VALID_LEVEL_IDS, DEFAULT_UNLOCKED, 'dark');
    assert.equal(state.schemaVersion, CURRENT_SCHEMA_VERSION);
    assert.equal(state.user, null);
    assert.equal(state.theme, 'dark');
    assert.equal(state.language, 'id');
    assert.deepEqual(state.unlockedLevels, DEFAULT_UNLOCKED);
    assert.deepEqual(state.completedLevels, []);
    assert.deepEqual(state.characterMastery, {});
  }

  const partialCorrupted = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    user: { id: 123, name: '' },
    language: 'fr',
    theme: 'neon',
    streak: -4,
    xp: Number.NaN,
    lastCompletedDate: 999,
    unlockedLevels: '1.1',
    completedLevels: [123, null],
    characterMastery: ['A', 'B'],
  };

  const recovered = normalizeAndMigrateState(
    partialCorrupted,
    VALID_LEVEL_IDS,
    DEFAULT_UNLOCKED,
    'light'
  );
  assert.equal(recovered.user, null);
  assert.equal(recovered.language, 'id');
  assert.equal(recovered.theme, 'light');
  assert.equal(recovered.streak, 0);
  assert.equal(recovered.xp, 0);
  assert.equal(recovered.lastCompletedDate, null);
  assert.deepEqual(recovered.unlockedLevels, DEFAULT_UNLOCKED);
  assert.deepEqual(recovered.completedLevels, []);
  assert.deepEqual(recovered.characterMastery, {});
});
