'use client';

import React, { useState, useEffect } from 'react';
import { StepInstructions2 } from '@/components/study2/StepInstructions2';
import { StepChat2 } from '@/components/study2/StepChat2';
import { StepSurvey } from '@/components/StepSurvey';
import { StepComplete } from '@/components/StepComplete';
import { Language, Step, ParticipantInfo, ChatMessage, SurveyResponse, ExperimentData, ImageType, DisclosureTiming } from '@/types/experiment';

// 8가지 조건 분기 정의 (자극물 A/B x 타이밍 pre/mid x 성별 female/male)
const ALL_8_CONDITIONS = [
  'A_pre_female',
  'A_pre_male',
  'A_mid_female',
  'A_mid_male',
  'B_pre_female',
  'B_pre_male',
  'B_mid_female',
  'B_mid_male',
];

function parseStudy2Condition(condParam: string, genderParam: string) {
  let c = (condParam || '').trim();
  const g = (genderParam || '').trim().toLowerCase();

  // 아무 파라미터도 없을 때 8개 중 랜덤 배정
  if (!c && !g) {
    c = ALL_8_CONDITIONS[Math.floor(Math.random() * ALL_8_CONDITIONS.length)];
  }

  // 1. 자극물 이미지 타입 (A: Posed vs B: Candid)
  const imageType: ImageType = (c.toUpperCase().includes('B') || c.toLowerCase().includes('candid')) ? 'B' : 'A';

  // 2. 사진 노출 시점 (pre vs mid)
  const timing: DisclosureTiming = c.toLowerCase().includes('pre') ? 'pre' : 'mid';

  // 3. 성별 (female vs male)
  let gender: 'female' | 'male' = 'female';
  const combined = (c + '_' + g).toLowerCase();

  if (g === 'male' || g === 'm' || g === '남' || g === '남성') {
    gender = 'male';
  } else if (g === 'female' || g === 'f' || g === '여' || g === '여성') {
    gender = 'female';
  } else if (combined.includes('female') || combined.includes('여') || combined.endsWith('_f')) {
    gender = 'female';
  } else if (combined.includes('male') || combined.includes('남') || combined.endsWith('_m')) {
    gender = 'male';
  } else {
    gender = Math.random() < 0.5 ? 'female' : 'male';
  }

  const conditionName = `${imageType}_${timing}_${gender}`;
  return { imageType, timing, gender, conditionName };
}

export default function Study2Page() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ko');
  // 1, 2, 3 대화 진행 안내 후 시작하기 누르면 채팅방 입장
  const [currentStep, setCurrentStep] = useState<Step>('instructions');

  const [participant, setParticipant] = useState<ParticipantInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [totalChatSeconds, setTotalChatSeconds] = useState<number>(0);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse>({});
  const [startedAt, setStartedAt] = useState<string>('');
  const [completedExperimentData, setCompletedExperimentData] = useState<ExperimentData | null>(null);
  
  // Custom demographics for Study 2
  const [userAge, setUserAge] = useState<number>(21);
  const [userOccupation, setUserOccupation] = useState<string>('대학(원)생');

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
    const genderParam = (urlParams.get('gender') || urlParams.get('g') || '').trim();

    const parsed = parseStudy2Condition(condParam, genderParam);
    const randomId = pidParam || ('S2_' + Math.random().toString(36).substring(2, 8).toUpperCase());

    const pInfo: ParticipantInfo = {
      id: randomId,
      imageType: parsed.imageType,
      timing: parsed.timing,
      condition: parsed.conditionName as any,
      group: parsed.imageType,
      gender: parsed.gender,
      birthYear: '',
      occupation: '',
      consentedAt: now,
    };

    setParticipant(pInfo);
    participantRef.current = pInfo;
  }, []);

  // 1. 대화 완료 시 (채팅 내 1단계 기본 대화에서 입력한 직업·나이 반영)
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
      setUserAge(updatedInfo.age);
      setUserOccupation(updatedInfo.occupation);

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

  // 2. 설문 완료 및 데이터 저장 (/api/submit 구글 시트 연동)
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
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experimentData),
      });
    } catch (e) {
      console.error('Submit API error:', e);
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
      <main className={currentStep === 'chat' ? 'w-full h-full flex items-center justify-center' : 'flex-1 flex items-center justify-center py-6 sm:py-10'}>
        {/* Step 0: Instructions (1, 2, 3 안내 후 대화 시작) */}
        {currentStep === 'instructions' && (
          <StepInstructions2 onStart={() => setCurrentStep('chat')} />
        )}

        {/* Step 1: Interactive Turn-based & Button Chat */}
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

        {/* Step 2: Main Survey */}
        {currentStep === 'survey' && (
          <StepSurvey
            language={language}
            group={participant.group}
            gender={participant.gender}
            onSubmitSurvey={handleSurveyComplete}
          />
        )}

        {/* Step 3: Completion */}
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
