import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  getLevelById,
  getSignByClass,
  generateExerciseSteps,
  generateCharacterPracticeSteps,
  formatSignLabel,
} from '../curriculum';
import { ExerciseStep, RoboflowPrediction, SignData } from '../types';
import { DuoButton } from '../components/DuoButton';
import { DuoCard } from '../components/DuoCard';
import { ChibiSignDemonstrator } from '../components/ChibiSignDemonstrator';
import { SentenceSignDemonstrator } from '../components/SentenceSignDemonstrator';
import { Modal } from '../components/Modal';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  advanceChainedCamera,
  ChainedCameraState,
  createChainedCameraState,
  gradeWordBankSelection,
} from '../utils/sentenceExercise';
import {
  captureVideoFrame,
  detectPatuliSignFromCanvas,
  findMatchingPrediction,
  preloadPatuliModel,
  TARGET_CONFIDENCE_THRESHOLD,
} from '../services/vision';
import {
  getAudioSettings,
  playSfx,
  setAdaptiveMusic,
  subscribeAudioSettings,
  toggleAudioMute,
} from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  X,
  Check,
  Lightning,
  Flame,
  Camera,
  CameraSlash,
  Sparkle,
  HandPeace,
  Info,
  ArrowCounterClockwise,
  ArrowRight,
  Trash,
  SpeakerHigh,
  SpeakerSlash,
} from '@phosphor-icons/react';

const getCharacterForSign = (sign: SignData): 'rafael' | 'kana' => {
  if (sign.unitId === 'unit-1' || sign.unitId === 'unit-3' || sign.modelCategory === 'abjad') {
    return 'rafael';
  }
  return 'kana';
};

