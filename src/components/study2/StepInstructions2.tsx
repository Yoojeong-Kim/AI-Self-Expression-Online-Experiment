'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface StepInstructions2Props {
  onStart: () => void;
}

export const StepInstructions2: React.FC<StepInstructions2Props> = ({ onStart }) => {
  return (
    <div className="w-full max-w-md mx-auto py-6 sm:py-12 px-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-neutral-200/90 text-[#0d0d0d] space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0d0d0d] tracking-tight">
            대화 진행 안내
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium">
            지금부터 AI 친구와의 1:1 대화가 시작됩니다.
          </p>
        </div>

        {/* 1, 2, 3 Rules List */}
        <div className="space-y-3">
          {/* Rule 1 */}
          <div className="p-4 rounded-2xl bg-[#f9f9f9] border border-neutral-200/80 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-[#0d0d0d]">
                편안한 반말 대화
              </h4>
              <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
                동갑내기 또래 친구와 카톡하듯 편하고 자연스럽게 반말로 대화해 주세요.
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-4 rounded-2xl bg-[#f9f9f9] border border-neutral-200/80 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-[#0d0d0d]">
                솔직한 생각과 일상 표현
              </h4>
              <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
                화면에 제시되는 선택지나 질문에 본인의 평소 생각이나 일상을 솔직하게 답해 주세요.
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-4 rounded-2xl bg-[#f9f9f9] border border-neutral-200/80 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-[#0d0d0d]">
                대화 후 설문 이동
              </h4>
              <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
                약 5분간의 대화가 끝나면, 대화 경험에 대한 짧은 설문 화면으로 이동합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={onStart}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#0d0d0d] hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <span>AI와 대화 시작하기</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
