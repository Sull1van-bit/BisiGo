import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Route-based code splitting for peak Lighthouse performance
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const LearnPage = lazy(() => import('./pages/LearnPage').then(m => ({ default: m.LearnPage })));
const LessonPage = lazy(() => import('./pages/LessonPage').then(m => ({ default: m.LessonPage })));
const CharactersPage = lazy(() => import('./pages/CharactersPage').then(m => ({ default: m.CharactersPage })));
const DictionaryPage = lazy(() => import('./pages/DictionaryPage').then(m => ({ default: m.DictionaryPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PageFallback: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-[#0F172A] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-4 border-[#E2E8F0] dark:border-[#334155] border-t-[#1A8CFF] animate-spin" />
  </div>
);

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/lesson/:levelId" element={<LessonPage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/characters/practice/:category" element={<LessonPage />} />
            <Route path="/characters/practice/:category/:signClass" element={<LessonPage />} />
            <Route path="/dictionary" element={<DictionaryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
