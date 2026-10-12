'use client';

import React, { useState } from 'react';
import { Language } from '@/types/experiment';
import { translations } from '@/data/locales';
import { IRBConsentViewer } from '@/components/IRBConsentViewer';
import { User, Calendar, Briefcase, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface StepDemographicsProps {
  language: Language;
  onComplete: (info: { gender: string; birthYear: string; occupation: string }) => void;
}

export const StepDemographics: React.FC<StepDemographicsProps> = ({
  language,
  onComplete,
}) => {
  const t = translations[language].demographics;

  const [gender, setGender] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [occupation, setOccupation] = useState<string>('');
  const [consented, setConsented] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentYear = new Date().getFullYear();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!consented) {
      setErrorMessage(
        language === 'ko'
          ? '연구 참여 동의서 내용을 확인하신 후, 동의 체크박스에 체크해 주셔야 설문에 참여하실 수 있습니다.'
          : 'Please review the informed consent and check the agreement checkbox to participate in the study.'
      );
      return;
    }

    if (!gender || !birthYear || !occupation) {
      setErrorMessage(t.validationError);
      return;
    }

    const yearNum = parseInt(birthYear, 10);
    if (isNaN(yearNum) || yearNum < 1930 || yearNum > currentYear - 10) {
      setErrorMessage(t.invalidYear);
      return;
    }

    onComplete({ gender, birthYear, occupation });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-9 space-y-8">
        {/* Header Introduction */}
        <div className="border-b border-slate-100 pb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'ko' ? '1. 연구 참여 동의 및 기본 정보' : '1. Informed Consent & Demographics'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            {language === 'ko' ? '연구 참여자 설명문 및 동의서' : 'Study Participant Information & Consent Form'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            {language === 'ko'
              ? '본 연구는 성균관대학교 기관생명윤리위원회(IRB)의 승인을 받아 진행됩니다. 아래 연구 설명문을 스크롤하여 확인하신 뒤, 최하단 동의란에 체크하고 기본 정보를 입력해 주세요.'
              : 'This study has been reviewed and approved by the Institutional Review Board (IRB) of Sungkyunkwan University. Please scroll through the information below, check the consent box at the bottom, and enter your basic demographic information.'}
          </p>
        </div>

        {/* Error Message Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs sm:text-sm font-semibold shadow-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Scrollable IRB Consent Section */}
          <div>
            <IRBConsentViewer
              consented={consented}
              onConsentChange={(val) => {
                setConsented(val);
                if (errorMessage) setErrorMessage('');
              }}
            />
          </div>

          <hr className="border-slate-200/80" />

          {/* 2. Demographics Input Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <span>{language === 'ko' ? '참가자 기본 정보 입력' : 'Participant Demographics'}</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {language === 'ko' ? '※ 통계 분석용 익명 수집' : '※ Anonymous collection for statistical analysis'}
              </span>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.genderLabel}</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {Object.entries(t.genderOptions).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all select-none ${
                      gender === key
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={key}
                      checked={gender === key}
                      onChange={(e) => {
                        setGender(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      className="sr-only"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Birth Year */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.birthYearLabel}</span>
              </label>
              <input
                type="number"
                min="1930"
                max={currentYear - 10}
                placeholder={t.birthYearPlaceholder}
                value={birthYear}
                onChange={(e) => {
                  setBirthYear(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs sm:text-sm bg-white"
              />
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.occupationLabel}</span>
              </label>
              <select
                value={occupation}
                onChange={(e) => {
                  setOccupation(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs sm:text-sm bg-white"
              >
                <option value="">{language === 'ko' ? '-- 선택하세요 --' : '-- Select --'}</option>
                {Object.entries(t.occupationOptions).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{language === 'ko' ? '동의 완료 및 대화 안내로 이동' : 'Agree & Proceed to Instructions'}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2.5">
              {language === 'ko'
                ? '※ 동의 후 다음 단계에서 AI 챗봇과의 대화 진행 방법이 안내됩니다.'
                : '※ In the next step, instructions for interacting with the AI chatbot will be provided.'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
