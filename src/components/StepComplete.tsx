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

    const sendData = async () => {
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(experimentData),
        });
        const result = await res.json();
        if (result.success && result.sheetsSynced) {
          setStatusMessage(t.statusSynced);
        } else {
          setStatusMessage(t.statusLocal);
        }
      } catch (err) {
        setStatusMessage(t.statusLocal);
      }
    };

    sendData();
  }, [experimentData, t.statusLocal, t.statusSynced]);

  const p = experimentData.participant;
  const mins = Math.round(experimentData.totalChatSeconds / 60);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Award className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          {language === 'ko' ? '참여해 주셔서 감사합니다.' : 'Thank you for your participation.'}
        </h2>

        {/* Debriefing Section */}
        <div className="mt-8 text-left bg-slate-50/80 rounded-2xl p-5 sm:p-7 border border-slate-200/80 space-y-4">
          <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
            <p>
              {language === 'ko'
                ? '본 연구는 AI 챗봇이 자신의 모습을 시각적으로 보여주는 방식이 사용자의 인식과 상호작용에 어떤 영향을 미치는지 알아보기 위해 진행되었습니다.'
                : 'This study was conducted to investigate how an AI chatbot\'s visual self-presentation affects users\' perceptions and interactions.'}
            </p>
            <p>
              {language === 'ko'
                ? '대화 중 보신 사진은 연구진이 사전에 준비한 자극물 이미지이며, 참여자가 나눈 대화 내용을 실시간으로 반영해 생성된 것이 아닙니다. 참여자에 따라 사진이 제시되는 시점과 사진의 유형이 다르게 배정되었습니다.'
                : 'The picture shown during the chat was pre-selected by the research team and not generated in real-time based on your conversation. The timing and type of visual presentation varied across participants.'}
            </p>
          </div>

          {/* Principal Investigator Contact Info */}
          <div className="pt-4 border-t border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800">
              {language === 'ko' ? '연구 관련 문의사항' : 'Research Inquiry & Contact'}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-0.5">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'ko' ? '연구책임자: 김유정' : 'Lead Researcher: Yujeong Kim'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'ko' ? '연락처: 010-9507-3814' : 'Contact: +82 10-9507-3814'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t.closeNotice}</span>
        </div>
      </div>
    </div>
  );
};
