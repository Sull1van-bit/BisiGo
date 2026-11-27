import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from './ThemeToggle';
import { House, TextAa, BookOpen, GearSix, HandPeace } from '@phosphor-icons/react';

export const Sidebar: React.FC = () => {
  const { t } = useApp();

  const navItems = [
    {
      to: '/learn',
      label: t('BELAJAR', 'LEARN'),
      icon: House,
    },
    {
      to: '/characters',
      label: t('HURUF & ANGKA', 'CHARACTERS'),
      icon: TextAa,
    },
    {
      to: '/dictionary',
      label: t('KAMUS ISYARAT', 'DICTIONARY'),
      icon: BookOpen,
    },
    {
      to: '/settings',
      label: t('PENGATURAN', 'SETTINGS'),
      icon: GearSix,
    },
  ];

  return (
    <>
      {/* Desktop Left Sidebar: w-64 fixed h-screen */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 left-0 bottom-0 z-30 border-r-2 border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-4 py-6 select-none">
        {/* Brand in Sidebar */}
        <div className="mb-8 px-3">
          <Link
            to="/learn"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8CFF] rounded-2xl p-1"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#1A8CFF] shadow-[0_3px_0_#0066CC] flex items-center justify-center text-white">
              <HandPeace size={24} weight="fill" />
            </div>
            <span className="font-black text-3xl text-[#1A8CFF] tracking-tight">
              BisiGo
            </span>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-2" aria-label={t('Menu Navigasi Utama', 'Main Navigation Menu')}>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3.5 rounded-2xl font-extrabold uppercase tracking-wide text-sm transition-all duration-75 border-2 ${
                    isActive
                      ? 'bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 text-[#0066CC] dark:text-[#60B2FF] border-[#1A8CFF]'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] hover:text-[#1E293B] dark:hover:text-[#F8FAFC] border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={24}
                      weight={isActive ? 'fill' : 'bold'}
                      className={isActive ? 'text-[#1A8CFF] dark:text-[#60B2FF]' : 'text-[#94A3B8]'}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="pt-4 border-t-2 border-[#E2E8F0] dark:border-[#334155]">
          <ThemeToggle />
        </div>
      </aside>

      {/* Spacer for desktop layout so center column does not get obscured by fixed sidebar */}
      <div className="hidden md:block w-64 shrink-0" aria-hidden="true" />

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0F172A] border-t-2 border-[#E2E8F0] dark:border-[#334155] px-2 py-2 flex items-center justify-around select-none"
        aria-label={t('Navigasi Seluler', 'Mobile Navigation')}
      >
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-4 rounded-xl min-h-[48px] min-w-[56px] font-black text-xs tracking-wider uppercase transition-colors ${
                  isActive
                    ? 'text-[#0066CC] dark:text-[#60B2FF] bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 border-2 border-[#1A8CFF]'
                    : 'text-[#94A3B8] hover:text-[#64748B] dark:hover:text-[#CBD5E1]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={22}
                    weight={isActive ? 'fill' : 'bold'}
                    className={isActive ? 'text-[#1A8CFF] dark:text-[#60B2FF]' : 'text-[#94A3B8]'}
                  />
                  <span className="mt-1 text-[10px]">{item.label.split(' ')[0]}</span>
                </>
              )}
            </NavLink>
          );
        })}
        <ThemeToggle compact />
      </nav>
    </>
  );
};
