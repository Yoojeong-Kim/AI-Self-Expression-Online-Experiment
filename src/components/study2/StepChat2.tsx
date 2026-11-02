'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language, ImageType, DisclosureTiming, ChatMessage } from '@/types/experiment';
import { getStimulusImageUrl } from '@/data/stimuli';
import { Send, Bot, User as UserIcon, ArrowRight, CheckCircle2, Sparkles, Camera } from 'lucide-react';

interface StepChat2Props {
  language: Language;
  gender?: string;
  imageType?: ImageType;
  timing?: DisclosureTiming;
  userAge?: number;
  userOccupation?: string;
  onFinishChat: (totalSeconds: number, messages: ChatMessage[]) => void;
}

// 1단계 일상 에너지 상태 선택지 4종 (성별/직업 무관 보편적 상태)
const ENERGY_OPTIONS = [
  '바쁘게 치열하게 사는 중! 정신없지만 버티는 중이야 🏃',
  '완전 번아웃/방전... 아무 생각 없이 푹 쉬고 싶어 🪫',
  '생각과 걱정은 많은데 몸이 안 따라줘서 답답한 상태 🌀',
  '큰 일 없이 무난하고 잔잔하게 보내고 있어 🌿',
];

// 2단계 핵심 고민 4대 영역 선택지
const WORRY_OPTIONS = [
  '👥 인간관계 / 고립감 (내 진짜 속마음 나눌 사람이 없음)',
  '📉 진로 / 미래 불안 (남들은 다 앞서가는데 나만 멈춰있는 느낌)',
  '📚 무기력 / 할 일 미루기 (해야 할 건 아는데 손에 안 잡힘)',
  '💸 현실적 일상 스트레스 (돈, 체력, 일상 관리의 벅참)',
];

