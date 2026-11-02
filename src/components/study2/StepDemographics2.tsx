'use client';

import React, { useState } from 'react';
import { Language } from '@/types/experiment';
import { User, ArrowRight, AlertCircle, Sparkles, Briefcase, Calendar } from 'lucide-react';

interface StepDemographics2Props {
  language: Language;
  onComplete: (info: {
    gender: string;
    age: number;
    occupation: string;
    occupationDetail?: string;
  }) => void;
}

const OCCUPATION_OPTIONS = [
  { id: 'college', label: '🎓 대학생 (휴학생 포함)' },
  { id: 'jobseeker', label: '📝 취업준비생 / 시험준비생' },
  { id: 'worker', label: '💼 직장인 (사회초년생 / 인턴)' },
  { id: 'parttime', label: '☕ 아르바이트 / 프리랜서' },
  { id: 'other', label: '✏️ 기타 (직접 입력)' },
];

export const StepDemographics2: React.FC<StepDemographics2Props> = ({
  language,
  onComplete,
}) => {
  const [gender, setGender] = useState<string>('');
  const [age, setAge] = useState<string>('21');
  const [occupation, setOccupation] = useState<string>('college');
  const [customOccupation, setCustomOccupation] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!gender) {
      setErrorMessage('AI와의 원활한 대화 및 설정을 위해 성별을 선택해 주세요.');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 15 || ageNum > 35) {
      setErrorMessage('나이를 올바른 숫자(만 19~24세 권장)로 입력해 주세요.');
      return;
    }

    if (occupation === 'other' && !customOccupation.trim()) {
      setErrorMessage('기타 직업/신분을 직접 입력해 주세요.');
      return;
    }

    const finalOccupation = occupation === 'other' 
      ? customOccupation.trim() 
      : OCCUPATION_OPTIONS.find(o => o.id === occupation)?.label.replace(/^[^\s]+\s/, '') || '대학생';

    onComplete({
      gender,
      age: ageNum,
      occupation: finalOccupation,
      occupationDetail: customOccupation.trim() || undefined,
    });
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-9 space-y-7">
        {/* Header Introduction */}
        <div className="text-center border-b border-slate-100 pb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI 친구와의 대화 전 기본 설정</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            참가자 기본 정보 확인
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            AI 친구가 당신의 일상과 눈높이에 딱 맞춰 대화할 수 있도록<br className="hidden sm:inline" />
            간단한 기본 정보를 확인합니다.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs sm:text-sm font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. 성별 선택 */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              <span>귀하의 성별을 선택해 주세요 <span className="text-rose-500">*</span></span>
            </label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-3.5 px-4 rounded-xl border text-center font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  gender === 'female'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>👧 여성 (Female)</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-3.5 px-4 rounded-xl border text-center font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  gender === 'male'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>👦 남성 (Male)</span>
              </button>
            </div>
          </div>

          {/* 2. 나이 입력 */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>현재 나이를 입력해 주세요 (만 나이 기준) <span className="text-rose-500">*</span></span>
            </label>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm font-bold text-slate-600">만</span>
              <input
                type="number"
                min="18"
                max="30"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="21"
                className="w-24 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm font-bold text-slate-600">세</span>
              <span className="text-xs text-slate-400 pl-2">(만 19~24세 대상 연구)</span>
            </div>
          </div>

          {/* 3. 직업/신분 선택 */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>현재 본인의 상태(신분/직업)를 선택해 주세요 <span className="text-rose-500">*</span></span>
            </label>
            <div className="space-y-2 pt-1">
              {OCCUPATION_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    occupation === opt.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 text-sm'
                  }`}
                >
                  <input
                    type="radio"
                    name="occupation"
                    value={opt.id}
                    checked={occupation === opt.id}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-xs sm:text-sm">{opt.label}</span>
                </label>
              ))}

              {occupation === 'other' && (
                <div className="pt-2 pl-7">
                  <input
                    type="text"
                    value={customOccupation}
                    onChange={(e) => setCustomOccupation(e.target.value)}
                    placeholder="현재 신분이나 일하시는 분야를 적어주세요 (예: 공무원 준비, 군인 등)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>AI 친구와 대화 시작하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
