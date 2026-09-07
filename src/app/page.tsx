'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { StepDemographics } from '@/components/StepDemographics';
import { StepInstructions } from '@/components/StepInstructions';
import { StepChat } from '@/components/StepChat';
import { StepSurvey } from '@/components/StepSurvey';
import { StepComplete } from '@/components/StepComplete';
import { Language, Step, ExperimentGroup, ParticipantInfo, ChatMessage, SurveyResponse, ExperimentData } from '@/types/experiment';

export default function Home() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ko');
  const [currentStep, setCurrentStep] = useState<Step>('demographics');

  const [participant, setParticipant] = useState<ParticipantInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [totalChatSeconds, setTotalChatSeconds] = useState<number>(0);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse>({});
  const [startedAt, setStartedAt] = useState<string>('');

  const participantRef = React.useRef<ParticipantInfo | null>(null);
  const chatMessagesRef = React.useRef<ChatMessage[]>([]);
  const totalChatSecondsRef = React.useRef<number>(0);
  const startedAtRef = React.useRef<string>('');

  useEffect(() => {
    setMounted(true);
    const now = new Date().toISOString();
    setStartedAt(now);
    startedAtRef.current = now;

    const assignCondition = async () => {
      try {
        const res = await fetch('/api/assign');
        if (res.ok) {
          const data = await res.json();
          const pInfo: ParticipantInfo = {
            id: data.participantId,
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

      // Fallback in-client randomizer
      const randomId = 'P' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const imageType = Math.random() < 0.5 ? 'A' : 'B';
      const timing = Math.random() < 0.5 ? 'pre' : 'mid';
      const condition = `${imageType}_${timing}` as any;

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

  const [finalExperimentData, setFinalExperimentData] = useState<ExperimentData | null>(null);

  const handleDemographicsComplete = (info: { gender: string; birthYear: string; occupation: string }) => {
    const updated = participantRef.current ? { ...participantRef.current, ...info } : null;
    if (updated) {
      setParticipant(updated);
      participantRef.current = updated;
    } else if (participant) {
      const p = { ...participant, ...info };
      setParticipant(p);
      participantRef.current = p;
    }
    setCurrentStep('instructions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInstructionsStart = () => {
    setCurrentStep('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishChat = (seconds: number, messages: ChatMessage[]) => {
    setTotalChatSeconds(seconds);
    setChatMessages(messages);
    totalChatSecondsRef.current = seconds;
    chatMessagesRef.current = messages;
    setCurrentStep('survey');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSurveyComplete = async (responses: SurveyResponse) => {
    setSurveyResponses(responses);
    const curParticipant = participantRef.current || participant;
    const curSeconds = totalChatSecondsRef.current || totalChatSeconds;
    const curMessages = chatMessagesRef.current.length > 0 ? chatMessagesRef.current : chatMessages;

    if (curParticipant) {
      const finalData: ExperimentData = {
        participant: curParticipant,
        language,
        totalChatSeconds: curSeconds,
        chatMessages: curMessages,
        surveyResponses: responses,
        startedAt: startedAtRef.current || startedAt,
        submittedAt: new Date().toISOString(),
      };
      setFinalExperimentData(finalData);

      // Direct submit API call to eliminate any lifecycle race condition
      try {
        await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalData),
        });
      } catch (err) {
        console.error('Submit API direct call error:', err);
      }
    }
    setCurrentStep('complete');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        language={language}
        onLanguageChange={setLanguage}
        currentStep={currentStep}
        participantId={participant?.id}
        group={participant?.group}
        condition={participant?.condition}
      />

      <main className="flex-1">
        {currentStep === 'demographics' && (
          <StepDemographics
            language={language}
            onComplete={handleDemographicsComplete}
          />
        )}

        {currentStep === 'instructions' && (
          <StepInstructions
            language={language}
            onStart={handleInstructionsStart}
          />
        )}

        {currentStep === 'chat' && participant && (
          <StepChat
            language={language}
            gender={participant.gender}
            group={participant.imageType}
            imageType={participant.imageType}
            timing={participant.timing}
            onFinishChat={handleFinishChat}
          />
        )}

        {currentStep === 'survey' && (
          <StepSurvey
            language={language}
            gender={participant?.gender}
            group={participant?.imageType || 'A'}
            onSubmitSurvey={handleSurveyComplete}
          />
        )}

        {currentStep === 'complete' && finalExperimentData && (
          <StepComplete
            language={language}
            experimentData={finalExperimentData}
          />
        )}
      </main>
    </div>
  );
}
