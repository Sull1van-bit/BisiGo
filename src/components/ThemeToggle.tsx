import React from 'react';
import { Moon, Sun } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

/** Tactile Sun/Moon button aligned with BisiGo 3D surfaces. */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  compact = false,
  className = '',
}) => {
  const { theme, toggleTheme, t } = useApp();
  const isDark = theme === 'dark';

  const label = isDark
    ? t('MODE TERANG', 'LIGHT MODE')
    : t('MODE GELAP', 'DARK MODE');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t('Aktifkan mode terang', 'Switch to light mode') : t('Aktifkan mode gelap', 'Switch to dark mode')}
      title={label}
      className={`inline-flex items-center justify-center gap-2.5 rounded-xl border-2 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-[#E2E8F0]/60 dark:hover:bg-[#273549] text-[#1E293B] dark:text-[#F8FAFC] shadow-[0_2px_0_#CBD5E1] dark:shadow-[0_2px_0_#090E1A] active:translate-y-[2px] active:shadow-none transition-all duration-75 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8CFF] ${
        compact ? 'w-10 h-10 p-0' : 'px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider w-full'
      } ${className}`}
    >
      {isDark ? (
        <Sun size={18} weight="fill" className="text-[#FFC800] shrink-0" />
      ) : (
        <Moon size={18} weight="fill" className="text-[#3B5BDB] shrink-0" />
      )}
      {!compact && <span>{label}</span>}
    </button>
  );
};
