'use client';

import React, { useEffect, useState } from 'react';
import { Language, ExperimentData } from '@/types/experiment';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StepCompleteProps {
  language: Language;
  experimentData: ExperimentData;
}

export const StepComplete: React.FC<StepCompleteProps> = ({
  language,
  experimentData,
}) => {
  const p = experimentData.participant;
  
  // Construct Embrain return redirect URL with panel ID
  const panelId = p?.id || '';
  const embrainRedirectUrl = `https://survey.panel.co.kr/2026/154697/m9.asp?panel_id=${encodeURIComponent(panelId)}&status=001`;

  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    try {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    // Auto redirect countdown timer (3 seconds)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = embrainRedirectUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [embrainRedirectUrl]);

  return (
    <div className="max-w-xl mx-auto py-16 px-4 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          {language === 'ko' ? '참여해 주셔서 감사합니다.' : 'Thank you for your participation.'}
        </h2>

        {/* Emphasized Red Notice Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-sm sm:text-base font-bold flex flex-col items-center justify-center gap-3 shadow-sm text-center leading-relaxed">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <span>패널 적립금 지급 및 최종 완료를 위해 엠브레인 링크로 이동합니다.</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-rose-700 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
            <span>{countdown > 0 ? `${countdown}초 후 엠브레인 페이지로 자동 이동됩니다...` : '페이지로 이동 중입니다...'}</span>
          </div>
        </div>

        {/* Direct Button in case auto-redirect is blocked by browser popup settings */}
        <div className="pt-2">
          <a
            href={embrainRedirectUrl}
            className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>엠브레인 완료 페이지로 바로 이동하기</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            ※ 화면이 자동으로 넘어가지 않으면 위 버튼을 직접 눌러주세요.
          </p>
        </div>
      </div>
    </div>
  );
};
