'use client';

import React, { useState } from 'react';
import { Language } from '@/types/experiment';
import { UserCheck, ArrowRight, Calendar, User } from 'lucide-react';

interface StepDemographics2Props {
  language: Language;
  onComplete: (info: {
    gender: string;
    age: number;
  }) => void;
}

export const StepDemographics2: React.FC<StepDemographics2Props> = ({
  onComplete,
}) => {
  const [gender, setGender] = useState<string>('');
  const [ageInput, setAgeInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!gender) {
      setErrorMessage('성별을 선택해 주세요.');
      return;
    }

    const parsedAge = parseInt(ageInput.trim(), 10);
    if (isNaN(parsedAge) || parsedAge < 15 || parsedAge > 40) {
      setErrorMessage('만 나이를 숫자로 정확히 입력해 주세요 (예: 21).');
      return;
    }

    onComplete({
      gender,
      age: parsedAge,
    });
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            사전 기본 정보 확인
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            실험 환경 설정을 위해 성별과 만 나이를 먼저 확인합니다.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. 성별 선택 */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              <span>1. 귀하의 성별을 선택해 주세요.</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  gender === 'female'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>👧 여성</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  gender === 'male'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>👦 남성</span>
              </button>
            </div>
          </div>

          {/* 2. 만 나이 입력 */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>2. 귀하의 만 나이를 숫자로 입력해 주세요.</span>
            </label>
            <div className="flex items-center justify-center gap-3 py-2 bg-white rounded-xl border border-slate-200 px-4">
              <span className="text-sm sm:text-base font-bold text-slate-700">만</span>
              <input
                type="number"
                min={14}
                max={35}
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                placeholder="21"
                className="w-20 text-center text-lg sm:text-xl font-extrabold text-indigo-600 border-b-2 border-indigo-400 focus:border-indigo-600 focus:outline-none py-1 bg-transparent"
              />
              <span className="text-sm sm:text-base font-bold text-slate-700">세</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
          >
            <span>AI 친구와 대화 시작하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
