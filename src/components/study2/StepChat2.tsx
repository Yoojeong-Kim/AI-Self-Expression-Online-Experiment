'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language, ImageType, DisclosureTiming, ChatMessage } from '@/types/experiment';
import { getStimulusImageUrl } from '@/data/stimuli';
import { ArrowUp, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';

interface StepChat2Props {
  language: Language;
  gender?: string;
  imageType?: ImageType;
  timing?: DisclosureTiming;
  userAge?: number;
  userOccupation?: string;
  onFinishChat: (
    totalSeconds: number,
    messages: ChatMessage[],
    updatedInfo?: { gender: string; age: number; occupation: string }
  ) => void;
}

// 1단계 기본 대화: 직업 선택지 5종 (+ 기타 직접 입력 = 총 6개)
const OCCUPATION_OPTIONS = [
  { emoji: '🎓', label: '대학생' },
  { emoji: '📚', label: '대학원생' },
  { emoji: '📝', label: '취준생' },
  { emoji: '💼', label: '직장인' },
  { emoji: '☕', label: '알바·프리랜서' },
];

// 1라운드: 일상 & 취미 선택지 5종 (+ 기타 = 총 6개)
const HOBBY_OPTIONS = [
  { emoji: '🎬', label: '누워서 넷플릭스·유튜브' },
  { emoji: '🛏️', label: '침대에서 그냥 뒹굴거리기' },
  { emoji: '☕', label: '카페 가거나 산책하기' },
  { emoji: '🏃', label: '운동하거나 취미 즐기기' },
  { emoji: '🍻', label: '친구들 만나서 놀기' },
];

// 2라운드: 성향 & 라이프스타일 선택지 3종 (+ 기타 = 총 4개)
const LIFESTYLE_OPTIONS = [
  { emoji: '🏠', label: '완전 집순이 / 집돌이' },
  { emoji: '🚗', label: '무조건 밖으로 나가야 함' },
  { emoji: '⚖️', label: '그때그때 반반인 듯!' },
];

// 3라운드: 요즘 기분 & 근황 선택지 4종 (+ 기타 = 총 5개)
const MOOD_OPTIONS = [
  { emoji: '😮‍💨', label: '할 게 너무 많아서 좀 지쳐' },
  { emoji: '🌀', label: '생각도 많고 좀 답답해' },
  { emoji: '🌿', label: '그냥저냥 무난하게 사는 중' },
  { emoji: '😊', label: '요즘 나름 재밌고 좋아!' },
];

// 호칭 정제 함수 (예: "유정이라고 해봐" -> "유정")
function cleanNicknameClient(raw: string): string {
  let cleaned = (raw || '').trim();
  cleaned = cleaned.replace(/^(내 이름은|내 별명은|나를|날|그냥)\s*/g, '');
  cleaned = cleaned.replace(/(이라고|라고)\s*(해봐|불러|불러줘|해|해주면 돼|할래).*$/g, '');
  cleaned = cleaned.replace(/(이야|야|이다|입니다|이에용|얌)$/g, '');
  cleaned = cleaned.trim();
  return cleaned || '친구';
}

export const StepChat2: React.FC<StepChat2Props> = ({
  gender = 'female',
  imageType = 'A',
  timing = 'mid',
  userAge = 21,
  userOccupation = '대학(원)생',
  onFinishChat,
}) => {
  const currentTiming = timing || 'mid';
  const chatGender = gender || 'female';

  const [chatAge, setChatAge] = useState<number>(
    userAge && userAge >= 19 && userAge <= 24 ? userAge : 21
  );
  const [ageDraft, setAgeDraft] = useState<string>(
    String(userAge && userAge >= 19 && userAge <= 24 ? userAge : 21)
  );

  useEffect(() => {
    if (userAge && userAge >= 19 && userAge <= 24) {
      setChatAge(userAge);
      setAgeDraft(String(userAge));
    }
  }, [userAge]);

  const [nickname, setNickname] = useState<string>('');
  const [nicknameDraft, setNicknameDraft] = useState<string>('');
  const [chatOccupation, setChatOccupation] = useState<string>(userOccupation || '');

  // Custom input toggles & drafts for Occupation, Hobby, Lifestyle, Mood
  const [showCustomOccupation, setShowCustomOccupation] = useState<boolean>(false);
  const [customOccupationDraft, setCustomOccupationDraft] = useState<string>('');

  const [selectedHobby, setSelectedHobby] = useState<string>('');
  const [showCustomHobby, setShowCustomHobby] = useState<boolean>(false);
  const [customHobbyDraft, setCustomHobbyDraft] = useState<string>('');

  const [selectedLifestyle, setSelectedLifestyle] = useState<string>('');
  const [showCustomLifestyle, setShowCustomLifestyle] = useState<boolean>(false);
  const [customLifestyleDraft, setCustomLifestyleDraft] = useState<string>('');

  const [selectedMood, setSelectedMood] = useState<string>('');
  const [showCustomMood, setShowCustomMood] = useState<boolean>(false);
  const [customMoodDraft, setCustomMoodDraft] = useState<string>('');

  // Stimulus image uses link-assigned gender
  const stimulusImageUrl = getStimulusImageUrl(chatGender, imageType);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const [flowStep, setFlowStep] = useState<string>(
    currentTiming === 'pre' ? 'pre_photo_chat' : 'ask_age'
  );

  const [freeTalkTurnCount, setFreeTalkTurnCount] = useState<number>(0);
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
  }, [messages, isLoading, flowStep, showCustomOccupation, showCustomHobby, showCustomLifestyle, showCustomMood]);

  // Initial Greeting Setup
  useEffect(() => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const initialPhotoUrl = getStimulusImageUrl(chatGender, imageType);

    if (currentTiming === 'pre') {
      setMessages([
        {
          id: 'pre-init',
          sender: 'ai',
          text: '안녕! 만나서 반가워 ㅎㅎ 본격적으로 이야기 나누기 전에 내 모습 먼저 보여줄게! (사진_노출됨)\n이건 내 모습이야. 내 모습이나 스타일 보니 어때 보여?',
          timestamp: nowStr,
          imageUrl: initialPhotoUrl,
        },
      ]);
      setPhotoFeedbackCount(0);
      setFlowStep('pre_photo_chat');
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setMessages([
        {
          id: 'mid-init',
          sender: 'ai',
          text: '안녕! 만나서 반가워 ㅎㅎ 오늘 너랑 편하게 이야기 나누고 싶어!\n우리 본격적으로 이야기 나누기 전에 서로 기본적인 것부터 알아가 볼까? 나이는 만으로 몇 살이야?',
          timestamp: nowStr,
        },
      ]);
      setFlowStep('ask_age');
    }
  }, [currentTiming, chatGender, imageType]);

  // API Call helper
  const callAI = async (
    userMsgText: string,
    stageName: 'photo_feedback' | 'round1_hobby' | 'round2_lifestyle' | 'round3_mood' | 'free_talk',
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
          gender: chatGender,
          imageType,
          timing: currentTiming,
          nickname: nickname || '친구',
          occupation: chatOccupation || '대학생',
          age: chatAge,
          chatHistory: allHist.map((m) => ({
            sender: m.sender,
            text: m.text,
            imageUrl: m.imageUrl,
          })),
        }),
      });

      if (!res.ok) throw new Error('Chat API error');
      const data = await res.json();
      if (data.cleanedNickname && data.cleanedNickname !== nickname) {
        setNickname(data.cleanedNickname);
      }
      return data.text || '응응! 이야기해 줘서 고마워 ㅎㅎ';
    } catch (err) {
      console.error(err);
      return '응응! 네 이야기 들으니 공감된다 ㅎㅎ 편하게 이야기해 줘!';
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // [1단계 기본 대화]: 나이 -> 호칭 -> 직업 (모든 단계 되돌리기 지원)
  // ============================================================================

  // 1-1. 나이 입력 확인 (만 19~24세 범위 제한)
  const handleAgeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(ageDraft.trim(), 10);
    const clampedAge = isNaN(parsed)
      ? 21
      : Math.min(24, Math.max(19, parsed));
    setChatAge(clampedAge);
    setAgeDraft(String(clampedAge));

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'u-age-' + Date.now(),
      sender: 'user',
      text: `만 ${clampedAge}살`,
      timestamp: nowStr,
    };
    const aiMsg: ChatMessage = {
      id: 'ai-ask-nick-' + Date.now(),
      sender: 'ai',
      text: `만 ${clampedAge}살이구나! 우리 편하게 부를 수 있게 네 이름이나 별명 알려줄래?`,
      timestamp: nowStr,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setFlowStep('ask_nickname');
  };

  // 되돌리기: 호칭 -> 나이
  const handleBackToAge = () => {
    setMessages((prev) => prev.slice(0, -2));
    setFlowStep('ask_age');
  };

  // 1-3. 이름(호칭) 입력
  const handleNicknameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = cleanNicknameClient(nicknameDraft || nickname || '친구');
    setNickname(cleaned);
    setNicknameDraft(cleaned);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'u-nick-' + Date.now(),
      sender: 'user',
      text: cleaned,
      timestamp: nowStr,
    };
    const aiMsg: ChatMessage = {
      id: 'ai-ask-occ-' + Date.now(),
      sender: 'ai',
      text: `좋아, ${cleaned}아! 반가워 ㅎㅎ 요즘은 주로 뭐 하면서 지내?`,
      timestamp: nowStr,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setShowCustomOccupation(false);
    setFlowStep('ask_occupation');
  };

  // 되돌리기: 직업 -> 호칭
  const handleBackToNickname = () => {
    setMessages((prev) => prev.slice(0, -2));
    setShowCustomOccupation(false);
    setFlowStep('ask_nickname');
  };

  // 1-4. 직업 선택 완료 -> 곧바로 [1라운드: 일상 & 취미] 질문으로!
  const handleOccupationSelect = (cleanOccText: string) => {
    const cleanOcc = cleanOccText.trim();
    setChatOccupation(cleanOcc);
    setShowCustomOccupation(false);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'u-occ-' + Date.now(),
      sender: 'user',
      text: cleanOcc,
      timestamp: nowStr,
    };

    const aiHobbyMsg: ChatMessage = {
      id: 'ai-hobby-q-' + Date.now(),
      sender: 'ai',
      text: `오 ${cleanOcc}이구나! 반가워 ${nickname}아 ㅎㅎ\n너는 보통 주말이나 쉴 때 주로 뭐 하면서 시간 보내?`,
      timestamp: nowStr,
    };
    setMessages((prev) => [...prev, userMsg, aiHobbyMsg]);
    setShowCustomHobby(false);
    setFlowStep('select_hobby');
  };

  // 되돌리기: 직업 다시 선택
  const handleBackToOccupation = () => {
    setMessages((prev) => prev.slice(0, -2));
    setShowCustomOccupation(false);
    setFlowStep('ask_occupation');
  };

  // ============================================================================
  // [3개 라운드 대화 흐름: 1.취미 -> 2.성향 -> 3.기분]
  // ============================================================================

  // 1라운드: 취미 선택 완료 -> [2라운드: 성향(집순이 vs 밖순이)] 질문으로!
  const handleHobbySelect = async (cleanHobbyText: string) => {
    const cleanHobby = cleanHobbyText.trim();
    setSelectedHobby(cleanHobby);
    setShowCustomHobby(false);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'u-hobby-' + Date.now(),
      sender: 'user',
      text: cleanHobby,
      timestamp: nowStr,
    };
    setMessages((prev) => [...prev, userMsg]);

    const aiReplyText = await callAI(cleanHobby, 'round1_hobby', 1, [userMsg]);

    const aiMsg: ChatMessage = {
      id: 'ai-lifestyle-q-' + Date.now(),
      sender: 'ai',
      text: `${aiReplyText}\n\n그럼 너는 평소에 완전 집순이(집돌이) 스타일이야, 아니면 밖에 나가는 거 좋아해?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setShowCustomLifestyle(false);
    setFlowStep('select_lifestyle');
  };

  const handleBackToHobby = () => {
    setMessages((prev) => prev.slice(0, -2));
    setShowCustomLifestyle(false);
    setFlowStep('select_hobby');
  };

  // 2라운드: 성향 선택 완료 -> [3라운드: 요즘 기분 & 근황] 질문으로!
  const handleLifestyleSelect = async (cleanLifestyleText: string) => {
    const cleanLifestyle = cleanLifestyleText.trim();
    setSelectedLifestyle(cleanLifestyle);
    setShowCustomLifestyle(false);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'u-lifestyle-' + Date.now(),
      sender: 'user',
      text: cleanLifestyle,
      timestamp: nowStr,
    };
    setMessages((prev) => [...prev, userMsg]);

    const aiReplyText = await callAI(cleanLifestyle, 'round2_lifestyle', 1, [userMsg]);

    const aiMsg: ChatMessage = {
      id: 'ai-mood-q-' + Date.now(),
      sender: 'ai',
      text: `${aiReplyText}\n\n아 무슨 느낌인지 알겠다 ㅎㅎ\n요즘 매일 보내는 일상은 좀 어때? 살만해, 아니면 좀 지쳐?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setShowCustomMood(false);
    setFlowStep('select_mood');
  };

  const handleBackToLifestyle = () => {
    setMessages((prev) => prev.slice(0, -2));
    setShowCustomMood(false);
    setFlowStep('select_lifestyle');
  };

  // 3라운드: 기분 선택 완료 -> [자유 텍스트 티키타카 (총 3턴)] 시작!
  const handleMoodSelect = async (cleanMoodText: string) => {
    const cleanMood = cleanMoodText.trim();
    setSelectedMood(cleanMood);
    setShowCustomMood(false);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'u-mood-' + Date.now(),
      sender: 'user',
      text: cleanMood,
      timestamp: nowStr,
    };
    setMessages((prev) => [...prev, userMsg]);

    const aiReplyText = await callAI(cleanMood, 'round3_mood', 1, [userMsg]);
    const aiMsg: ChatMessage = {
      id: 'ai-freetalk-turn-1-' + Date.now(),
      sender: 'ai',
      text: aiReplyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setFreeTalkTurnCount(1);
    setFlowStep('chat_free_talk');
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const handleResetMood = () => {
    setMessages((prev) => prev.slice(0, -2));
    setShowCustomMood(false);
    setFlowStep('select_mood');
    setFreeTalkTurnCount(0);
  };

  // ============================================================================
  // [자유 텍스트 핑퐁]: 사진 이야기(2턴) & 고민 대화(5턴)
  // ============================================================================
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

    if (flowStep === 'pre_photo_chat' || flowStep === 'mid_photo_chat') {
      const nextCnt = photoFeedbackCount + 1;
      setPhotoFeedbackCount(nextCnt);

      const aiReply = await callAI(trimmed, 'photo_feedback', nextCnt, [userMsg]);

      if (flowStep === 'pre_photo_chat' && nextCnt >= 2) {
        const combinedAiMsg: ChatMessage = {
          id: 'ai-photo-to-age-' + Date.now(),
          sender: 'ai',
          text: `${aiReply}\n\n내 모습 좋게 봐줘서 고마워 ㅎㅎ 그럼 우리 서로 기본적인 것부터 알아가 볼까? 나이는 만으로 몇 살이야?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, combinedAiMsg]);
        setFlowStep('ask_age');
      } else if (flowStep === 'mid_photo_chat' && nextCnt >= 2) {
        const combinedCompleteMsg: ChatMessage = {
          id: 'ai-complete-mid-' + Date.now(),
          sender: 'ai',
          text: `${aiReply}\n\n오늘 ${nickname} 너랑 깊은 이야기도 나누고 내 모습도 보여줄 수 있어서 진짜 뜻깊었어 ㅎㅎ 오늘 나랑 나눈 대화가 어땠는지 다음 화면에서 솔직하게 남겨줄래?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, combinedCompleteMsg]);
        setFlowStep('completed');
      } else {
        const aiMsg: ChatMessage = {
          id: 'ai-photo-rep-' + Date.now(),
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setTimeout(() => inputRef.current?.focus(), 150);
      }
      return;
    }

    if (flowStep === 'chat_free_talk') {
      const nextTurn = freeTalkTurnCount + 1;
      setFreeTalkTurnCount(nextTurn);

      const aiReply = await callAI(trimmed, 'free_talk', nextTurn, [userMsg]);

      if (nextTurn >= 3) {
        if (currentTiming === 'mid') {
          const aiMsg: ChatMessage = {
            id: 'ai-freetalk-turn-3-' + Date.now(),
            sender: 'ai',
            text: `${aiReply}\n\n우리 이렇게 이야기 나누다 보니까 진짜 친해진 것 같아 ㅎㅎ 아 맞다! 계속 대화만 했는데, 내가 실제로 어떻게 생겼는지 안 궁금해?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setFlowStep('mid_photo_ask');
        } else {
          const completeMsg: ChatMessage = {
            id: 'ai-complete-pre-' + Date.now(),
            sender: 'ai',
            text: `${aiReply}\n\n오늘 ${nickname} 너랑 소소하게 이야기 나눌 수 있어서 진짜 즐겁고 고마웠어 ㅎㅎ 난 언제나 네 편이니까 힘내! 오늘 나랑 나눈 대화가 어땠는지 다음 화면에서 솔직하게 남겨줄래?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, completeMsg]);
          setFlowStep('completed');
        }
      } else {
        const aiMsg: ChatMessage = {
          id: 'ai-freetalk-turn-' + nextTurn + '-' + Date.now(),
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }
  };

  // Mid 조건: 사진 요청 버튼 클릭 시 사진 공개!
  const handleMidPhotoReveal = (cleanClickText: string) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'u-ask-photo-' + Date.now(),
      sender: 'user',
      text: cleanClickText,
      timestamp: nowStr,
    };

    const aiRevealMsg: ChatMessage = {
      id: 'ai-reveal-photo-' + Date.now(),
      sender: 'ai',
      text: '짜잔! 이건 내 모습이야 ㅎㅎ 내 모습을 보니 어때 보여? (사진_노출됨)',
      timestamp: nowStr,
      imageUrl: stimulusImageUrl,
    };

    setMessages((prev) => [...prev, userMsg, aiRevealMsg]);
    setFlowStep('mid_photo_chat');
    setPhotoFeedbackCount(0);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  return (
    <div className="w-full max-w-[640px] h-dvh sm:h-[90dvh] sm:max-h-[750px] bg-white sm:rounded-3xl border border-neutral-200/90 shadow-xs flex flex-col overflow-hidden text-[#0d0d0d]">
      {/* Slim Top Status Bar (ChatGPT 4o 문구 및 아이콘 제거) */}
      {(nickname || flowStep === 'pre_photo_chat' || flowStep === 'mid_photo_chat' || flowStep === 'chat_free_talk' || flowStep === 'completed') && (
        <div className="bg-white border-b border-neutral-100 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {nickname && (
              <span className="text-xs font-medium text-neutral-500">
                {nickname}님과의 대화
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(flowStep === 'pre_photo_chat' || flowStep === 'mid_photo_chat') && (
              <div className="px-2.5 py-0.5 rounded-full bg-[#f4f4f4] border border-neutral-200 text-[#0d0d0d] text-[11px] font-semibold">
                사진 대화 {photoFeedbackCount} / 2
              </div>
            )}

            {flowStep === 'chat_free_talk' && (
              <div className="px-2.5 py-0.5 rounded-full bg-[#f4f4f4] border border-neutral-200 text-[#0d0d0d] text-[11px] font-semibold">
                대화 진행 {freeTalkTurnCount} / 3
              </div>
            )}

            {flowStep === 'completed' && (
              <div className="px-2.5 py-0.5 rounded-full bg-[#0d0d0d] text-white text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>대화 완료</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Stream (한 화면에 잘 들어오도록 여백 및 이미지 비율 최적화, AI 좌측 아이콘 제거) */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 space-y-3.5 bg-white">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const cleanText = msg.text.replace('(사진_노출됨)', '').trim();

          if (isUser) {
            return (
              <div
                key={msg.id}
                className="flex justify-end animate-in fade-in slide-in-from-bottom-1 duration-150"
              >
                <div className="max-w-[78%] bg-[#f4f4f4] text-[#0d0d0d] px-4 py-2 rounded-3xl text-xs sm:text-[14px] leading-relaxed">
                  <p className="whitespace-pre-wrap">{cleanText}</p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className="flex justify-start animate-in fade-in duration-150"
            >
              <div className="max-w-[85%] space-y-2">
                <div className="bg-white border border-neutral-200/90 text-[#0d0d0d] px-4 py-2.5 rounded-2xl sm:rounded-3xl text-xs sm:text-[14px] leading-relaxed shadow-2xs">
                  <p className="whitespace-pre-wrap">{cleanText}</p>
                </div>

                {/* Image Stimulus (스크롤 없이 한눈에 들어오는 컴팩트한 비율) */}
                {msg.imageUrl && (
                  <div className="pt-1">
                    <div className="relative w-full max-w-[175px] sm:max-w-[195px] rounded-2xl overflow-hidden border border-neutral-200 bg-[#f4f4f4]">
                      <img
                        src={msg.imageUrl}
                        alt="AI 모습"
                        className="w-full h-auto object-cover block"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Pulsing Dot Loading Indicator in Speech Bubble */}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-150">
            <div className="bg-white border border-neutral-200/90 px-3.5 py-2 rounded-2xl flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse [animation-delay:200ms]" />
              <span className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse [animation-delay:400ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Composer & Interactive Selection Area (컴팩트한 높이로 한 화면 유지) */}
      <div className="px-4 sm:px-6 pb-3.5 pt-2 bg-white flex-shrink-0">
        {/* 1-1. 나이 입력 */}
        {flowStep === 'ask_age' && (
          <form onSubmit={handleAgeSubmit} className="p-3 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2">
            <div className="text-xs font-semibold text-neutral-600 px-1">
              <span>만 나이를 입력해 주세요</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl border border-neutral-300 bg-white">
                <span className="text-xs sm:text-sm font-bold text-neutral-700">만</span>
                <input
                  type="number"
                  min={19}
                  max={24}
                  step={1}
                  value={ageDraft}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setAgeDraft('');
                      return;
                    }
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      if (num > 24) setAgeDraft('24');
                      else if (num < 19 && val.length >= 2) setAgeDraft('19');
                      else setAgeDraft(val);
                    }
                  }}
                  onBlur={() => {
                    const num = parseInt(ageDraft, 10);
                    if (isNaN(num) || num < 19) setAgeDraft('19');
                    else if (num > 24) setAgeDraft('24');
                  }}
                  autoFocus
                  className="w-14 text-center font-extrabold text-[#0d0d0d] text-sm sm:text-base border-b-2 border-[#0d0d0d] focus:outline-none bg-transparent"
                />
                <span className="text-xs sm:text-sm font-bold text-neutral-700">세</span>
              </div>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0d0d0d] hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs"
              >
                확인
              </button>
            </div>
          </form>
        )}

        {/* 1-3. 호칭 입력 */}
        {flowStep === 'ask_nickname' && (
          <form onSubmit={handleNicknameSubmit} className="p-3 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2">
            <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
              <span>AI 친구가 부를 당신의 이름을 적어주세요.</span>
              <button
                type="button"
                onClick={handleBackToAge}
                className="text-[11px] text-neutral-500 hover:text-[#0d0d0d] flex items-center gap-0.5 cursor-pointer font-normal underline"
              >
                <RotateCcw className="w-3 h-3" />
                이전으로
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="내 이름이나 별명"
                maxLength={15}
                value={nicknameDraft}
                onChange={(e) => setNicknameDraft(e.target.value)}
                autoFocus
                className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white text-[#0d0d0d] text-xs sm:text-sm focus:outline-none focus:border-[#0d0d0d] font-semibold"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0d0d0d] hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs"
              >
                확인
              </button>
            </div>
          </form>
        )}

        {/* 1-4. 직업 선택 */}
        {flowStep === 'ask_occupation' && (
          <div className="p-3 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2">
            <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
              <span>현재 본인의 직업을 선택해 주세요</span>
              <button
                type="button"
                onClick={handleBackToNickname}
                className="text-[11px] text-neutral-500 hover:text-[#0d0d0d] flex items-center gap-0.5 cursor-pointer font-normal underline"
              >
                <RotateCcw className="w-3 h-3" />
                이전으로
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {OCCUPATION_OPTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleOccupationSelect(item.label)}
                  className="py-2 px-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white hover:border-[#0d0d0d] text-[#0d0d0d] font-semibold text-xs transition-all cursor-pointer text-center"
                >
                  {item.emoji} {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomOccupation(true)}
                className={`py-2 px-2.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer text-center ${
                  showCustomOccupation
                    ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white'
                    : 'border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white text-[#0d0d0d]'
                }`}
              >
                ✨ 기타 (직접 입력)
              </button>
            </div>

            {showCustomOccupation && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="직업 직접 입력 (예: 휴학생, 군인 등)"
                  value={customOccupationDraft}
                  onChange={(e) => setCustomOccupationDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customOccupationDraft.trim()) {
                      e.preventDefault();
                      handleOccupationSelect(customOccupationDraft.trim());
                    }
                  }}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0d0d0d]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customOccupationDraft.trim()) {
                      handleOccupationSelect(customOccupationDraft.trim());
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#0d0d0d] text-white font-bold text-xs cursor-pointer"
                >
                  확인
                </button>
              </div>
            )}
          </div>
        )}

        {/* 1라운드: 일상 & 취미 선택 */}
        {flowStep === 'select_hobby' && !isLoading && (
          <div className="p-3 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2">
            <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
              <span>보통 쉴 때 주로 뭐 하면서 보내?</span>
              <button
                type="button"
                onClick={handleBackToOccupation}
                className="text-[11px] text-neutral-500 hover:text-[#0d0d0d] flex items-center gap-0.5 cursor-pointer font-normal underline"
              >
                <RotateCcw className="w-3 h-3" />
                이전으로
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {HOBBY_OPTIONS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleHobbySelect(item.label)}
                  className="py-2 px-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white hover:border-[#0d0d0d] text-[#0d0d0d] font-semibold text-xs text-center transition-all cursor-pointer"
                >
                  {item.emoji} {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomHobby(true)}
                className={`py-2 px-2.5 rounded-xl border font-semibold text-xs text-center transition-all cursor-pointer ${
                  showCustomHobby
                    ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white'
                    : 'border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white text-[#0d0d0d]'
                }`}
              >
                ✨ 기타 (직접 입력)
              </button>
            </div>

            {showCustomHobby && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="쉬는 시간에 주로 하는 것을 적어줘..."
                  value={customHobbyDraft}
                  onChange={(e) => setCustomHobbyDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customHobbyDraft.trim()) {
                      e.preventDefault();
                      handleHobbySelect(customHobbyDraft.trim());
                    }
                  }}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0d0d0d]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customHobbyDraft.trim()) {
                      handleHobbySelect(customHobbyDraft.trim());
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#0d0d0d] text-white font-bold text-xs cursor-pointer"
                >
                  전송
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2라운드: 성향 & 라이프스타일 선택 */}
        {flowStep === 'select_lifestyle' && !isLoading && (
          <div className="p-3 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2">
            <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
              <span>너의 평소 성향은 어때?</span>
              <button
                type="button"
                onClick={handleBackToHobby}
                className="text-[11px] text-neutral-500 hover:text-[#0d0d0d] flex items-center gap-0.5 cursor-pointer font-normal underline"
              >
                <RotateCcw className="w-3 h-3" />
                이전으로
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {LIFESTYLE_OPTIONS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleLifestyleSelect(item.label)}
                  className="py-2.5 px-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white hover:border-[#0d0d0d] text-[#0d0d0d] font-semibold text-xs text-center transition-all cursor-pointer"
                >
                  {item.emoji} {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomLifestyle(true)}
                className={`py-2.5 px-2.5 rounded-xl border font-semibold text-xs text-center transition-all cursor-pointer ${
                  showCustomLifestyle
                    ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white'
                    : 'border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white text-[#0d0d0d]'
                }`}
              >
                ✨ 기타 (직접 입력)
              </button>
            </div>

            {showCustomLifestyle && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="너의 성향을 편하게 적어줘..."
                  value={customLifestyleDraft}
                  onChange={(e) => setCustomLifestyleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customLifestyleDraft.trim()) {
                      e.preventDefault();
                      handleLifestyleSelect(customLifestyleDraft.trim());
                    }
                  }}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0d0d0d]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customLifestyleDraft.trim()) {
                      handleLifestyleSelect(customLifestyleDraft.trim());
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#0d0d0d] text-white font-bold text-xs cursor-pointer"
                >
                  전송
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3라운드: 요즘 기분 & 근황 선택 */}
        {flowStep === 'select_mood' && !isLoading && (
          <div className="p-3 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2">
            <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
              <span>요즘 보내는 일상은 어때?</span>
              <button
                type="button"
                onClick={handleBackToLifestyle}
                className="text-[11px] text-neutral-500 hover:text-[#0d0d0d] flex items-center gap-0.5 cursor-pointer font-normal underline"
              >
                <RotateCcw className="w-3 h-3" />
                이전으로
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {MOOD_OPTIONS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleMoodSelect(item.label)}
                  className="py-2.5 px-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white hover:border-[#0d0d0d] text-[#0d0d0d] font-semibold text-xs text-center transition-all cursor-pointer"
                >
                  {item.emoji} {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomMood(true)}
                className={`py-2.5 px-2.5 rounded-xl border font-semibold text-xs text-center transition-all cursor-pointer col-span-2 ${
                  showCustomMood
                    ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white'
                    : 'border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white text-[#0d0d0d]'
                }`}
              >
                ✨ 기타 (직접 입력)
              </button>
            </div>

            {showCustomMood && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="요즘 네 기분이나 일상을 편하게 적어줘..."
                  value={customMoodDraft}
                  onChange={(e) => setCustomMoodDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customMoodDraft.trim()) {
                      e.preventDefault();
                      handleMoodSelect(customMoodDraft.trim());
                    }
                  }}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0d0d0d]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customMoodDraft.trim()) {
                      handleMoodSelect(customMoodDraft.trim());
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#0d0d0d] text-white font-bold text-xs cursor-pointer"
                >
                  전송
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. Mid 조건: 사진 요청 짧은 버튼 2종 */}
        {flowStep === 'mid_photo_ask' && !isLoading && (
          <div className="p-3 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2">
            <div className="text-xs font-semibold text-neutral-600 px-1">
              <span>AI 친구에게 답장을 선택해 주세요</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleMidPhotoReveal('응 궁금해! 보여줘')}
                className="py-2.5 px-3 rounded-xl border border-[#0d0d0d] bg-white hover:bg-[#0d0d0d] hover:text-white text-[#0d0d0d] font-bold text-xs sm:text-sm text-center transition-all cursor-pointer"
              >
                📸 응 궁금해! 보여줘
              </button>
              <button
                type="button"
                onClick={() => handleMidPhotoReveal('오 어떻게 생겼어?')}
                className="py-2.5 px-3 rounded-xl border border-[#0d0d0d] bg-white hover:bg-[#0d0d0d] hover:text-white text-[#0d0d0d] font-bold text-xs sm:text-sm text-center transition-all cursor-pointer"
              >
                ✨ 오 어떻게 생겼어?
              </button>
            </div>
          </div>
        )}

        {/* 5. 자유 텍스트 타이핑 모드 (사진 이야기 2턴 & 속마음 대화 3턴) */}
        {(flowStep === 'pre_photo_chat' || flowStep === 'chat_free_talk' || flowStep === 'mid_photo_chat') && (
          <form onSubmit={handleSendMessage} className="space-y-1.5">
            <div className="flex items-center gap-2 bg-[#f4f4f4] rounded-full border border-neutral-200/90 pl-4 pr-1.5 py-1.5 shadow-2xs focus-within:border-neutral-400 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="메시지를 입력하세요..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-[#0d0d0d] placeholder:text-neutral-400 text-xs sm:text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="w-8 h-8 rounded-full bg-[#0d0d0d] hover:bg-neutral-800 disabled:bg-neutral-300 text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {flowStep === 'chat_free_talk' && freeTalkTurnCount <= 1 && !isLoading && (
              <div className="flex justify-end pr-2">
                <button
                  type="button"
                  onClick={handleResetMood}
                  className="text-[11px] text-neutral-400 hover:text-[#0d0d0d] flex items-center gap-0.5 cursor-pointer underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  기분 다시 선택하기
                </button>
              </div>
            )}
          </form>
        )}

        {/* 6. 최종 대화 완료 상태 */}
        {flowStep === 'completed' && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() =>
                onFinishChat(elapsedSeconds, messages, {
                  gender: chatGender,
                  age: chatAge,
                  occupation: chatOccupation || '대학(원)생',
                })
              }
              className="w-full py-3 px-5 rounded-full bg-[#0d0d0d] hover:bg-neutral-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <span>대화 완료! 다음 설문으로 이동하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
