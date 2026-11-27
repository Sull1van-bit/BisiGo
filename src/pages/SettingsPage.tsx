import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { DuoButton } from '../components/DuoButton';
import { Modal } from '../components/Modal';
import {
  getAudioSettings,
  playSfx,
  setBusVolume,
  subscribeAudioSettings,
  toggleAudioMute,
} from '../utils/audio';
import {
  GearSix,
  Translate,
  Camera,
  User,
  ArrowsClockwise,
  SignOut,
  CheckCircle,
  Warning,
  Moon,
  Sun,
  SpeakerHigh,
  SpeakerSlash,
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const {
    user,
    language,
    setLanguage,
    theme,
    setTheme,
    resetProgress,
    logout,
    streak,
    xp,
    t,
  } = useApp();

  const navigate = useNavigate();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [cameraPermState, setCameraPermState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [cameraPermMessage, setCameraPermMessage] = useState<string | null>(null);
  const [audioSettings, setAudioSettings] = useState(getAudioSettings);

  useEffect(() => subscribeAudioSettings(setAudioSettings), []);

  const handleRequestCameraPermission = async () => {
    setCameraPermState('requesting');
    setCameraPermMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          t(
            'Browser ini tidak mendukung akses kamera.',
            'This browser does not support camera access.'
          )
        );
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermState('granted');
      setCameraPermMessage(
        t(
          'Izin kamera berhasil diaktifkan! Kamera siap digunakan di dalam latihan.',
          'Camera permission granted! Your camera is ready for practice sessions.'
        )
      );
    } catch (err: unknown) {
      setCameraPermState('denied');
      const errName = err instanceof DOMException ? err.name : '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraPermMessage(
          t(
            'Izin kamera ditolak oleh browser. Klik ikon kamera/gembok di sebelah kiri address bar browser lalu ubah izin Kamera menjadi "Allow / Izinkan".',
            'Camera permission was blocked by your browser. Click the camera/lock icon in your address bar and set Camera to "Allow".'
          )
        );
      } else {
        setCameraPermMessage(
          err instanceof Error
            ? err.message
            : t('Tidak dapat mengakses perangkat kamera.', 'Unable to access camera device.')
        );
      }
    }
  };

  const handleConfirmReset = () => {
    resetProgress();
    setIsResetModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] flex flex-col md:flex-row pb-20 md:pb-0 select-none">
      <Sidebar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Page Title */}
        <div className="border-b-2 border-[#E2E8F0] dark:border-[#334155] pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 border-2 border-[#1A8CFF] flex items-center justify-center text-[#1A8CFF] dark:text-[#60B2FF]">
              <GearSix size={24} weight="fill" />
            </div>
            <h1 className="font-black text-3xl sm:text-4xl text-[#1E293B] dark:text-[#F8FAFC] tracking-tight">
              {t('Pengaturan & Akun', 'Settings & Account')}
            </h1>
          </div>
          <p className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8]">
            {t(
              'Kelola preferensi tampilan, audio, bahasa, izin kamera, dan data pembelajaran.',
              'Manage appearance, audio mixer, language preferences, camera permission, and learning data.'
            )}
          </p>
        </div>

        {/* 1. Theme Toggle */}
        <section className="bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_6px_0_#070B14] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#1E293B] dark:text-[#F8FAFC] font-black text-lg">
            {theme === 'dark' ? (
              <Moon size={22} weight="fill" className="text-[#FFC800]" />
            ) : (
              <Sun size={22} weight="fill" className="text-[#1A8CFF]" />
            )}
            <h2>{t('Tampilan Aplikasi', 'App Appearance')}</h2>
          </div>
          <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            {t(
              'Pilih tema terang atau tema gelap agar nyaman dipakai di kondisi cahaya apa pun.',
              'Choose Light or Dark theme for comfortable learning in any lighting condition.'
            )}
          </p>

          <div className="flex gap-3 max-w-xs pt-1">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-2 inline-flex items-center justify-center gap-2 ${
                theme === 'light'
                  ? 'bg-[#1A8CFF] text-white border-[#1A8CFF] shadow-[0_3px_0_#0066CC]'
                  : 'bg-[#F8FAFC] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155] hover:bg-[#E2E8F0] dark:hover:bg-[#273549]'
              }`}
            >
              <Sun size={16} weight="fill" />
              <span>{t('Terang', 'Light')}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-2 inline-flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'bg-[#3B5BDB] text-white border-[#3B5BDB] shadow-[0_3px_0_#2B44A8]'
                  : 'bg-[#F8FAFC] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155] hover:bg-[#E2E8F0] dark:hover:bg-[#273549]'
              }`}
            >
              <Moon size={16} weight="fill" />
              <span>{t('Gelap', 'Dark')}</span>
            </button>
          </div>
        </section>

        {/* 1B. Audio Mixer (Master, Adaptive Music, SFX Buses) */}
        <section className="bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[#1E293B] dark:text-[#F8FAFC] font-black text-lg">
              {audioSettings.muted ? (
                <SpeakerSlash size={22} weight="bold" className="text-[#FF4B4B]" />
              ) : (
                <SpeakerHigh size={22} weight="fill" className="text-[#1A8CFF] dark:text-[#60B2FF]" />
              )}
              <h2>{t('Audio & Musik Adaptif', 'Audio & Adaptive Music')}</h2>
            </div>

            <div className="flex items-center gap-2">
              <DuoButton
                variant={audioSettings.muted ? 'red' : 'white'}
                size="sm"
                onClick={() => toggleAudioMute()}
              >
                {audioSettings.muted
                  ? t('SUARA DIBISUKAN', 'MUTED')
                  : t('BISUKAN', 'MUTE')}
              </DuoButton>
              <DuoButton
                variant="blue"
                size="sm"
                onClick={() => playSfx('correct')}
              >
                {t('TES SUARA', 'TEST SOUND')}
              </DuoButton>
            </div>
          </div>

          <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            {t(
              'Atur volume bus Master, Musik latar adaptif selama latihan, serta efek suara (SFX & tombol).',
              'Adjust Master, adaptive lesson background Music, and Sound Effects (SFX & UI) bus levels.'
            )}
          </p>

          <div className="space-y-3 pt-1">
            {(
              [
                { key: 'master', label: t('Master Volume', 'Master Volume'), val: audioSettings.master },
                { key: 'music', label: t('Musik Latihan Adaptif', 'Adaptive Lesson Music'), val: audioSettings.music },
                { key: 'sfx', label: t('Efek Suara & Tombol (SFX)', 'Sound Effects & UI (SFX)'), val: audioSettings.sfx },
              ] as const
            ).map(bus => (
              <label key={bus.key} className="block space-y-1">
                <div className="flex justify-between text-xs font-black text-[#1E293B] dark:text-[#F8FAFC]">
                  <span>{bus.label}</span>
                  <span className="text-[#1A8CFF] dark:text-[#60B2FF]">
                    {audioSettings.muted ? '0%' : `${Math.round(bus.val * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(bus.val * 100)}
                  onChange={e => setBusVolume(bus.key, Number(e.target.value) / 100)}
                  className="w-full accent-[#1A8CFF] cursor-pointer"
                />
              </label>
            ))}
          </div>
        </section>

        {/* 2. Language Toggle */}
        <section className="bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#1E293B] dark:text-[#F8FAFC] font-black text-lg">
            <Translate size={22} weight="bold" className="text-[#1A8CFF] dark:text-[#60B2FF]" />
            <h2>{t('Bahasa Antarmuka', 'Interface Language')}</h2>
          </div>
          <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            {t(
              'Pilih bahasa untuk petunjuk dan menu navigasi. Bahasa isyarat yang diajarkan tetap BISINDO.',
              'Select language for interface and instructions. Sign language taught remains strictly BISINDO.'
            )}
          </p>

          <div className="flex gap-3 max-w-xs pt-1">
            <button
              type="button"
              onClick={() => setLanguage('id')}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                language === 'id'
                  ? 'bg-[#1A8CFF] text-white border-[#1A8CFF] shadow-[0_3px_0_#0066CC]'
                  : 'bg-[#F8FAFC] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155] hover:bg-[#E2E8F0] dark:hover:bg-[#273549]'
              }`}
            >
              Indonesia (ID)
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                language === 'en'
                  ? 'bg-[#3B5BDB] text-white border-[#3B5BDB] shadow-[0_3px_0_#2B44A8]'
                  : 'bg-[#F8FAFC] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155] hover:bg-[#E2E8F0] dark:hover:bg-[#273549]'
              }`}
            >
              English (EN)
            </button>
          </div>
        </section>

        {/* 3. Camera Permission & Practice Access */}
        <section className="bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[#1E293B] dark:text-[#F8FAFC] font-black text-lg">
              <Camera size={22} weight="bold" className="text-[#1A8CFF] dark:text-[#60B2FF]" />
              <h2>{t('Izin Akses Kamera', 'Camera Access Permission')}</h2>
            </div>
            {cameraPermState === 'granted' && (
              <span className="text-xs font-black text-[#0CA678] dark:text-[#38D9A9] bg-[#E6FCF5] dark:bg-[#0B2B23] px-3 py-1 rounded-xl border border-[#12B886] flex items-center gap-1">
                <CheckCircle size={16} weight="fill" />
                {t('DIIZINKAN', 'ALLOWED')}
              </span>
            )}
          </div>

          <p className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            {t(
              'Kamera digunakan saat sesi praktik untuk mengenali gerakan tangan BISINDO kamu secara langsung. Video diproses sepenuhnya di perangkatmu dan tidak pernah dikirim ke server mana pun.',
              'Your camera is used during practice sessions to recognize your BISINDO hand signs in real time. Video is processed entirely on your device and never sent to any server.'
            )}
          </p>

          {cameraPermMessage && (
            <div
              className={`p-3.5 rounded-2xl border-2 text-xs font-extrabold leading-relaxed ${
                cameraPermState === 'granted'
                  ? 'bg-[#E6FCF5] dark:bg-[#0B2B23] border-[#12B886] text-[#0CA678] dark:text-[#38D9A9]'
                  : 'bg-[#FFDFE0] dark:bg-[#2F1519] border-[#FF4B4B] text-[#EA2B2B] dark:text-[#FF8787]'
              }`}
            >
              {cameraPermMessage}
            </div>
          )}

          <div className="pt-1">
            <DuoButton
              variant="blue"
              size="sm"
              disabled={cameraPermState === 'requesting'}
              onClick={() => {
                void handleRequestCameraPermission();
              }}
            >
              <Camera size={18} weight="bold" className="mr-2" />
              {cameraPermState === 'requesting'
                ? t('MEMINTA IZIN KAMERA...', 'REQUESTING PERMISSION...')
                : t('IZINKAN AKSES KAMERA', 'ALLOW CAMERA ACCESS')}
            </DuoButton>
          </div>
        </section>

        {/* 4. Account Status & Guest Migration */}
        <section className="bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#1E293B] dark:text-[#F8FAFC] font-black text-lg">
            <User size={22} weight="bold" className="text-[#3B5BDB] dark:text-[#8EA4FF]" />
            <h2>{t('Status Profil Belajar', 'Learner Profile Status')}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-[#F8FAFC] dark:bg-[#162032] rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155]">
              <span className="text-[11px] text-[#94A3B8] dark:text-[#64748B] font-black uppercase block">
                {t('Tipe Akun', 'Account Type')}
              </span>
              <span className="text-sm font-black text-[#1E293B] dark:text-[#F8FAFC] mt-1 block">
                {user?.isGuest ? t('Mode Tamu', 'Guest Mode') : t('Akun Terdaftar', 'Registered Account')}
              </span>
            </div>

            <div className="p-4 bg-[#F8FAFC] dark:bg-[#162032] rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155]">
              <span className="text-[11px] text-[#94A3B8] dark:text-[#64748B] font-black uppercase block">
                {t('Nama Pengguna', 'Display Name')}
              </span>
              <span className="text-sm font-black text-[#1E293B] dark:text-[#F8FAFC] mt-1 block">
                {user?.name || '-'}
              </span>
            </div>

            <div className="p-4 bg-[#F8FAFC] dark:bg-[#162032] rounded-2xl border-2 border-[#E2E8F0] dark:border-[#334155]">
              <span className="text-[11px] text-[#94A3B8] dark:text-[#64748B] font-black uppercase block">
                {t('Statistik', 'Statistics')}
              </span>
              <span className="text-sm font-black text-[#1E293B] dark:text-[#F8FAFC] mt-1 block">
                {xp} XP / {streak} {t('Hari', 'Days')}
              </span>
            </div>
          </div>

          {user?.isGuest && (
            <div className="pt-2">
              <DuoButton
                variant="blue"
                size="md"
                to="/auth"
              >
                {t('BUAT AKUN UNTUK SIMPAN PROGRES', 'CREATE ACCOUNT TO SAVE PROGRESS')}
              </DuoButton>
            </div>
          )}
        </section>

        {/* 5. Progress Reset & Logout */}
        <section className="bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#1E293B] dark:text-[#F8FAFC] font-black text-lg">
            <ArrowsClockwise size={22} weight="bold" className="text-[#FF4B4B]" />
            <h2>{t('Manajemen Data Belajar', 'Learning Data Management')}</h2>
          </div>

          <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            {t(
              'Reset progres 4 unit Belajar, penguasaan Huruf & Angka (Abjad & Angka), streak harian, dan XP kembali ke awal.',
              'Reset progress across all 4 Learn units, Characters mastery (Alphabet & Numbers), daily streak, and XP back to start.'
            )}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <DuoButton
              variant="white"
              size="sm"
              onClick={() => setIsResetModalOpen(true)}
            >
              <ArrowsClockwise size={18} weight="bold" className="mr-2 text-[#FF4B4B]" />
              {t('RESET KEMAJUAN BELAJAR', 'RESET PROGRESS')}
            </DuoButton>

            <DuoButton
              variant="ghost"
              size="sm"
              onClick={handleLogout}
            >
              <SignOut size={18} weight="bold" className="mr-2" />
              {t('KELUAR AKUN', 'LOG OUT')}
            </DuoButton>
          </div>
        </section>

        {/* Reset Confirmation Modal */}
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title={t('Konfirmasi Reset Kemajuan', 'Confirm Progress Reset')}
        >
          <div className="space-y-4 select-none">
            <div className="flex items-start gap-3 p-4 bg-[#FFDFE0] dark:bg-[#2F1519] border-2 border-[#FF4B4B] rounded-2xl text-[#EA2B2B] dark:text-[#FF8787]">
              <Warning size={28} weight="fill" className="shrink-0 mt-0.5" />
              <div className="text-xs font-extrabold leading-relaxed">
                <p className="font-black text-sm">
                  {t('Tindakan ini tidak dapat dibatalkan.', 'This action cannot be undone.')}
                </p>
                <p className="mt-1">
                  {t(
                    'Progres akan dikembalikan ke level pembuka di semua 4 unit Belajar (1.1, 2.1, 3.1, 4.1) serta mereset penguasaan Huruf & Angka, XP, dan streak.',
                    'Progress will reset to the starter levels of all 4 Learn units (1.1, 2.1, 3.1, 4.1) and clear Characters mastery, XP, and streak.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <DuoButton
                variant="red"
                size="md"
                fullWidth
                onClick={handleConfirmReset}
              >
                {t('YA, RESET KEMAJUAN', 'YES, RESET PROGRESS')}
              </DuoButton>
              <DuoButton
                variant="white"
                size="md"
                onClick={() => setIsResetModalOpen(false)}
              >
                {t('BATAL', 'CANCEL')}
              </DuoButton>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};
