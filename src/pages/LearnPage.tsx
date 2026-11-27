import React, { useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { UserStatusCard } from '../components/UserStatusCard';
import { DuoButton } from '../components/DuoButton';
import { Mascot } from '../components/Mascot';
import { CURRICULUM } from '../curriculum';
import { LevelData, UnitData } from '../types';
import {
  Lock,
  Star,
  VideoCamera,
  BookOpen,
  Crown,
  Play,
  TextAa,
  ArrowRight,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DuoButtonVariant } from '../components/DuoButton';
import { playSfx } from '../utils/audio';

interface UnitThemeStyle {
  bannerBg: string;
  bannerShadow: string;
  guidebookIconColor: string;
  nodeUnlockedBg: string;
  ringBorder: string;
  badgeClasses: string;
  tutorPillClasses: string;
  ctaVariant: DuoButtonVariant;
}

const UNIT_THEMES: Record<UnitData['theme'], UnitThemeStyle> = {
  emerald: {
    bannerBg: 'bg-[#12B886]',
    bannerShadow: 'shadow-[0_4px_0_#0CA678]',
    guidebookIconColor: 'text-[#0CA678]',
    nodeUnlockedBg: 'bg-[#12B886] text-white shadow-[0_6px_0_#0CA678] hover:bg-[#20C997]',
    ringBorder: 'border-[#12B886]',
    badgeClasses: 'bg-[#E6FCF5] dark:bg-[#0B2B23] text-[#0CA678] dark:text-[#38D9A9]',
    tutorPillClasses:
      'bg-[#E6FCF5] dark:bg-[#0B2B23] text-[#0CA678] dark:text-[#38D9A9] border-[#12B886]/30 dark:border-[#12B886]/40',
    ctaVariant: 'mint',
  },
  blue: {
    bannerBg: 'bg-[#1A8CFF]',
    bannerShadow: 'shadow-[0_4px_0_#0066CC]',
    guidebookIconColor: 'text-[#0066CC]',
    nodeUnlockedBg: 'bg-[#1A8CFF] text-white shadow-[0_6px_0_#0066CC] hover:bg-[#339BFF]',
    ringBorder: 'border-[#1A8CFF]',
    badgeClasses: 'bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 text-[#0066CC] dark:text-[#60B2FF]',
    tutorPillClasses:
      'bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 text-[#0066CC] dark:text-[#60B2FF] border-[#1A8CFF]/30 dark:border-[#1A8CFF]/40',
    ctaVariant: 'blue',
  },
  gold: {
    bannerBg: 'bg-[#E68A00]',
    bannerShadow: 'shadow-[0_4px_0_#B36B00]',
    guidebookIconColor: 'text-[#B36B00]',
    nodeUnlockedBg: 'bg-[#FF9600] text-white shadow-[0_6px_0_#CC7800] hover:bg-[#FFA726]',
    ringBorder: 'border-[#FF9600]',
    badgeClasses: 'bg-[#FFF8DB] dark:bg-[#FF9600]/15 text-[#9A5B00] dark:text-[#FFD43B]',
    tutorPillClasses:
      'bg-[#FFF8DB] dark:bg-[#FF9600]/15 text-[#9A5B00] dark:text-[#FFD43B] border-[#FF9600]/30 dark:border-[#FF9600]/40',
    ctaVariant: 'gold',
  },
  violet: {
    bannerBg: 'bg-[#7C3AED]',
    bannerShadow: 'shadow-[0_4px_0_#5B21B6]',
    guidebookIconColor: 'text-[#5B21B6]',
    nodeUnlockedBg: 'bg-[#7C3AED] text-white shadow-[0_6px_0_#5B21B6] hover:bg-[#8B5CF6]',
    ringBorder: 'border-[#7C3AED]',
    badgeClasses: 'bg-[#F3E8FF] dark:bg-[#7C3AED]/20 text-[#6D28D9] dark:text-[#C4B5FD]',
    tutorPillClasses:
      'bg-[#F3E8FF] dark:bg-[#7C3AED]/20 text-[#6D28D9] dark:text-[#C4B5FD] border-[#7C3AED]/30 dark:border-[#7C3AED]/40',
    ctaVariant: 'cobalt',
  },
  teal: {
    bannerBg: 'bg-[#0D9488]',
    bannerShadow: 'shadow-[0_4px_0_#0F766E]',
    guidebookIconColor: 'text-[#0F766E]',
    nodeUnlockedBg: 'bg-[#0D9488] text-white shadow-[0_6px_0_#0F766E] hover:bg-[#14B8A6]',
    ringBorder: 'border-[#0D9488]',
    badgeClasses: 'bg-[#CCFBF1] dark:bg-[#0D9488]/20 text-[#0F766E] dark:text-[#5EEAD4]',
    tutorPillClasses:
      'bg-[#CCFBF1] dark:bg-[#0D9488]/20 text-[#0F766E] dark:text-[#5EEAD4] border-[#0D9488]/30 dark:border-[#0D9488]/40',
    ctaVariant: 'mint',
  },
};

function buildConnectorPath(
  nodeCount: number,
  offsets: number[],
  topY: number,
  rowStep: number
): { path: string; height: number } {
  if (nodeCount <= 1) {
    return { path: '', height: Math.max(120, topY + 64) };
  }

  const points = Array.from({ length: nodeCount }, (_, idx) => ({
    x: 100 + offsets[idx % offsets.length],
    y: topY + idx * rowStep,
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
  }

  return {
    path: d,
    height: points[points.length - 1].y + 64,
  };
}

export const LearnPage: React.FC = () => {
  const { user, unlockedLevels, completedLevels, language, t } = useApp();
  const navigate = useNavigate();

  // Active popover state
  const [selectedNode, setSelectedNode] = useState<{
    level: LevelData;
    unit: UnitData;
    rect?: DOMRect;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close popover on outside click or Escape key
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.node-popover-container') && !target.closest('.path-node-btn')) {
        setSelectedNode(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Keep opened popover fully visible above bottom viewport / mobile nav
  useEffect(() => {
    if (!selectedNode) return;
    const frameId = requestAnimationFrame(() => {
      popoverRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => cancelAnimationFrame(frameId);
  }, [selectedNode]);

  if (user === null) {
    return <Navigate to="/" replace />;
  }

  // Find the current active level (first unlocked not yet completed)
  const currentActiveLevelId = (() => {
    for (const unit of CURRICULUM) {
      for (const level of unit.levels) {
        if (unlockedLevels.includes(level.id) && !completedLevels.includes(level.id)) {
          return level.id;
        }
      }
    }
    return null;
  })();

  const handleNodeClick = (level: LevelData, unit: UnitData) => {
    playSfx('select');
    if (selectedNode?.level.id === level.id) {
      setSelectedNode(null);
    } else {
      setSelectedNode({ level, unit });
    }
  };

  // S-Curve horizontal offset for path nodes: 0px, 48px, 0px, -48px
  const sOffsets = [0, 48, 0, -48];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] flex pb-20 md:pb-0 transition-colors duration-200" ref={containerRef}>
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Main Content & 3. Right Sidebar Shell */}
      <div className="flex-1 flex justify-center px-4 lg:px-8 py-6">
        <div className="flex justify-center gap-8 xl:gap-12 w-full max-w-5xl">
          {/* Center Column: The Real Duolingo Stepping-Stone Path */}
          <main className="w-full max-w-[540px] pt-2 pb-28 space-y-12">
            {/* Quick-link banner to Characters (Abjad A-Z & Angka 0-10) */}
            <div className="bg-[#F8FAFC] dark:bg-[#1E293B] rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 border-2 border-[#1A8CFF] flex items-center justify-center text-[#1A8CFF] dark:text-[#60B2FF] shrink-0">
                  <TextAa size={20} weight="bold" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-sm text-[#1E293B] dark:text-[#F8FAFC] truncate">
                    {t('Huruf (A–Z) & Angka (0–10)', 'Alphabet (A–Z) & Numbers (0–10)')}
                  </p>
                  <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] truncate">
                    {t(
                      'Latih ejaan jari dan angka di halaman khusus Karakter.',
                      'Practice fingerspelling and numbers in the dedicated Characters track.'
                    )}
                  </p>
                </div>
              </div>

              <DuoButton
                variant="white-blue"
                size="sm"
                to="/characters"
                className="shrink-0"
              >
                <span>{t('BUKA', 'OPEN')}</span>
                <ArrowRight size={14} weight="bold" className="ml-1.5" />
              </DuoButton>
            </div>

            {CURRICULUM.map((unit: UnitData, unitIndex: number) => {
              const themeStyle = UNIT_THEMES[unit.theme] ?? UNIT_THEMES.blue;
              const useRafael = unitIndex % 2 === 0;
              const tutorName = useRafael ? 'Rafael' : 'Kana';
              const isFirstLevelCurrent = unit.levels[0]?.id === currentActiveLevelId;
              const connector = buildConnectorPath(
                unit.levels.length,
                sOffsets,
                isFirstLevelCurrent ? 78 : 50,
                146
              );

              return (
                <section key={unit.id} className="space-y-8">
                  {/* Unit Header Banner with Guidebook button */}
                  <div
                    data-testid={`unit-banner-${unit.id}`}
                    className={`${themeStyle.bannerBg} rounded-2xl p-5 text-white flex items-center justify-between gap-4 ${themeStyle.bannerShadow}`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-black uppercase tracking-wider opacity-90 block">
                        UNIT {unitIndex + 1}
                      </span>
                      <h2 className="font-black text-xl sm:text-2xl tracking-tight leading-tight">
                        {language === 'en' ? unit.title.en : unit.title.id}
                      </h2>
                      <p className="text-xs sm:text-sm font-bold opacity-95 max-w-sm">
                        {language === 'en' ? unit.description.en : unit.description.id}
                      </p>
                    </div>

                    <DuoButton
                      variant="white"
                      size="sm"
                      to="/dictionary"
                      className="shrink-0 font-black text-xs"
                    >
                      <BookOpen size={18} weight="bold" className={`mr-1.5 ${themeStyle.guidebookIconColor} dark:text-[#F8FAFC]`} />
                      {t('KAMUS', 'GUIDEBOOK')}
                    </DuoButton>
                  </div>

                  {/* 3D Stepping-Stone Path Nodes */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`mb-6 xl:mb-0 xl:absolute xl:top-24 z-10 flex flex-col items-center ${
                        useRafael ? 'xl:right-1' : 'xl:left-1'
                      }`}
                    >
                      <div className="rounded-full dark:bg-[radial-gradient(circle_at_center,rgba(26,140,255,0.18),transparent_70%)]">
                        <Mascot
                          directions={useRafael ? '/mascots/rafael-directions.webp' : '/mascots/kana-directions.webp'}
                          reactions={useRafael ? '/mascots/rafael-reactions.webp' : '/mascots/kana-reactions.webp'}
                          size={104}
                          label={`${tutorName}, tutor Unit ${unitIndex + 1}`}
                        />
                      </div>
                      <span
                        className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${themeStyle.tutorPillClasses}`}
                      >
                        {tutorName}
                      </span>
                    </div>

                    <div
                      className={`relative w-full pb-4 flex flex-col items-center gap-12 ${
                        isFirstLevelCurrent ? 'pt-11' : 'pt-4'
                      }`}
                    >
                      {/* Dynamic SVG Connector Path scaled to unit.levels.length */}
                      {connector.path && (
                        <svg
                          className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-full pointer-events-none"
                          viewBox={`0 0 200 ${connector.height}`}
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <path
                            d={connector.path}
                            fill="none"
                            className="stroke-[#E2E8F0] dark:stroke-[#334155]"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="12 12"
                          />
                        </svg>
                      )}

                      {unit.levels.map((level, idx) => {
                        const isCompleted = completedLevels.includes(level.id);
                        const isUnlocked = unlockedLevels.includes(level.id);
                        const isCurrent = level.id === currentActiveLevelId;
                        const isSelected = selectedNode?.level.id === level.id;
                        const offsetPx = sOffsets[idx % sOffsets.length];
                        const sentenceCount = level.sentences?.length ?? 0;

                        // 3D Node Color Tokens
                        let nodeBg =
                          'bg-[#E2E8F0] dark:bg-[#283548] text-[#94A3B8] dark:text-[#64748B] shadow-[0_6px_0_#CBD5E1] dark:shadow-[0_6px_0_#070B14]';
                        if (isCompleted) {
                          nodeBg =
                            'bg-[#FFC800] text-white shadow-[0_6px_0_#E5B400] hover:bg-[#FFD324]';
                        } else if (isUnlocked) {
                          nodeBg = themeStyle.nodeUnlockedBg;
                        }

                        const levelSummaryText = level.isUnitReview
                          ? t('Ujian Kalimat & Kamera', 'Sentence & Camera Review')
                          : sentenceCount > 0 && level.signs.length === 0
                          ? `${sentenceCount} ${t('Latihan Kalimat BISINDO', 'BISINDO Sentence Exercises')}`
                          : sentenceCount > 0
                          ? `${level.signs.length} ${t('Isyarat', 'Signs')} · ${sentenceCount} ${t('Kalimat', 'Sentences')}`
                          : `${level.signs.length} ${t('Isyarat BISINDO', 'BISINDO Signs')}`;

                        return (
                          <div
                            key={level.id}
                            className={`relative ${isSelected ? 'z-20' : 'z-10'} flex flex-col items-center ${
                              isCurrent && idx > 0 ? 'mt-5' : ''
                            }`}
                          >
                            <div
                              className="flex flex-col items-center"
                              style={{ transform: `translateX(${offsetPx}px)` }}
                            >
                              <div className="relative flex items-center justify-center">
                                {/* Active Node Speech Bubble */}
                                {isCurrent && (
                                  <div className="absolute -top-11 z-20 flex flex-col items-center pointer-events-none">
                                    <div className="bg-white dark:bg-[#1E293B] border-2 border-[#E2E8F0] dark:border-[#334155] text-[#0066CC] dark:text-[#60B2FF] font-black uppercase text-xs px-3 py-1 rounded-xl shadow-sm tracking-wider flex items-center gap-1 whitespace-nowrap">
                                      <Play size={12} weight="fill" />
                                      <span>{t('MULAI', 'START')}</span>
                                    </div>
                                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#E2E8F0] dark:border-t-[#334155]" />
                                  </div>
                                )}

                                {/* Outer ring scoped strictly around the 3D button so it never cuts into the label */}
                                {isCurrent && (
                                  <div className={`absolute -inset-2.5 rounded-full border-4 border-dashed ${themeStyle.ringBorder} pointer-events-none`} />
                                )}

                                {/* 3D Oval Token Button */}
                                <button
                                  type="button"
                                  onClick={() => handleNodeClick(level, unit)}
                                  aria-expanded={isSelected}
                                  aria-haspopup="dialog"
                                  className={`path-node-btn w-[78px] h-[70px] rounded-full flex items-center justify-center relative active:translate-y-[6px] active:shadow-none transition-all duration-75 select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A8CFF] ${nodeBg} ${
                                    isSelected ? 'ring-4 ring-[#1A8CFF] ring-offset-2 dark:ring-offset-[#0F172A]' : ''
                                  }`}
                                  aria-label={`Level ${level.id}: ${
                                    language === 'en' ? level.title.en : level.title.id
                                  }`}
                                >
                                  {/* Inner glossy reflection arc */}
                                  {(isUnlocked || isCompleted) && (
                                    <span className="w-9 h-3 bg-white/25 rounded-full absolute top-2 left-4 pointer-events-none" />
                                  )}

                                  {isCompleted ? (
                                    <Crown size={36} weight="fill" className="text-white drop-shadow-sm" />
                                  ) : isUnlocked ? (
                                    level.isUnitReview ? (
                                      <VideoCamera size={34} weight="fill" className="text-white drop-shadow-sm" />
                                    ) : (
                                      <Star size={34} weight="fill" className="text-white drop-shadow-sm" />
                                    )
                                  ) : (
                                    <Lock size={30} weight="bold" className="text-[#94A3B8] dark:text-[#64748B]" />
                                  )}
                                </button>
                              </div>

                              {/* Level ID Subtitle */}
                              <span className="text-xs font-black text-[#64748B] dark:text-[#94A3B8] mt-3 tracking-wide text-center">
                                {language === 'en' ? level.title.en : level.title.id}
                              </span>
                            </div>

                            {/* Interactive Node Card: in-flow so it pushes subsequent nodes/banners down with zero overlap */}
                            <AnimatePresence initial={false}>
                              {isSelected && (
                                <div
                                  ref={popoverRef}
                                  className="node-popover-container relative mt-4 z-20 w-72 max-w-[calc(100vw-2rem)] scroll-mb-24"
                                >
                                  <motion.div
                                    role="dialog"
                                    aria-label={`Level ${level.id}`}
                                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                                    transition={{ duration: 0.15 }}
                                    className="relative bg-white dark:bg-[#1E293B] rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] p-5 shadow-xl text-center space-y-3"
                                  >
                                    {/* Top triangle arrow aligned to the clicked node center */}
                                    <div
                                      className="absolute -top-2 w-4 h-4 bg-white dark:bg-[#1E293B] border-t-2 border-l-2 border-[#E2E8F0] dark:border-[#334155] -translate-x-1/2 rotate-45"
                                      style={{ left: `calc(50% + ${offsetPx}px)` }}
                                    />

                                    {isUnlocked ? (
                                      <>
                                        <div className="space-y-1">
                                          <span
                                            className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-lg ${
                                              isCompleted
                                                ? 'bg-[#FFF8DB] dark:bg-[#FFC800]/15 text-[#7A5600] dark:text-[#FFD43B]'
                                                : themeStyle.badgeClasses
                                            }`}
                                          >
                                            LEVEL {level.id}
                                          </span>
                                          <h3 className="font-black text-lg text-[#1E293B] dark:text-[#F8FAFC]">
                                            {language === 'en' ? level.title.en : level.title.id}
                                          </h3>
                                          <p className="text-xs font-extrabold text-[#64748B] dark:text-[#94A3B8]">
                                            {levelSummaryText}
                                          </p>
                                        </div>

                                        <DuoButton
                                          variant={themeStyle.ctaVariant}
                                          size="md"
                                          fullWidth
                                          onClick={() => navigate(`/lesson/${level.id}`)}
                                        >
                                          {isCompleted
                                            ? t('LATIHAN LAGI +10 XP', 'PRACTICE +10 XP')
                                            : t('MULAI +20 XP', 'START +20 XP')}
                                        </DuoButton>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-12 h-12 rounded-full bg-[#E2E8F0] dark:bg-[#162032] flex items-center justify-center text-[#94A3B8] dark:text-[#64748B] mx-auto">
                                          <Lock size={24} weight="bold" />
                                        </div>
                                        <div>
                                          <h4 className="font-black text-base text-[#1E293B] dark:text-[#F8FAFC]">
                                            Level {level.id} {t('Terkunci', 'Locked')}
                                          </h4>
                                          <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">
                                            {t(
                                              'Selesaikan level sebelumnya di unit ini untuk membuka materi ini!',
                                              'Complete the previous level in this unit to unlock this lesson!'
                                            )}
                                          </p>
                                        </div>
                                        <DuoButton variant="white" size="md" fullWidth disabled>
                                          {t('TERKUNCI', 'LOCKED')}
                                        </DuoButton>
                                      </>
                                    )}
                                  </motion.div>
                                </div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
          </main>

          {/* Right Sidebar: Streak, Quests, Guest Profile */}
          <aside className="hidden lg:block w-80 shrink-0">
            <UserStatusCard />
          </aside>
        </div>
      </div>
    </div>
  );
};
