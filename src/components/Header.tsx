'use client';

import React from 'react';
import { Language, Step, ExperimentGroup } from '@/types/experiment';
import { translations } from '@/data/locales';
import { Globe, CheckCircle2, Circle } from 'lucide-react';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currentStep: Step;
  participantId?: string;
  group?: ExperimentGroup;
  condition?: ExperimentCondition;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  currentStep,
  participantId,
  group,
  condition,
}) => {
  const t = translations[language];

  const steps: { key: Step; label: string; num: number }[] = [
    { key: 'instructions', label: t.header.step1, num: 1 },
    { key: 'chat', label: t.header.step2, num: 2 },
    { key: 'survey', label: t.header.step3, num: 3 },
    { key: 'complete', label: t.header.step4, num: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const conditionDisplay = condition || group;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Title and ID */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            EXP
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800 tracking-tight">
              {t.appTitle}
            </h1>
            {participantId && (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>{t.header.participantId}: <strong className="font-mono text-slate-700">{participantId}</strong></span>
                {conditionDisplay && (
                  <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium text-[10px]">
                    {t.header.group}: {conditionDisplay}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stepper (Desktop) */}
        <div className="hidden sm:flex items-center gap-1">
          {steps.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <React.Fragment key={step.key}>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-slate-100 text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] border border-current">
                      {step.num}
                    </span>
                  )}
                  <span>{step.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-3 h-0.5 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Globe className="w-4 h-4 text-slate-500 ml-1.5 mr-1" />
            <button
              onClick={() => onLanguageChange('ko')}
              className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                language === 'ko'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              한국어
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                language === 'en'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
