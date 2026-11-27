// shortcut: procedural Web Audio synth instead of sampled audio assets, upgrade to compressed .ogg/.mp3 stems if custom studio recordings are added

export type AudioBusName = 'master' | 'music' | 'sfx';
export type SfxKind =
  | 'click'
  | 'select'
  | 'step'
  | 'slotMatch'
  | 'correct'
  | 'cameraSuccess'
  | 'wrong'
  | 'complete';
export type AdaptiveMusicMode = 'off' | 'study' | 'camera';

export interface AudioSettings {
  master: number; // 0..1 slider
  music: number;  // 0..1 slider
  sfx: number;    // 0..1 slider
  muted: boolean;
}

const AUDIO_STORAGE_KEY = 'bisigo_audio';
export const MUSIC_BPM = 100;
export const SECONDS_PER_BEAT = 60 / MUSIC_BPM;
const MIN_DB = -60;

const DEFAULT_SETTINGS: AudioSettings = {
  master: 0.85,
  music: 0.55,
  sfx: 0.85,
  muted: false,
};

export function dbToLinear(db: number): number {
  if (db <= MIN_DB || !Number.isFinite(db)) return 0;
  return Math.pow(10, db / 20);
}

export function linearToDb(linear: number): number {
  if (linear <= 0.001 || !Number.isFinite(linear)) return MIN_DB;
  return Math.max(MIN_DB, 20 * Math.log10(linear));
}

/**
 * Maps a 0..1 UI slider to linear bus gain.
 * Squares the normalized slider so perceived loudness changes evenly across the travel,
 * with true silence (0) at <= 0.
 */
export function sliderToGain(slider01: number): number {
  if (!Number.isFinite(slider01) || slider01 <= 0) return 0;
  const clamped = Math.min(1, Math.max(0, slider01));
  return clamped * clamped;
}

export function timeUntilNextBeat(songTimeSec: number, bpm = MUSIC_BPM): number {
  const spb = 60 / bpm;
  const safeTime = Math.max(0, songTimeSec);
  const rem = safeTime % spb;
  return rem === 0 ? 0 : spb - rem;
}

export function pickVariation(
  poolSize: number,
  lastIndex: number,
  semitoneSpread = 1.0,
  dbSpread = 1.5,
  randPool = Math.random(),
  randPitch = Math.random(),
  randDb = Math.random()
): { index: number; pitchMultiplier: number; gainMultiplier: number } {
  let index = 0;
  if (poolSize > 1) {
    const candidate = Math.floor(randPool * poolSize) % poolSize;
    index = candidate === lastIndex ? (candidate + 1) % poolSize : candidate;
  }
  const semitoneOffset = (randPitch * 2 - 1) * semitoneSpread;
  const dbOffset = (randDb * 2 - 1) * dbSpread;
  return {
    index,
    pitchMultiplier: Math.pow(2, semitoneOffset / 12),
    gainMultiplier: dbToLinear(dbOffset),
  };
}

function loadSettings(): AudioSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      master:
        typeof parsed.master === 'number' && Number.isFinite(parsed.master)
          ? Math.min(1, Math.max(0, parsed.master))
          : DEFAULT_SETTINGS.master,
      music:
        typeof parsed.music === 'number' && Number.isFinite(parsed.music)
          ? Math.min(1, Math.max(0, parsed.music))
          : DEFAULT_SETTINGS.music,
      sfx:
        typeof parsed.sfx === 'number' && Number.isFinite(parsed.sfx)
          ? Math.min(1, Math.max(0, parsed.sfx))
          : DEFAULT_SETTINGS.sfx,
      muted: Boolean(parsed.muted),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let settings: AudioSettings = loadSettings();
const listeners = new Set<(s: AudioSettings) => void>();

function saveAndNotify(): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }
  const snapshot = { ...settings };
  listeners.forEach(fn => fn(snapshot));
}

// Mixing graph nodes: Master <- { Music <- MusicDuck <- {BaseLayer, FocusLayer}, SFX <- UI }
let ctx: AudioContext | null = null;
let masterBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let musicDuckBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let uiBus: GainNode | null = null;
let baseLayerBus: GainNode | null = null;
let focusLayerBus: GainNode | null = null;

let musicMode: AdaptiveMusicMode = 'off';
let schedulerTimer: number | null = null;
let nextNoteTime = 0;
let stepCounter = 0;
let duckRecoverTimer: number | null = null;

