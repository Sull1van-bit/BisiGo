import React, { useState, useEffect } from 'react';
import { getSignByClass } from '../curriculum';

interface DatasetPoseReferenceProps {
  roboflowClass: string;
  language: 'id' | 'en';
}

/**
 * Displays `/roboflow-reference/${roboflowClass}.jpg` when present in `public/roboflow-reference/`,
 * falling back cleanly to a YOLO detection-zone framing illustration if local dataset samples
 * are not bundled.
 */
export const DatasetPoseReference: React.FC<DatasetPoseReferenceProps> = ({
  roboflowClass,
  language,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [roboflowClass]);

  const sign = getSignByClass(roboflowClass);
  const word = sign ? (language === 'en' ? sign.wordEn : sign.wordId) : roboflowClass;

  if (!imgError) {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-[#1A8CFF] bg-[#1E293B] aspect-[4/3] w-full max-w-[260px] mx-auto">
        <img
          src={`/roboflow-reference/${roboflowClass}.jpg`}
          alt={`Pose referensi kamera untuk ${word}`}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-[#1A8CFF] text-white font-black text-[10px] tracking-wide uppercase shadow">
          {roboflowClass}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-[#1A8CFF] bg-[#E6F3FF] dark:bg-[#1A8CFF]/15 p-3 w-full max-w-[260px] mx-auto text-center space-y-1.5">
      <svg viewBox="0 0 200 130" className="w-full h-24 mx-auto" aria-hidden="true">
        <rect x="6" y="6" width="188" height="118" rx="12" className="fill-white dark:fill-[#0F172A] stroke-[#E2E8F0] dark:stroke-[#334155]" strokeWidth="2" />
        <circle cx="100" cy="40" r="16" className="fill-[#CBD5E1] dark:fill-[#334155]" />
        <path d="M 64 114 C 66 80, 134 80, 136 114 Z" className="fill-[#CBD5E1] dark:fill-[#334155]" />
        <rect
          x="52"
          y="36"
          width="96"
          height="74"
          rx="10"
          fill="#1A8CFF"
          fillOpacity="0.14"
          stroke="#1A8CFF"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
        <rect x="52" y="22" width="66" height="14" rx="4" fill="#1A8CFF" />
        <text x="58" y="32" fill="#FFFFFF" fontSize="9" fontWeight="900">
          {roboflowClass}
        </text>
      </svg>
      <p className="text-[11px] font-extrabold text-[#0066CC] dark:text-[#60B2FF] leading-snug">
        {language === 'en'
          ? 'Detection Zone: keep torso & hands inside the blue frame'
          : 'Zona Deteksi: jaga tangan di depan dada/wajah di bingkai biru'}
      </p>
    </div>
  );
};