export const LessonPage: React.FC = () => {
  const { levelId, category, signClass } = useParams<{
    levelId?: string;
    category?: string;
    signClass?: string;
  }>();
  const navigate = useNavigate();
  const { user, language, completeLevel, recordCharacterPractice, getCharacterMastery, loginAsGuest, t } = useApp();

  const isCharacterPractice = category === 'abjad' || category === 'angka';
  const characterCategory = isCharacterPractice ? (category as 'abjad' | 'angka') : null;
  const decodedSignClass = signClass ? decodeURIComponent(signClass) : undefined;
  const exitRoute = isCharacterPractice
    ? characterCategory === 'angka'
      ? '/characters?tab=angka'
      : '/characters'
    : '/learn';

  // Ensure user session exists (auto-guest for direct character practice links, /auth redirect for Learn lessons)
  useEffect(() => {
    if (!user) {
      if (isCharacterPractice) {
        loginAsGuest();
      } else {
        navigate('/auth', { replace: true });
      }
    }
  }, [user, isCharacterPractice, loginAsGuest, navigate]);

  // Load level metadata in Learn mode
  const levelInfo = useMemo(() => {
    if (isCharacterPractice || !levelId) return null;
    return getLevelById(levelId);
  }, [isCharacterPractice, levelId]);

  // Generate exercise steps for either Learn Mode or Character Practice Mode
  const steps: ExerciseStep[] = useMemo(() => {
    if (isCharacterPractice && characterCategory) {
      return generateCharacterPracticeSteps(characterCategory, decodedSignClass);
    }
    if (!levelInfo) return [];
    return generateExerciseSteps(levelInfo.level, levelInfo.unit);
  }, [isCharacterPractice, characterCategory, decodedSignClass, levelInfo]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Reset step index if route params change
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsCompletedModalOpen(false);
    setEarnedSummary(null);
    setPracticedCharacterClasses([]);
    setCharacterMasterySummary(null);
  }, [levelId, characterCategory, decodedSignClass]);

  // Quiz & Word-Bank state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedWordIndices, setSelectedWordIndices] = useState<number[]>([]);
  const [quizChecked, setQuizChecked] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  // Chained camera state (mirrored in ref so scanFrame reads latest activeSlotIndex without restarting webcam)
  const [chainedState, setChainedState] = useState<ChainedCameraState | null>(null);
  const chainedStateRef = useRef<ChainedCameraState | null>(null);
  const [slotFeedback, setSlotFeedback] = useState<string | null>(null);
  const slotFeedbackTimerRef = useRef<number | null>(null);

  const updateChainedState = (next: ChainedCameraState | null) => {
    chainedStateRef.current = next;
    setChainedState(next);
  };

  const triggerSlotFeedback = (signLabel: string) => {
    playSfx('slotMatch');
    if (slotFeedbackTimerRef.current !== null) {
      window.clearTimeout(slotFeedbackTimerRef.current);
    }
    setSlotFeedback(signLabel);
    slotFeedbackTimerRef.current = window.setTimeout(() => {
      setSlotFeedback(null);
      slotFeedbackTimerRef.current = null;
    }, 1400);
  };

  const [audioMuted, setAudioMuted] = useState(() => getAudioSettings().muted);
  useEffect(() => subscribeAudioSettings(s => setAudioMuted(s.muted)), []);

  // Camera & AI detection state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const pendingStreamPromiseRef = useRef<Promise<MediaStream> | null>(null);
  const webcamSessionRef = useRef(0);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [targetConfidence, setTargetConfidence] = useState(0);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [detectionSuccess, setDetectionSuccess] = useState(false);
  const [showCameraHint, setShowCameraHint] = useState(true);

  // Completion modal state
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [earnedSummary, setEarnedSummary] = useState<{ xpEarned: number; streakIncremented: boolean } | null>(null);
  const [practicedCharacterClasses, setPracticedCharacterClasses] = useState<string[]>([]);
  const [characterMasterySummary, setCharacterMasterySummary] = useState<{
    averageMastery: number;
    averageDelta: number;
  } | null>(null);

  const currentStep = steps[currentStepIndex];

  // Adaptive vertical-layered background music (base layer on study/quiz, focus layer crossfaded in on camera)
  useEffect(() => {
    if (isCompletedModalOpen || !currentStep) {
      setAdaptiveMusic('off');
      return;
    }
    const isCamera = currentStep.type === 'camera' || currentStep.type === 'chained-camera';
    setAdaptiveMusic(isCamera ? 'camera' : 'study');
  }, [currentStep?.id, currentStep?.type, isCompletedModalOpen]);

  const activeChainedIndex =
    currentStep?.type === 'chained-camera' && chainedState
      ? Math.min(chainedState.activeSlotIndex, Math.max(0, chainedState.expectedSigns.length - 1))
      : 0;

  const activeTargetClass =
    currentStep?.type === 'chained-camera'
      ? (chainedState?.expectedSigns[activeChainedIndex] ?? currentStep.sign.roboflowClass)
      : (currentStep?.sign.roboflowClass ?? '');

  const activeTargetSign: SignData | undefined =
    currentStep?.type === 'chained-camera'
      ? (currentStep.sentenceSigns?.[activeChainedIndex] ??
        getSignByClass(activeTargetClass) ??
        currentStep.sign)
      : currentStep?.sign;

  const attachActiveStreamToVideo = () => {
    const stream = activeStreamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.muted = true;
    video.playsInline = true;
    const tryPlay = () => {
      void video.play().catch(() => {
        // Ignore transient play() abort when stream initializes
      });
    };
    video.onloadedmetadata = tryPlay;
    tryPlay();
  };

  // Stop camera tracks helper
  const stopWebcam = () => {
    webcamSessionRef.current += 1;
    pendingStreamPromiseRef.current = null;
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setCameraLoading(false);
  };

  // Clean up webcam, adaptive music, and timers on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
      setAdaptiveMusic('off');
      if (slotFeedbackTimerRef.current !== null) {
        window.clearTimeout(slotFeedbackTimerRef.current);
      }
    };
  }, []);

  // Ensure active stream is bound to <video> whenever a camera step renders
  useEffect(() => {
    if (
      streamActive &&
      (currentStep?.type === 'camera' || currentStep?.type === 'chained-camera')
    ) {
      attachActiveStreamToVideo();
    }
  }, [streamActive, currentStep?.id, currentStep?.type]);

  // Start webcam (callable synchronously from user click or automatically on camera step entry)
  const startWebcam = async (forceNewRequest = false) => {
    const existingStream = activeStreamRef.current;
    const hasLiveTrack = existingStream
      ?.getVideoTracks()
      .some(track => track.readyState === 'live');
    if (!forceNewRequest && hasLiveTrack && existingStream) {
      setCameraError(null);
      setCameraLoading(false);
      setStreamActive(true);
      attachActiveStreamToVideo();
      return;
    }

    if (!forceNewRequest && pendingStreamPromiseRef.current) {
      return;
    }

    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }

    webcamSessionRef.current += 1;
    const sessionId = webcamSessionRef.current;

    setInferenceError(null);
    setCameraLoading(true);
    setCameraError(null);

    try {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        throw new Error(
          t(
            'Akses kamera membutuhkan HTTPS atau localhost (bukan alamat IP HTTP biasa).',
            'Camera access requires HTTPS or localhost (not a plain HTTP IP address).'
          )
        );
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          t(
            'Peramban tidak mendukung atau memblokir akses kamera web.',
            'Browser does not support or blocked webcam access.'
          )
        );
      }

      const requestStream = async (): Promise<MediaStream> => {
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            },
            audio: false,
          });
        } catch (firstErr: unknown) {
          const firstName = firstErr instanceof DOMException ? firstErr.name : '';
          if (firstName === 'NotAllowedError' || firstName === 'PermissionDeniedError') {
            throw firstErr;
          }
          return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      };

      const streamPromise = requestStream();
      pendingStreamPromiseRef.current = streamPromise;
      const stream = await streamPromise;

      if (pendingStreamPromiseRef.current === streamPromise) {
        pendingStreamPromiseRef.current = null;
      }

      if (sessionId !== webcamSessionRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      activeStreamRef.current = stream;
      setStreamActive(true);
      setCameraLoading(false);
      setCameraError(null);
      attachActiveStreamToVideo();
    } catch (err: unknown) {
      pendingStreamPromiseRef.current = null;
      if (sessionId !== webcamSessionRef.current) return;
      const errName = err instanceof DOMException ? err.name : '';
      let errorMsg: string;

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        errorMsg = t(
          'Izin kamera ditolak atau diabaikan. Klik ikon kamera/gembok di address bar browser lalu pilih Izinkan (Allow).',
          'Camera permission was denied or dismissed. Click the camera/lock icon in your browser address bar and select Allow.'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        errorMsg = t(
          'Kamera tidak ditemukan pada perangkat ini.',
          'No camera device found on this device.'
        );
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        errorMsg = t(
          'Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera lain lalu coba lagi.',
          'Camera is currently used by another app. Close other camera apps and retry.'
        );
      } else {
        errorMsg =
          err instanceof Error
            ? err.message
            : t('Tidak dapat mengakses kamera web.', 'Unable to access webcam.');
      }

      setCameraError(errorMsg);
      setCameraLoading(false);
      setStreamActive(false);
    }
  };

  // Initialize or reset exercise state when currentStepIndex or step changes
  useEffect(() => {
    setSelectedOption(null);
    setSelectedWordIndices([]);
    setQuizChecked(false);
    setIsAnswerCorrect(false);
    setTargetConfidence(0);
    setInferenceError(null);
    setDetectionSuccess(false);
    setSlotFeedback(null);
    if (slotFeedbackTimerRef.current !== null) {
      window.clearTimeout(slotFeedbackTimerRef.current);
      slotFeedbackTimerRef.current = null;
    }

    if (currentStep?.type === 'chained-camera' && currentStep.sentence) {
      updateChainedState(createChainedCameraState(currentStep.sentence.signs));
    } else {
      updateChainedState(null);
    }

    if (currentStep?.type === 'camera' || currentStep?.type === 'chained-camera') {
      void startWebcam(false);
      return undefined;
    }

    stopWebcam();
    return undefined;
  }, [currentStepIndex, currentStep?.id, currentStep?.type]);

  // Keyboard shortcut listener for Quiz options (1, 2, 3, 4) and Enter to check/advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentStep?.type === 'quiz' && !quizChecked && currentStep.options) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const index = parseInt(e.key, 10) - 1;
          if (index < currentStep.options.length) {
            playSfx('select');
            setSelectedOption(currentStep.options[index]);
          }
        }
      }

      if (e.key === 'Enter') {
        if (currentStep?.type === 'quiz') {
          if (!quizChecked && selectedOption) {
            handleCheckQuiz();
          } else if (quizChecked) {
            handleNextStep();
          }
        } else if (currentStep?.type === 'word-bank') {
          if (!quizChecked && selectedWordIndices.length > 0) {
            handleCheckWordBank();
          } else if (quizChecked && isAnswerCorrect) {
            handleNextStep();
          }
        } else if (currentStep?.type === 'study') {
          handleNextStep();
        } else if (
          (currentStep?.type === 'camera' || currentStep?.type === 'chained-camera') &&
          detectionSuccess
        ) {
          handleNextStep();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, quizChecked, isAnswerCorrect, selectedOption, selectedWordIndices, detectionSuccess]);

  // Apply detection predictions to UI state for single-sign camera or chained-camera
  const applyDetectionResponse = (preds: RoboflowPrediction[]) => {
    if (!currentStep) return;
    setInferenceError(null);

    if (currentStep.type === 'chained-camera') {
      const prevState = chainedStateRef.current;
      if (!prevState || prevState.completed) return;

      const expectedSign = prevState.expectedSigns[prevState.activeSlotIndex];
      const targetMatch = findMatchingPrediction(preds, expectedSign);
      setTargetConfidence(targetMatch ? targetMatch.confidence : 0);

      const { state: nextState, advanced, matchedSign } = advanceChainedCamera(
        prevState,
        preds,
        TARGET_CONFIDENCE_THRESHOLD
      );

      if (advanced) {
        updateChainedState(nextState);
        if (nextState.completed) {
          setTargetConfidence(1);
          setDetectionSuccess(true);
          playSfx('cameraSuccess');
          stopWebcam();
        } else {
          triggerSlotFeedback(matchedSign || expectedSign);
          setTargetConfidence(0);
        }
      }
      return;
    }

    const targetClass = currentStep.sign.roboflowClass;
    const targetMatch = findMatchingPrediction(preds, targetClass);
    setTargetConfidence(targetMatch ? targetMatch.confidence : 0);

    if (targetMatch && targetMatch.confidence >= TARGET_CONFIDENCE_THRESHOLD) {
      setDetectionSuccess(true);
      playSfx('cameraSuccess');
    }
  };

  // Preload active category model in background
  useEffect(() => {
    if (!currentStep) return;
    const categoryToLoad =
      currentStep.type === 'chained-camera' ? 'kata' : currentStep.sign.modelCategory;
    void preloadPatuliModel(categoryToLoad).catch(() => {
      // Handled during inference call if loading fails
    });
  }, [currentStep]);

  // Sequential real-time inference loop for active webcam detection (no overlapping requests)
  useEffect(() => {
    const isCameraStep =
      currentStep?.type === 'camera' || currentStep?.type === 'chained-camera';
    if (!streamActive || !isCameraStep || detectionSuccess) {
      return;
    }

    let cancelled = false;
    let timerId: number | undefined;

    const scanFrame = async () => {
      if (cancelled) return;
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
        timerId = window.setTimeout(scanFrame, 120);
        return;
      }

      const frame = captureVideoFrame(videoRef.current, canvasRef.current);
      if (!frame) {
        timerId = window.setTimeout(scanFrame, 120);
        return;
      }

      const isChained = currentStep.type === 'chained-camera';
      const targetSignForFrame = isChained
        ? chainedStateRef.current?.expectedSigns[chainedStateRef.current.activeSlotIndex]
        : currentStep.sign.roboflowClass;

      if (!targetSignForFrame) {
        return;
      }

      const modelCategoryForFrame = isChained ? 'kata' : currentStep.sign.modelCategory;

      try {
        const result = await detectPatuliSignFromCanvas(
          frame.canvas,
          modelCategoryForFrame,
          targetSignForFrame,
          false
        );
        if (cancelled) return;

        const preds = Array.isArray(result.predictions) ? result.predictions : [];
        applyDetectionResponse(preds);

        if (isChained) {
          const latest = chainedStateRef.current;
          if (!latest || latest.completed) {
            return;
          }
          const movedSlot = latest.expectedSigns[latest.activeSlotIndex] !== targetSignForFrame;
          timerId = window.setTimeout(scanFrame, movedSlot ? 450 : 35);
        } else {
          const targetMatch = findMatchingPrediction(preds, currentStep.sign.roboflowClass);
          if (targetMatch && targetMatch.confidence >= TARGET_CONFIDENCE_THRESHOLD) {
            return;
          }
          timerId = window.setTimeout(scanFrame, 35);
        }
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === 'AbortError')) {
          return;
        }
        setInferenceError(
          t(
            'Gagal memproses kamera. Pastikan pencahayaan cukup lalu coba lagi.',
            'Unable to process camera frame. Check your lighting and try again.'
          )
        );
        timerId = window.setTimeout(scanFrame, 1000);
      }
    };

    timerId = window.setTimeout(scanFrame, 80);

    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [streamActive, currentStep, detectionSuccess]);

  // Advance to next step or complete lesson / character practice
  const handleNextStep = () => {
    if (currentStepIndex + 1 < steps.length) {
      playSfx('step');
      const nextStep = steps[currentStepIndex + 1];
      if (nextStep && (nextStep.type === 'camera' || nextStep.type === 'chained-camera')) {
        void startWebcam(false);
      }
      setCurrentStepIndex(prev => prev + 1);
    } else {
      stopWebcam();
      playSfx('complete');
      if (isCharacterPractice) {
        const practicedClasses = Array.from(new Set(steps.map(s => s.sign.roboflowClass)));
        const beforeMasteries = practicedClasses.map(cls => getCharacterMastery(cls));
        const afterMasteries = beforeMasteries.map(m => Math.max(0, Math.min(100, m + 34)));
        const totalDelta = afterMasteries.reduce(
          (acc, after, idx) => acc + (after - beforeMasteries[idx]),
          0
        );
        const totalAfter = afterMasteries.reduce((acc, after) => acc + after, 0);
        const averageDelta =
          practicedClasses.length > 0 ? Math.round(totalDelta / practicedClasses.length) : 0;
        const averageMastery =
          practicedClasses.length > 0 ? Math.round(totalAfter / practicedClasses.length) : 0;

        recordCharacterPractice(practicedClasses);
        setPracticedCharacterClasses(practicedClasses);
        setCharacterMasterySummary({ averageMastery, averageDelta });
      } else if (levelId) {
        const summary = completeLevel(levelId);
        setEarnedSummary(summary);
      }
      setIsCompletedModalOpen(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1A8CFF', '#3B5BDB', '#FFC800', '#12B886'],
        });
      } catch {
        // Fallback
      }
    }
  };

  const handleCheckQuiz = () => {
    if (!selectedOption || !currentStep || currentStep.correctOptionIndex === undefined) return;
    const correctWord = currentStep.options?.[currentStep.correctOptionIndex];
    const isCorrect = selectedOption === correctWord;
    setIsAnswerCorrect(isCorrect);
    setQuizChecked(true);
    playSfx(isCorrect ? 'correct' : 'wrong');
  };

  const handleCheckWordBank = () => {
    if (!currentStep || !currentStep.sentence || !currentStep.wordBankOptions) return;
    const selectedSigns = selectedWordIndices
      .map(idx => currentStep.wordBankOptions?.[idx])
      .filter((w): w is string => Boolean(w));
    const isCorrect = gradeWordBankSelection(selectedSigns, currentStep.sentence.signs);
    setIsAnswerCorrect(isCorrect);
    setQuizChecked(true);
    playSfx(isCorrect ? 'correct' : 'wrong');
  };

  const handleRetryWordBank = () => {
    setSelectedWordIndices([]);
    setQuizChecked(false);
    setIsAnswerCorrect(false);
  };

  if ((!isCharacterPractice && !levelInfo) || steps.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F172A] flex flex-col items-center justify-center p-4 transition-colors duration-200">
        <p className="text-base font-black text-[#1E293B] dark:text-[#F8FAFC]">
          {isCharacterPractice
            ? t('Latihan karakter tidak ditemukan.', 'Character practice not found.')
            : t('Level tidak ditemukan.', 'Level not found.')}
        </p>
        <div className="mt-4">
          <DuoButton variant="blue" size="md" onClick={() => navigate(exitRoute)}>
            {isCharacterPractice
              ? t('KEMBALI KE HURUF & ANGKA', 'BACK TO CHARACTERS')
              : t('KEMBALI KE BELAJAR', 'BACK TO LEARN')}
          </DuoButton>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div className="h-screen flex flex-col justify-between bg-white dark:bg-[#0F172A] overflow-hidden select-none transition-colors duration-200">
      {/* 1. TOP PROGRESS BAR HEADER (max-w-4xl mx-auto) */}
      <header className="max-w-4xl w-full mx-auto px-6 pt-6 sm:pt-8 flex items-center gap-4 shrink-0">
        <button
          type="button"
          onClick={() => {
            playSfx('click');
            stopWebcam();
            navigate(exitRoute);
          }}
          className="p-1 text-[#94A3B8] dark:text-[#64748B] hover:text-[#64748B] dark:hover:text-[#F8FAFC] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8CFF] rounded-xl"
          aria-label={t('Keluar dari sesi latihan', 'Exit practice session')}
        >
          <X size={26} weight="bold" />
        </button>

        {/* Thick BisiGo Blue Progress Bar with White Gloss Highlight */}
        <div className="flex-1 h-4 bg-[#E2E8F0] dark:bg-[#1E293B] rounded-full overflow-hidden p-0.5 relative">
          <div
            className="bg-[#1A8CFF] h-full rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progressPercent}%` }}
          >
            {/* White shine highlight bar */}
            <div className="h-1.5 bg-white/30 rounded-full mx-2 mt-0.5" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleAudioMute()}
          aria-label={audioMuted ? t('Nyalakan suara', 'Unmute audio') : t('Bisukan suara', 'Mute audio')}
          className="p-2 rounded-xl border-2 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:text-[#1A8CFF] dark:hover:text-[#60B2FF] transition-colors cursor-pointer"
        >
          {audioMuted ? <SpeakerSlash size={18} weight="bold" /> : <SpeakerHigh size={18} weight="fill" />}
        </button>

        <ThemeToggle compact />
      </header>

      {/* 2. CENTER INTERACTIVE STAGE (max-w-2xl mx-auto) */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-4 flex flex-col overflow-y-auto">
        {currentStep && (
          <div className="w-full my-auto">
            {/* STAGE 1: SIGN STUDY INTRODUCTION */}
            {currentStep.type === 'study' && (
              <div className="space-y-6 text-center animate-fadeIn">
                <div>
                  <span className="bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 text-[#0066CC] dark:text-[#60B2FF] border-2 border-[#1A8CFF] px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider inline-block">
                    {isCharacterPractice
                      ? characterCategory === 'abjad'
                        ? t('KARAKTER ABJAD', 'ALPHABET CHARACTER')
                        : t('KARAKTER ANGKA', 'NUMBER CHARACTER')
                      : t('ISYARAT BARU', 'NEW SIGN')}
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-black text-[#1E293B] dark:text-[#F8FAFC] mt-2">
                    {formatSignLabel(currentStep.sign, language)}
                  </h1>
                </div>

                {/* Gesture Illustration Card */}
                <div className="flex justify-center">
                  <div className="p-4 bg-[#F8FAFC] dark:bg-[#1E293B] border-2 border-[#E2E8F0] dark:border-[#334155] rounded-3xl shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] flex flex-col items-center gap-3 w-full max-w-sm">
                    <ChibiSignDemonstrator
                      character={getCharacterForSign(currentStep.sign)}
                      signClass={currentStep.sign.roboflowClass}
                      size="lg"
                    />
                  </div>
                </div>

                {/* Speech-Bubble Hint Box with top triangle */}
                <div className="relative bg-white dark:bg-[#1E293B] border-2 border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] text-left max-w-lg mx-auto">
                  <div className="absolute -top-2.5 left-8 w-4 h-4 bg-white dark:bg-[#1E293B] border-t-2 border-l-2 border-[#E2E8F0] dark:border-[#334155] rotate-45" />
                  <span className="text-[11px] font-black text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider block mb-1">
                    {t('PANDUAN GERAKAN:', 'GESTURE GUIDE:')}
                  </span>
                  <p className="text-base font-extrabold text-[#1E293B] dark:text-[#F8FAFC] leading-relaxed">
                    {language === 'en' ? currentStep.sign.hintEn : currentStep.sign.hintId}
                  </p>
                  {currentStep.sign.scenarioId && (
                    <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
                      <span className="font-black text-[#1E293B] dark:text-[#F8FAFC]">
                        {t('Konteks: ', 'Context: ')}
                      </span>
                      {language === 'en'
                        ? currentStep.sign.scenarioEn
                        : currentStep.sign.scenarioId}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 2: MULTIPLE CHOICE QUIZ */}
            {currentStep.type === 'quiz' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#1E293B] dark:text-[#F8FAFC]">
                    {t('Pilih arti atau isyarat yang tepat', 'Select the correct sign or meaning')}
                  </h2>
                </div>

                {/* Prompt Question Box */}
                <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B]">
                  <ChibiSignDemonstrator
                    character={getCharacterForSign(currentStep.sign)}
                    signClass={currentStep.sign.roboflowClass}
                    size="sm"
                    className="shrink-0"
                    ariaLabel={t(
                      `Demonstrasi isyarat BISINDO oleh ${getCharacterForSign(currentStep.sign) === 'rafael' ? 'Rafael' : 'Kana'}`,
                      `BISINDO sign demonstration by ${getCharacterForSign(currentStep.sign) === 'rafael' ? 'Rafael' : 'Kana'}`
                    )}
                  />
                  <div>
                    <span className="text-[11px] font-black uppercase text-[#94A3B8] dark:text-[#64748B] tracking-wide block">
                      {t('SKENARIO PENGGUNAAN', 'SITUATION')}
                    </span>
                    <p className="text-base font-black text-[#1E293B] dark:text-[#F8FAFC] mt-0.5">
                      {language === 'en' ? currentStep.questionEn : currentStep.questionId}
                    </p>
                  </div>
                </div>

                {/* 2x2 Grid of Tactile Option Cards with keyboard badges (1, 2, 3, 4) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {currentStep.options?.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    let status: 'default' | 'selected' | 'correct' | 'wrong' = 'default';

                    if (quizChecked) {
                      const isCorrectAnswer =
                        idx === currentStep.correctOptionIndex;
                      if (isCorrectAnswer) {
                        status = 'correct';
                      } else if (isSelected) {
                        status = 'wrong';
                      }
                    } else if (isSelected) {
                      status = 'selected';
                    }

                    return (
                      <DuoCard
                        key={option}
                        shortcutNumber={idx + 1}
                        status={status}
                        disabled={quizChecked}
                        onClick={() => setSelectedOption(option)}
                        className="text-base font-black py-4"
                      >
                        <span>{option}</span>
                      </DuoCard>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STAGE 2B: WORD-BANK SENTENCE QUIZ */}
            {currentStep.type === 'word-bank' && currentStep.sentence && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <span className="bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 text-[#0066CC] dark:text-[#60B2FF] border-2 border-[#1A8CFF] px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider inline-block">
                    {t('SUSUN KALIMAT BISINDO', 'BUILD THE SENTENCE')}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#1E293B] dark:text-[#F8FAFC] mt-1.5">
                    {t('Susun urutan isyarat yang diperagakan', 'Arrange the demonstrated signs in order')}
                  </h2>
                </div>

                {/* Sequential Demonstrator + Meaning Prompt */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
                  <div className="sm:col-span-3">
                    <SentenceSignDemonstrator
                      character={getCharacterForSign(currentStep.sign)}
                      signs={currentStep.sentenceSigns ?? []}
                      size="md"
                      hideLabels={true}
                    />
                  </div>
                  <div className="sm:col-span-2 p-4 rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] space-y-2 text-left">
                    <span className="text-[11px] font-black uppercase text-[#94A3B8] dark:text-[#64748B] tracking-wider block">
                      {t('ARTI KALIMAT', 'SENTENCE MEANING')}
                    </span>
                    <p className="text-lg font-black text-[#1E293B] dark:text-[#F8FAFC] leading-snug">
                      “{language === 'en' ? currentStep.sentence.meaningEn : currentStep.sentence.meaningId}”
                    </p>
                    <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">
                      {t(
                        `Terdiri dari ${currentStep.sentence.signs.length} isyarat berurutan.`,
                        `Consists of ${currentStep.sentence.signs.length} signs in sequence.`
                      )}
                    </p>
                  </div>
                </div>

                {/* Selected Answer Tray */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                      {t('JAWABAN KAMU', 'YOUR SEQUENCE')}
                    </span>
                    {selectedWordIndices.length > 0 && !quizChecked && (
                      <button
                        type="button"
                        onClick={() => {
                          playSfx('click');
                          setSelectedWordIndices([]);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-[#64748B] dark:text-[#94A3B8] hover:text-[#EA2B2B] transition-colors cursor-pointer"
                      >
                        <Trash size={14} weight="bold" />
                        <span>{t('Bersihkan', 'Clear')}</span>
                      </button>
                    )}
                  </div>

                  <div
                    data-testid="word-bank-answer-tray"
                    className={`min-h-[64px] p-3 rounded-2xl border-2 flex flex-wrap items-center gap-2 transition-colors ${
                      quizChecked && isAnswerCorrect
                        ? 'bg-[#E6FCF5] dark:bg-[#0B2B23] border-[#12B886]'
                        : quizChecked && !isAnswerCorrect
                        ? 'bg-[#FFDFE0] dark:bg-[#2F1519] border-[#FF4B4B]'
                        : 'bg-[#F8FAFC] dark:bg-[#162032] border-dashed border-[#CBD5E1] dark:border-[#334155]'
                    }`}
                  >
                    {selectedWordIndices.length === 0 ? (
                      <span className="text-xs font-bold text-[#94A3B8] dark:text-[#64748B] px-1">
                        {t(
                          'Ketuk kartu kata di bawah sesuai urutan isyarat...',
                          'Tap word chips below in the sign order...'
                        )}
                      </span>
                    ) : (
                      selectedWordIndices.map((optIdx, trayPos) => {
                        const word = currentStep.wordBankOptions?.[optIdx] ?? '';
                        return (
                          <button
                            key={`selected-${optIdx}-${trayPos}`}
                            type="button"
                            data-testid={`word-bank-selected-${trayPos}`}
                            disabled={quizChecked}
                            onClick={() => {
                              playSfx('select');
                              setSelectedWordIndices(prev => prev.filter((_, i) => i !== trayPos));
                            }}
                            className={`px-3.5 py-2 rounded-xl font-black text-sm border-2 transition-all ${
                              quizChecked && isAnswerCorrect
                                ? 'bg-white dark:bg-[#0F172A] text-[#0CA678] dark:text-[#38D9A9] border-[#12B886] shadow-[0_3px_0_#0CA678]'
                                : quizChecked && !isAnswerCorrect
                                ? 'bg-white dark:bg-[#0F172A] text-[#EA2B2B] dark:text-[#FF8787] border-[#FF4B4B] shadow-[0_3px_0_#EA2B2B]'
                                : 'bg-[#E6F3FF] dark:bg-[#1A8CFF]/20 text-[#0066CC] dark:text-[#60B2FF] border-[#1A8CFF] shadow-[0_3px_0_#1A8CFF] hover:brightness-95 active:translate-y-[2px] cursor-pointer'
                            }`}
                          >
                            <span className="opacity-60 mr-1.5 text-xs">{trayPos + 1}.</span>
                            {word}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Available Word Bank Chips */}
                <div
                  data-testid="word-bank-options"
                  className="flex flex-wrap items-center justify-center gap-2.5 pt-1"
                >
                  {currentStep.wordBankOptions?.map((word, idx) => {
                    const isUsed = selectedWordIndices.includes(idx);
                    return (
                      <button
                        key={`bank-${word}-${idx}`}
                        type="button"
                        data-testid={`word-bank-option-${idx}`}
                        disabled={isUsed || quizChecked}
                        onClick={() => {
                          playSfx('select');
                          setSelectedWordIndices(prev => [...prev, idx]);
                        }}
                        className={`px-4 py-2.5 rounded-2xl font-black text-sm border-2 transition-all ${
                          isUsed
                            ? 'bg-[#E2E8F0] dark:bg-[#1E293B] text-transparent border-[#CBD5E1] dark:border-[#334155] shadow-none cursor-default select-none'
                            : quizChecked
                            ? 'bg-white dark:bg-[#1E293B] text-[#94A3B8] dark:text-[#64748B] border-[#E2E8F0] dark:border-[#334155] cursor-not-allowed'
                            : 'bg-white dark:bg-[#1E293B] text-[#1E293B] dark:text-[#F8FAFC] border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] hover:border-[#1A8CFF] active:translate-y-[3px] active:shadow-none cursor-pointer'
                        }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STAGE 3: LIVE CAMERA PRACTICE (SINGLE SIGN OR CHAINED SENTENCE) */}
            {(currentStep.type === 'camera' || currentStep.type === 'chained-camera') && activeTargetSign && (
              <div className="space-y-4 animate-fadeIn">
                {/* Header Challenge */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <span className="bg-[#FFF8DB] dark:bg-[#FFC800]/15 text-[#E5B400] dark:text-[#FFD43B] border-2 border-[#FFC800] px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider inline-block">
                      {currentStep.type === 'chained-camera'
                        ? t('PRAKTIK KALIMAT BERURUTAN', 'CHAINED SENTENCE PRACTICE')
                        : t('PRAKTIK KAMERA LANGSUNG', 'LIVE CAMERA PRACTICE')}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#1E293B] dark:text-[#F8FAFC] mt-1">
                      {currentStep.type === 'chained-camera' ? (
                        <>
                          {detectionSuccess ? (
                            <span className="text-[#0CA678] dark:text-[#38D9A9]">
                              {t('Semua isyarat kalimat selesai!', 'All sentence signs completed!')}
                            </span>
                          ) : (
                            <>
                              {t(`Isyarat #${activeChainedIndex + 1}:`, `Sign #${activeChainedIndex + 1}:`)}{' '}
                              <span className="text-[#1A8CFF] dark:text-[#60B2FF]">
                                {formatSignLabel(activeTargetSign, language)}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {t('Peragakan isyarat:', 'Perform sign:')}{' '}
                          <span className="text-[#1A8CFF] dark:text-[#60B2FF]">
                            {formatSignLabel(activeTargetSign, language)}
                          </span>
                        </>
                      )}
                    </h2>
                    {currentStep.type === 'chained-camera' && currentStep.sentence && (
                      <p className="text-xs font-extrabold text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                        {t('Arti:', 'Meaning:')}{' '}
                        “{language === 'en' ? currentStep.sentence.meaningEn : currentStep.sentence.meaningId}”
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCameraHint(prev => !prev)}
                    className="p-2 rounded-xl text-[#1A8CFF] dark:text-[#60B2FF] bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 border-2 border-[#1A8CFF] font-black text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Info size={18} weight="bold" />
                    <span>{showCameraHint ? t('Tutup Bantuan', 'Hide Guide') : t('Lihat Bantuan', 'Show Guide')}</span>
                  </button>
                </div>

                {/* Visible Chained Sequence Bar */}
                {currentStep.type === 'chained-camera' && chainedState && (
                  <div
                    data-testid="chained-sequence-bar"
                    className="p-3 rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] flex flex-wrap items-center justify-center gap-2"
                  >
                    {chainedState.expectedSigns.map((signLabel, idx) => {
                      const isDone = Boolean(chainedState.completedSlots[idx]);
                      const isActive = !chainedState.completed && idx === chainedState.activeSlotIndex;
                      return (
                        <React.Fragment key={`${signLabel}-${idx}`}>
                          <div
                            data-testid={`chained-slot-${idx}`}
                            data-slot-status={isDone ? 'completed' : isActive ? 'active' : 'pending'}
                            className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wide border-2 flex items-center gap-1.5 transition-all ${
                              isDone
                                ? 'bg-[#E6FCF5] dark:bg-[#0B2B23] text-[#0CA678] dark:text-[#38D9A9] border-[#12B886] shadow-[0_2px_0_#0CA678]'
                                : isActive
                                ? 'bg-[#1A8CFF] text-white border-[#0066CC] shadow-[0_2px_0_#0066CC] ring-2 ring-[#1A8CFF]/30'
                                : 'bg-white dark:bg-[#162032] text-[#94A3B8] dark:text-[#64748B] border-[#E2E8F0] dark:border-[#334155]'
                            }`}
                          >
                            <span>
                              {idx + 1}. {signLabel.toUpperCase()}
                            </span>
                            {isDone && <Check size={14} weight="bold" aria-hidden="true" />}
                          </div>
                          {idx < chainedState.expectedSigns.length - 1 && (
                            <ArrowRight
                              size={16}
                              weight="bold"
                              className="text-[#94A3B8] dark:text-[#64748B] shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {/* Slot-completed transient notification */}
                {slotFeedback && (
                  <div
                    data-testid="chained-slot-feedback"
                    className="px-3.5 py-2 rounded-xl bg-[#E6FCF5] dark:bg-[#0B2B23] border-2 border-[#12B886] text-[#0CA678] dark:text-[#38D9A9] text-xs font-black text-center animate-fadeIn"
                  >
                    {t(
                      `✓ "${slotFeedback}" berhasil! Sekarang peragakan isyarat berikutnya.`,
                      `✓ "${slotFeedback}" matched! Now perform the next sign.`
                    )}
                  </div>
                )}

                {/* Collapsible Gesture Guide */}
                {showCameraHint && (
                  <div className="p-3.5 rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B]">
                    <div className="flex items-center gap-3">
                      <ChibiSignDemonstrator
                        character={getCharacterForSign(activeTargetSign)}
                        signClass={activeTargetSign.roboflowClass}
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#1E293B] dark:text-[#F8FAFC] leading-relaxed">
                          {language === 'en' ? activeTargetSign.hintEn : activeTargetSign.hintId}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Camera Viewport Frame */}
                <div
                  className={`relative w-full aspect-[4/3] max-w-md mx-auto bg-[#1E293B] rounded-2xl border-4 overflow-hidden flex items-center justify-center transition-colors ${
                    detectionSuccess
                      ? 'border-[#12B886] shadow-[0_6px_0_#0CA678]'
                      : 'border-[#1A8CFF] shadow-[0_6px_0_#0066CC]'
                  }`}
                >
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-200 ${
                      streamActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Framing Guide Overlay */}
                  {streamActive && !detectionSuccess && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end items-center p-3 gap-2">
                      <div className="w-[72%] h-[68%] rounded-2xl border-2 border-dashed border-white/35" />
                      <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white text-[11px] font-extrabold text-center shadow">
                        {t(
                          'Posisikan tangan di area tengah dada/wajah sesuai contoh maskot',
                          'Position hands at chest/face center matching the mascot'
                        )}
                      </div>
                    </div>
                  )}

                  {/* Corner Viewfinder Brackets */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-white pointer-events-none z-10" />
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-white pointer-events-none z-10" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-white pointer-events-none z-10" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-white pointer-events-none z-10" />

                  {/* Permission Request / Activation Prompt Overlay */}
                  {!streamActive && !cameraError && (
                    <div className="relative z-20 text-center p-5 text-white space-y-3 max-w-xs bg-black/45 backdrop-blur-sm rounded-2xl">
                      {cameraLoading && (
                        <div className="w-9 h-9 border-4 border-white/30 border-t-[#1A8CFF] rounded-full animate-spin mx-auto" />
                      )}
                      <p className="text-xs font-extrabold leading-relaxed">
                        {cameraLoading
                          ? t(
                              'Meminta izin kamera... Pilih "Allow / Izinkan" pada popup browser, atau klik tombol di bawah.',
                              'Requesting camera permission... Click "Allow" in your browser prompt, or press below.'
                            )
                          : t(
                              'Klik tombol di bawah untuk mengizinkan dan menyalakan kamera.',
                              'Click below to allow and start your camera.'
                            )}
                      </p>
                      <DuoButton
                        variant="blue"
                        size="sm"
                        onClick={() => {
                          void startWebcam(true);
                        }}
                      >
                        <Camera size={16} weight="bold" className="mr-1.5" />
                        {t('Izinkan & Nyalakan Kamera', 'Allow & Start Camera')}
                      </DuoButton>
                    </div>
                  )}

                  {/* Permission/Error State */}
                  {cameraError && (
                    <div className="relative z-20 text-center p-5 text-white space-y-3 max-w-xs bg-black/50 backdrop-blur-sm rounded-2xl">
                      <CameraSlash size={34} weight="bold" className="mx-auto text-[#FF4B4B]" />
                      <p className="text-xs font-bold text-[#FFDFE0] leading-relaxed">
                        {cameraError}
                      </p>
                      <DuoButton
                        variant="blue"
                        size="sm"
                        onClick={() => {
                          void startWebcam(true);
                        }}
                      >
                        <Camera size={16} weight="bold" className="mr-1.5" />
                        {t('Izinkan & Coba Lagi', 'Allow & Retry Camera')}
                      </DuoButton>
                    </div>
                  )}

                  {/* Clean Learner Status Pill */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-black/75 backdrop-blur-sm text-white px-3.5 py-1 rounded-full text-xs font-black flex items-center gap-2 whitespace-nowrap max-w-[90%] truncate">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        detectionSuccess
                          ? 'bg-[#12B886]'
                          : targetConfidence >= 0.22
                          ? 'bg-[#FFC800] animate-pulse'
                          : streamActive
                          ? 'bg-[#1A8CFF] animate-pulse'
                          : 'bg-gray-400'
                      }`}
                    />
                    <span className="truncate">
                      {detectionSuccess
                        ? t('Gerakan Sesuai! ✓', 'Sign Matched! ✓')
                        : targetConfidence >= 0.22
                        ? t('Pertahankan posisi tangan...', 'Hold your hand position...')
                        : streamActive
                        ? t('Peragakan isyarat di depan kamera', 'Perform the sign in front of the camera')
                        : t('Menyiapkan kamera...', 'Preparing camera...')}
                    </span>
                  </div>
                </div>

                {/* Target Match Progress Bar */}
                {(() => {
                  const matchProgress = detectionSuccess
                    ? 100
                    : Math.min(95, Math.round((targetConfidence / TARGET_CONFIDENCE_THRESHOLD) * 100));
                  return (
                    <div className="max-w-md mx-auto space-y-1">
                      <div className="flex justify-between text-xs font-black text-[#64748B] dark:text-[#94A3B8]">
                        <span>{t('Kecocokan Gerakan', 'Gesture Match')}</span>
                        <span>
                          {detectionSuccess
                            ? t('Selesai', 'Complete')
                            : matchProgress >= 50
                            ? t('Hampir tepat', 'Almost there')
                            : t('Menunggu gerakan', 'Waiting for sign')}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-[#E2E8F0] dark:bg-[#1E293B] rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            detectionSuccess ? 'bg-[#12B886]' : 'bg-[#1A8CFF]'
                          }`}
                          style={{
                            width: `${matchProgress}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {inferenceError && (
                  <div className="max-w-md mx-auto px-3.5 py-2 rounded-xl bg-[#FFF8DB] dark:bg-[#FFC800]/15 border border-[#FFC800] text-[#7A5600] dark:text-[#FFD43B] text-xs font-bold text-center">
                    {inferenceError}
                  </div>
                )}

                {/* Accessibility Skip Option */}
                <div className="max-w-md mx-auto pt-1 flex justify-center">
                  <DuoButton
                    variant="ghost"
                    size="sm"
                    onClick={handleNextStep}
                  >
                    {t('Tidak Bisa Pakai Kamera Sekarang', "Can't Use Camera Right Now")}
                  </DuoButton>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. FIXED BOTTOM ACTION & FEEDBACK SHEET */}
      <footer
        className={`w-full min-h-[7rem] md:h-28 flex items-center px-6 py-4 transition-colors duration-200 select-none ${
          quizChecked && isAnswerCorrect
            ? 'bg-[#E6FCF5] dark:bg-[#0B2B23] border-t-2 border-[#12B886]'
            : quizChecked && !isAnswerCorrect
            ? 'bg-[#FFDFE0] dark:bg-[#2F1519] border-t-2 border-[#FF4B4B]'
            : 'bg-white dark:bg-[#0F172A] border-t-2 border-[#E2E8F0] dark:border-[#334155]'
        }`}
      >
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between gap-4">
          {/* Study Step: Single Continue button */}
          {currentStep?.type === 'study' && (
            <>
              <div />
              <DuoButton
                variant="blue"
                size="lg"
                onClick={handleNextStep}
                className="w-full sm:w-auto min-w-[160px]"
              >
                {t('LANJUTKAN', 'CONTINUE')}
              </DuoButton>
            </>
          )}

          {/* Quiz Step: Left LEWATI, Right PERIKSA / Feedback message */}
          {currentStep?.type === 'quiz' && (
            <>
              {quizChecked ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                  {/* Feedback Message */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                        isAnswerCorrect
                          ? 'bg-white dark:bg-[#0F172A] text-[#12B886] dark:text-[#38D9A9] shadow-[0_2px_0_#0CA678]'
                          : 'bg-white dark:bg-[#0F172A] text-[#FF4B4B] dark:text-[#FF8787] shadow-[0_2px_0_#EA2B2B]'
                      }`}
                    >
                      {isAnswerCorrect ? (
                        <Check size={32} weight="bold" />
                      ) : (
                        <X size={32} weight="bold" />
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-2xl font-black ${
                          isAnswerCorrect
                            ? 'text-[#0CA678] dark:text-[#38D9A9]'
                            : 'text-[#EA2B2B] dark:text-[#FF8787]'
                        }`}
                      >
                        {isAnswerCorrect
                          ? t('Luar biasa!', 'Amazing!')
                          : t('Jawaban yang benar:', 'Correct answer:')}
                      </h4>
                      {!isAnswerCorrect && currentStep.correctOptionIndex !== undefined && (
                        <p className="text-sm font-black text-[#EA2B2B] dark:text-[#FF8787] mt-0.5">
                          {currentStep.options?.[currentStep.correctOptionIndex]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Advance button */}
                  <DuoButton
                    variant={isAnswerCorrect ? 'mint' : 'red'}
                    size="lg"
                    onClick={handleNextStep}
                    className="w-full sm:w-auto min-w-[160px]"
                  >
                    {t('LANJUTKAN', 'CONTINUE')}
                  </DuoButton>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <DuoButton
                    variant="white"
                    size="lg"
                    onClick={handleNextStep}
                  >
                    {t('LEWATI', 'SKIP')}
                  </DuoButton>

                  <DuoButton
                    variant="blue"
                    size="lg"
                    disabled={!selectedOption}
                    onClick={handleCheckQuiz}
                    className="min-w-[160px]"
                  >
                    {t('PERIKSA', 'CHECK')}
                  </DuoButton>
                </div>
              )}
            </>
          )}

          {/* Word-Bank Sentence Quiz Step */}
          {currentStep?.type === 'word-bank' && (
            <>
              {quizChecked ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                        isAnswerCorrect
                          ? 'bg-white dark:bg-[#0F172A] text-[#12B886] dark:text-[#38D9A9] shadow-[0_2px_0_#0CA678]'
                          : 'bg-white dark:bg-[#0F172A] text-[#FF4B4B] dark:text-[#FF8787] shadow-[0_2px_0_#EA2B2B]'
                      }`}
                    >
                      {isAnswerCorrect ? (
                        <Check size={32} weight="bold" />
                      ) : (
                        <X size={32} weight="bold" />
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-xl sm:text-2xl font-black ${
                          isAnswerCorrect
                            ? 'text-[#0CA678] dark:text-[#38D9A9]'
                            : 'text-[#EA2B2B] dark:text-[#FF8787]'
                        }`}
                      >
                        {isAnswerCorrect
                          ? t('Urutan tepat!', 'Correct sequence!')
                          : t('Urutan belum tepat. Jawaban benar:', 'Incorrect order. Correct answer:')}
                      </h4>
                      {!isAnswerCorrect && currentStep.sentence && (
                        <p
                          data-testid="word-bank-expected-answer"
                          className="text-sm font-black text-[#EA2B2B] dark:text-[#FF8787] mt-0.5"
                        >
                          {currentStep.sentence.signs.join(' + ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    {!isAnswerCorrect && (
                      <DuoButton
                        variant="white"
                        size="lg"
                        onClick={handleRetryWordBank}
                        className="flex-1 sm:flex-initial"
                      >
                        <ArrowCounterClockwise size={18} weight="bold" className="mr-1.5" />
                        {t('COBA LAGI', 'TRY AGAIN')}
                      </DuoButton>
                    )}
                    <DuoButton
                      variant={isAnswerCorrect ? 'mint' : 'red'}
                      size="lg"
                      onClick={handleNextStep}
                      className="flex-1 sm:flex-initial min-w-[150px]"
                    >
                      {t('LANJUTKAN', 'CONTINUE')}
                    </DuoButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <DuoButton
                    variant="white"
                    size="lg"
                    onClick={handleNextStep}
                  >
                    {t('LEWATI', 'SKIP')}
                  </DuoButton>

                  <DuoButton
                    variant="blue"
                    size="lg"
                    disabled={selectedWordIndices.length === 0}
                    onClick={handleCheckWordBank}
                    className="min-w-[160px]"
                  >
                    {t('PERIKSA', 'CHECK')}
                  </DuoButton>
                </div>
              )}
            </>
          )}

          {/* Camera & Chained-Camera Step */}
          {(currentStep?.type === 'camera' || currentStep?.type === 'chained-camera') && (
            <div className="flex items-center justify-between w-full gap-4">
              {detectionSuccess ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#12B886] text-white flex items-center justify-center font-black shrink-0">
                    <Check size={22} weight="bold" />
                  </div>
                  <span className="font-black text-base sm:text-lg text-[#0CA678] dark:text-[#38D9A9]">
                    {currentStep.type === 'chained-camera'
                      ? t('Kalimat Selesai!', 'Sentence Completed!')
                      : t('Gerakan Sesuai!', 'Gesture Matched!')}
                  </span>
                </div>
              ) : (
                <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">
                  {currentStep.type === 'chained-camera' && chainedState
                    ? t(
                        `Isyarat ${activeChainedIndex + 1} dari ${chainedState.expectedSigns.length}: Peragakan "${activeTargetClass}" di depan kamera.`,
                        `Sign ${activeChainedIndex + 1} of ${chainedState.expectedSigns.length}: Perform "${activeTargetClass}" in front of the camera.`
                      )
                    : t(
                        'Peragakan gerakan isyarat di depan kamera sampai indikator menyala.',
                        'Perform the sign in front of the camera until the indicator confirms a match.'
                      )}
                </p>
              )}

              <DuoButton
                variant="blue"
                size="lg"
                disabled={!detectionSuccess}
                onClick={handleNextStep}
                className="min-w-[160px]"
              >
                {t('LANJUTKAN', 'CONTINUE')}
              </DuoButton>
            </div>
          )}
        </div>
      </footer>

      {/* Completion Modal (Learn Level or Character Practice) */}
      <Modal
        isOpen={isCompletedModalOpen}
        onClose={() => navigate(exitRoute)}
      >
        <div className="text-center space-y-6 p-2 select-none">
          <div className="w-20 h-20 rounded-full bg-[#FFF8DB] dark:bg-[#FFC800]/15 border-4 border-[#FFC800] shadow-[0_4px_0_#E5B400] flex items-center justify-center text-[#FFC800] mx-auto animate-bounce">
            <HandPeace size={44} weight="fill" />
          </div>

          <div>
            <h3 className="font-black text-3xl text-[#1E293B] dark:text-[#F8FAFC]">
              {isCharacterPractice
                ? t('Latihan Karakter Selesai!', 'Character Practice Complete!')
                : t('Level Selesai!', 'Lesson Complete!')}
            </h3>
            <p className="text-sm font-extrabold text-[#64748B] dark:text-[#94A3B8] mt-1">
              {isCharacterPractice
                ? t(
                    `Kamu menyelesaikan latihan ${characterCategory === 'abjad' ? 'Abjad' : 'Angka'}: ${practicedCharacterClasses.join(', ')}.`,
                    `You practiced ${characterCategory === 'abjad' ? 'Alphabet' : 'Number'} signs: ${practicedCharacterClasses.join(', ')}.`
                  )
                : t(
                    `Kamu menyelesaikan semua latihan di Level ${levelId}.`,
                    `You practiced all signs in Level ${levelId}.`
                  )}
            </p>
          </div>

          {isCharacterPractice ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-[#162032] rounded-2xl border-2 border-[#FFC800] shadow-[0_4px_0_#E5B400] text-center">
                <span className="text-[11px] font-black uppercase text-[#B58100] dark:text-[#FFD43B] tracking-wider block">
                  {t('PENGUASAAN', 'MASTERY')}
                </span>
                <div className="font-black text-3xl text-[#E5B400] dark:text-[#FFD43B] mt-1 flex items-center justify-center gap-1">
                  <Sparkle size={24} weight="fill" />
                  <span>{characterMasterySummary?.averageMastery ?? 0}%</span>
                </div>
                <span className="text-[11px] font-extrabold text-[#B58100] dark:text-[#FFD43B] block mt-0.5">
                  {characterMasterySummary && characterMasterySummary.averageDelta > 0
                    ? `+${characterMasterySummary.averageDelta}%`
                    : t('Maksimal', 'Maxed')}
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-[#162032] rounded-2xl border-2 border-[#12B886] shadow-[0_4px_0_#0CA678] text-center">
                <span className="text-[11px] font-black uppercase text-[#0CA678] dark:text-[#38D9A9] tracking-wider block">
                  {t('KARAKTER', 'SIGNS')}
                </span>
                <div className="font-black text-3xl text-[#12B886] dark:text-[#38D9A9] mt-1 flex items-center justify-center gap-1">
                  <Check size={24} weight="bold" />
                  <span>{practicedCharacterClasses.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* XP Card */}
              <div className="p-4 bg-white dark:bg-[#162032] rounded-2xl border-2 border-[#1A8CFF] shadow-[0_4px_0_#0066CC] text-center">
                <span className="text-[11px] font-black uppercase text-[#0066CC] dark:text-[#60B2FF] tracking-wider block">
                  TOTAL XP
                </span>
                <div className="font-black text-3xl text-[#1A8CFF] dark:text-[#60B2FF] mt-1 flex items-center justify-center gap-1">
                  <Lightning size={24} weight="fill" />
                  <span>+{earnedSummary?.xpEarned || 20}</span>
                </div>
              </div>

              {/* Streak Card */}
              <div className="p-4 bg-white dark:bg-[#162032] rounded-2xl border-2 border-[#FF9600] shadow-[0_4px_0_#CC7800] text-center">
                <span className="text-[11px] font-black uppercase text-[#FF9600] tracking-wider block">
                  STREAK
                </span>
                <div className="font-black text-3xl text-[#FF9600] mt-1 flex items-center justify-center gap-1">
                  <Flame size={24} weight="fill" />
                  <span>{earnedSummary?.streakIncremented ? '+1' : t('AKTIF', 'ACTIVE')}</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <DuoButton
              variant="blue"
              size="lg"
              fullWidth
              onClick={() => navigate(exitRoute)}
            >
              {t('SELESAI', 'DONE')}
            </DuoButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
