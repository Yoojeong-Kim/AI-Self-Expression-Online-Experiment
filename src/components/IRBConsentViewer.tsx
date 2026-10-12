'use client';

import React from 'react';
import { irbConsentData } from '@/data/irbConsent';
import { FileText, Users, ShieldCheck, ChevronDown, Printer } from 'lucide-react';

interface IRBConsentViewerProps {
  consented: boolean;
  onConsentChange: (checked: boolean) => void;
}

export const IRBConsentViewer: React.FC<IRBConsentViewerProps> = ({
  consented,
  onConsentChange,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Document Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            {irbConsentData.formNumber}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            생명윤리심의 통과 과제
          </span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors self-start sm:self-auto print:hidden"
          title="동의서 인쇄 또는 PDF 저장"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>동의서 사본 인쇄/저장</span>
        </button>
      </div>

      {/* Scrollable Document Container */}
      <div className="relative border border-slate-200/90 rounded-2xl bg-white shadow-xs overflow-hidden">
        {/* Subtle scroll hint badge */}
        <div className="bg-slate-50/90 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            {irbConsentData.documentTitle}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span>스크롤하여 전문 확인</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          </span>
        </div>

        {/* Scroll Body */}
        <div className="p-4 sm:p-6 max-h-[360px] sm:max-h-[420px] overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed font-sans pr-3 scrollbar-thin scrollbar-thumb-slate-300">
          {/* Notice Alert */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
            <p className="font-semibold">{irbConsentData.notice}</p>
          </div>

          {/* Project Title Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span>■ 연구과제</span>
            </h4>
            <div className="space-y-1 pl-2">
              <p>
                <strong className="text-slate-900">[국문]</strong> {irbConsentData.projectTitleKo}
              </p>
              <p className="text-slate-600">
                <strong className="text-slate-900">[영문]</strong> {irbConsentData.projectTitleEn}
              </p>
            </div>
          </div>

          {/* Research Team Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>■ 연구진 정보</span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-[11px] border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2 px-3 font-semibold">구분</th>
                    <th className="py-2 px-3 font-semibold">소속 및 직위</th>
                    <th className="py-2 px-3 font-semibold">성명</th>
                    <th className="py-2 px-3 font-semibold">전공분야</th>
                    <th className="py-2 px-3 font-semibold">연락처</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {irbConsentData.researchers.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-3 font-medium text-slate-900">{r.role}</td>
                      <td className="py-1.5 px-3 text-slate-600">{r.affiliation} {r.position}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{r.name}</td>
                      <td className="py-1.5 px-3 text-slate-600">{r.major}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-600">{r.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* 14 Sections Content */}
          <div className="space-y-4">
            {irbConsentData.sections.map((sec) => (
              <div key={sec.num} className="space-y-1.5">
                <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  <span className="text-indigo-600">{sec.num}.</span>
                  <span>{sec.title}</span>
                </h5>
                <div className="space-y-1 pl-3.5 text-slate-600 leading-relaxed border-l-2 border-indigo-100">
                  {sec.content.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <hr className="border-slate-200" />

          {/* Closing Official Statement */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200/80 space-y-1.5">
            <p className="font-bold text-slate-800">성균관대 기관생명윤리위원회 위원장 귀하</p>
            <p className="text-slate-700 leading-relaxed">
              본인은 본 동의서의 내용을 읽고 이해하였으며, 궁금한 사항은 연구자에게 문의할 수 있음을 알고 있습니다. 
              본인은 자발적으로 본 연구에 참여하는 것에 동의합니다.
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              {irbConsentData.systemAutoRecordNote}
            </p>
          </div>
        </div>
      </div>

      {/* Main Bottom Agreement Checkbox */}
      <div
        onClick={() => onConsentChange(!consented)}
        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-start gap-3 ${
          consented
            ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
            : 'bg-white border-slate-300 hover:border-indigo-300 hover:bg-slate-50/50'
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
          className="cursor-pointer text-xs sm:text-sm font-bold text-slate-900 leading-snug"
        >
          {irbConsentData.agreementCheckboxLabel}
          <span className="block text-xs font-normal text-slate-500 mt-1">
            (위 설명문을 끝까지 확인하였으며, 엠브레인 패널 리워드 지급 및 AI 챗봇 연구 참여에 동의합니다.)
          </span>
        </label>
      </div>
    </div>
  );
};
