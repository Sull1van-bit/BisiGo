import React, { useEffect, useState } from 'react';
import { Play, Pause, ArrowCounterClockwise } from '@phosphor-icons/react';
import { SignData } from '../types';
import { formatSignLabel } from '../curriculum';
import { useApp } from '../context/AppContext';
import { ChibiSignDemonstrator, ChibiSignDemonstratorProps } from './ChibiSignDemonstrator';

export interface SentenceSignDemonstratorProps {
  character?: 'rafael' | 'kana';
  signs: SignData[];
  size?: ChibiSignDemonstratorProps['size'];
  hideLabels?: boolean;
  autoPlayIntervalMs?: number;
  activeIndex?: number;
  onActiveIndexChange?: (idx: number) => void;
  className?: string;
}

export const SentenceSignDemonstrator: React.FC<SentenceSignDemonstratorProps> = ({
  character = 'rafael',
  signs,
  size = 'md',
  hideLabels = false,
  autoPlayIntervalMs = 1600,
  activeIndex,
  onActiveIndexChange,
  className = '',
}) => {
  const { language, t } = useApp();
  const [internalIndex, setInternalIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const signsSignature = signs.map(s => s.roboflowClass).join('|');

  useEffect(() => {
    setInternalIndex(0);
    setIsPlaying(true);
  }, [signsSignature]);

  const rawIndex = activeIndex !== undefined ? activeIndex : internalIndex;
  const currentIndex = signs.length > 0 ? Math.max(0, Math.min(signs.length - 1, rawIndex)) : 0;
  const currentSign = signs[currentIndex];

  const selectIndex = (idx: number) => {
    if (signs.length === 0) return;
    const clamped = Math.max(0, Math.min(signs.length - 1, idx));
    if (activeIndex === undefined) {
      setInternalIndex(clamped);
    }
    onActiveIndexChange?.(clamped);
  };

  useEffect(() => {
    if (!isPlaying || signs.length <= 1) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      const nextIndex = (currentIndex + 1) % signs.length;
      if (activeIndex === undefined) {
        setInternalIndex(nextIndex);
      }
      onActiveIndexChange?.(nextIndex);
    }, autoPlayIntervalMs);

    return () => window.clearTimeout(timerId);
  }, [isPlaying, currentIndex, signs.length, autoPlayIntervalMs, activeIndex, onActiveIndexChange]);

  if (signs.length === 0 || !currentSign) {
    return null;
  }

  const handleReplay = () => {
    selectIndex(0);
    setIsPlaying(true);
  };

  return (
    <div
      data-testid="sentence-demonstrator"
      className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] ${className}`}
    >
      {/* Active Step Badge */}
      <div className="px-3 py-1 rounded-full bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 border border-[#1A8CFF]/40 text-[#0066CC] dark:text-[#60B2FF] text-xs font-black tracking-wide">
        {hideLabels
          ? t(`Isyarat ${currentIndex + 1} dari ${signs.length}`, `Sign ${currentIndex + 1} of ${signs.length}`)
          : `${currentIndex + 1}/${signs.length} · ${formatSignLabel(currentSign, language)}`}
      </div>

      {/* Chibi Mascot Demonstrating Current Sign */}
      <div className="flex items-center justify-center">
        <ChibiSignDemonstrator
          key={`${currentIndex}-${currentSign.roboflowClass}`}
          character={character}
          signClass={currentSign.roboflowClass}
          size={size}
          animate={isPlaying}
          ariaLabel={
            hideLabels
              ? t(
                  `Demonstrasi isyarat BISINDO oleh ${character === 'rafael' ? 'Rafael' : 'Kana'}`,
                  `BISINDO sign demonstration by ${character === 'rafael' ? 'Rafael' : 'Kana'}`
                )
              : undefined
          }
        />
      </div>

      {/* Clickable Step Indicator Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {signs.map((sign, idx) => {
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={`${sign.roboflowClass}-${idx}`}
              type="button"
              data-testid={`demo-step-pill-${idx}`}
              onClick={() => selectIndex(idx)}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={
                hideLabels
                  ? t(`Tampilkan isyarat ${idx + 1}`, `Show sign ${idx + 1}`)
                  : `${idx + 1}. ${formatSignLabel(sign, language)}`
              }
              className={`px-3 py-1 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[#1A8CFF] text-white border-[#0066CC] shadow-[0_2px_0_#0066CC]'
                  : 'bg-white dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155] hover:border-[#1A8CFF] hover:text-[#1A8CFF]'
              }`}
            >
              {hideLabels ? idx + 1 : `${idx + 1}. ${formatSignLabel(sign, language)}`}
            </button>
          );
        })}
      </div>

      {/* Playback Controls: Play/Pause & Replay */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          data-testid="demo-play-pause"
          onClick={() => setIsPlaying(prev => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#162032] text-[#1E293B] dark:text-[#F8FAFC] hover:border-[#1A8CFF] hover:text-[#1A8CFF] transition-colors cursor-pointer"
        >
          {isPlaying ? <Pause size={14} weight="bold" /> : <Play size={14} weight="bold" />}
          <span>{isPlaying ? t('Jeda', 'Pause') : t('Putar', 'Play')}</span>
        </button>

        <button
          type="button"
          data-testid="demo-replay"
          onClick={handleReplay}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#162032] text-[#1E293B] dark:text-[#F8FAFC] hover:border-[#1A8CFF] hover:text-[#1A8CFF] transition-colors cursor-pointer"
        >
          <ArrowCounterClockwise size={14} weight="bold" />
          <span>{t('Ulangi', 'Replay')}</span>
        </button>
      </div>
    </div>
  );
};
