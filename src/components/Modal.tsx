import React, { useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
  closeLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  closeLabel,
}) => {
  const { t } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.15 }}
            className={`w-full ${maxWidth} bg-white dark:bg-[#1E293B] rounded-3xl border-2 border-[#E2E8F0] dark:border-[#334155] shadow-2xl overflow-hidden`}
            onClick={e => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B]">
                <h3 className="font-black text-xl text-[#1E293B] dark:text-[#F8FAFC]">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel ?? t('Tutup dialog', 'Close dialog')}
                  className="p-1 rounded-xl text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#273549] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8CFF]"
                >
                  <X size={22} weight="bold" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
