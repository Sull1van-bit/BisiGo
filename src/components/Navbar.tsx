import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DuoButton } from './DuoButton';
import { ThemeToggle } from './ThemeToggle';
import { HandPeace, Globe, User as UserIcon } from '@phosphor-icons/react';

export const Navbar: React.FC = () => {
  const { user, language, setLanguage, t } = useApp();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0F172A] border-b-2 border-[#E2E8F0] dark:border-[#334155]">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8CFF] rounded-2xl p-1"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#1A8CFF] shadow-[0_3px_0_#0066CC] flex items-center justify-center text-white">
            <HandPeace size={24} weight="fill" />
          </div>
          <span className="font-black text-3xl text-[#1A8CFF] tracking-tight">
            BisiGo
          </span>
        </Link>

        {/* Right Controls: Theme Toggle, Language Selector & Auth CTA */}
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle compact />

          <div className="hidden sm:flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
            <Globe size={18} weight="bold" className="text-[#94A3B8]" />
            <span>{t('BAHASA:', 'SITE LANGUAGE:')}</span>
            <div className="inline-flex rounded-xl border-2 border-[#E2E8F0] dark:border-[#334155] p-0.5 bg-[#F8FAFC] dark:bg-[#1E293B]">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-colors ${
                  language === 'id'
                    ? 'bg-white dark:bg-[#0F172A] text-[#1A8CFF] dark:text-[#60B2FF] shadow-sm'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
                }`}
                aria-label="Ubah bahasa ke Bahasa Indonesia"
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-colors ${
                  language === 'en'
                    ? 'bg-white dark:bg-[#0F172A] text-[#3B5BDB] dark:text-[#8EA4FF] shadow-sm'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
                }`}
                aria-label="Change language to English"
              >
                EN
              </button>
            </div>
          </div>

          {user ? (
            <DuoButton
              variant="white"
              size="sm"
              onClick={() => navigate('/learn')}
            >
              <UserIcon size={18} weight="bold" className="mr-2 text-[#1A8CFF]" />
              {user.isGuest ? t('MODE TAMU', 'GUEST') : user.name.toUpperCase()}
            </DuoButton>
          ) : (
            <DuoButton
              variant="white"
              size="sm"
              to="/auth"
            >
              {t('MASUK', 'SIGN IN')}
            </DuoButton>
          )}
        </div>
      </div>
    </header>
  );
};
