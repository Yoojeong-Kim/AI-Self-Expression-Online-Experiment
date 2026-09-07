'use client';

import React, { useState } from 'react';
import { Language, ExperimentGroup, SurveyResponse } from '@/types/experiment';
import { translations } from '@/data/locales';
import { surveySections, allSurveyQuestions, SurveyQuestionItem } from '@/data/surveyQuestions';
import { getStimulusImageUrl } from '@/data/stimuli';
import { IOSScale } from '@/components/IOSScale';
import { ArrowRight, AlertCircle, Sparkles, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface StepSurveyProps {
  language: Language;
  group: ExperimentGroup;
  gender?: string;
  onSubmitSurvey: (responses: SurveyResponse) => void;
}

export const StepSurvey: React.FC<StepSurveyProps> = ({
  language,
  group,
  gender,
  onSubmitSurvey,
}) => {
  const t = translations[language].survey;
  const [responses, setResponses] = useState<SurveyResponse>({});
  const [errorMessage, setErrorMessage] = useState<string>('');

  const totalQuestions = allSurveyQuestions.length;
  const answeredCount = Object.keys(responses).filter((k) => {
    const val = responses[k];
    return val !== undefined && val !== null && String(val).trim() !== '';
  }).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const isComplete = answeredCount >= totalQuestions;
  const stimulusSrc = getStimulusImageUrl(gender, group);

  // Secret shortcut: Alt + S (or Ctrl+Shift+S / F2) to autofill all survey questions for testing
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isS = e.code === 'KeyS' || e.key === 's' || e.key === 'S' || e.key === 'ㄴ' || e.keyCode === 83;
      if ((e.altKey && isS) || ((e.ctrlKey || e.metaKey) && e.shiftKey && isS) || e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();
        const autoFilled: SurveyResponse = {};
        allSurveyQuestions.forEach((q) => {
          if (q.type === 'likert7') autoFilled[q.id] = 6;
          else if (q.type === 'ios') autoFilled[q.id] = 5;
          else if (q.type === 'singleChoice' && q.options && q.options.length > 0) autoFilled[q.id] = q.options[0].value;
          else if (q.type === 'yesNo') autoFilled[q.id] = 'yes';
          else if (q.type === 'number') autoFilled[q.id] = 25;
          else autoFilled[q.id] = 'Testing response';
        });
        setResponses(autoFilled);
        if (errorMessage) setErrorMessage('');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [errorMessage]);

  const handleSelectValue = (questionId: string, value: number | string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answeredCount < totalQuestions) {
      setErrorMessage(
        language === 'ko'
          ? `아직 작성하지 않은 문항이 있습니다. (${totalQuestions - answeredCount}개 미응답)`
          : `There are unanswered questions remaining. (${totalQuestions - answeredCount} unanswered)`
      );
      return;
    }
    onSubmitSurvey(responses);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* 1. Introduction Card & Sticky Chatbot Image Display */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          {/* Chatbot Image Display (Top Sticky / Anchored) */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm flex items-center justify-center">
              <img
                src={stimulusSrc}
                alt="Chatbot Presented Image"
                className="w-full h-full object-cover block"
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              {language === 'ko' ? '대화 중 챗봇이 보여준 사진' : 'Photo presented by chatbot'}
            </span>
          </div>

          {/* Intro Text */}
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ko' ? '1. 도입 안내' : '1. Introduction'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              {language === 'ko' ? 'AI 챗봇의 시각적 자기표현 연구' : 'Study on Visual Self-Presentation of AI Chatbots'}
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 space-y-1.5 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p>
                {language === 'ko'
                  ? '대화는 여기까지입니다. 지금부터는 방금 나눈 대화에 대해 여쭤보겠습니다.'
                  : 'The conversation has ended. From now on, we will ask about your experience during the conversation.'}
              </p>
              <p>
                {language === 'ko'
                  ? '정답이나 오답은 없으며 대화 중에 실제로 느끼셨던 그대로 답해 주시면 됩니다.'
                  : 'There are no right or wrong answers; please respond honestly based on how you felt.'}
              </p>
              <p className="text-slate-500 font-medium pt-1">
                {language === 'ko'
                  ? '※ 응답은 익명으로 처리되며 연구 목적으로만 사용됩니다. (약 10분 소요)'
                  : '※ All responses are anonymous and used strictly for research purposes. (Approx. 10 mins)'}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span>{language === 'ko' ? '전체 설문 진행률' : 'Survey Progress'}</span>
            <span className="text-indigo-600">
              {answeredCount} / {totalQuestions} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300 shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm font-semibold shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Survey Sections Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {surveySections.map((section, secIdx) => (
          <div
            key={section.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5"
          >
            {/* Section Header */}
            <div className="border-b border-slate-100 pb-3.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                {language === 'ko' ? section.titleKo : section.titleEn}
              </h3>
              {(section.instructionKo || section.instructionEn) && (
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/60">
                  {language === 'ko' ? section.instructionKo : section.instructionEn}
                </p>
              )}
            </div>

            {/* Questions in Section */}
            <div className="space-y-5">
              {section.questions.map((q) => {
                const selectedVal = responses[q.id];
                const isAnswered =
                  selectedVal !== undefined &&
                  selectedVal !== null &&
                  String(selectedVal).trim() !== '';

                return (
                  <div
                    key={q.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isAnswered
                        ? 'border-slate-200 bg-slate-50/40'
                        : 'border-slate-300/90 bg-white shadow-2xs'
                    }`}
                  >
                    {/* Question Title */}
                    <div className="flex items-start gap-2.5 mb-3.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5 ${
                          isAnswered
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isAnswered ? '✓' : '•'}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                        {language === 'ko' ? q.ko : q.en}
                      </p>
                    </div>

                    {/* Question Controls by Type */}
                    {q.type === 'likert7' && (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-7 gap-1.5">
                          {[1, 2, 3, 4, 5, 6, 7].map((score) => {
                            const isChecked = selectedVal === score;
                            return (
                              <label
                                key={score}
                                onClick={() => handleSelectValue(q.id, score)}
                                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border cursor-pointer select-none transition-all ${
                                  isChecked
                                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs scale-[1.02]'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={score}
                                  checked={isChecked}
                                  onChange={() => handleSelectValue(q.id, score)}
                                  className="sr-only"
                                />
                                <span className="text-xs sm:text-sm font-bold">{score}</span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 px-1 pt-1">
                          <span>1 ({t.likertMin})</span>
                          <span>4 ({t.likertMid})</span>
                          <span>7 ({t.likertMax})</span>
                        </div>
                      </div>
                    )}

                    {q.type === 'ios' && (
                      <IOSScale
                        value={typeof selectedVal === 'number' ? selectedVal : undefined}
                        onChange={(val) => handleSelectValue(q.id, val)}
                        language={language}
                      />
                    )}

                    {q.type === 'singleChoice' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt) => {
                          const isChecked = String(selectedVal) === opt.value;
                          return (
                            <label
                              key={opt.value}
                              onClick={() => handleSelectValue(q.id, opt.value)}
                              className={`flex items-center p-3 rounded-xl border cursor-pointer text-xs sm:text-sm font-medium transition-all ${
                                isChecked
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs font-bold'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={opt.value}
                                checked={isChecked}
                                onChange={() => handleSelectValue(q.id, opt.value)}
                                className="sr-only"
                              />
                              <span>{language === 'ko' ? opt.ko : opt.en}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'yesNo' && (
                      <div className="flex gap-3">
                        {[
                          { val: 'yes', ko: '예', en: 'Yes' },
                          { val: 'no', ko: '아니오', en: 'No' },
                        ].map((opt) => {
                          const isChecked = selectedVal === opt.val;
                          return (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => handleSelectValue(q.id, opt.val)}
                              className={`flex-1 py-2.5 px-4 rounded-xl border font-bold text-xs sm:text-sm transition-all ${
                                isChecked
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {language === 'ko' ? opt.ko : opt.en}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'number' && (
                      <div className="flex items-center gap-2 max-w-xs">
                        <input
                          type="number"
                          min="10"
                          max="100"
                          placeholder={language === 'ko' ? '예: 23' : 'e.g., 23'}
                          value={selectedVal !== undefined ? String(selectedVal) : ''}
                          onChange={(e) => handleSelectValue(q.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                        />
                        <span className="text-xs font-semibold text-slate-500">
                          {language === 'ko' ? '세' : 'years old'}
                        </span>
                      </div>
                    )}

                    {q.type === 'text' && (
                      <input
                        type="text"
                        placeholder={language === 'ko' ? '예: 대한민국' : 'e.g., South Korea'}
                        value={selectedVal !== undefined ? String(selectedVal) : ''}
                        onChange={(e) => handleSelectValue(q.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sticky Submit Button */}
        <div className="sticky bottom-4 z-40 pt-4">
          <button
            type="submit"
            disabled={!isComplete}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 group ${
              isComplete
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl hover:shadow-2xl cursor-pointer ring-2 ring-indigo-600/30 ring-offset-2'
                : 'bg-slate-200 text-slate-400 border border-slate-300 shadow-none cursor-not-allowed pointer-events-none'
            }`}
          >
            <span>
              {isComplete
                ? t.submitButton
                : language === 'ko'
                ? `모든 문항에 응답해 주세요 (${answeredCount}/${totalQuestions})`
                : `Please answer all questions (${answeredCount}/${totalQuestions})`}
            </span>
            <ArrowRight className={`w-5 h-5 transition-transform ${isComplete ? 'group-hover:translate-x-1 text-white' : 'text-slate-400'}`} />
          </button>
        </div>
      </form>
    </div>
  );
};
