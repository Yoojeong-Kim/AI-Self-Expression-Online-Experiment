'use client';

import React, { useState } from 'react';
import { Language } from '@/types/experiment';
import { User, ArrowRight, AlertCircle, Sparkles, MessageCircle, Clock, HeartHandshake } from 'lucide-react';

interface StepDemographicsProps {
  language: Language;
  onComplete: (info: {
    gender: string;
    birthYear: string;
    occupation: string;
    hasAiExperience?: string;
  }) => void;
}

export const StepDemographics: React.FC<StepDemographicsProps> = ({
  language,
  onComplete,
}) => {
  const [gender, setGender] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!gender) {
      setErrorMessage(
        language === 'ko'
          ? '챗봇 대화 진행을 위해 성별을 선택해 주세요.'
          : 'Please select your gender to proceed.'
      );
      return;
    }

    onComplete({
      gender,
      birthYear: '',
      occupation: '',
      hasAiExperience: 'yes',
    });
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-9 space-y-7">
        {/* Header Introduction */}
        <div className="text-center border-b border-slate-100 pb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'ko' ? 'AI 챗봇 대화 과제 안내' : 'AI Chatbot Task Guide'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            {language === 'ko' ? 'AI 챗봇과의 대화 시작 전 안내' : 'Before You Chat with the AI'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            {language === 'ko'
              ? '원활한 실험 진행 및 챗봇 설정을 위해 성별을 선택하신 후 안내에 따라 대화를 시작해 주세요.'
              : 'Please select your gender and review the instructions before beginning the chat.'}
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
          {/* Gender Selection */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              <span>{language === 'ko' ? '귀하의 성별을 선택해 주세요' : 'Please select your gender'}</span>
              <span className="text-indigo-600 text-xs font-normal">
                {language === 'ko' ? '(대화 챗봇 매칭용)' : '(For chatbot matching)'}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <label
                className={`flex items-center justify-center py-3.5 px-4 rounded-xl border-2 cursor-pointer text-xs sm:text-sm font-bold transition-all select-none ${
                  gender === 'male'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-white text-slate-700 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={(e) => {
                    setGender(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="sr-only"
                />
                <span>{language === 'ko' ? '남성' : 'Male'}</span>
              </label>

              <label
                className={`flex items-center justify-center py-3.5 px-4 rounded-xl border-2 cursor-pointer text-xs sm:text-sm font-bold transition-all select-none ${
                  gender === 'female'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-white text-slate-700 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={(e) => {
                    setGender(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="sr-only"
                />
                <span>{language === 'ko' ? '여성' : 'Female'}</span>
              </label>
            </div>
          </div>

          {/* Chat Instructions Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-indigo-950 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-indigo-600" />
              <span>{language === 'ko' ? '대화 진행 방법 안내' : 'How to chat with the AI'}</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2">
                <HeartHandshake className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'ko'
                    ? '친한 친구와 대화하듯이 편안하게 이야기해 주시면 됩니다.'
                    : 'Feel free to chat comfortably as if texting a friendly companion.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'ko'
                    ? '대화는 최소 6분 동안 진행되며, 정해진 시간 동안 자유롭게 대화를 이어가 주세요.'
                    : 'The conversation continues for at least 6 minutes.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'ko'
                    ? '대화 중간 화면 상단에 제시되는 주제(관심사, 일상 고민 등)를 참고하여 자연스럽게 이야기해 주시면 됩니다.'
                    : 'Topics will appear at the top of the chat to guide your conversation naturally.'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{language === 'ko' ? 'AI와 대화 시작하기' : 'Start Chat with AI'}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2.5">
              {language === 'ko'
                ? '※ 버튼을 누르면 AI 챗봇과의 1:1 대화창으로 바로 연결됩니다.'
                : '※ Clicking the button connects you directly to the 1-on-1 AI chat screen.'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
