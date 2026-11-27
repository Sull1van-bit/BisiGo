import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { DuoButton } from '../components/DuoButton';
import { DuoCard } from '../components/DuoCard';
import { Mascot } from '../components/Mascot';
import { ChibiSignDemonstrator } from '../components/ChibiSignDemonstrator';
import { formatSignLabel, ALL_SIGNS, getSignByClass } from '../curriculum';
import {
  CheckCircle,
  Eye,
  Question,
  VideoCamera,
  Lightning,
  Flame,
} from '@phosphor-icons/react';

export const HomePage: React.FC = () => {
  const { user, loginAsGuest, language, t } = useApp();
  const navigate = useNavigate();

  const [activeSignIndex, setActiveSignIndex] = useState(1); // Terima Kasih by default
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  // Redirect to /learn if already authenticated or guest
  if (user !== null) {
    return <Navigate to="/learn" replace />;
  }

  // Showcase signs across BISINDO models: Saya, Terima Kasih, Satu
  const showcaseSigns = [
    getSignByClass('Saya'),
    getSignByClass('Terima Kasih'),
    getSignByClass('Satu'),
  ].filter((sign): sign is NonNullable<typeof sign> => Boolean(sign));

  const activeSign = showcaseSigns[activeSignIndex] ?? showcaseSigns[0];

  const handleStartGuest = () => {
    loginAsGuest();
    navigate('/learn');
  };

  const handleCheckQuiz = (option: string) => {
    setSelectedQuizOption(option);
    if (option === activeSign.wordId) {
      setQuizFeedback('correct');
    } else {
      setQuizFeedback('incorrect');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0F172A] transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 md:py-16 space-y-20 select-none">
        {/* HERO SECTION (max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center) */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side: Interactive Visual Showcase Card with Floating Badges */}
          <div className="relative">
            {/* Floating Game Badges */}
            <div className="absolute -top-4 -left-3 z-20 bg-white dark:bg-[#1E293B] border-2 border-[#1A8CFF] shadow-[0_4px_0_#0066CC] rounded-2xl px-3.5 py-1.5 flex items-center gap-1.5 font-black text-sm text-[#1A8CFF] dark:text-[#60B2FF]">
              <Lightning size={18} weight="fill" className="text-[#1A8CFF] dark:text-[#60B2FF]" />
              <span>+20 XP</span>
            </div>

            <div className="absolute -bottom-4 -right-3 z-20 bg-white dark:bg-[#1E293B] border-2 border-[#FF9600] shadow-[0_4px_0_#CC7800] rounded-2xl px-3.5 py-1.5 flex items-center gap-1.5 font-black text-sm text-[#FF9600]">
              <Flame size={18} weight="fill" className="text-[#FF9600]" />
              <span>1 {t('Hari Streak!', 'Day Streak!')}</span>
            </div>

            {/* Showcase Main Card */}
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] p-6 shadow-[0_6px_0_#CBD5E1] dark:shadow-[0_6px_0_#070B14] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#E2E8F0] dark:border-[#334155]">
                <span className="text-xs font-black uppercase tracking-wider text-[#0066CC] dark:text-[#60B2FF] bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 px-3 py-1 rounded-xl">
                  {t('COBA TEBAK ISYARAT', 'TRY GUESSING THE SIGN')}
                </span>
                <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">
                  {t('Pilih kata isyarat:', 'Choose sign:')}
                </span>
              </div>

              {/* Sign tabs */}
              <div className="grid grid-cols-3 gap-2">
                {showcaseSigns.map((s, idx) => (
                  <button
                    key={`${s.modelCategory}-${s.roboflowClass}`}
                    type="button"
                    onClick={() => {
                      setActiveSignIndex(idx);
                      setSelectedQuizOption(null);
                      setQuizFeedback('idle');
                    }}
                    className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                      activeSignIndex === idx
                        ? 'bg-[#1A8CFF] text-white shadow-[0_3px_0_#0066CC] translate-y-[-2px]'
                        : 'bg-[#F8FAFC] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#273549]'
                    }`}
                  >
                    {s.wordId}
                  </button>
                ))}
              </div>

              {/* Active Gesture Illustration */}
              <div className="flex items-center gap-4 bg-[#F8FAFC] dark:bg-[#162032] p-4 rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155]">
                <ChibiSignDemonstrator
                  character={activeSign.unitId === 'unit-1' || activeSign.modelCategory === 'angka' ? 'rafael' : 'kana'}
                  signClass={activeSign.roboflowClass}
                  size="md"
                  className="shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="font-black text-xl text-[#1E293B] dark:text-[#F8FAFC]">
                    {formatSignLabel(activeSign, language)}
                  </h3>
                  <p className="text-xs font-extrabold text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                    {language === 'en' ? activeSign.hintEn : activeSign.hintId}
                  </p>
                </div>
              </div>

              {/* Interactive Quick Quiz */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-black uppercase tracking-wide text-[#1E293B] dark:text-[#F8FAFC]">
                  {t('Tebak Isyarat Ini:', 'Guess This Gesture:')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {showcaseSigns.map((s, idx) => (
                    <DuoCard
                      key={`${s.modelCategory}-${s.roboflowClass}`}
                      shortcutNumber={idx + 1}
                      selected={selectedQuizOption === s.wordId}
                      status={
                        selectedQuizOption === s.wordId
                          ? s.wordId === activeSign.wordId
                            ? 'correct'
                            : 'wrong'
                          : 'default'
                      }
                      onClick={() => handleCheckQuiz(s.wordId)}
                      className="py-2.5 px-3 text-xs font-black"
                    >
                      <span>{s.wordId}</span>
                    </DuoCard>
                  ))}
                </div>

                {quizFeedback === 'correct' && (
                  <p className="text-xs font-black text-[#0CA678] dark:text-[#38D9A9] flex items-center gap-1 mt-1">
                    <CheckCircle size={16} weight="fill" />
                    {t('Tepat sekali! Kamu sudah siap belajar.', 'Spot on! You are ready to learn.')}
                  </p>
                )}
                {quizFeedback === 'incorrect' && (
                  <p className="text-xs font-black text-[#EA2B2B] dark:text-[#FF8787] mt-1">
                    {t(
                      `Jawaban yang benar adalah "${activeSign.wordId}".`,
                      `The correct sign is "${activeSign.wordId}".`
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: BisiGo Headline & Stacked 3D Buttons */}
          <div className="space-y-5">
            {/* Interactive Cursor-Tracking Mascots */}
            <div className="inline-flex items-end gap-4 px-5 pt-3 pb-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border-2 border-[#E2E8F0] dark:border-[#334155] rounded-3xl shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14]">
              <div className="flex flex-col items-center">
                <div className="rounded-full dark:bg-[radial-gradient(circle_at_center,rgba(26,140,255,0.18),transparent_70%)]">
                  <Mascot
                    directions="/mascots/rafael-directions.webp"
                    reactions="/mascots/rafael-reactions.webp"
                    size={112}
                    label="Rafael, tutor Unit 1 & 3"
                  />
                </div>
                <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 text-[#0066CC] dark:text-[#60B2FF] text-[11px] font-black uppercase tracking-wide">
                  Rafael · Unit 1 &amp; 3
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="rounded-full dark:bg-[radial-gradient(circle_at_center,rgba(26,140,255,0.18),transparent_70%)]">
                  <Mascot
                    directions="/mascots/kana-directions.webp"
                    reactions="/mascots/kana-reactions.webp"
                    size={112}
                    label="Kana, tutor Unit 2 & 4"
                  />
                </div>
                <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#EDF2FF] dark:bg-[#3B5BDB]/20 text-[#3B5BDB] dark:text-[#8EA4FF] text-[11px] font-black uppercase tracking-wide">
                  Kana · Unit 2 &amp; 4
                </span>
              </div>
            </div>

            <h1 className="font-black text-4xl sm:text-5xl text-[#1E293B] dark:text-[#F8FAFC] tracking-tight leading-[1.15]">
              {t(
                'Cara seru, gratis, dan interaktif untuk belajar BISINDO!',
                'The free, fun, and interactive way to learn BISINDO!'
              )}
            </h1>

            <p className="text-xl font-extrabold text-[#1A8CFF] dark:text-[#60B2FF]">
              {t('Rangkai kata menjadi kalimat, langsung di depan kamera.', 'Chain signs into real sentences, right in front of your camera.')}
            </p>

            <p className="text-base font-bold text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              {t(
                'Pelajari 23 kata penting BISINDO dalam 4 unit kalimat interaktif, plus halaman khusus Huruf (A–Z) & Angka (0–10) dengan verifikasi kamera real-time di perangkat.',
                'Master 23 essential BISINDO words across 4 sentence-building Learn units, plus a dedicated Characters page for Alphabet (A–Z) & Numbers (0–10) with on-device camera verification.'
              )}
            </p>

            {/* Stacked Full-Width 3D Buttons */}
            <div className="space-y-3.5 pt-2 max-w-md">
              <DuoButton
                variant="blue"
                size="lg"
                fullWidth
                onClick={handleStartGuest}
              >
                {t('MULAI BELAJAR (GUEST)', 'GET STARTED (GUEST)')}
              </DuoButton>

              <DuoButton
                variant="white-blue"
                size="lg"
                fullWidth
                to="/auth"
              >
                {t('SUDAH PUNYA AKUN / DAFTAR', 'I ALREADY HAVE AN ACCOUNT')}
              </DuoButton>
            </div>
          </div>
        </section>

        {/* 3-STEP NUMBERED WORKFLOW */}
        <section className="space-y-8 pt-8 border-t-2 border-[#E2E8F0] dark:border-[#334155]">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl font-black text-[#1E293B] dark:text-[#F8FAFC]">
              {t('Bagaimana BisiGo Bekerja', 'How BisiGo Works')}
            </h2>
            <p className="text-base font-bold text-[#64748B] dark:text-[#94A3B8]">
              {t(
                'Metode tiga langkah taktil dari pengenalan kata hingga merangkai kalimat BISINDO.',
                'A three-step tactile method from single signs to chained BISINDO sentences.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Electric Blue Card */}
            <div className="p-6 bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 text-[#1A8CFF] dark:text-[#60B2FF] border-2 border-[#1A8CFF] flex items-center justify-center font-black text-xl">
                <Eye size={24} weight="bold" />
              </div>
              <h3 className="font-black text-xl text-[#1E293B] dark:text-[#F8FAFC]">
                {t('1. Telaah Visual', '1. Visual Breakdown')}
              </h3>
              <p className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {t(
                  'Setiap isyarat diperkenalkan oleh maskot Rafael & Kana lengkap dengan arah gerakan tangan dan konteks nyata.',
                  'Every sign is demonstrated by Rafael & Kana with clear hand placement cues and real-life context.'
                )}
              </p>
            </div>

            {/* Step 2: Royal Cobalt Card */}
            <div className="p-6 bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EDF2FF] dark:bg-[#3B5BDB]/20 text-[#3B5BDB] dark:text-[#8EA4FF] border-2 border-[#3B5BDB] dark:border-[#4C6EF5] flex items-center justify-center font-black text-xl">
                <Question size={24} weight="bold" />
              </div>
              <h3 className="font-black text-xl text-[#1E293B] dark:text-[#F8FAFC]">
                {t('2. Kuis & Susun Kalimat', '2. Quiz & Sentence Builder')}
              </h3>
              <p className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {t(
                  'Uji pemahamanmu lewat kuis pilihan ganda dan susun chip kata menjadi kalimat BISINDO yang berurutan.',
                  'Test comprehension with multiple-choice quizzes and arrange word chips into ordered BISINDO sentences.'
                )}
              </p>
            </div>

            {/* Step 3: Gold Card */}
            <div className="p-6 bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF8DB] dark:bg-[#FFC800]/15 text-[#E5B400] dark:text-[#FFD43B] border-2 border-[#FFC800] flex items-center justify-center font-black text-xl">
                <VideoCamera size={24} weight="bold" />
              </div>
              <h3 className="font-black text-xl text-[#1E293B] dark:text-[#F8FAFC]">
                {t('3. Kamera Berantai Real-Time', '3. Chained Live Camera')}
              </h3>
              <p className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {t(
                  'Peragakan kalimat 2–3 isyarat secara berurutan di depan kamera. Sistem visi lokal memvalidasi setiap langkah secara instan.',
                  'Perform 2–3 sign sentences in sequence in front of your camera. On-device vision validates each slot in real time.'
                )}
              </p>
            </div>
          </div>
        </section>

        {/* 60 BISINDO VOCABULARY PREVIEW */}
        <section className="space-y-6 pt-4 border-t-2 border-[#E2E8F0] dark:border-[#334155]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1E293B] dark:text-[#F8FAFC]">
                {t('Kurikulum 60 Isyarat BISINDO', '60 BISINDO Curriculum Signs')}
              </h2>
              <p className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8] mt-1">
                {t(
                  '4 unit kalimat Belajar (23 Kata inti) ditambah halaman Huruf & Angka (26 Abjad & 11 Angka).',
                  '4 sentence-building Learn units (23 core Words) plus a Characters page (26 Alphabet & 11 Numbers).'
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DuoButton variant="blue" size="sm" to="/characters">
                {t('HURUF & ANGKA', 'CHARACTERS')}
              </DuoButton>
              <DuoButton variant="cobalt" size="sm" to="/dictionary">
                {t('BUKA KAMUS LENGKAP', 'OPEN FULL DICTIONARY')}
              </DuoButton>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {ALL_SIGNS.map(sign => (
              <div
                key={`${sign.modelCategory}-${sign.roboflowClass}`}
                className="p-3 bg-white dark:bg-[#1E293B] border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_3px_0_#CBD5E1] dark:shadow-[0_3px_0_#070B14] rounded-2xl text-center flex flex-col items-center justify-center gap-2"
              >
                <ChibiSignDemonstrator
                  character={sign.unitId === 'unit-1' || sign.unitId === 'unit-3' || sign.modelCategory === 'angka' ? 'rafael' : 'kana'}
                  signClass={sign.roboflowClass}
                  size="xs"
                  animate={false}
                />
                <span className="font-black text-xs text-[#1E293B] dark:text-[#F8FAFC] truncate w-full">
                  {formatSignLabel(sign, language)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t-2 border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] py-8 mt-12 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-extrabold text-[#64748B] dark:text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-[#1A8CFF] dark:text-[#60B2FF]">BisiGo</span>
            <span>-</span>
            <span>HORIZON 2026 Web Development Competition</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleStartGuest}
              className="hover:text-[#1A8CFF] dark:hover:text-[#60B2FF] focus-visible:outline-none"
            >
              {t('MODE TAMU', 'GUEST MODE')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="hover:text-[#3B5BDB] dark:hover:text-[#8EA4FF] focus-visible:outline-none"
            >
              {t('MASUK / DAFTAR', 'SIGN IN / REGISTER')}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
