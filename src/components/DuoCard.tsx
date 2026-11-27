import React, { ReactNode } from 'react';
import { playSfx } from '../utils/audio';

export interface DuoCardProps {
  children: ReactNode;
  selected?: boolean;
  status?: 'default' | 'selected' | 'correct' | 'wrong';
  shortcutNumber?: number | string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const DuoCard: React.FC<DuoCardProps> = ({
  children,
  selected = false,
  status = 'default',
  shortcutNumber,
  onClick,
  className = '',
  disabled = false,
}) => {
  const effectiveStatus = selected ? 'selected' : status;

  let stateClasses =
    'bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#273549] text-[#1E293B] dark:text-[#F8FAFC] border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] active:translate-y-[4px] active:shadow-none';

  let shortcutClass = 'border-2 border-[#E2E8F0] dark:border-[#334155] text-[#94A3B8] bg-white dark:bg-[#0F172A]';

  if (effectiveStatus === 'selected') {
    stateClasses =
      'bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 text-[#0066CC] dark:text-[#60B2FF] border-2 border-[#1A8CFF] shadow-[0_4px_0_#1A8CFF]';
    shortcutClass = 'border-2 border-[#1A8CFF] text-[#0066CC] dark:text-[#60B2FF] bg-white dark:bg-[#0F172A]';
  } else if (effectiveStatus === 'correct') {
    stateClasses =
      'bg-[#E6FCF5] dark:bg-[#0B2B23] text-[#0CA678] dark:text-[#38D9A9] border-2 border-[#12B886] shadow-[0_4px_0_#0CA678]';
    shortcutClass = 'border-2 border-[#12B886] text-[#0CA678] dark:text-[#38D9A9] bg-white dark:bg-[#0F172A]';
  } else if (effectiveStatus === 'wrong') {
    stateClasses =
      'bg-[#FFDFE0] dark:bg-[#2F1519] text-[#EA2B2B] dark:text-[#FF8787] border-2 border-[#FF4B4B] shadow-[0_4px_0_#EA2B2B]';
    shortcutClass = 'border-2 border-[#FF4B4B] text-[#EA2B2B] dark:text-[#FF8787] bg-white dark:bg-[#0F172A]';
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        playSfx('select');
        onClick?.();
      }}
      className={`w-full text-left font-bold rounded-2xl px-5 py-3.5 transition-all duration-75 select-none flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8CFF] ${stateClasses} ${
        disabled ? 'cursor-not-allowed opacity-60 active:translate-y-0 shadow-none' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="flex items-center gap-3.5 flex-1">
        {shortcutNumber && (
          <span
            className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${shortcutClass}`}
          >
            {shortcutNumber}
          </span>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </button>
  );
};
