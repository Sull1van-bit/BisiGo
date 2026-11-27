import { PatuliModelCategory, RoboflowPrediction, RoboflowResponse } from '../types';

export const TARGET_CONFIDENCE_THRESHOLD = 0.38;
const INFERENCE_MIN_CONFIDENCE = 0.22;
// Patuli-ML SSD MobileNet V2 FPNLite input tensor resolution (320x320 1:1 square)
const MODEL_INPUT_SIZE = 320;
const CAPTURE_WIDTH = 480;
const CAPTURE_HEIGHT = 360;
const CAMERA_ASPECT_RATIO = CAPTURE_WIDTH / CAPTURE_HEIGHT;

const MODEL_PATHS: Record<PatuliModelCategory, string> = {
  angka: '/models/angka_v2.tflite',
  kata: '/models/kata_v2.tflite',
  abjad: '/models/abjad_v2.tflite',
};

interface TfWebBoundingBoxProto {
  getOriginX(): number;
  getOriginY(): number;
  getWidth(): number;
  getHeight(): number;
}

interface TfWebClassProto {
  getClassName(): string;
  getDisplayName(): string;
  getScore(): number;
  getIndex(): number;
}

interface TfWebDetectionProto {
  getBoundingBox(): TfWebBoundingBoxProto | undefined;
  getClassesList(): TfWebClassProto[];
}

interface TfWebDetectionResultProto {
  getDetectionsList(): TfWebDetectionProto[];
}

interface TfWebObjectDetector {
  detect(input: ImageData | HTMLCanvasElement | HTMLImageElement | HTMLVideoElement): TfWebDetectionResultProto | undefined;
  cleanUp(): void;
}

interface TfWebObjectDetectorOptions {
  setMaxResults(v: number): void;
  setScoreThreshold(v: number): void;
  setNumThreads(v: number): void;
}

interface TfWebNamespace {
  tflite_web_api: {
    setWasmPath(path: string): void;
    getWasmFeatures(): Promise<{ multiThreading: boolean; simd: boolean }>;
  };
  ObjectDetectorOptions: new () => TfWebObjectDetectorOptions;
  ObjectDetector: {
    create(model: string | ArrayBuffer, options?: TfWebObjectDetectorOptions): Promise<TfWebObjectDetector>;
  };
}

declare global {
  interface Window {
    tfweb?: TfWebNamespace;
  }
}

let tfwebPromise: Promise<TfWebNamespace> | null = null;
const detectorCache = new Map<PatuliModelCategory, Promise<TfWebObjectDetector>>();
let roiCanvas: HTMLCanvasElement | null = null;
let scanCycleCounter = 0;

function getRoiCanvas(): HTMLCanvasElement {
  if (!roiCanvas) {
    roiCanvas = document.createElement('canvas');
    roiCanvas.width = MODEL_INPUT_SIZE;
    roiCanvas.height = MODEL_INPUT_SIZE;
  }
  return roiCanvas;
}

function loadTfWebClient(): Promise<TfWebNamespace> {
  if (typeof window !== 'undefined' && window.tfweb) {
    window.tfweb.tflite_web_api.setWasmPath('/wasm/');
    return Promise.resolve(window.tfweb);
  }
  if (tfwebPromise) return tfwebPromise;

  tfwebPromise = new Promise<TfWebNamespace>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Browser DOM is required for local TFLite inference.'));
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-patuli-tflite="true"]'
    );
    if (existingScript && window.tfweb) {
      window.tfweb.tflite_web_api.setWasmPath('/wasm/');
      resolve(window.tfweb);
      return;
    }

    // tflite_web_api_client.js ends with `exports.tfweb = tfweb;` which throws
    // `ReferenceError: exports is not defined` in classic browser script scope unless guarded.
    const win = window as unknown as Record<string, unknown>;
    if (typeof win.exports === 'undefined') {
      win.exports = {};
    }

    const script = document.createElement('script');
    script.src = '/wasm/tflite_web_api_client.js';
    script.async = true;
    script.dataset.patuliTflite = 'true';
    script.onload = () => {
      if (window.tfweb) {
        window.tfweb.tflite_web_api.setWasmPath('/wasm/');
        resolve(window.tfweb);
      } else {
        tfwebPromise = null;
        reject(new Error('TFLite Web API client loaded without initializing window.tfweb.'));
      }
    };
    script.onerror = () => {
      tfwebPromise = null;
      script.remove();
      reject(new Error('Failed to load /wasm/tflite_web_api_client.js.'));
    };
    document.head.appendChild(script);
  });

  return tfwebPromise;
}

