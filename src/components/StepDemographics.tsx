'use client';

import React, { useState } from 'react';
import { Language } from '@/types/experiment';
import { translations } from '@/data/locales';
import { User, Calendar, Briefcase, ArrowRight, AlertCircle } from 'lucide-react';

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

    if (!gender || !birthYear || !occupation || !consented) {
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
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">{t.title}</h2>
          <p className="text-xs text-slate-500 mt-1">{t.subtitle}</p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              {t.genderLabel}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(t.genderOptions).map(([key, label]) => (
                <label
                  key={key}
                  className={`flex items-center justify-center p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                    gender === key
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={key}
                    checked={gender === key}
                    onChange={(e) => setGender(e.target.value)}
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
              {t.birthYearLabel}
            </label>
            <input
              type="number"
              min="1930"
              max={currentYear - 10}
              placeholder={t.birthYearPlaceholder}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs sm:text-sm"
            />
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              {t.occupationLabel}
            </label>
            <select
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs sm:text-sm bg-white"
            >
              <option value="">{language === 'ko' ? '-- 선택하세요 --' : '-- Select --'}</option>
              {Object.entries(t.occupationOptions).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Consent */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                {t.consentCheckbox}
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>{t.submitButton}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
