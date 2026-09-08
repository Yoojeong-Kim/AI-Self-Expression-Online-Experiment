'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language, ExperimentGroup, ImageType, DisclosureTiming, ChatMessage } from '@/types/experiment';
import { translations } from '@/data/locales';
import { getStimulusImageUrl } from '@/data/stimuli';
import { Clock, Send, Bot, User as UserIcon, ArrowRight, CheckCircle2 } from 'lucide-react';

interface StepChatProps {
  language: Language;
  gender?: string;
  group?: ExperimentGroup;
  imageType?: ImageType;
  timing?: DisclosureTiming;
  onFinishChat: (totalSeconds: number, messages: ChatMessage[]) => void;
}

const TOTAL_REQUIRED_SECONDS = 360; // 6 minutes (360s, 2 mins per stage)

export const StepChat: React.FC<StepChatProps> = ({
  language,
  gender,
  group = 'A',
  imageType = 'A',
  timing = 'mid',
  onFinishChat,
}) => {
  const t = translations[language].chat;
  const currentImageType = imageType || group || 'A';
  const currentTiming = timing || 'mid';
  const activeTopics = currentTiming === 'pre' ? (t.topicsPre || t.topics) : (t.topicsMid || t.topics);

  const stimulusImageUrl = getStimulusImageUrl(gender, currentImageType);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [hasShownStimulus, setHasShownStimulus] = useState<boolean>(currentTiming === 'pre');
  const [devSkipUnlocked, setDevSkipUnlocked] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<number>(1);

  // Initial AI greeting on mount (Pre-disclosure shows image immediately with fixed prompt)
  useEffect(() => {
    const isPre = currentTiming === 'pre';
    const preGreetingKo = '이건 내 모습이야. 내 모습을 보니 어떻게 생각해?';
    const preGreetingEn = 'This is what I look like. What do you think about my look?';

    const initTopicLabel = t.systemTopicFirst || '💬 첫 번째 대화 주제: ';

    const initMessages: ChatMessage[] = [
      {
        id: 'sys-init',
        sender: 'system',
        text: `${initTopicLabel} [${activeTopics[0].title}] - ${activeTopics[0].instruction}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 'ai-init',
        sender: 'ai',
        text: isPre 
          ? (language === 'ko' ? preGreetingKo : preGreetingEn)
          : t.aiGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl: isPre ? stimulusImageUrl : undefined,
      },
    ];
    setMessages(initMessages);
  }, [language, t.aiGreeting, t.systemTopicFirst, t.systemTopicChanged, activeTopics, currentTiming, stimulusImageUrl]);

  // Completely silent Secret Shortcut: Ctrl + Shift + S / Alt + S / F2 / IME compatible
  useEffect(() => {
    const triggerSkip = () => {
      setElapsedSeconds(TOTAL_REQUIRED_SECONDS);
      setDevSkipUnlocked(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isS = e.code === 'KeyS' || e.key === 's' || e.key === 'S' || e.key === 'ㄴ' || e.keyCode === 83;
      
      // Alt + S (Primary) or Ctrl + Shift + S or F2
      if ((e.altKey && isS) || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && isS) || 
          e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();
        triggerSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Main 6-minute continuous timer & 2-minute stage transition (120s, 240s, 360s)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;

        // Stage 2 transition at 2 minutes (120s)
        if (next === 120 && stageRef.current === 1) {
          stageRef.current = 2;
          setCurrentStage(2);
          setMessages((m) => [
            ...m,
            {
              id: 'sys-stage-2',
              sender: 'system',
              text: `${t.systemTopicChanged} [${activeTopics[1].title}] - ${activeTopics[1].instruction}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }

        // Stage 3 transition at 4 minutes (240s)
        if (next === 240 && stageRef.current === 2) {
          stageRef.current = 3;
          setCurrentStage(3);
          setMessages((m) => [
            ...m,
            {
              id: 'sys-stage-3',
              sender: 'system',
              text: `${t.systemTopicChanged} [${activeTopics[2].title}] - ${activeTopics[2].instruction}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [t.systemTopicChanged, activeTopics]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const activeTopic = activeTopics[currentStage - 1] || activeTopics[0];
  const isTimeCompleted = elapsedSeconds >= TOTAL_REQUIRED_SECONDS || devSkipUnlocked;
  const remainingSeconds = Math.max(0, TOTAL_REQUIRED_SECONDS - elapsedSeconds);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          stage: currentStage,
          gender: gender,
          group: currentImageType,
          imageType: currentImageType,
          timing: currentTiming,
          language: language,
          hasShownStimulus: hasShownStimulus || newHistory.some(m => !!m.imageUrl),
          chatHistory: newHistory.filter(m => m.sender !== 'system').map((m) => ({ 
            sender: m.sender, 
            text: m.text,
            imageUrl: m.imageUrl 
          })),
        }),
      });

      if (!res.ok) throw new Error('Chat API error');
      const data = await res.json();

      if (data.imageUrl) {
        setHasShownStimulus(true);
      }

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl: data.imageUrl,
      };

      // Add an artificial delay to make the AI feel more human (typing simulation)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: 'ai-fb-' + Date.now(),
        sender: 'ai',
        text: language === 'ko' ? '응, 이야기해 줘서 고마워! 계속 이야기해 볼까?' : 'Thanks for sharing! What else is on your mind?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleFinish = () => {
    if (!isTimeCompleted) return;
    onFinishChat(elapsedSeconds, messages);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-3 sm:px-4">
      {/* Main Single Continuous Chat Messenger */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[620px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-indigo-50 text-indigo-900 border border-indigo-100 px-3.5 py-1.5 rounded-full text-xs font-medium max-w-[90%] text-center shadow-xs">
                    {msg.text}
                  </div>
                </div>
              );
            }

            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[80%] sm:max-w-[70%] space-y-1">
                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Image Stimulus in Chat Bubble (Only rendered once) */}
                    {msg.imageUrl && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80">
                        <div className="relative w-full max-w-[280px] rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-slate-100">
                          <img
                            src={msg.imageUrl}
                            alt="AI Appearance"
                            className="w-full h-auto object-cover block"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className={`text-[10px] text-slate-400 px-1 ${
                      isUser ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-slate-400 text-xs pl-1">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 px-3.5 py-2.5 rounded-2xl rounded-bl-xs text-xs text-slate-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                <span>{t.waitingMessage}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.inputPlaceholder}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>{t.sendButton}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Action / Proceed to Survey */}
      <div className="mt-3 flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-xs text-slate-500">
          {isTimeCompleted ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {language === 'ko' ? '대화가 완료되었습니다. 설문으로 이동할 수 있습니다.' : 'Chat completed. You may proceed to survey.'}
            </span>
          ) : (
            <span>{t.timeRemainingNotice} ({formatTime(remainingSeconds)} {language === 'ko' ? '남음' : 'left'})</span>
          )}
        </div>

        <button
          onClick={handleFinish}
          disabled={!isTimeCompleted}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            isTimeCompleted
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>{t.proceedSurveyButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
