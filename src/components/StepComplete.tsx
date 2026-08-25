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
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{t.title}</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.subtitle}</p>

        {/* Sync Status Badge */}
        <div className="mt-5 p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-2">
          <Database className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>

        {/* Participant Summary Info */}
        <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">{t.participantId}</span>
            <strong className="font-mono text-slate-800 text-sm">{p.id}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">{t.group}</span>
            <strong className="text-indigo-600 font-semibold">Group {p.group}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">{t.totalChatTime}</span>
            <strong className="text-slate-800">{mins}m ({experimentData.totalChatSeconds}s)</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Status</span>
            <strong className="text-emerald-700 font-bold">100% Complete</strong>
          </div>
        </div>

        {/* 8. Debriefing Section */}
        <div className="mt-8 text-left bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-3">
            <Info className="w-4 h-4" />
            <span>{language === 'ko' ? '8. 연구 디브리핑 (Debriefing)' : '8. Study Debriefing'}</span>
          </div>

          <div className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed">
            <p className="font-semibold text-slate-800">
              {language === 'ko' ? '참여해 주셔서 진심으로 감사합니다.' : 'Thank you very much for participating in this study.'}
            </p>
            <p>
              {language === 'ko'
                ? '이 연구는 AI 챗봇이 자신의 모습을 시각적으로 보여주는 방식이 사용자의 인식에 어떤 영향을 주는지 알아보기 위한 것이었습니다.'
                : 'This study investigated how an AI chatbot\'s visual self-presentation affects users\' perceptions.'}
            </p>
            <p>
              {language === 'ko'
                ? '대화 중 보신 사진은 연구진이 미리 준비한 이미지이며, 참여자가 나눈 대화 내용을 반영해 생성된 것이 아닙니다. 참여자에 따라 사진이 제시되는 시점과 사진의 종류가 다르게 배정되었습니다.'
                : 'The picture shown during the chat was pre-selected by the research team and not generated based on your chat content. The timing and type of visual presentation varied across participants.'}
            </p>
          </div>

          {/* Principal Investigator Contact Info */}
          <div className="mt-5 pt-4 border-t border-slate-200/80 bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <p className="font-bold text-slate-800">
              {language === 'ko' ? '연구 관련 문의사항 안내' : 'Principal Investigator Contact'}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'ko' ? '연구책임자: 김유정' : 'Lead Researcher: Yujeong Kim'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'ko' ? '연락처: 010-9507-3814' : 'Contact: +82 10-9507-3814'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t.closeNotice}</span>
        </div>
      </div>
    </div>
  );
};
