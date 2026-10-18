'use client';

import React, { useEffect, useState } from 'react';
import { Language, ExperimentData } from '@/types/experiment';
import { translations } from '@/data/locales';
import { Award, Database, ShieldCheck, Mail, Phone, User, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StepCompleteProps {
  language: Language;
  experimentData: ExperimentData;
}

export const StepComplete: React.FC<StepCompleteProps> = ({
  language,
  experimentData,
}) => {
  const t = translations[language].complete;
  const [statusMessage, setStatusMessage] = useState<string>(t.statusSynced);

  useEffect(() => {
    try {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
    // API submission is now handled by page.tsx to prevent double submissions.
  }, []);

  const p = experimentData.participant;
  const mins = Math.round(experimentData.totalChatSeconds / 60);

  return (
    <div className="max-w-xl mx-auto py-16 px-4 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          {language === 'ko' ? '참여해 주셔서 감사합니다.' : 'Thank you for your participation.'}
        </h2>

        {/* Emphasized Red Notice Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-sm sm:text-base font-bold flex flex-col sm:flex-row items-center justify-center gap-3 shadow-sm text-center leading-relaxed">
          <ShieldCheck className="w-6 h-6 text-rose-600 flex-shrink-0" />
          <span>{t.closeNotice}</span>
        </div>
      </div>
    </div>
  );
};
