import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { UserStatusCard } from '../components/UserStatusCard';
import { DuoButton } from '../components/DuoButton';
import { Modal } from '../components/Modal';
import { ChibiSignDemonstrator } from '../components/ChibiSignDemonstrator';
import { ABJAD_SIGNS, ANGKA_SIGNS } from '../curriculum';
import type { SignData } from '../types';
import { playSfx } from '../utils/audio';
import {
  TextAa,
  Hash,
  Lightbulb,
  Play,
  CheckCircle,
  HandPointing,
  Camera,
  Sparkle,
} from '@phosphor-icons/react';

type CharacterCategory = 'abjad' | 'angka';

const ANGKA_DIGITS: Record<string, string> = {
  Nol: '0',
  Satu: '1',
  Dua: '2',
  Tiga: '3',
  Empat: '4',
  Lima: '5',
  Enam: '6',
  Tujuh: '7',
  Delapan: '8',
  Sembilan: '9',
  Sepuluh: '10',
};

export const CharactersPage: React.FC = () => {
  const { user, loginAsGuest, getCharacterMastery, language, t } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: CharacterCategory =
    searchParams.get('tab') === 'angka' ? 'angka' : 'abjad';
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);

  const signs: SignData[] = activeTab === 'abjad' ? ABJAD_SIGNS : ANGKA_SIGNS;

  const masteredCount = signs.filter(
    sign => getCharacterMastery(sign.roboflowClass) >= 100
  ).length;
  const practicedCount = signs.filter(
    sign => getCharacterMastery(sign.roboflowClass) > 0
  ).length;

  const handleSelectTab = (tab: CharacterCategory) => {
    playSfx('select');
    setSearchParams(tab === 'abjad' ? {} : { tab: 'angka' }, { replace: true });
  };

  const handleStartPractice = (signClass?: string) => {
    if (signClass) playSfx('select');
    if (!user) {
      loginAsGuest();
    }
    if (signClass) {
      navigate(
        `/characters/practice/${activeTab}/${encodeURIComponent(signClass)}`
      );
    } else {
      navigate(`/characters/practice/${activeTab}`);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] flex pb-20 md:pb-0 transition-colors duration-200 select-none">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Main Content & 3. Right Sidebar Shell */}
      <div className="flex-1 flex justify-center px-4 lg:px-8 py-6">
        <div className="flex justify-center gap-8 xl:gap-12 w-full max-w-5xl">
          {/* Center Column */}
          <main className="w-full max-w-[600px] pt-2 pb-24 space-y-6">
            {/* Duolingo-style Top Tabs: Abjad (A-Z) | Angka (0-10) */}
            <div
              role="tablist"
              aria-label={t('Kategori Karakter BISINDO', 'BISINDO Character Categories')}
              className="grid grid-cols-2 gap-3 p-1.5 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'abjad'}
                data-testid="characters-tab-abjad"
                onClick={() => handleSelectTab('abjad')}
                className={`py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'abjad'
                    ? 'bg-[#1A8CFF] text-white shadow-[0_3px_0_#0066CC]'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <TextAa size={20} weight="bold" />
                <span>{t('Abjad (A–Z)', 'Alphabet (A–Z)')}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'angka'}
                data-testid="characters-tab-angka"
                onClick={() => handleSelectTab('angka')}
                className={`py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'angka'
                    ? 'bg-[#3B5BDB] text-white shadow-[0_3px_0_#2B44A8]'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Hash size={20} weight="bold" />
                <span>{t('Angka (0–10)', 'Numbers (0–10)')}</span>
              </button>
            </div>

            {/* Category Hero Header + Tips + Primary Practice CTA */}
            <section className="bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] p-6 space-y-5 text-center">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 text-[#0066CC] dark:text-[#60B2FF] border border-[#1A8CFF]/30">
                  <Sparkle size={14} weight="fill" />
                  {activeTab === 'abjad'
                    ? t('26 HURUF BISINDO', '26 BISINDO LETTERS')
                    : t('11 ANGKA BISINDO', '11 BISINDO NUMBERS')}
                </span>

                <span className="text-xs font-black text-[#64748B] dark:text-[#94A3B8]">
                  {masteredCount > 0
                    ? `${masteredCount} / ${signs.length} ${t('Dikuasai', 'Mastered')}`
                    : `${practicedCount} / ${signs.length} ${t('Dilatih', 'Practiced')}`}
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="font-black text-2xl sm:text-3xl text-[#1E293B] dark:text-[#F8FAFC] tracking-tight">
                  {activeTab === 'abjad'
                    ? t('Ayo belajar Abjad BISINDO!', "Let's learn BISINDO Fingerspelling!")
                    : t('Ayo belajar Angka BISINDO!', "Let's learn BISINDO Numbers!")}
                </h1>
                <p className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto leading-relaxed">
                  {activeTab === 'abjad'
                    ? t(
                        'Kuasai ejaan jari A–Z untuk mengeja nama, istilah baru, dan kata serapan secara jelas di depan kamera.',
                        'Master A–Z fingerspelling to spell names, places, and new words clearly in front of the camera.'
                      )
                    : t(
                        'Pelajari bentuk jari angka 0 hingga 10 untuk menyebutkan jumlah, waktu, dan nomor sehari-hari.',
                        'Learn hand shapes for numbers 0 through 10 to sign quantities, time, and everyday counts.'
                      )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                <DuoButton
                  variant={activeTab === 'abjad' ? 'blue' : 'cobalt'}
                  size="lg"
                  data-testid="characters-practice-btn"
                  onClick={() => handleStartPractice()}
                  className="w-full sm:w-auto min-w-[230px]"
                >
                  <Play size={18} weight="fill" className="mr-2" />
                  {t('MULAI LATIHAN', 'LEARN THE CHARACTERS')}
                </DuoButton>

                <DuoButton
                  variant="white"
                  size="lg"
                  data-testid="characters-tips-btn"
                  onClick={() => setIsTipsModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Lightbulb size={18} weight="bold" className="mr-2 text-[#FF9600]" />
                  {t('TIPS', 'TIPS')}
                </DuoButton>
              </div>
            </section>

            {/* Tactile Sign Grid with Bottom Gold Mastery Bar */}
            <section
              aria-label={
                activeTab === 'abjad'
                  ? t('Abjad BISINDO', 'BISINDO Alphabet')
                  : t('Angka BISINDO', 'BISINDO Numbers')
              }
            >
              <div
                data-testid="characters-grid"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5"
              >
                {signs.map(sign => {
                  const mastery = getCharacterMastery(sign.roboflowClass);
                  const isMastered = mastery >= 100;
                  const shortCode =
                    activeTab === 'abjad'
                      ? sign.roboflowClass
                      : ANGKA_DIGITS[sign.roboflowClass] ?? sign.roboflowClass;
                  const subLabel =
                    language === 'en' ? sign.wordEn : sign.wordId;

                  return (
                    <button
                      key={`${sign.modelCategory}-${sign.roboflowClass}`}
                      type="button"
                      data-testid={`character-card-${sign.roboflowClass}`}
                      onClick={() => handleStartPractice(sign.roboflowClass)}
                      className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] hover:border-[#1A8CFF] dark:hover:border-[#1A8CFF] active:translate-y-[3px] active:shadow-none transition-all p-3.5 flex flex-col items-center justify-between gap-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8CFF]"
                    >
                      {/* Top Badge Row */}
                      <div className="w-full flex items-center justify-between">
                        <span
                          className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-xs font-black ${
                            isMastered
                              ? 'bg-[#FFF8DB] dark:bg-[#FFC800]/20 text-[#7A5600] dark:text-[#FFD43B] border border-[#FFC800]'
                              : activeTab === 'abjad'
                              ? 'bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 text-[#0066CC] dark:text-[#60B2FF]'
                              : 'bg-[#EDF2FF] dark:bg-[#3B5BDB]/20 text-[#3B5BDB] dark:text-[#8EA4FF]'
                          }`}
                        >
                          {shortCode}
                        </span>

                        {isMastered ? (
                          <CheckCircle
                            size={18}
                            weight="fill"
                            className="text-[#FFC800]"
                            aria-label={t('Dikuasai', 'Mastered')}
                          />
                        ) : (
                          <span className="text-[10px] font-black text-[#94A3B8] dark:text-[#64748B]">
                            {mastery}%
                          </span>
                        )}
                      </div>

                      {/* Chibi Pose */}
                      <div className="py-1">
                        <ChibiSignDemonstrator
                          character={activeTab === 'abjad' ? 'kana' : 'rafael'}
                          signClass={sign.roboflowClass}
                          size="sm"
                          animate={false}
                        />
                      </div>

                      {/* Label */}
                      <div className="w-full space-y-2">
                        <div className="font-black text-sm text-[#1E293B] dark:text-[#F8FAFC] truncate">
                          {subLabel}
                        </div>

                        {/* Bottom Gold Mastery Bar (#FFC800) */}
                        <div
                          className="w-full h-2 rounded-full bg-[#E2E8F0] dark:bg-[#0F172A] overflow-hidden"
                          aria-label={`${t('Penguasaan', 'Mastery')}: ${mastery}%`}
                        >
                          <div
                            className="h-full rounded-full bg-[#FFC800] transition-all duration-300"
                            style={{ width: `${mastery}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </main>

          {/* Right Sidebar: Streak, Quests, Guest Profile */}
          <aside className="hidden lg:block w-80 shrink-0">
            <UserStatusCard />
          </aside>
        </div>
      </div>

      {/* Tips / Panduan Modal */}
      <Modal
        isOpen={isTipsModalOpen}
        onClose={() => setIsTipsModalOpen(false)}
        title={
          activeTab === 'abjad'
            ? t('Panduan Abjad BISINDO (A–Z)', 'BISINDO Alphabet Tips (A–Z)')
            : t('Panduan Angka BISINDO (0–10)', 'BISINDO Numbers Tips (0–10)')
        }
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 select-none">
          <div className="p-4 rounded-2xl bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 border-2 border-[#1A8CFF]/40 flex items-start gap-3">
            <HandPointing
              size={24}
              weight="fill"
              className="text-[#1A8CFF] dark:text-[#60B2FF] shrink-0 mt-0.5"
            />
            <div className="space-y-1">
              <h4 className="font-black text-sm text-[#0066CC] dark:text-[#60B2FF]">
                {activeTab === 'abjad'
                  ? t('Ciri Khas Abjad BISINDO', 'How BISINDO Fingerspelling Works')
                  : t('Satu Tangan (0–5) & Dua Tangan (6–10)', 'One Hand (0–5) & Two Hands (6–10)')}
              </h4>
              <p className="text-xs font-bold text-[#1E293B] dark:text-[#E2E8F0] leading-relaxed">
                {activeTab === 'abjad'
                  ? t(
                      'Berbeda dari ASL yang satu tangan, Abjad BISINDO banyak memakai dua tangan yang membentuk siluet visual huruf (misalnya A, B, H, K, M, N, P, T, W, X, Y).',
                      'Unlike single-handed ASL, BISINDO alphabet signs frequently use both hands together to mirror the letter shape (such as A, B, H, K, M, N, P, T, W, X, and Y).'
                    )
                  : t(
                      'Angka 0–5 cukup diperagakan dengan satu tangan menghadap kamera. Mulai angka 6–10, gunakan kedua tangan berdampingan (5 + jari tambahan).',
                      'Numbers 0–5 are signed with one hand facing the camera. From 6–10, hold both hands side by side (5 fingers + additional fingers).'
                    )}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#162032] border-2 border-[#E2E8F0] dark:border-[#334155] flex items-start gap-3">
            <Camera
              size={24}
              weight="bold"
              className="text-[#3B5BDB] dark:text-[#8EA4FF] shrink-0 mt-0.5"
            />
            <div className="space-y-1">
              <h4 className="font-black text-sm text-[#1E293B] dark:text-[#F8FAFC]">
                {t('Tips Deteksi Kamera Akurat', 'Tips for Reliable Camera Detection')}
              </h4>
              <ul className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] space-y-1.5 list-disc pl-4">
                <li>
                  {t(
                    'Posisikan kedua tangan di depan dada dengan pencahayaan terang dan merata.',
                    'Keep your hands at chest height with bright, even front lighting.'
                  )}
                </li>
                <li>
                  {t(
                    'Tahan posisi jari sekitar 1 detik agar kamera dapat mengenali bentuk tanganmu dengan jelas.',
                    'Hold each hand shape steady for ~1 second so the camera recognizes your sign clearly.'
                  )}
                </li>
                <li>
                  {t(
                    'Klik kartu huruf atau angka mana saja untuk latihan fokus, atau tekan "Mulai Latihan" untuk seri campuran.',
                    'Tap any character card for focused practice, or press "Learn the Characters" for a mixed drill.'
                  )}
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-2">
            <DuoButton
              variant="blue"
              size="md"
              fullWidth
              onClick={() => setIsTipsModalOpen(false)}
            >
              {t('MENGERTI', 'GOT IT')}
            </DuoButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