const lastPoolIndex: Record<string, number> = {};

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();

    // Safety limiter on Master bus (-1 dB threshold) to prevent clipping when stems + SFX sum
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1.0;
    limiter.knee.value = 0.0;
    limiter.ratio.value = 20.0;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;

    masterBus = ctx.createGain();
    musicBus = ctx.createGain();
    musicDuckBus = ctx.createGain();
    sfxBus = ctx.createGain();
    uiBus = ctx.createGain();
    baseLayerBus = ctx.createGain();
    focusLayerBus = ctx.createGain();

    // UI bus sits -3 dB under SFX bus so frequent taps never overpower reward stingers
    uiBus.gain.value = dbToLinear(-3);
    musicDuckBus.gain.value = 1.0;
    baseLayerBus.gain.value = dbToLinear(-16);
    focusLayerBus.gain.value = 0;

    baseLayerBus.connect(musicDuckBus);
    focusLayerBus.connect(musicDuckBus);
    musicDuckBus.connect(musicBus);
    musicBus.connect(masterBus);

    uiBus.connect(sfxBus);
    sfxBus.connect(masterBus);

    masterBus.connect(limiter);
    limiter.connect(ctx.destination);

    syncBusGains();
  }

  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
  return ctx;
}

function syncBusGains(): void {
  if (!ctx || !masterBus || !musicBus || !sfxBus) return;
  const now = ctx.currentTime;
  const masterGain = settings.muted ? 0 : sliderToGain(settings.master);
  const musicGain = sliderToGain(settings.music);
  const sfxGain = sliderToGain(settings.sfx);

  masterBus.gain.setTargetAtTime(masterGain, now, 0.015);
  musicBus.gain.setTargetAtTime(musicGain, now, 0.015);
  sfxBus.gain.setTargetAtTime(sfxGain, now, 0.015);
}

/**
 * Ducks the dedicated MusicDuck bus in dB without overwriting the player's Music slider.
 */
export function duckMusic(dipDb = -12, holdMs = 320): void {
  if (!ctx || !musicDuckBus) return;
  const now = ctx.currentTime;
  const targetGain = dbToLinear(dipDb);

  musicDuckBus.gain.cancelScheduledValues(now);
  musicDuckBus.gain.setTargetAtTime(targetGain, now, 0.012); // Fast ~12ms attack

  if (duckRecoverTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(duckRecoverTimer);
  }
  if (typeof window !== 'undefined') {
    duckRecoverTimer = window.setTimeout(() => {
      if (ctx && musicDuckBus) {
        musicDuckBus.gain.setTargetAtTime(1.0, ctx.currentTime, 0.14); // Smooth ~400ms release
      }
      duckRecoverTimer = null;
    }, holdMs);
  }
}

