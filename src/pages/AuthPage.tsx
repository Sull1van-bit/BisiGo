import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DuoButton } from '../components/DuoButton';
import { ThemeToggle } from '../components/ThemeToggle';
import { HandPeace, ArrowLeft, UserCircle, CheckCircle } from '@phosphor-icons/react';

export const AuthPage: React.FC = () => {
  const { user, loginUser, registerUser, loginAsGuest, t } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (user && !user.isGuest) {
    return <Navigate to="/learn" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (!name.trim()) {
        setError(t('Silakan masukkan nama panggilan Anda.', 'Please enter your nickname.'));
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError(t('Silakan masukkan alamat email yang valid.', 'Please enter a valid email address.'));
        return;
      }
      if (password.length < 6) {
        setError(t('Kata sandi minimal 6 karakter.', 'Password must be at least 6 characters.'));
        return;
      }

      registerUser(name, email);
      navigate('/learn');
    } else {
      if (!email.trim()) {
        setError(t('Silakan masukkan email atau nama pengguna Anda.', 'Please enter your email or username.'));
        return;
      }
      if (!password) {
        setError(t('Silakan masukkan kata sandi Anda.', 'Please enter your password.'));
        return;
      }

      const displayName = email.split('@')[0] || 'Sahabat BISINDO';
      loginUser(displayName, email);
      navigate('/learn');
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/learn');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-md w-full mx-auto mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC] tracking-wide focus-visible:outline-none"
        >
          <ArrowLeft size={18} weight="bold" />
          {t('KEMBALI KE BERANDA', 'BACK TO HOME')}
        </Link>
        <ThemeToggle compact />
      </div>

      <div className="max-w-md w-full mx-auto bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_6px_0_#CBD5E1] dark:shadow-[0_6px_0_#070B14] p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1A8CFF] shadow-[0_3px_0_#0066CC] flex items-center justify-center text-white shrink-0">
            <HandPeace size={28} weight="fill" />
          </div>
          <div>
            <h1 className="font-black text-3xl text-[#1A8CFF] tracking-tight">
              BisiGo
            </h1>
            <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">
              {mode === 'login'
                ? t('Masuk ke akunmu untuk melanjutkan belajar', 'Sign in to continue your streak')
                : t('Buat profil baru untuk menyimpan kemajuan', 'Create a profile to save your progress')}
            </p>
          </div>
        </div>

        {/* Guest Migration Notice */}
        {user?.isGuest && (
          <div className="p-4 bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 rounded-2xl border-2 border-[#1A8CFF] text-[#0066CC] dark:text-[#93C5FD] flex items-start gap-3 text-xs font-bold leading-relaxed">
            <CheckCircle size={20} weight="fill" className="text-[#1A8CFF] dark:text-[#60B2FF] shrink-0 mt-0.5" />
            <div>
              <span className="font-black uppercase tracking-wide block mb-0.5">
                {t('MIGRASI PROFIL TAMU', 'GUEST PROFILE MIGRATION')}
              </span>
              {t(
                'Streak dan XP yang telah kamu kumpulkan akan otomatis dipindahkan ke akun barumu.',
                'Your accumulated streak and XP will automatically transfer to your registered profile.'
              )}
            </div>
          </div>
        )}

        {/* Tab switch between Masuk and Daftar */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#F8FAFC] dark:bg-[#162032] rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-[#0F172A] text-[#1A8CFF] dark:text-[#60B2FF] shadow-[0_2px_0_#CBD5E1] dark:shadow-[0_2px_0_#070B14] border border-[#1A8CFF]'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
            }`}
          >
            {t('MASUK', 'SIGN IN')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-[#0F172A] text-[#3B5BDB] dark:text-[#8EA4FF] shadow-[0_2px_0_#2B44A8] border border-[#3B5BDB]'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
            }`}
          >
            {t('DAFTAR AKUN', 'CREATE ACCOUNT')}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-[#FFDFE0] dark:bg-[#2F1519] border-2 border-[#FF4B4B] rounded-2xl text-[#EA2B2B] dark:text-[#FF8787] text-xs font-black">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-black uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] mb-1.5">
                {t('Nama Panggilan', 'Display Name')}
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ketik nama panggilanmu"
                className="w-full px-4 py-3 text-sm font-bold rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#162032] text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] focus:bg-white dark:focus:bg-[#0F172A] focus:border-[#1A8CFF] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-black uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] mb-1.5">
              {t('Alamat Email', 'Email Address')}
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-4 py-3 text-sm font-bold rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#162032] text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] focus:bg-white dark:focus:bg-[#0F172A] focus:border-[#1A8CFF] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-black uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] mb-1.5">
              {t('Kata Sandi', 'Password')}
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-4 py-3 text-sm font-bold rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#162032] text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] focus:bg-white dark:focus:bg-[#0F172A] focus:border-[#1A8CFF] focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <DuoButton type="submit" variant="blue" size="lg" fullWidth>
              {mode === 'login' ? t('MASUK KE AKUN', 'LOG IN') : t('BUAT AKUN BARU', 'CREATE ACCOUNT')}
            </DuoButton>
          </div>
        </form>

        {/* Separator */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-[#E2E8F0] dark:border-[#334155]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-[#1E293B] px-3 text-[#94A3B8] dark:text-[#64748B] font-black uppercase">
              {t('ATAU', 'OR')}
            </span>
          </div>
        </div>

        {/* Continue as Guest Button */}
        <div>
          <DuoButton
            type="button"
            variant="white-blue"
            size="md"
            fullWidth
            onClick={handleGuestLogin}
          >
            <UserCircle size={20} weight="bold" className="mr-2" />
            {t('LANJUTKAN SEBAGAI TAMU', 'CONTINUE AS GUEST')}
          </DuoButton>
          <p className="text-[11px] text-[#94A3B8] dark:text-[#64748B] font-bold text-center mt-2">
            {t(
              'Akses penuh ke seluruh materi dan praktik kamera langsung tanpa registrasi.',
              'Full access to all lessons and live camera practice without registration.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
