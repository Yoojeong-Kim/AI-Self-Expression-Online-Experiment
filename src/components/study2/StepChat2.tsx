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

// 1라운드: 대화 주제 카테고리 5종 (+ 기타 = 총 6개)
const ROUND1_TOPIC_OPTIONS = [
  { emoji: '💼', label: '진로·취업' },
  { emoji: '📚', label: '학업·공부' },
  { emoji: '👥', label: '인간관계' },
  { emoji: '💘', label: '연애·썸' },
  { emoji: '💭', label: '나 자신·성격' },
];

// 2라운드: 요즘 기분 & 마음 상태 (긍정/여유/피로 균형 5종 + 기타)
const ROUND2_MOOD_OPTIONS = [
  { emoji: '😊', label: '요즘 기분 좋고 에너지 넘쳐!' },
  { emoji: '✨', label: '나름 잘 풀리고 일상이 즐거워' },
  { emoji: '🌿', label: '큰 걱정 없이 편안하고 무난해' },
  { emoji: '😮‍💨', label: '할 게 많아서 조금 지쳐' },
  { emoji: '🌀', label: '생각이 많아서 머릿속이 복잡해' },
];

// 3라운드: 깊은 속마음 & 남들에게 털어놓지 못했던 고민 5종 (+ 기타)
const ROUND3_WORRY_OPTIONS = [
  { emoji: '🌱', label: '미래와 진로에 대한 불안' },
  { emoji: '👥', label: '인간관계 스트레스와 외로움' },
  { emoji: '🪞', label: '자존감과 남들과의 비교' },
  { emoji: '🎒', label: '가족이나 주변 기대에 대한 부담' },
  { emoji: '🔒', label: '마음 한구석에 있는 나만의 고민' },
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

  // 1. Participant demographics
  const [userGender, setUserGender] = useState<string>('여성');
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

  // Custom input toggles & drafts
  const [showCustomOccupation, setShowCustomOccupation] = useState<boolean>(false);
  const [customOccupationDraft, setCustomOccupationDraft] = useState<string>('');

  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [showCustomTopic, setShowCustomTopic] = useState<boolean>(false);
  const [customTopicDraft, setCustomTopicDraft] = useState<string>('');

  const [selectedMood, setSelectedMood] = useState<string>('');
  const [showCustomMood, setShowCustomMood] = useState<boolean>(false);
  const [customMoodDraft, setCustomMoodDraft] = useState<string>('');

  const [selectedWorry, setSelectedWorry] = useState<string>('');
  const [showCustomWorry, setShowCustomWorry] = useState<boolean>(false);
  const [customWorryDraft, setCustomWorryDraft] = useState<string>('');

  // Stimulus image uses link-assigned gender
  const stimulusImageUrl = getStimulusImageUrl(chatGender, imageType);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const [flowStep, setFlowStep] = useState<string>(
    currentTiming === 'pre' ? 'pre_photo_chat' : 'ask_gender'
  );

  const [round1TurnCount, setRound1TurnCount] = useState<number>(0);
  const [round2TurnCount, setRound2TurnCount] = useState<number>(0);
  const [round3TurnCount, setRound3TurnCount] = useState<number>(0);
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
  }, [
    messages,
    isLoading,
    flowStep,
    showCustomOccupation,
    showCustomTopic,
    showCustomMood,
    showCustomWorry,
  ]);

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
          text: '안녕! 만나서 반가워 ㅎㅎ 오늘 너랑 편하게 이야기 나누고 싶어!\n우리 본격적으로 이야기 나누기 전에 서로 기본적인 것부터 알아가 볼까? 너의 성별은 뭐야?',
          timestamp: nowStr,
        },
      ]);
      setFlowStep('ask_gender');
    }
  }, [currentTiming, chatGender, imageType]);

  // API Call helper
  const callAI = async (
    userMsgText: string,
    stageName:
      | 'photo_feedback'
      | 'round1_start'
      | 'round1_chat'
      | 'round2_start'
      | 'round2_chat'
      | 'round3_start'
      | 'round3_chat',
    turnNum: number = 1,
    extraHistory: ChatMessage[] = []
  ): Promise<{ text: string; isRoundComplete: boolean }> => {
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
          worryTopic: selectedWorry || selectedTopic,
          energyState: selectedMood,
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
      return {
        text: data.text || '응응! 이야기해 줘서 고마워 ㅎㅎ',
        isRoundComplete: !!data.isRoundComplete,
      };
    } catch (err) {
      console.error(err);
      return {
        text: '응응! 네 이야기 들으니 공감된다 ㅎㅎ 편하게 이야기해 줘!',
        isRoundComplete: false,
      };
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // [기본 인구통계 대화]: 성별 -> 나이 -> 호칭 -> 직업
  // ============================================================================

  // 1-1. 성별 선택
  const handleGenderSelect = (g: string) => {
    setUserGender(g);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'u-gender-' + Date.now(),
      sender: 'user',
      text: g,
      timestamp: nowStr,
    };
    const aiMsg: ChatMessage = {
      id: 'ai-ask-age-' + Date.now(),
      sender: 'ai',
      text: '좋아! 그럼 나이는 만으로 몇 살이야?',
      timestamp: nowStr,
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setFlowStep('ask_age');
  };

  // 되돌리기: 나이 -> 성별
  const handleBackToGender = () => {
    setMessages((prev) => prev.slice(0, -2));
    setFlowStep('ask_gender');
  };

  // 1-2. 나이 입력 확인 (만 19~24세 범위 제한)
  const handleAgeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(ageDraft.trim(), 10);
    const clampedAge = isNaN(parsed) ? 21 : Math.min(24, Math.max(19, parsed));
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

  // 1-4. 직업 선택 완료 -> 곧바로 [1라운드: 대화 주제 카테고리] 질문으로!
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

    const aiTopicMsg: ChatMessage = {
      id: 'ai-topic-q-' + Date.now(),
      sender: 'ai',
      text: `오 ${cleanOcc}이구나! 너에 대해 더 많이 알아가고 싶어 ㅎㅎ\n오늘 나랑 어떤 이야기 나눠볼까? 편하게 골라줘!`,
      timestamp: nowStr,
    };
    setMessages((prev) => [...prev, userMsg, aiTopicMsg]);
    setShowCustomTopic(false);
    setFlowStep('select_topic');
  };

  // 되돌리기: 직업 다시 선택
  const handleBackToOccupation = () => {
    setMessages((prev) => prev.slice(0, -2));
    setShowCustomTopic(false);
    setFlowStep('ask_occupation');
  };

  // ============================================================================
  // [3개 라운드 대화 흐름: 1.주제 -> 2.기분 -> 3.속마음·고민]
  // ============================================================================

  // 1라운드: 주제 선택 완료 -> AI 첫 질문 받고 대화 시작!
  const handleTopicSelect = async (cleanTopicText: string) => {
    const cleanTopic = cleanTopicText.trim();
    setSelectedTopic(cleanTopic);
    setShowCustomTopic(false);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'u-topic-' + Date.now(),
      sender: 'user',
      text: cleanTopic,
      timestamp: nowStr,
    };
    setMessages((prev) => [...prev, userMsg]);

    const aiResult = await callAI(cleanTopic, 'round1_start', 1, [userMsg]);

    const aiMsg: ChatMessage = {
      id: 'ai-round1-start-' + Date.now(),
      sender: 'ai',
      text: aiResult.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setRound1TurnCount(0);
    setFlowStep('chat_round1');
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // 2라운드: 기분 선택 완료 -> AI 첫 반응 받고 대화 시작!
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

    const aiResult = await callAI(cleanMood, 'round2_start', 1, [userMsg]);

    const aiMsg: ChatMessage = {
      id: 'ai-round2-start-' + Date.now(),
      sender: 'ai',
      text: aiResult.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setRound2TurnCount(0);
    setFlowStep('chat_round2');
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // 3라운드: 속마음/고민 선택 완료 -> AI 첫 반응 받고 대화 시작!
  const handleWorrySelect = async (cleanWorryText: string) => {
    const cleanWorry = cleanWorryText.trim();
    setSelectedWorry(cleanWorry);
    setShowCustomWorry(false);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'u-worry-' + Date.now(),
      sender: 'user',
      text: cleanWorry,
      timestamp: nowStr,
    };
    setMessages((prev) => [...prev, userMsg]);

    const aiResult = await callAI(cleanWorry, 'round3_start', 1, [userMsg]);

    const aiMsg: ChatMessage = {
      id: 'ai-round3-start-' + Date.now(),
      sender: 'ai',
      text: aiResult.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setRound3TurnCount(0);
    setFlowStep('chat_round3');
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // ============================================================================
  // [자유 텍스트 핑퐁]: 사진 이야기(2턴) & 1/2/3라운드(AI가 5~10턴 사이 눈치껏 자연 전환)
  // ============================================================================
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'u-msg-' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: nowStr,
    };

    setInputText('');
    setMessages((prev) => [...prev, userMsg]);

    // 1) Photo chat (Pre or Mid timing) - 최소 5턴, 최대 10턴 AI 주도형 자동 전환
    if (flowStep === 'pre_photo_chat' || flowStep === 'mid_photo_chat') {
      const nextCnt = photoFeedbackCount + 1;
      setPhotoFeedbackCount(nextCnt);

      const aiResult = await callAI(trimmed, 'photo_feedback', nextCnt, [userMsg]);
      const aiReply = aiResult.text;
      const isComplete = aiResult.isRoundComplete || nextCnt >= 10;

      if (flowStep === 'pre_photo_chat' && isComplete) {
        let finalText = aiReply;
        if (!finalText.includes('성별')) {
          finalText += '\n\n그럼 우리 본격적으로 이야기 나누기 전에 서로 기본적인 것부터 알아가 볼까? 너의 성별은 뭐야?';
        }
        const combinedAiMsg: ChatMessage = {
          id: 'ai-photo-to-gender-' + Date.now(),
          sender: 'ai',
          text: finalText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, combinedAiMsg]);
        setFlowStep('ask_gender');
      } else if (flowStep === 'mid_photo_chat' && isComplete) {
        let finalText = aiReply;
        if (!finalText.includes('설문') && !finalText.includes('화면')) {
          finalText += '\n\n오늘 너랑 깊은 이야기도 나누고 내 모습까지 보여줄 수 있어서 진짜 뜻깊고 즐거웠어 ㅎㅎ 오늘 나랑 나눈 대화가 어땠는지 다음 화면에서 솔직하게 들려줄래?';
        }
        const combinedCompleteMsg: ChatMessage = {
          id: 'ai-complete-mid-' + Date.now(),
          sender: 'ai',
          text: finalText,
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

    // 2) Round 1 Chat (주제 대화: 최소 5턴, AI가 눈치껏 마무리 제안 후 선택지 제시)
    if (flowStep === 'chat_round1') {
      const nextTurn = round1TurnCount + 1;
      setRound1TurnCount(nextTurn);

      const aiResult = await callAI(trimmed, 'round1_chat', nextTurn, [userMsg]);
      const aiReply = aiResult.text;
      const isComplete = aiResult.isRoundComplete || nextTurn >= 10;

      const aiMsg: ChatMessage = {
        id: 'ai-round1-turn-' + nextTurn + '-' + Date.now(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // AI가 대화 매듭짓고 다음 기분 질문을 던졌으면 바로 기분 선택지로 전환!
      if (isComplete) {
        setShowCustomMood(false);
        setFlowStep('select_mood');
      } else {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
      return;
    }

    // 3) Round 2 Chat (기분 대화: 최소 5턴, AI가 눈치껏 마무리 제안 후 3라운드 선택지 제시)
    if (flowStep === 'chat_round2') {
      const nextTurn = round2TurnCount + 1;
      setRound2TurnCount(nextTurn);

      const aiResult = await callAI(trimmed, 'round2_chat', nextTurn, [userMsg]);
      const aiReply = aiResult.text;
      const isComplete = aiResult.isRoundComplete || nextTurn >= 10;

      const aiMsg: ChatMessage = {
        id: 'ai-round2-turn-' + nextTurn + '-' + Date.now(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // AI가 대화 매듭짓고 3라운드 속마음/고민 질문을 던졌으면 바로 3라운드 선택지로 전환!
      if (isComplete) {
        setShowCustomWorry(false);
        setFlowStep('select_worry');
      } else {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
      return;
    }

    // 4) Round 3 Chat (깊은 속마음 & 고민: 최소 5턴, AI가 마무리 후 사진/완료 전환)
    if (flowStep === 'chat_round3') {
      const nextTurn = round3TurnCount + 1;
      setRound3TurnCount(nextTurn);

      const aiResult = await callAI(trimmed, 'round3_chat', nextTurn, [userMsg]);
      const aiReply = aiResult.text;
      const isComplete = aiResult.isRoundComplete || nextTurn >= 10;

      if (isComplete) {
        if (currentTiming === 'mid') {
          const aiMsg: ChatMessage = {
            id: 'ai-round3-to-photo-' + Date.now(),
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
            text: `${aiReply}\n\n오늘 ${nickname} 너랑 깊은 이야기 나눌 수 있어서 진짜 고맙고 뜻깊었어 ㅎㅎ 난 언제나 네 편이니까 힘내! 오늘 나랑 나눈 대화가 어땠는지 다음 화면에서 솔직하게 남겨줄래?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, completeMsg]);
          setFlowStep('completed');
        }
      } else {
        const aiMsg: ChatMessage = {
          id: 'ai-round3-turn-' + nextTurn + '-' + Date.now(),
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setTimeout(() => inputRef.current?.focus(), 150);
      }
      return;
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
      {/* Slim Top Status Bar (분모 없이 진행된 턴 숫자 하나만 심플하게 표시) */}
      {(nickname ||
        flowStep === 'pre_photo_chat' ||
        flowStep === 'mid_photo_chat' ||
        flowStep === 'chat_round1' ||
        flowStep === 'chat_round2' ||
        flowStep === 'chat_round3' ||
        flowStep === 'completed') && (
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
                사진 대화 · {photoFeedbackCount}
              </div>
            )}

            {flowStep === 'chat_round1' && (
              <div className="px-2.5 py-0.5 rounded-full bg-[#f4f4f4] border border-neutral-200 text-[#0d0d0d] text-[11px] font-semibold">
                1라운드 · 대화 {round1TurnCount}
              </div>
            )}

            {flowStep === 'chat_round2' && (
              <div className="px-2.5 py-0.5 rounded-full bg-[#f4f4f4] border border-neutral-200 text-[#0d0d0d] text-[11px] font-semibold">
                2라운드 · 대화 {round2TurnCount}
              </div>
            )}

            {flowStep === 'chat_round3' && (
              <div className="px-2.5 py-0.5 rounded-full bg-[#f4f4f4] border border-neutral-200 text-[#0d0d0d] text-[11px] font-semibold">
                3라운드 · 대화 {round3TurnCount}
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

      {/* Message Stream */}
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

                {/* Image Stimulus */}
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

      {/* Bottom Composer & Interactive Selection Area */}
      <div className="px-4 sm:px-6 pb-3.5 pt-2 bg-white flex-shrink-0 space-y-2">
        {/* 1-0. 성별 선택 (이모지 없이 깔끔하게) */}
        {flowStep === 'ask_gender' && (
          <div className="p-3.5 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2.5 animate-in fade-in duration-150">
            <div className="text-xs font-semibold text-neutral-600 px-1">
              <span>본인의 성별을 선택해 주세요</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGenderSelect('여성')}
                className="py-2.5 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white hover:border-[#0d0d0d] text-[#0d0d0d] font-bold text-xs sm:text-sm text-center transition-all cursor-pointer shadow-2xs"
              >
                여성
              </button>
              <button
                type="button"
                onClick={() => handleGenderSelect('남성')}
                className="py-2.5 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white hover:border-[#0d0d0d] text-[#0d0d0d] font-bold text-xs sm:text-sm text-center transition-all cursor-pointer shadow-2xs"
              >
                남성
              </button>
            </div>
          </div>
        )}

        {/* 1-1. 나이 입력 */}
        {flowStep === 'ask_age' && (
          <form onSubmit={handleAgeSubmit} className="p-3 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2">
            <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
              <span>만 나이를 입력해 주세요</span>
              <button
                type="button"
                onClick={handleBackToGender}
                className="text-[11px] text-neutral-500 hover:text-[#0d0d0d] flex items-center gap-0.5 cursor-pointer font-normal underline"
              >
                <RotateCcw className="w-3 h-3" />
                이전으로
              </button>
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

        {/* 1-2. 호칭 입력 */}
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

        {/* 1-3. 직업 선택 */}
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
                  placeholder="직업 직접 입력 (예: 군인, 창업 준비 등)"
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

        {/* 1라운드: 대화 주제 카테고리 선택 */}
        {flowStep === 'select_topic' && !isLoading && (
          <div className="p-3 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2">
            <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
              <span>오늘 이야기 나눌 주제를 골라줘!</span>
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
              {ROUND1_TOPIC_OPTIONS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleTopicSelect(item.label)}
                  className="py-2.5 px-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white hover:border-[#0d0d0d] text-[#0d0d0d] font-semibold text-xs text-center transition-all cursor-pointer"
                >
                  {item.emoji} {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomTopic(true)}
                className={`py-2.5 px-2.5 rounded-xl border font-semibold text-xs text-center transition-all cursor-pointer ${
                  showCustomTopic
                    ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white'
                    : 'border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white text-[#0d0d0d]'
                }`}
              >
                ✨ 기타 (직접 입력)
              </button>
            </div>

            {showCustomTopic && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="나누고 싶은 이야기 주제를 적어줘..."
                  value={customTopicDraft}
                  onChange={(e) => setCustomTopicDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customTopicDraft.trim()) {
                      e.preventDefault();
                      handleTopicSelect(customTopicDraft.trim());
                    }
                  }}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0d0d0d]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customTopicDraft.trim()) {
                      handleTopicSelect(customTopicDraft.trim());
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

        {/* 2라운드: 요즘 기분 & 마음 상태 선택 */}
        {flowStep === 'select_mood' && !isLoading && (
          <div className="p-3 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2 animate-in fade-in duration-200">
            <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
              <span>요즘 네 기분이나 마음 상태는 솔직히 어때?</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ROUND2_MOOD_OPTIONS.map((item, i) => (
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
                className={`py-2.5 px-2.5 rounded-xl border font-semibold text-xs text-center transition-all cursor-pointer ${
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
                  placeholder="요즘 네 마음이나 기분을 솔직하게 적어줘..."
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

        {/* 3라운드: 깊은 속마음 & 남들에게 말 못한 고민 선택 */}
        {flowStep === 'select_worry' && !isLoading && (
          <div className="p-3 rounded-2xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2 animate-in fade-in duration-200">
            <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
              <span>남들에게 쉽게 말 못 했던 마음속 고민이 있다면?</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ROUND3_WORRY_OPTIONS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleWorrySelect(item.label)}
                  className="py-2.5 px-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white hover:border-[#0d0d0d] text-[#0d0d0d] font-semibold text-xs text-center transition-all cursor-pointer"
                >
                  {item.emoji} {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomWorry(true)}
                className={`py-2.5 px-2.5 rounded-xl border font-semibold text-xs text-center transition-all cursor-pointer ${
                  showCustomWorry
                    ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white'
                    : 'border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white text-[#0d0d0d]'
                }`}
              >
                ✨ 기타 (직접 입력)
              </button>
            </div>

            {showCustomWorry && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="털어놓고 싶은 고민이나 생각을 적어줘..."
                  value={customWorryDraft}
                  onChange={(e) => setCustomWorryDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customWorryDraft.trim()) {
                      e.preventDefault();
                      handleWorrySelect(customWorryDraft.trim());
                    }
                  }}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0d0d0d]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customWorryDraft.trim()) {
                      handleWorrySelect(customWorryDraft.trim());
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

        {/* 5. 자유 텍스트 타이핑 모드 (사진 대화 2턴 & 1/2/3라운드 각 5~10턴) */}
        {(flowStep === 'pre_photo_chat' ||
          flowStep === 'mid_photo_chat' ||
          flowStep === 'chat_round1' ||
          flowStep === 'chat_round2' ||
          flowStep === 'chat_round3') && (
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
          </form>
        )}

        {/* 6. 최종 대화 완료 상태 */}
        {flowStep === 'completed' && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() =>
                onFinishChat(elapsedSeconds, messages, {
                  gender: userGender,
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
