'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { StepDemographics2 } from '@/components/study2/StepDemographics2';
import { StepChat2 } from '@/components/study2/StepChat2';
import { StepSurvey } from '@/components/StepSurvey';
import { StepComplete } from '@/components/StepComplete';
import { Language, Step, ParticipantInfo, ChatMessage, SurveyResponse, ExperimentData } from '@/types/experiment';

export default function Study2Page() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ko');
  const [currentStep, setCurrentStep] = useState<Step>('demographics');

  const [participant, setParticipant] = useState<ParticipantInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [totalChatSeconds, setTotalChatSeconds] = useState<number>(0);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse>({});
  const [startedAt, setStartedAt] = useState<string>('');
  const [completedExperimentData, setCompletedExperimentData] = useState<ExperimentData | null>(null);
  
  // Custom demographics for Study 2
  const [userAge, setUserAge] = useState<number>(21);
  const [userOccupation, setUserOccupation] = useState<string>('대학생');

  const participantRef = React.useRef<ParticipantInfo | null>(null);
  const chatMessagesRef = React.useRef<ChatMessage[]>([]);
  const totalChatSecondsRef = React.useRef<number>(0);
  const startedAtRef = React.useRef<string>('');

  useEffect(() => {
    setMounted(true);
    const now = new Date().toISOString();
    setStartedAt(now);
    startedAtRef.current = now;

    const urlParams = new URLSearchParams(window.location.search);
    const condParam = (urlParams.get('cond') || urlParams.get('c') || '').trim();
    const pidParam = (urlParams.get('pid') || urlParams.get('id') || '').trim();

    const assignCondition = async () => {
      try {
        const queryStr = condParam ? `?cond=${encodeURIComponent(condParam)}` : '';
        const res = await fetch(`/api/assign${queryStr}`);
        if (res.ok) {
          const data = await res.json();
          const pInfo: ParticipantInfo = {
            id: pidParam || data.participantId,
            imageType: data.imageType,
            timing: data.timing,
            condition: data.condition,
            group: data.imageType,
            gender: '',
            birthYear: '',
            occupation: '',
            consentedAt: now,
          };
          setParticipant(pInfo);
          participantRef.current = pInfo;
          return;
        }
      } catch (e) {
        console.warn('Assign API error, using fallback assignment:', e);
      }

      // Fallback in-client randomizer or param assignment
      const validConditions = ['A_pre', 'A_mid', 'B_pre', 'B_mid'];
      const assignedCondition = validConditions.includes(condParam)
        ? condParam
        : validConditions[Math.floor(Math.random() * validConditions.length)];

      const [imageTypeStr, timingStr] = assignedCondition.split('_');
      const randomId = pidParam || ('S2_' + Math.random().toString(36).substring(2, 8).toUpperCase());
      const imageType = imageTypeStr as any;
      const timing = timingStr as any;
      const condition = assignedCondition as any;

      const pInfo: ParticipantInfo = {
        id: randomId,
        imageType,
        timing,
        condition,
        group: imageType,
        gender: '',
        birthYear: '',
        occupation: '',
        consentedAt: now,
      };
      setParticipant(pInfo);
      participantRef.current = pInfo;
    };

    assignCondition();
  }, []);

  // 1. 사전 설문 완료 시 (성별, 나이 확인 -> 곧바로 대화창 진입!)
  const handleDemographicsComplete = (info: {
    gender: string;
    age: number;
  }) => {
    setUserAge(info.age);

    if (participant) {
      const updated: ParticipantInfo = {
        ...participant,
        gender: info.gender,
        birthYear: String(new Date().getFullYear() - info.age),
      };
      setParticipant(updated);
      participantRef.current = updated;
    }

    // Direct transition to Interactive Chat Step!
    setCurrentStep('chat');
  };

  // 2. 대화 완료 시 (채팅 내 1단계 기본 대화에서 입력한 직업·성별·나이 반영)
  const handleChatFinish = (
    totalSeconds: number,
    messages: ChatMessage[],
    updatedInfo?: { gender: string; age: number; occupation: string }
  ) => {
    setTotalChatSeconds(totalSeconds);
    setChatMessages(messages);
    totalChatSecondsRef.current = totalSeconds;
    chatMessagesRef.current = messages;

    if (updatedInfo && participantRef.current) {
      const updated: ParticipantInfo = {
        ...participantRef.current,
        gender: updatedInfo.gender || participantRef.current.gender,
        birthYear: String(new Date().getFullYear() - updatedInfo.age),
        occupation: updatedInfo.occupation,
      };
      setParticipant(updated);
      participantRef.current = updated;
    }

    setCurrentStep('survey');
  };

  // 3. 설문 완료 및 데이터 저장
  const handleSurveyComplete = async (responses: SurveyResponse) => {
    setSurveyResponses(responses);

    if (!participantRef.current) return;

    const experimentData: ExperimentData = {
      participant: participantRef.current,
      language: language,
      totalChatSeconds: totalChatSecondsRef.current,
      chatMessages: chatMessagesRef.current,
      surveyResponses: responses,
      startedAt: startedAtRef.current,
      submittedAt: new Date().toISOString(),
    };

    setCompletedExperimentData(experimentData);

    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experimentData),
      });
    } catch (e) {
      console.error('Save API error:', e);
    }

    setCurrentStep('complete');
  };

  if (!mounted || !participant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0d0d0d] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-neutral-500">화면을 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        currentStep === 'chat'
          ? 'h-dvh overflow-hidden bg-[#f4f4f4] flex flex-col items-center justify-center sm:p-4 font-sans text-[#0d0d0d]'
          : 'min-h-screen bg-[#f9f9f9] flex flex-col font-sans text-[#0d0d0d]'
      }
    >
      {currentStep !== 'chat' && (
        <Header
          language={language}
          onLanguageChange={setLanguage}
          currentStep={currentStep}
          condition={participant.condition}
          participantId={participant.id}
        />
      )}

      <main className={currentStep === 'chat' ? 'w-full h-full flex items-center justify-center' : 'flex-1 py-4 sm:py-6'}>
        {/* Step 1: Pre-Demographics (Gender, Age, Occupation) */}
        {currentStep === 'demographics' && (
          <StepDemographics2
            language={language}
            onComplete={handleDemographicsComplete}
          />
        )}

        {/* Step 2: Interactive Turn-based & Button Chat */}
        {currentStep === 'chat' && (
          <StepChat2
            language={language}
            gender={participant.gender}
            imageType={participant.imageType}
            timing={participant.timing}
            userAge={userAge}
            userOccupation={userOccupation}
            onFinishChat={handleChatFinish}
          />
        )}

        {/* Step 3: Main Survey */}
        {currentStep === 'survey' && (
          <StepSurvey
            language={language}
            group={participant.group}
            gender={participant.gender}
            onSubmitSurvey={handleSurveyComplete}
          />
        )}

        {/* Step 4: Completion */}
        {currentStep === 'complete' && completedExperimentData && (
          <StepComplete
            language={language}
            experimentData={completedExperimentData}
          />
        )}
      </main>
    </div>
  );
}
