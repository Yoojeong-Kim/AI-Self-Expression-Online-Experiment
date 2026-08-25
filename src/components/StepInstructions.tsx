'use client';

import React from 'react';
import { Language } from '@/types/experiment';
import { translations } from '@/data/locales';
import { Sparkles, ArrowRight, Clock, MessageSquare, Compass } from 'lucide-react';

interface StepInstructionsProps {
  language: Language;
  onStart: () => void;
}

export const StepInstructions: React.FC<StepInstructionsProps> = ({
  language,
  onStart,
}) => {
  const t = translations[language].instructions;

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
          <Sparkles className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-slate-800">{t.title}</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">{t.subtitle}</p>

        <div className="space-y-3 mb-8 text-left">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
            <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-800">{t.rule1}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
            <Compass className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-800">{t.rule2}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-800">{t.rule3}</span>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>{t.startButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