async function getPatuliDetector(category: PatuliModelCategory): Promise<TfWebObjectDetector> {
  const existing = detectorCache.get(category);
  if (existing) return existing;

  const promise = (async () => {
    const tfweb = await loadTfWebClient();
    const options = new tfweb.ObjectDetectorOptions();
    options.setMaxResults(5);
    options.setScoreThreshold(INFERENCE_MIN_CONFIDENCE);
    // Single-thread SIMD works universally without requiring COOP/COEP SharedArrayBuffer headers
    options.setNumThreads(1);
    return tfweb.ObjectDetector.create(MODEL_PATHS[category], options);
  })().catch(err => {
    detectorCache.delete(category);
    throw err;
  });

  detectorCache.set(category, promise);
  return promise;
}

export async function preloadPatuliModel(category: PatuliModelCategory): Promise<void> {
  await getPatuliDetector(category);
}

export function normalizeSignClass(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]+/g, ' ');
}

export function findMatchingPrediction(
  predictions: RoboflowPrediction[],
  targetClass: string
): RoboflowPrediction | undefined {
  const normalizedTarget = normalizeSignClass(targetClass);
  return predictions
    .filter(pred => normalizeSignClass(pred.class) === normalizedTarget)
    .sort((a, b) => b.confidence - a.confidence)[0];
}

export function selectDisplayPrediction(
  predictions: RoboflowPrediction[],
  targetClass: string
): RoboflowPrediction | undefined {
  if (predictions.length === 0) return undefined;
  const targetMatch = findMatchingPrediction(predictions, targetClass);
  if (targetMatch) return targetMatch;
  return [...predictions].sort((a, b) => b.confidence - a.confidence)[0];
}

/**
 * Center-crops webcam feed to 4:3 (`480x360`) to match the `object-cover` video preview
 * without squashing aspect ratio. Multi-scale 1:1 square crops are extracted during inference.
 */
export function captureVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): { canvas: HTMLCanvasElement; width: number; height: number } | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const srcRatio = vw / vh;
  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;

  if (srcRatio > CAMERA_ASPECT_RATIO) {
    sw = Math.round(vh * CAMERA_ASPECT_RATIO);
    sx = Math.round((vw - sw) / 2);
  } else if (srcRatio < CAMERA_ASPECT_RATIO) {
    sh = Math.round(vw / CAMERA_ASPECT_RATIO);
    sy = Math.round((vh - sh) / 2);
  }

  if (canvas.width !== CAPTURE_WIDTH) canvas.width = CAPTURE_WIDTH;
  if (canvas.height !== CAPTURE_HEIGHT) canvas.height = CAPTURE_HEIGHT;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);

  return { canvas, width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT };
}

export async function prepareImageFileForInference(file: File): Promise<{
  canvas: HTMLCanvasElement;
  previewUrl: string;
  width: number;
  height: number;
}> {
  const previewUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode selected image.'));
      el.src = previewUrl;
    });

    const maxSide = 480;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const width = Math.max(1, Math.round((img.naturalWidth || MODEL_INPUT_SIZE) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || MODEL_INPUT_SIZE) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to initialize canvas context.');
    }

    ctx.drawImage(img, 0, 0, width, height);
    return { canvas, previewUrl, width, height };
  } catch (err) {
    URL.revokeObjectURL(previewUrl);
    throw err;
  }
}

export class VisionInferenceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface SquareRoi {
  sx: number;
  sy: number;
  size: number;
  flipX?: boolean;
}

