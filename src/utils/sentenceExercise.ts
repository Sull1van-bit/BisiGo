import type { RoboflowPrediction } from '../types.ts';

export const DEFAULT_CHAINED_CONFIDENCE_THRESHOLD = 0.38;

export interface ChainedCameraState {
  expectedSigns: string[];
  activeSlotIndex: number;
  completedSlots: boolean[];
  completed: boolean;
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]+/g, ' ');
}

function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(items: T[], rand: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function gradeWordBankSelection(
  selectedSigns: string[],
  expectedSigns: string[]
): boolean {
  if (expectedSigns.length === 0 || selectedSigns.length !== expectedSigns.length) {
    return false;
  }
  for (let i = 0; i < expectedSigns.length; i++) {
    if (selectedSigns[i].trim() !== expectedSigns[i].trim()) {
      return false;
    }
  }
  return true;
}

export function buildWordBankOptions(
  expectedSigns: string[],
  distractorPool: string[],
  seed?: number
): string[] {
  const rand = typeof seed === 'number' && Number.isFinite(seed) ? createPrng(seed) : Math.random;

  const expectedNormalized = new Set(expectedSigns.map(normalizeLabel));
  const seenDistractors = new Set<string>();
  const uniqueDistractors: string[] = [];

  for (const candidate of distractorPool) {
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    const norm = normalizeLabel(trimmed);
    if (expectedNormalized.has(norm) || seenDistractors.has(norm)) {
      continue;
    }
    seenDistractors.add(norm);
    uniqueDistractors.push(trimmed);
  }

  const desiredDistractorCount = expectedSigns.length <= 2 ? 4 : 3;
  const distractorCount = Math.min(
    Math.max(2, desiredDistractorCount),
    uniqueDistractors.length
  );

  const chosenDistractors = shuffleArray(uniqueDistractors, rand).slice(0, distractorCount);
  const combined = [...expectedSigns, ...chosenDistractors];

  return shuffleArray(combined, rand);
}

export function createChainedCameraState(expectedSigns: string[]): ChainedCameraState {
  const signs = [...expectedSigns];
  return {
    expectedSigns: signs,
    activeSlotIndex: 0,
    completedSlots: signs.map(() => false),
    completed: signs.length === 0,
  };
}

export function advanceChainedCamera(
  state: ChainedCameraState,
  predictions: RoboflowPrediction[],
  threshold = DEFAULT_CHAINED_CONFIDENCE_THRESHOLD
): { state: ChainedCameraState; advanced: boolean; matchedSign?: string } {
  if (state.completed || state.activeSlotIndex >= state.expectedSigns.length) {
    return { state, advanced: false };
  }

  const expectedSign = state.expectedSigns[state.activeSlotIndex];
  const expectedNorm = normalizeLabel(expectedSign);

  const qualifiedMatch = predictions
    .filter(
      pred =>
        normalizeLabel(pred.class) === expectedNorm &&
        Number.isFinite(pred.confidence) &&
        pred.confidence >= threshold
    )
    .sort((a, b) => b.confidence - a.confidence)[0];

  if (!qualifiedMatch) {
    return { state, advanced: false };
  }

  const nextState = advanceChainedCameraSlot(state);
  return {
    state: nextState,
    advanced: true,
    matchedSign: expectedSign,
  };
}

export function advanceChainedCameraSlot(state: ChainedCameraState): ChainedCameraState {
  if (state.completed || state.activeSlotIndex >= state.expectedSigns.length) {
    return state;
  }

  const nextCompletedSlots = state.completedSlots.map((done, idx) =>
    idx === state.activeSlotIndex ? true : done
  );
  const nextActiveIndex = state.activeSlotIndex + 1;
  const completed = nextActiveIndex >= state.expectedSigns.length;

  return {
    expectedSigns: [...state.expectedSigns],
    activeSlotIndex: nextActiveIndex,
    completedSlots: nextCompletedSlots,
    completed,
  };
}
