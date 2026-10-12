'use client';

import React, { useState } from 'react';
import { Language } from '@/types/experiment';
import { translations } from '@/data/locales';
import { IRBConsentViewer } from '@/components/IRBConsentViewer';
import { User, Calendar, Briefcase, ArrowRight, AlertCircle, Sparkles, Bot, CheckCircle2, XCircle } from 'lucide-react';

interface StepDemographicsProps {
  language: Language;
  onComplete: (info: {
    gender: string;
    birthYear: string;
    occupation: string;
    hasAiExperience?: string;
  }) => void;
}

// 2039 세대 기준 (만 20세 ~ 만 39세)
// 2026년 기준: 1986년생 ~ 2006년생
const MIN_VALID_BIRTH_YEAR = 1986;
const MAX_VALID_BIRTH_YEAR = 2006;

export const StepDemographics: React.FC<StepDemographicsProps> = ({
  language,
  onComplete,
}) => {
  const t = translations[language].demographics;

  const [gender, setGender] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [hasAiExperience, setHasAiExperience] = useState<string>(''); // 'yes' | 'no'
  const [occupation, setOccupation] = useState<string>('');
  const [consented, setConsented] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentYear = new Date().getFullYear();

  // 출생연도 유효성 및 스크리닝 판별
  const trimmedYear = birthYear.trim();
  const yearNum = parseInt(trimmedYear, 10);
  const isYearFourDigits = trimmedYear.length === 4 && !isNaN(yearNum);
  
  const isTooOld = isYearFourDigits && yearNum < MIN_VALID_BIRTH_YEAR;
  const isTooYoung = isYearFourDigits && yearNum > MAX_VALID_BIRTH_YEAR;
  const isAgeDisqualified = isTooOld || isTooYoung;

  // AI 챗봇 경험 스크리닝 판별
  const isAiDisqualified = hasAiExperience === 'no';

  // 스크리닝 조건 불충족 여부
  const isScreeningDisqualified = isAgeDisqualified || isAiDisqualified;

  // 출생연도에 따른 대략적인 만 나이 계산
  const calculatedAge = isYearFourDigits && yearNum >= 1900 && yearNum <= currentYear
    ? currentYear - yearNum
    : null;

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

    if (!birthYear || !hasAiExperience || !gender || !occupation) {
      setErrorMessage(
        language === 'ko'
          ? '모든 기본 정보 및 확인 문항에 응답해 주세요.'
          : 'Please complete all demographic and screening questions.'
      );
      return;
    }

    if (!isYearFourDigits || yearNum < 1920 || yearNum > currentYear) {
      setErrorMessage(t.invalidYear || '올바른 4자리 출생연도를 입력해 주세요. (예: 2000)');
      return;
    }

    // 스크리닝 연령 조건 불충족 시 차단
    if (isAgeDisqualified) {
      setErrorMessage(
        language === 'ko'
          ? `본 연구는 만 20세~39세(${MIN_VALID_BIRTH_YEAR}년~${MAX_VALID_BIRTH_YEAR}년생) 참여자를 대상으로 하여 진행이 어렵습니다.`
          : 'This study is restricted to participants aged 20-39.'
      );
      return;
    }

    // AI 경험 불충족 시 차단
    if (isAiDisqualified) {
      setErrorMessage(
        language === 'ko'
          ? '본 연구는 생성형 AI 챗봇 사용 경험이 있으신 분을 대상으로 하여 진행이 어렵습니다.'
          : 'This study requires prior experience with Generative AI chatbots.'
      );
      return;
    }

    onComplete({
      gender,
      birthYear,
      occupation,
      hasAiExperience,
    });
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

        {/* Global Error Banner */}
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

          {/* 2. Screening & Demographics Input Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <span>{language === 'ko' ? '참가자 스크리닝 및 기본 정보' : 'Participant Screening & Demographics'}</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {language === 'ko' ? '※ 연구 대상자 선정 기준 확인' : '※ Verifying eligibility criteria'}
              </span>
            </div>

            {/* Q1. 출생연도 (2039 세대 스크리닝) */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>
                    {language === 'ko' ? '1. 출생연도를 입력해 주세요 (4자리)' : '1. Birth Year (4 digits)'}
                  </span>
                </label>
                {calculatedAge !== null && !isAgeDisqualified && (
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    약 만 {calculatedAge}세
                  </span>
                )}
              </div>

              <input
                type="number"
                min="1930"
                max={currentYear}
                placeholder={language === 'ko' ? '예: 2000 (숫자 4자리 입력)' : 'e.g. 2000'}
                value={birthYear}
                onChange={(e) => {
                  setBirthYear(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className={`w-full px-4 py-3 rounded-xl border transition-all text-slate-800 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 ${
                  isAgeDisqualified
                    ? 'border-amber-400 focus:ring-amber-300 ring-1 ring-amber-300 bg-amber-50/30'
                    : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />

              {/* 연령 스크리닝 실시간 안내 문구 */}
              {isAgeDisqualified && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5 mt-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      {language === 'ko'
                        ? '연구 대상 연령 기준 안내 (만 20세 ~ 39세)'
                        : 'Age Eligibility Notice (Aged 20–39)'}
                    </p>
                    <p className="text-amber-800 mt-1">
                      {language === 'ko'
                        ? isTooYoung
                          ? `죄송합니다. 본 연구는 연구 대상자 선정 기준(만 20세~39세 / ${MIN_VALID_BIRTH_YEAR}년~${MAX_VALID_BIRTH_YEAR}년생)에 해당하는 분들을 대상으로 진행됩니다. 만 20세 미만은 연구 대상에 해당하지 않아 설문 참여가 어렵습니다.`
                          : `죄송합니다. 본 연구는 연구 대상자 선정 기준(만 20세~39세 / ${MIN_VALID_BIRTH_YEAR}년~${MAX_VALID_BIRTH_YEAR}년생)에 해당하는 분들을 대상으로 진행됩니다. 입력하신 연령은 대상에 해당하지 않아 설문 참여가 어렵습니다.`
                        : `We apologize. This study is conducted with participants aged 20–39 (born ${MIN_VALID_BIRTH_YEAR}–${MAX_VALID_BIRTH_YEAR}). The entered birth year does not meet the eligibility criteria.`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Q2. AI 챗봇 사용 경험 여부 (스크리닝) */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 space-y-2.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-600" />
                <span>
                  {language === 'ko'
                    ? '2. 생성형 AI 챗봇(ChatGPT, Claude 등)을 사용해 보신 경험이 있으십니까?'
                    : '2. Have you ever used or interacted with Generative AI chatbots (e.g., ChatGPT, Claude)?'}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label
                  className={`flex items-center justify-center p-3 sm:p-3.5 rounded-xl border cursor-pointer text-xs sm:text-sm font-semibold transition-all select-none ${
                    hasAiExperience === 'yes'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="hasAiExperience"
                    value="yes"
                    checked={hasAiExperience === 'yes'}
                    onChange={() => {
                      setHasAiExperience('yes');
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>{language === 'ko' ? '예 (사용 경험 있음)' : 'Yes (I have experience)'}</span>
                  </span>
                </label>

                <label
                  className={`flex items-center justify-center p-3 sm:p-3.5 rounded-xl border cursor-pointer text-xs sm:text-sm font-semibold transition-all select-none ${
                    hasAiExperience === 'no'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs ring-1 ring-amber-400'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="hasAiExperience"
                    value="no"
                    checked={hasAiExperience === 'no'}
                    onChange={() => {
                      setHasAiExperience('no');
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-amber-600" />
                    <span>{language === 'ko' ? '아니오 (사용 경험 없음)' : 'No (Never used)'}</span>
                  </span>
                </label>
              </div>

              {/* AI 경험 스크리닝 실시간 안내 문구 */}
              {isAiDisqualified && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5 mt-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      {language === 'ko'
                        ? '연구 대상 조건 안내 (AI 챗봇 사용 경험자)'
                        : 'Experience Eligibility Notice'}
                    </p>
                    <p className="text-amber-800 mt-1">
                      {language === 'ko'
                        ? '죄송합니다. 본 연구는 생성형 AI 챗봇과의 상호작용 경험이 있으신 분을 대상으로 진행됩니다. 사용 경험이 없으신 경우 연구 참여 대상에 해당하지 않아 설문이 종료됩니다.'
                        : 'We apologize. This study is conducted with participants who have experience using Generative AI chatbots. Without prior experience, you are not eligible for this study.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Q3. 성별 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'ko' ? '3. 성별' : '3. Gender'}</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {Object.entries(t.genderOptions).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all select-none ${
                      gender === key
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'
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

            {/* Q4. 직업 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'ko' ? '4. 직업' : '4. Occupation'}</span>
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
              disabled={isScreeningDisqualified}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 ${
                isScreeningDisqualified
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white cursor-pointer'
              }`}
            >
              <span>
                {isScreeningDisqualified
                  ? language === 'ko'
                    ? '참여 대상 기준 미충족 (설문 진행 불가)'
                    : 'Ineligible to Participate'
                  : language === 'ko'
                  ? '동의 완료 및 대화 안내로 이동'
                  : 'Agree & Proceed to Instructions'}
              </span>
              {!isScreeningDisqualified && <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2.5">
              {isScreeningDisqualified
                ? language === 'ko'
                  ? '※ 본 연구의 참여 대상 기준(만 20세~39세 및 AI 챗봇 사용 경험)을 충족하지 않아 더 이상 진행하실 수 없습니다.'
                  : '※ You cannot proceed because the eligibility criteria (Aged 20–39 and prior AI chatbot experience) are not met.'
                : language === 'ko'
                ? '※ 동의 후 다음 단계에서 AI 챗봇과의 대화 진행 방법이 안내됩니다.'
                : '※ In the next step, instructions for interacting with the AI chatbot will be provided.'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
