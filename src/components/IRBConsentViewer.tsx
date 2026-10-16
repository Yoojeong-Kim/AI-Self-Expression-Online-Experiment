'use client';

import React from 'react';
import { irbConsentData } from '@/data/irbConsent';
import { FileText, ChevronDown, ShieldCheck } from 'lucide-react';

interface IRBConsentViewerProps {
  consented: boolean;
  onConsentChange: (checked: boolean) => void;
}

export const IRBConsentViewer: React.FC<IRBConsentViewerProps> = ({
  consented,
  onConsentChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Scrollable Document Container */}
      <div className="relative border border-slate-300 rounded-xl bg-white shadow-xs overflow-hidden">
        {/* Document Top Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 font-medium">
          <span className="flex items-center gap-1.5 font-bold text-slate-800">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>연구 참여 설명문 및 동의서</span>
          </span>
          <span className="flex items-center gap-1 text-slate-400 text-[11px]">
            <span>스크롤하여 확인</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          </span>
        </div>

        {/* Scroll Body */}
        <div className="p-4 sm:p-6 max-h-[380px] sm:max-h-[440px] overflow-y-auto space-y-5 text-[13px] text-slate-700 leading-relaxed font-sans pr-3 scrollbar-thin scrollbar-thumb-slate-300">
          {/* 14 Sections Content */}
          <div className="space-y-4">
            {irbConsentData.sections.map((sec) => (
              <div key={sec.num} className="space-y-1.5">
                <h5 className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5">
                  <span className="text-indigo-600 font-semibold">{sec.num}.</span>
                  <span>{sec.title}</span>
                </h5>
                <div className="space-y-1.5 pl-3.5 text-slate-600 leading-relaxed border-l-2 border-slate-200">
                  {sec.content.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <hr className="border-slate-200 my-4" />

          {/* Official IRB Notice & Confirmation */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>성균관대 기관생명윤리위원회 위원장 귀하</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              본인은 본 동의서의 내용을 읽고 이해하였으며, 궁금한 사항은 연구자에게 문의할 수 있음을 알고 있습니다. 
              본인은 자발적으로 본 연구에 참여하는 것에 동의합니다.
            </p>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              {irbConsentData.systemAutoRecordNote}
            </p>
          </div>
        </div>
      </div>

      {/* Main Bottom Agreement Checkbox */}
      <div
        onClick={() => onConsentChange(!consented)}
        className={`p-4 rounded-xl border-2 transition-all cursor-pointer select-none flex items-start gap-3 ${
          consented
            ? 'bg-indigo-50/90 border-indigo-600 shadow-xs ring-1 ring-indigo-500/20'
            : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/60'
        }`}
      >
        <input
          type="checkbox"
          id="irb-consent-agree"
          checked={consented}
          onChange={(e) => onConsentChange(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
        />
        <label
          htmlFor="irb-consent-agree"
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer text-xs sm:text-[13px] font-bold text-slate-900 leading-snug"
        >
          {irbConsentData.agreementCheckboxLabel}
        </label>
      </div>
    </div>
  );
};
