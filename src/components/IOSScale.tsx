'use client';

import React from 'react';
import { Language } from '@/types/experiment';

interface IOSScaleProps {
  value?: number;
  onChange: (val: number) => void;
  language: Language;
}

export const IOSScale: React.FC<IOSScaleProps> = ({ value, onChange, language }) => {
  const levels = [
    { score: 1, dx: 38 },
    { score: 2, dx: 30 },
    { score: 3, dx: 22 },
    { score: 4, dx: 16 },
    { score: 5, dx: 11 },
    { score: 6, dx: 6 },
    { score: 7, dx: 2 },
  ];

  const selfLabel = language === 'ko' ? '나' : 'Self';
  const otherLabel = language === 'ko' ? '챗봇' : 'AI';

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
        {levels.map(({ score, dx }) => {
          const isSelected = value === score;
          const cx1 = 50 - dx / 2;
          const cx2 = 50 + dx / 2;
          const radius = 22;

          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/80 shadow-md ring-2 ring-indigo-500 scale-[1.03]'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div className="w-full h-20 flex items-center justify-center">
                <svg viewBox="0 0 100 60" className="w-full h-full max-w-[100px]">
                  <circle
                    cx={cx1}
                    cy={30}
                    r={radius}
                    fill={isSelected ? '#818cf8' : '#e0e7ff'}
                    fillOpacity={0.55}
                    stroke={isSelected ? '#4f46e5' : '#6366f1'}
                    strokeWidth={1.5}
                  />
                  <text
                    x={cx1}
                    y={33}
                    textAnchor="middle"
                    fontSize={score >= 5 ? 7 : 8}
                    fontWeight="bold"
                    fill={isSelected ? '#312e81' : '#4338ca'}
                  >
                    {selfLabel}
                  </text>

                  <circle
                    cx={cx2}
                    cy={30}
                    r={radius}
                    fill={isSelected ? '#38bdf8' : '#e0f2fe'}
                    fillOpacity={0.55}
                    stroke={isSelected ? '#0284c7' : '#0ea5e9'}
                    strokeWidth={1.5}
                  />
                  <text
                    x={cx2}
                    y={33}
                    textAnchor="middle"
                    fontSize={score >= 5 ? 7 : 8}
                    fontWeight="bold"
                    fill={isSelected ? '#0c4a6e' : '#0369a1'}
                  >
                    {otherLabel}
                  </text>
                </svg>
              </div>

              <div className="mt-2 flex items-center justify-center gap-1">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {score}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-slate-500 px-1 font-medium">
        <span>① {language === 'ko' ? '전혀 겹치지 않음 (완전히 분리)' : 'No overlap (Completely separate)'}</span>
        <span>⑦ {language === 'ko' ? '거의 완전히 겹침 (매우 일체화)' : 'Almost completely overlapping'}</span>
      </div>
    </div>
  );
};