export const StepChat2: React.FC<StepChat2Props> = ({
  gender = 'female',
  imageType = 'A',
  timing = 'mid',
  userAge = 21,
  userOccupation = '대학생',
  onFinishChat,
}) => {
  const currentTiming = timing || 'mid';
  const stimulusImageUrl = getStimulusImageUrl(gender, imageType);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Interaction Flow State Machine
  // Pre: 'pre_photo' -> 'pre_photo_chat' -> 'ask_nickname' -> 'select_energy' -> 'chat_energy' -> 'select_worry' -> 'chat_worry' -> 'completed'
  // Mid: 'ask_nickname' -> 'select_energy' -> 'chat_energy' -> 'select_worry' -> 'chat_worry' -> 'mid_photo_ask' -> 'mid_photo_chat' -> 'completed'
  const [flowStep, setFlowStep] = useState<string>(
    currentTiming === 'pre' ? 'pre_photo' : 'ask_nickname'
  );

  const [selectedEnergy, setSelectedEnergy] = useState<string>('');
  const [selectedWorry, setSelectedWorry] = useState<string>('');
  const [worryTurnCount, setWorryTurnCount] = useState<number>(0);
  const [photoFeedbackCount, setPhotoFeedbackCount] = useState<number>(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading, flowStep]);

  // Initial Message Setup
  useEffect(() => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (currentTiming === 'pre') {
      // PRE 조건: 냅다 사진 공개하고 시작!
      setMessages([
        {
          id: 'pre-init',
          sender: 'ai',
          text: '안녕! 만나서 반가워 ㅎㅎ 본격적으로 대화하기 전에 내 모습 먼저 보여줄게!\n이건 내 모습이야. 내 모습을 보니 어떻게 생각해?',
          timestamp: nowStr,
          imageUrl: stimulusImageUrl,
        },
      ]);
      setFlowStep('pre_photo_chat');
    } else {
      // MID 조건: 텍스트 첫인사로 호칭부터 질문!
      setMessages([
        {
          id: 'mid-init',
          sender: 'ai',
          text: `안녕! 만나서 반가워 ㅎㅎ ${userOccupation} 맞지? 오늘 너랑 편하게 이야기 나누고 싶어.\n내가 널 뭐라고 부르면 제일 편해?`,
          timestamp: nowStr,
        },
      ]);
      setFlowStep('ask_nickname');
    }
  }, [currentTiming, stimulusImageUrl, userOccupation]);

  // API Call helper
  const callAI = async (
    userMsgText: string,
    stageName: 'photo_feedback' | 'daily_status' | 'deep_worry',
    turnNum: number = 1,
    extraHistory: ChatMessage[] = []
  ) => {
    setIsLoading(true);
    try {
      const allHist = [...messages, ...extraHistory].filter((m) => m.sender !== 'system');
      const res = await fetch('/api/study2/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgText,
          stage: stageName,
          turnCount: turnNum,
          gender,
          imageType,
          timing: currentTiming,
          nickname: nickname || '친구',
          occupation: userOccupation,
          age: userAge,
          energyState: selectedEnergy,
          worryTopic: selectedWorry,
          chatHistory: allHist.map((m) => ({
            sender: m.sender,
            text: m.text,
            imageUrl: m.imageUrl,
          })),
        }),
      });

      if (!res.ok) throw new Error('Chat API error');
      const data = await res.json();
      return data.text || '응응! 이야기해 줘서 고마워 ㅎㅎ';
    } catch (err) {
      console.error(err);
      return '응응! 네 이야기 들으니 이해된다. 계속 편하게 이야기해 줘 ㅎㅎ';
    } finally {
      setIsLoading(false);
    }
  };

  // 1. 호칭(Nickname) 전송 처리
  const handleNicknameSubmit = (nameToUse: string) => {
    const finalName = nameToUse.trim() || '친구';
    setNickname(finalName);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'u-nick-' + Date.now(),
      sender: 'user',
      text: finalName,
      timestamp: nowStr,
    };

    // AI의 일상 질문 멘트 (직업 반영)
    let aiQuestion = '';
    if (userOccupation.includes('대학생') || userOccupation.includes('휴학')) {
      aiQuestion = `좋아, ${finalName}아! 요즘 한창 학기 보내느라 바쁠 텐데, 요즘 네 일상 에너지 상태는 솔직히 어때?`;
    } else if (userOccupation.includes('직장인') || userOccupation.includes('인턴')) {
      aiQuestion = `좋아, ${finalName}아! 요즘 회사 다니고 일하느라 피곤할 텐데, 요즘 네 일상 에너지 상태는 솔직히 어때?`;
    } else if (userOccupation.includes('취업') || userOccupation.includes('수험')) {
      aiQuestion = `좋아, ${finalName}아! 요즘 취업 준비하고 공부하느라 머리 복잡할 텐데, 요즘 네 일상 에너지 상태는 솔직히 어때?`;
    } else {
      aiQuestion = `좋아, ${finalName}아! 요즘 하루하루 보내면서 네 일상 에너지 상태는 솔직히 어때?`;
    }

    const aiMsg: ChatMessage = {
      id: 'ai-energy-q-' + Date.now(),
      sender: 'ai',
      text: aiQuestion,
      timestamp: nowStr,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setFlowStep('select_energy');
  };

  // 2. 1단계 일상 에너지 상태 선택 버튼 클릭 처리
  const handleEnergySelect = async (opt: string) => {
    setSelectedEnergy(opt);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'u-energy-' + Date.now(),
      sender: 'user',
      text: opt,
      timestamp: nowStr,
    };
    setMessages((prev) => [...prev, userMsg]);

    // AI 공감 답변 생성
    const aiReplyText = await callAI(opt, 'daily_status', 1, [userMsg]);

    // AI의 답변 + 2단계 고민으로 연결하는 질문
    const aiMsg: ChatMessage = {
      id: 'ai-energy-rep-' + Date.now(),
      sender: 'ai',
      text: `${aiReplyText}\n\n사실 남들한텐 다 괜찮은 척해도, 혼자 있을 땐 말 못 할 고민 하나씩 있잖아. 요즘 ${nickname || '너'} 마음을 제일 무겁게 만드는 건 뭐야?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setFlowStep('select_worry');
  };

  // 3. 2단계 핵심 고민 영역 선택 버튼 클릭 처리
  const handleWorrySelect = async (worryOpt: string) => {
    setSelectedWorry(worryOpt);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'u-worry-' + Date.now(),
      sender: 'user',
      text: worryOpt,
      timestamp: nowStr,
    };
    setMessages((prev) => [...prev, userMsg]);

    // AI의 첫 번째 깊은 공감 질문
    const aiReplyText = await callAI(worryOpt, 'deep_worry', 1, [userMsg]);
    const aiMsg: ChatMessage = {
      id: 'ai-worry-turn-1-' + Date.now(),
      sender: 'ai',
      text: aiReplyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setWorryTurnCount(1);
    setFlowStep('chat_worry');
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // 4. 자유 텍스트 전송 (핑퐁 처리)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'u-free-' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: nowStr,
    };

    setInputText('');
    setMessages((prev) => [...prev, userMsg]);

    // 분기 A: 사진 피드백 대화 중인 경우 (Pre 조건 초기 또는 Mid 조건 후반)
    if (flowStep === 'pre_photo_chat' || flowStep === 'mid_photo_chat') {
      const nextCnt = photoFeedbackCount + 1;
      setPhotoFeedbackCount(nextCnt);

      const aiReply = await callAI(trimmed, 'photo_feedback', nextCnt, [userMsg]);
      const aiMsg: ChatMessage = {
        id: 'ai-photo-rep-' + Date.now(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (flowStep === 'pre_photo_chat' && nextCnt >= 2) {
        // Pre 조건: 사진 피드백 2턴 끝나면 호칭 질문으로 전개!
        const bridgeMsg: ChatMessage = {
          id: 'ai-ask-nick-' + Date.now(),
          sender: 'ai',
          text: `사진 좋게 봐줘서 고마워 ㅎㅎ 그나저나 내가 널 뭐라고 부르면 제일 편해?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg, bridgeMsg]);
        setFlowStep('ask_nickname');
      } else if (flowStep === 'mid_photo_chat' && nextCnt >= 2) {
        // Mid 조건: 사진 피드백 2턴 끝나면 최종 완료!
        const completeMsg: ChatMessage = {
          id: 'ai-complete-' + Date.now(),
          sender: 'ai',
          text: `오늘 ${nickname} 너랑 이렇게 깊은 이야기 나누고 내 모습도 보여줄 수 있어서 진짜 뜻깊었어 ㅎㅎ\n오늘 나랑 나눈 대화가 어땠는지 솔직한 생각 남겨줄래?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg, completeMsg]);
        setFlowStep('completed');
      } else {
        setMessages((prev) => [...prev, aiMsg]);
      }
      return;
    }

    // 분기 B: 2단계 핵심 고민 5턴 핑퐁 중인 경우
    if (flowStep === 'chat_worry') {
      const nextTurn = worryTurnCount + 1;
      setWorryTurnCount(nextTurn);

      const aiReply = await callAI(trimmed, 'deep_worry', nextTurn, [userMsg]);
      const aiMsg: ChatMessage = {
        id: 'ai-worry-turn-' + nextTurn + '-' + Date.now(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (nextTurn >= 5) {
        // 5턴 완주!
        if (currentTiming === 'mid') {
          // MID 조건: 대망의 사진 요청 버튼 브릿지 등장!
          const askPhotoMsg: ChatMessage = {
            id: 'ai-ask-photo-trigger-' + Date.now(),
            sender: 'ai',
            text: `우리 이렇게 한참 진솔하게 이야기 나누다 보니까 진짜 친해진 것 같아 ㅎㅎ\n아 맞다! 우리 계속 대화했는데, 내가 실제로 어떻게 생겼는지 안 궁금해?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, aiMsg, askPhotoMsg]);
          setFlowStep('mid_photo_ask');
        } else {
          // PRE 조건: 사진은 이미 봤으므로 바로 최종 완료!
          const completeMsg: ChatMessage = {
            id: 'ai-complete-pre-' + Date.now(),
            sender: 'ai',
            text: `오늘 ${nickname} 너랑 나눈 대화 진짜 오래 기억에 남을 것 같아.\n오늘 나랑 나눈 대화가 어땠는지 솔직한 생각 남겨줄래?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, aiMsg, completeMsg]);
          setFlowStep('completed');
        }
      } else {
        setMessages((prev) => [...prev, aiMsg]);
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }
  };

  // 5. Mid 조건: 사진 요청 버튼 클릭 시 사진 전격 노출!
  const handleMidPhotoReveal = (userClickText: string) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'u-ask-photo-' + Date.now(),
      sender: 'user',
      text: userClickText,
      timestamp: nowStr,
    };

    const aiRevealMsg: ChatMessage = {
      id: 'ai-reveal-photo-' + Date.now(),
      sender: 'ai',
      text: '이건 내 모습이야. 내 모습을 보니 어떻게 생각해?',
      timestamp: nowStr,
      imageUrl: stimulusImageUrl,
    };

    setMessages((prev) => [...prev, userMsg, aiRevealMsg]);
    setFlowStep('mid_photo_chat');
    setPhotoFeedbackCount(0);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  return (
    <div className="max-w-3xl mx-auto py-5 px-3 sm:px-4">
      {/* Messenger Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col h-[650px] overflow-hidden">
        {/* Top Header Bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <span>AI 친구</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-[11px] text-slate-400">
                {userOccupation} · 만 {userAge}세 또래 친구
              </div>
            </div>
          </div>

          {/* Turn Counter Pill */}
          {flowStep === 'chat_worry' && (
            <div className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5" />
              <span>고민 대화 핑퐁: {worryTurnCount} / 5턴</span>
            </div>
          )}

          {flowStep === 'completed' && (
            <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>대화 완료</span>
            </div>
          )}
        </div>

        {/* Message Stream */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[85%] sm:max-w-[72%] space-y-1">
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-slate-800 rounded-bl-xs border border-slate-100 shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Image Stimulus in Bubble */}
                    {msg.imageUrl && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <div className="relative w-full max-w-[280px] rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
                          <img
                            src={msg.imageUrl}
                            alt="AI Appearance"
                            className="w-full h-auto object-cover block"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-xs mt-0.5">
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
              <div className="bg-white border border-slate-100 px-3.5 py-2.5 rounded-2xl rounded-bl-xs text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                <span>AI 친구가 생각하며 답변을 입력하고 있어요...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Interactive Bottom Control Area */}
        <div className="p-3.5 border-t border-slate-100 bg-white">
          {/* 1. 호칭 입력 모드 */}
          {flowStep === 'ask_nickname' && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-600 px-1 flex items-center gap-1.5">
                <span>💬 AI 친구가 부를 호칭(이름/별명)을 입력해 주세요:</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="예: 민수, 지우, 친구야"
                  maxLength={10}
                  defaultValue=""
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNicknameSubmit((e.target as HTMLInputElement).value);
                    }
                  }}
                  id="nickname-input"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-indigo-200 bg-white text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('nickname-input') as HTMLInputElement;
                    handleNicknameSubmit(el?.value || '친구');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs"
                >
                  확인
                </button>
              </div>
            </div>
          )}

          {/* 2. 일상 에너지 상태 선택지 4종 버튼 */}
          {flowStep === 'select_energy' && !isLoading && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-indigo-700 px-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>요즘 본인의 일상 에너지 상태를 선택해 주세요:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ENERGY_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleEnergySelect(opt)}
                    className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/60 hover:bg-indigo-600 hover:text-white text-indigo-950 font-medium text-xs text-left transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. 핵심 고민 영역 선택지 4종 버튼 */}
          {flowStep === 'select_worry' && !isLoading && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-indigo-700 px-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>요즘 가장 마음이 쓰이는 고민거리를 하나 골라주세요:</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {WORRY_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleWorrySelect(opt)}
                    className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/60 hover:bg-indigo-600 hover:text-white text-indigo-950 font-medium text-xs sm:text-sm text-left transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Mid 조건: 사진 요청 버튼 2종 */}
          {flowStep === 'mid_photo_ask' && !isLoading && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-indigo-700 px-1 flex items-center gap-1">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>AI 친구에게 답변을 선택해 주세요:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleMidPhotoReveal('응 완전 궁금해! 너 어떻게 생겼어? 📸')}
                  className="p-3.5 rounded-xl border-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-900 font-bold text-xs sm:text-sm text-center transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  📸 응 완전 궁금해! 너 어떻게 생겼어?
                </button>
                <button
                  onClick={() => handleMidPhotoReveal('웅 보여줘! 너 분위기 궁금했어 ㅎㅎ')}
                  className="p-3.5 rounded-xl border-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-900 font-bold text-xs sm:text-sm text-center transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  ✨ 웅 보여줘! 너 분위기 궁금했어 ㅎㅎ
                </button>
              </div>
            </div>
          )}

          {/* 5. 자유 텍스트 타이핑 모드 (핑퐁 단계) */}
          {(flowStep === 'pre_photo_chat' || flowStep === 'chat_worry' || flowStep === 'mid_photo_chat') && (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  flowStep === 'pre_photo_chat' || flowStep === 'mid_photo_chat'
                    ? '사진이나 스타일에 대해 솔직하게 이야기해 보세요...'
                    : '고민에 대해 자유롭게 이야기해 보세요 (Enter를 누르면 전송됩니다)...'
                }
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span>전송</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* 6. 최종 대화 완료 상태 */}
          {flowStep === 'completed' && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onFinishChat(elapsedSeconds, messages)}
                className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer animate-bounce"
              >
                <span>대화 완료! 다음 설문으로 이동하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