function playTone(
  destination: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  peakGain = 0.25,
  slideToFreq?: number
): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (slideToFreq && slideToFreq > 0) {
    osc.frequency.exponentialRampToValueAtTime(slideToFreq, startTime + duration);
  }

  env.gain.setValueAtTime(0.0001, startTime);
  env.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(0.012, duration * 0.25));
  env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(env);
  env.connect(destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

export function playSfx(kind: SfxKind): void {
  if (settings.muted || settings.master <= 0 || settings.sfx <= 0) return;
  const audioCtx = ensureContext();
  if (!audioCtx || !sfxBus || !uiBus) return;

  const now = audioCtx.currentTime;

  if (kind === 'click') {
    const pool = [523.25, 554.37, 587.33]; // C5, C#5, D5
    const v = pickVariation(pool.length, lastPoolIndex.click ?? -1, 1.0, 1.5);
    lastPoolIndex.click = v.index;
    const f = pool[v.index] * v.pitchMultiplier;
    playTone(uiBus, f, now, 0.045, 'triangle', 0.22 * v.gainMultiplier, f * 1.18);
    return;
  }

  if (kind === 'select') {
    const pool = [659.25, 698.46, 783.99, 880.0]; // E5, F5, G5, A5
    const v = pickVariation(pool.length, lastPoolIndex.select ?? -1, 0.8, 1.5);
    lastPoolIndex.select = v.index;
    const f = pool[v.index] * v.pitchMultiplier;
    playTone(uiBus, f, now, 0.065, 'sine', 0.24 * v.gainMultiplier, f * 1.12);
    return;
  }

  if (kind === 'step') {
    const v = pickVariation(1, 0, 0.6, 1.0);
    playTone(uiBus, 392.0 * v.pitchMultiplier, now, 0.07, 'sine', 0.14 * v.gainMultiplier, 523.25 * v.pitchMultiplier);
    return;
  }

  if (kind === 'slotMatch') {
    duckMusic(-8, 220);
    const v = pickVariation(1, 0, 0.4, 1.0);
    playTone(sfxBus, 587.33 * v.pitchMultiplier, now, 0.09, 'triangle', 0.26 * v.gainMultiplier);
    playTone(sfxBus, 880.0 * v.pitchMultiplier, now + 0.065, 0.16, 'sine', 0.3 * v.gainMultiplier);
    return;
  }

  if (kind === 'correct') {
    duckMusic(-12, 380);
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((n, idx) => {
      playTone(sfxBus!, n, now + idx * 0.055, 0.18, 'triangle', 0.28);
    });
    return;
  }

  if (kind === 'cameraSuccess') {
    duckMusic(-12, 420);
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((n, idx) => {
      playTone(sfxBus!, n, now + idx * 0.05, 0.22, 'sine', 0.28);
    });
    return;
  }

  if (kind === 'wrong') {
    duckMusic(-10, 320);
    playTone(sfxBus, 220.0, now, 0.12, 'triangle', 0.26, 196.0);
    playTone(sfxBus, 185.0, now + 0.1, 0.18, 'triangle', 0.24, 164.81);
    return;
  }

  if (kind === 'complete') {
    duckMusic(-14, 750);
    const fanfare = [
      { f: 523.25, t: 0.0, d: 0.14 },  // C5
      { f: 659.25, t: 0.11, d: 0.14 }, // E5
      { f: 783.99, t: 0.22, d: 0.14 }, // G5
      { f: 1046.5, t: 0.34, d: 0.42 }, // C6
    ];
    playTone(sfxBus, 261.63, now, 0.65, 'triangle', 0.22); // Warm C4 root
    fanfare.forEach(n => {
      playTone(sfxBus!, n.f, now + n.t, n.d, 'triangle', 0.32);
    });
  }
}

// Pentatonic patterns for adaptive vertical-layered lesson music (100 BPM eighth-note grid)
const BASE_MOTIF = [261.63, 329.63, 392.0, 329.63, 293.66, 392.0, 440.0, 392.0]; // C4 E4 G4 E4 D4 G4 A4 G4
const FOCUS_MOTIF = [523.25, 0, 659.25, 587.33, 783.99, 0, 659.25, 523.25];       // C5 - E5 D5 G5 - E5 C5

function scheduleMusicSteps(): void {
  if (!ctx || !baseLayerBus || !focusLayerBus || musicMode === 'off') return;
  const stepDuration = SECONDS_PER_BEAT / 2; // Eighth notes (0.3s at 100 BPM)
  const lookaheadSec = 0.25;

  while (nextNoteTime < ctx.currentTime + lookaheadSec) {
    const idx = stepCounter % BASE_MOTIF.length;
    const baseFreq = BASE_MOTIF[idx];
    if (baseFreq > 0) {
      playTone(baseLayerBus, baseFreq, nextNoteTime, stepDuration * 0.85, 'sine', 0.22);
    }

    const focusFreq = FOCUS_MOTIF[idx];
    if (focusFreq > 0) {
      playTone(focusLayerBus, focusFreq, nextNoteTime, stepDuration * 0.55, 'triangle', 0.18);
    }

    nextNoteTime += stepDuration;
    stepCounter += 1;
  }
}

/**
 * Controls adaptive background music with vertical layering:
 * - 'off': stops scheduler and fades layers out
 * - 'study': plays warm base layer, mutes camera focus layer
 * - 'camera': crossfades in the rhythmic focus layer on top of the base layer
 */
export function setAdaptiveMusic(mode: AdaptiveMusicMode): void {
  musicMode = mode;
  if (typeof window === 'undefined') return;

  if (mode === 'off') {
    if (schedulerTimer !== null) {
      window.clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
    if (ctx && baseLayerBus && focusLayerBus) {
      baseLayerBus.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      focusLayerBus.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    }
    return;
  }

  const audioCtx = ensureContext();
  if (!audioCtx || !baseLayerBus || !focusLayerBus) return;

  const now = audioCtx.currentTime;
  baseLayerBus.gain.setTargetAtTime(dbToLinear(-16), now, 0.18);
  focusLayerBus.gain.setTargetAtTime(mode === 'camera' ? dbToLinear(-15) : 0, now, 0.22);

  if (schedulerTimer === null) {
    // Quantize start to the next beat grid
    nextNoteTime = now + 0.05;
    stepCounter = 0;
    scheduleMusicSteps();
    schedulerTimer = window.setInterval(scheduleMusicSteps, 100);
  }
}

export function getAudioSettings(): AudioSettings {
  return { ...settings };
}

export function setBusVolume(bus: AudioBusName, slider01: number): void {
  const clamped = Number.isFinite(slider01) ? Math.min(1, Math.max(0, slider01)) : 0;
  settings = {
    ...settings,
    [bus]: clamped,
    ...(clamped > 0 && settings.muted ? { muted: false } : {}),
  };
  ensureContext();
  syncBusGains();
  saveAndNotify();
}

export function toggleAudioMute(): boolean {
  settings = { ...settings, muted: !settings.muted };
  ensureContext();
  syncBusGains();
  saveAndNotify();
  if (!settings.muted) {
    playSfx('select');
  }
  return settings.muted;
}

export function subscribeAudioSettings(listener: (s: AudioSettings) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