function runDetectorOnRoi(
  detector: TfWebObjectDetector,
  source: HTMLCanvasElement | HTMLImageElement,
  roi: SquareRoi,
  category: PatuliModelCategory,
  tag: string
): RoboflowPrediction[] {
  const targetCanvas = getRoiCanvas();
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return [];

  ctx.save();
  ctx.clearRect(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  if (roi.flipX) {
    ctx.translate(MODEL_INPUT_SIZE, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    source,
    roi.sx,
    roi.sy,
    roi.size,
    roi.size,
    0,
    0,
    MODEL_INPUT_SIZE,
    MODEL_INPUT_SIZE
  );
  ctx.restore();

  const protoResult = detector.detect(targetCanvas);
  const detList = protoResult ? protoResult.getDetectionsList() : [];

  return detList
    .map((det, idx): RoboflowPrediction | null => {
      const box = det.getBoundingBox();
      const topCat = det.getClassesList()?.[0];
      if (!topCat || !box) return null;
      const className = (topCat.getDisplayName() || topCat.getClassName() || '').trim();
      if (!className) return null;

      const bx = box.getOriginX();
      const by = box.getOriginY();
      const bw = box.getWidth();
      const bh = box.getHeight();
      const score = topCat.getScore();

      const normCenterX = (bx + bw / 2) / MODEL_INPUT_SIZE;
      const normCenterY = (by + bh / 2) / MODEL_INPUT_SIZE;
      const unflippedNormX = roi.flipX ? 1 - normCenterX : normCenterX;

      return {
        x: roi.sx + unflippedNormX * roi.size,
        y: roi.sy + normCenterY * roi.size,
        width: (bw / MODEL_INPUT_SIZE) * roi.size,
        height: (bh / MODEL_INPUT_SIZE) * roi.size,
        confidence: score,
        class: className,
        class_id: topCat.getIndex(),
        detection_id: `${category}-${tag}-${idx}-${Math.round(score * 1000)}`,
      };
    })
    .filter((p): p is RoboflowPrediction => p !== null);
}

/**
 * Runs local in-browser TFLite ObjectDetector inference using pure CPU SIMD WebAssembly
 * (zero WebGL dependency — works in LibreWolf, Firefox, Chrome, Safari) with multi-scale
 * 1:1 square crops and mirror fallback.
 */
export async function detectPatuliSignFromCanvas(
  source: HTMLCanvasElement | HTMLImageElement,
  category: PatuliModelCategory,
  targetClass?: string,
  exhaustive = false
): Promise<RoboflowResponse> {
  const t0 = performance.now();
  const detector = await getPatuliDetector(category);

  const sw = source instanceof HTMLCanvasElement ? source.width : source.naturalWidth || MODEL_INPUT_SIZE;
  const sh = source instanceof HTMLCanvasElement ? source.height : source.naturalHeight || MODEL_INPUT_SIZE;
  const minSide = Math.min(sw, sh);

  // Primary 1:1 center square (zero aspect ratio distortion)
  const centerRoi: SquareRoi = {
    sx: Math.round((sw - minSide) / 2),
    sy: Math.round((sh - minSide) / 2),
    size: minSide,
  };

  // Zoomed 1:1 square crops (~0.62x & 0.54x) for normal laptop sitting distance where hands appear smaller
  const zoomSize = Math.round(minSide * 0.62);
  const zoomY = Math.min(sh - zoomSize, Math.max(0, Math.round(sh * 0.54 - zoomSize / 2)));
  const extraRois: SquareRoi[] = [
    { sx: Math.round((sw - zoomSize) / 2), sy: zoomY, size: zoomSize },
    { sx: Math.max(0, Math.round(sw * 0.28 - zoomSize / 2)), sy: zoomY, size: zoomSize },
    { sx: Math.min(sw - zoomSize, Math.round(sw * 0.72 - zoomSize / 2)), sy: zoomY, size: zoomSize },
    { ...centerRoi, flipX: true },
    {
      sx: Math.round((sw - Math.round(minSide * 0.54)) / 2),
      sy: Math.round((sh - Math.round(minSide * 0.54)) / 2),
      size: Math.round(minSide * 0.54),
    },
  ];

  let bestPredictions = runDetectorOnRoi(detector, source, centerRoi, category, 'c0');
  const hasQualifiedTarget = (preds: RoboflowPrediction[]) => {
    if (!targetClass) return preds.some(p => p.confidence >= TARGET_CONFIDENCE_THRESHOLD);
    const match = findMatchingPrediction(preds, targetClass);
    return Boolean(match && match.confidence >= TARGET_CONFIDENCE_THRESHOLD);
  };

  if (!hasQualifiedTarget(bestPredictions)) {
    const roisToTry = exhaustive
      ? extraRois
      : [
          extraRois[scanCycleCounter % extraRois.length],
          extraRois[(scanCycleCounter + 1) % extraRois.length],
        ];
    scanCycleCounter = (scanCycleCounter + 2) % extraRois.length;

    for (let i = 0; i < roisToTry.length; i++) {
      const candidatePreds = runDetectorOnRoi(detector, source, roisToTry[i], category, `z${i}`);
      if (hasQualifiedTarget(candidatePreds)) {
        bestPredictions = candidatePreds;
        break;
      }
      const curBest = bestPredictions[0]?.confidence ?? 0;
      const candBest = candidatePreds[0]?.confidence ?? 0;
      if (candBest > curBest) {
        bestPredictions = candidatePreds;
      }
    }
  }

  return {
    time: (performance.now() - t0) / 1000,
    image: { width: sw, height: sh },
    predictions: bestPredictions,
  };
}
