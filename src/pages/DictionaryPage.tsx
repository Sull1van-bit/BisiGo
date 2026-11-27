import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { ChibiSignDemonstrator } from '../components/ChibiSignDemonstrator';
import { Modal } from '../components/Modal';
import { DuoButton } from '../components/DuoButton';
import { ALL_SIGNS, formatSignLabel } from '../curriculum';
import { SignData, PatuliModelCategory } from '../types';
import {
  MagnifyingGlass,
  BookOpen,
  Funnel,
  ArrowClockwise,
  VideoCamera,
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

type DictionaryFilter = 'all' | PatuliModelCategory;

export const DictionaryPage: React.FC = () => {
  const { user, loginAsGuest, language, t } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DictionaryFilter>('all');
  const [activeSignModal, setActiveSignModal] = useState<SignData | null>(null);

  const filteredSigns = useMemo(() => {
    return ALL_SIGNS.filter(sign => {
      const matchesCategory =
        selectedCategory === 'all' || sign.modelCategory === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        sign.wordId.toLowerCase().includes(q) ||
        sign.wordEn.toLowerCase().includes(q) ||
        sign.roboflowClass.toLowerCase().includes(q) ||
        sign.hintId.toLowerCase().includes(q) ||
        sign.hintEn.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  const handleResetSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const getSignBadge = (sign: SignData) => {
    if (sign.modelCategory === 'kata') {
      const unitNum = sign.unitId.replace('unit-', '');
      return {
        label: t(`KATA · UNIT ${unitNum}`, `WORD · UNIT ${unitNum}`),
        classes:
          'bg-[#E6FCF5] dark:bg-[#0B2B23] text-[#0CA678] dark:text-[#38D9A9] border-[#12B886]',
      };
    }
    if (sign.modelCategory === 'abjad') {
      return {
        label: t('ABJAD · A–Z', 'ALPHABET · A–Z'),
        classes:
          'bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 text-[#0066CC] dark:text-[#60B2FF] border-[#1A8CFF]',
      };
    }
    return {
      label: t('ANGKA · 0–10', 'NUMBERS · 0–10'),
      classes:
        'bg-[#EDF2FF] dark:bg-[#3B5BDB]/20 text-[#3B5BDB] dark:text-[#8EA4FF] border-[#3B5BDB]',
    };
  };

  const getDemonstratorCharacter = (sign: SignData): 'rafael' | 'kana' => {
    if (sign.modelCategory === 'angka' || sign.unitId === 'unit-1' || sign.unitId === 'unit-3') {
      return 'rafael';
    }
    return 'kana';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] flex flex-col md:flex-row pb-20 md:pb-0 select-none">
      <Sidebar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Page Title & Intro */}
        <div className="border-b-2 border-[#E2E8F0] dark:border-[#334155] pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 border-2 border-[#1A8CFF] flex items-center justify-center text-[#1A8CFF] dark:text-[#60B2FF]">
              <BookOpen size={24} weight="fill" />
            </div>
            <h1 className="font-black text-3xl sm:text-4xl text-[#1E293B] dark:text-[#F8FAFC] tracking-tight">
              {t('Kamus 60 Isyarat BISINDO', '60 BISINDO Sign Dictionary')}
            </h1>
          </div>
          <p className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8]">
            {t(
              'Pelajari panduan gerakan visual seluruh 60 kosakata isyarat (23 Kata kalimat belajar, 26 Abjad A–Z & 11 Angka 0–10) dengan deteksi AI real-time.',
              'Browse all 60 BISINDO gesture guides (23 Learn-path Words, 26 Alphabet A–Z & 11 Numbers 0–10) integrated with real-time on-device AI.'
            )}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] dark:text-[#64748B]">
              <MagnifyingGlass size={20} weight="bold" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('Cari kata, huruf, atau angka...', 'Search word, letter, or number...')}
              className="w-full pl-12 pr-4 py-3.5 text-sm font-bold rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#1E293B] dark:text-[#F8FAFC] focus:bg-white dark:focus:bg-[#162032] focus:border-[#1A8CFF] focus:outline-none placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 bg-[#F8FAFC] dark:bg-[#1E293B] rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                selectedCategory === 'all'
                  ? 'bg-white dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F8FAFC] shadow-[0_2px_0_#CBD5E1] dark:shadow-[0_2px_0_#070B14] border border-[#CBD5E1] dark:border-[#475569]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
              }`}
            >
              {t('Semua (60)', 'All (60)')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('kata')}
              className={`px-3.5 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                selectedCategory === 'kata'
                  ? 'bg-white dark:bg-[#0F172A] text-[#0CA678] dark:text-[#38D9A9] shadow-[0_2px_0_#0CA678] border border-[#12B886]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
              }`}
            >
              {t('Kata (23)', 'Words (23)')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('abjad')}
              className={`px-3.5 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                selectedCategory === 'abjad'
                  ? 'bg-white dark:bg-[#0F172A] text-[#0066CC] dark:text-[#60B2FF] shadow-[0_2px_0_#0066CC] border border-[#1A8CFF]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
              }`}
            >
              {t('Abjad (26)', 'Alphabet (26)')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('angka')}
              className={`px-3.5 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                selectedCategory === 'angka'
                  ? 'bg-white dark:bg-[#0F172A] text-[#3B5BDB] dark:text-[#8EA4FF] shadow-[0_2px_0_#2B44A8] border border-[#3B5BDB]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
              }`}
            >
              {t('Angka (11)', 'Numbers (11)')}
            </button>
          </div>
        </div>

        {/* 60 Signs Grid */}
        {filteredSigns.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {filteredSigns.map(sign => {
              const badge = getSignBadge(sign);

              return (
                <div
                  key={`${sign.modelCategory}-${sign.roboflowClass}`}
                  className="bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] p-5 flex flex-col justify-between hover:border-[#1A8CFF] dark:hover:border-[#1A8CFF] transition-all cursor-pointer"
                  onClick={() => setActiveSignModal(sign)}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-black text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wide truncate">
                        {language === 'en' ? sign.wordId : sign.wordEn}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-2xl bg-[#F8FAFC] dark:bg-[#162032] border border-[#E2E8F0] dark:border-[#334155]">
                        <ChibiSignDemonstrator
                          character={getDemonstratorCharacter(sign)}
                          signClass={sign.roboflowClass}
                          size="sm"
                          animate={false}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-xl text-[#1E293B] dark:text-[#F8FAFC]">
                          {formatSignLabel(sign, language)}
                        </h3>
                        <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] line-clamp-2 mt-1 leading-relaxed">
                          {language === 'en' ? sign.hintEn : sign.hintId}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-[#E2E8F0] dark:border-[#334155] mt-4 flex items-center justify-between">
                    <span className="text-xs font-black text-[#1A8CFF] dark:text-[#60B2FF] uppercase tracking-wide">
                      {t('Lihat Panduan', 'View Guide')} &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F8FAFC] dark:bg-[#162032] border-2 border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] mx-auto">
              <Funnel size={30} weight="bold" />
            </div>

            <div>
              <h3 className="font-black text-xl text-[#1E293B] dark:text-[#F8FAFC]">
                {t(
                  `Tidak ditemukan isyarat untuk "${searchQuery}"`,
                  `No signs found for "${searchQuery}"`
                )}
              </h3>
              <p className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm mx-auto">
                {t(
                  'Periksa ejaan kata atau reset filter untuk menampilkan seluruh 60 kosakata.',
                  'Check word spelling or reset filter to display all 60 vocabulary signs.'
                )}
              </p>
            </div>

            <div className="pt-2">
              <DuoButton
                variant="white"
                size="md"
                onClick={handleResetSearch}
              >
                <ArrowClockwise size={18} weight="bold" className="mr-2" />
                {t('RESET PENCARIAN', 'RESET SEARCH')}
              </DuoButton>
            </div>
          </div>
        )}

        {/* Detailed Sign Guide Modal */}
        <Modal
          isOpen={activeSignModal !== null}
          onClose={() => setActiveSignModal(null)}
          title={
            activeSignModal
              ? formatSignLabel(activeSignModal, language)
              : undefined
          }
        >
          {activeSignModal && (
            <div className="space-y-5 select-none">
              <div className="flex justify-center">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-xl border ${getSignBadge(activeSignModal).classes}`}
                >
                  {getSignBadge(activeSignModal).label}
                </span>
              </div>

              <div className="flex justify-center py-2">
                <div className="p-4 bg-[#F8FAFC] dark:bg-[#162032] border-2 border-[#E2E8F0] dark:border-[#334155] rounded-3xl">
                  <ChibiSignDemonstrator
                    character={getDemonstratorCharacter(activeSignModal)}
                    signClass={activeSignModal.roboflowClass}
                    size="lg"
                  />
                </div>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#162032] rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] p-5 space-y-2">
                <span className="text-[11px] font-black uppercase text-[#94A3B8] dark:text-[#64748B] tracking-wide block">
                  {t('DESKRIPSI GERAKAN TANGAN', 'GESTURE DESCRIPTION')}
                </span>
                <p className="text-base font-extrabold text-[#1E293B] dark:text-[#F8FAFC] leading-relaxed">
                  {language === 'en'
                    ? activeSignModal.hintEn
                    : activeSignModal.hintId}
                </p>

                {activeSignModal.scenarioId && (
                  <div className="pt-3 border-t-2 border-[#E2E8F0] dark:border-[#334155] text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">
                    <span className="font-black text-[#1E293B] dark:text-[#F8FAFC]">
                      {t('Konteks: ', 'Context: ')}
                    </span>
                    {language === 'en'
                      ? activeSignModal.scenarioEn
                      : activeSignModal.scenarioId}
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <DuoButton
                  variant={activeSignModal.modelCategory === 'kata' ? 'mint' : 'blue'}
                  size="md"
                  fullWidth
                  onClick={() => {
                    const sign = activeSignModal;
                    setActiveSignModal(null);
                    if (!user) {
                      loginAsGuest();
                    }
                    if (sign.modelCategory === 'kata') {
                      navigate('/learn');
                    } else {
                      navigate(
                        `/characters/practice/${sign.modelCategory}/${encodeURIComponent(sign.roboflowClass)}`
                      );
                    }
                  }}
                >
                  <VideoCamera size={20} weight="bold" className="mr-2" />
                  {activeSignModal.modelCategory === 'kata'
                    ? t('LATIHAN DI JALUR BELAJAR', 'PRACTICE ON PATH')
                    : t('LATIHAN KARAKTER INI', 'PRACTICE CHARACTER')}
                </DuoButton>
                <DuoButton
                  variant="white"
                  size="md"
                  onClick={() => setActiveSignModal(null)}
                >
                  {t('TUTUP', 'CLOSE')}
                </DuoButton>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
};
