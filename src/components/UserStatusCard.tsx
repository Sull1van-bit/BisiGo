import React from 'react';
import { useApp } from '../context/AppContext';
import { DuoButton } from './DuoButton';
import {
  Flame,
  Lightning,
  Trophy,
  Check,
} from '@phosphor-icons/react';

export const UserStatusCard: React.FC = () => {
  const {
    user,
    streak,
    lastCompletedDate,
    xp,
    language,
    setLanguage,
    t,
  } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const isStreakActiveToday = lastCompletedDate === today;

  const dayOfWeek = new Date().getDay();
  const daysId = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
  const daysEn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayLabels = language === 'en' ? daysEn : daysId;

  const xpQuestProgress = Math.min(xp, 20);
  const xpQuestPercent = Math.round((xpQuestProgress / 20) * 100);

  return (
    <div className="space-y-5 w-80 shrink-0 select-none">
      {/* 1. Top Status Row: Language Pill, Streak, XP */}
      <div className="flex items-center justify-between px-2 py-1">
        <div className="inline-flex rounded-xl border-2 border-[#E2E8F0] dark:border-[#334155] p-0.5 bg-[#F8FAFC] dark:bg-[#1E293B]">
          <button
            type="button"
            onClick={() => setLanguage('id')}
            className={`px-2.5 py-1 text-xs font-black rounded-lg transition-colors ${
              language === 'id'
                ? 'bg-white dark:bg-[#0F172A] text-[#1A8CFF] dark:text-[#60B2FF] shadow-sm'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
            }`}
          >
            ID
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-black rounded-lg transition-colors ${
              language === 'en'
                ? 'bg-white dark:bg-[#0F172A] text-[#3B5BDB] dark:text-[#8EA4FF] shadow-sm'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
            }`}
          >
            EN
          </button>
        </div>

        <div className="flex items-center gap-1.5 font-black text-lg text-[#FF9600]">
          <Flame size={24} weight="fill" className="text-[#FF9600]" />
          <span>{streak}</span>
        </div>

        <div className="flex items-center gap-1.5 font-black text-lg text-[#1A8CFF]">
          <Lightning size={24} weight="fill" className="text-[#1A8CFF]" />
          <span>{xp}</span>
        </div>
      </div>

      {/* 2. Daily Streak Widget Card */}
      <div className="border-2 border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 bg-white dark:bg-[#1E293B] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-[#1E293B] dark:text-[#F8FAFC]">
            {t('Hari Beruntun', 'Daily Streak')}
          </h3>
          <span className="text-xs font-black text-[#FF9600] uppercase tracking-wide">
            {streak} {t('HARI', 'DAYS')}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {dayLabels.map((dayLabel, idx) => {
            const isToday = idx === dayOfWeek;
            const isChecked = isToday && isStreakActiveToday;

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-black text-[#94A3B8] dark:text-[#64748B]">
                  {dayLabel}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                    isChecked
                      ? 'bg-[#FF9600] text-white shadow-[0_2px_0_#CC7800]'
                      : isToday
                      ? 'border-2 border-dashed border-[#FF9600] text-[#FF9600] bg-[#FFF8DB] dark:bg-[#FF9600]/15'
                      : 'border-2 border-[#E2E8F0] dark:border-[#334155] text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#162032]'
                  }`}
                >
                  {isChecked ? (
                    <Check size={16} weight="bold" />
                  ) : (
                    <Flame size={14} weight="fill" className={isToday ? 'text-[#FF9600]' : 'text-[#CBD5E1] dark:text-[#475569]'} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-bold text-center">
          {isStreakActiveToday
            ? t('Streak aktif hari ini! Pertahankan ritmemu.', 'Streak active today! Keep it going.')
            : t('Selesaikan 1 level hari ini untuk menyalakan apimu!', 'Complete 1 level today to ignite your streak!')}
        </p>
      </div>

      {/* 3. Daily Quests Card */}
      <div className="border-2 border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 bg-white dark:bg-[#1E293B] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={22} weight="fill" className="text-[#FFC800]" />
            <h3 className="font-extrabold text-base text-[#1E293B] dark:text-[#F8FAFC]">
              {t('Target Harian', 'Daily Quests')}
            </h3>
          </div>
          <span className="text-xs font-black text-[#1A8CFF] dark:text-[#60B2FF] uppercase">
            {t('LIHAT SEMUA', 'VIEW ALL')}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-extrabold">
            <span className="text-[#1E293B] dark:text-[#F8FAFC]">{t('Dapatkan 20 XP', 'Earn 20 XP')}</span>
            <span className="text-[#64748B] dark:text-[#94A3B8]">{xpQuestProgress} / 20 XP</span>
          </div>
          <div className="h-3 w-full bg-[#E2E8F0] dark:bg-[#0F172A] rounded-full overflow-hidden p-0.5 relative">
            <div
              className="h-full bg-[#1A8CFF] rounded-full transition-all duration-300"
              style={{ width: `${xpQuestPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-extrabold">
            <span className="text-[#1E293B] dark:text-[#F8FAFC]">
              {t('Praktikkan 3 Isyarat Kamera', 'Practice 3 Camera Signs')}
            </span>
            <span className="text-[#64748B] dark:text-[#94A3B8]">
              {xp >= 20 ? '3 / 3' : '1 / 3'}
            </span>
          </div>
          <div className="h-3 w-full bg-[#E2E8F0] dark:bg-[#0F172A] rounded-full overflow-hidden p-0.5 relative">
            <div
              className="h-full bg-[#3B5BDB] rounded-full transition-all duration-300"
              style={{ width: xp >= 20 ? '100%' : '33%' }}
            />
          </div>
        </div>
      </div>

      {/* 4. Guest Profile Prompt Card */}
      {user?.isGuest && (
        <div className="border-2 border-[#1A8CFF] rounded-2xl p-5 bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 space-y-3">
          <h4 className="font-black text-lg text-[#0066CC] dark:text-[#60B2FF]">
            {t('Simpan Progresmu!', 'Create a Profile!')}
          </h4>
          <p className="text-xs text-[#1E293B] dark:text-[#E2E8F0] font-bold leading-relaxed">
            {t(
              'Buat profil gratis untuk menyimpan streak, mahkota level, dan bersaing di liga.',
              'Create a free profile to save your streak, crowns, and compete with friends.'
            )}
          </p>
          <div className="space-y-2 pt-1">
            <DuoButton variant="blue" size="md" fullWidth to="/auth">
              {t('BUAT PROFIL', 'CREATE PROFILE')}
            </DuoButton>
            <DuoButton variant="white-blue" size="md" fullWidth to="/auth">
              {t('MASUK', 'SIGN IN')}
            </DuoButton>
          </div>
        </div>
      )}
    </div>
  );
};
