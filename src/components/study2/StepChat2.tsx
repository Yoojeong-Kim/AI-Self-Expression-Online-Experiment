'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language, ImageType, DisclosureTiming, ChatMessage } from '@/types/experiment';
import { getStimulusImageUrl } from '@/data/stimuli';
import { ArrowUp, ArrowRight, CheckCircle2, RotateCcw, ChevronDown, PanelLeft } from 'lucide-react';

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

// ChatGPT-style OpenAI Knot / Sparkle Emblem SVG
const ChatGPTIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2a4.5 4.5 0 0 0-3.89 2.25L4.22 11a4.5 4.5 0 0 0 0 4.5l3.89 6.75a4.5 4.5 0 0 0 7.78 0l3.89-6.75a4.5 4.5 0 0 0 0-4.5L15.89 4.25A4.5 4.5 0 0 0 12 2Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// 1단계 기본 대화: 직업 선택지 5종 (+ 기타 직접 입력 = 총 6개)
const OCCUPATION_OPTIONS = [
  { emoji: '🏫', label: '고등학생' },
  { emoji: '🎓', label: '대학(원)생' },
  { emoji: '📝', label: '취준생' },
  { emoji: '💼', label: '직장인' },
  { emoji: '☕', label: '알바·프리랜서' },
];

// 일상 에너지 상태 선택지 5종 (+ 기타 직접 타이핑 = 총 6개)
const ENERGY_OPTIONS = [
  { emoji: '🏃', label: '바쁘고 정신없음' },
  { emoji: '🪫', label: '완전 방전·번아웃' },
  { emoji: '🌀', label: '생각만 많고 답답함' },
  { emoji: '🌿', label: '무난하고 평온함' },
  { emoji: '🔥', label: '의욕 넘치고 활기참' },
];

// 핵심 고민 선택지 5종 (+ 기타 직접 타이핑 = 총 6개)
const WORRY_OPTIONS = [
  { emoji: '👥', label: '인간관계·외로움' },
  { emoji: '📉', label: '진로·미래 불안' },
  { emoji: '📚', label: '무기력·할 일 미루기' },
  { emoji: '💸', label: '돈·체력·현실 스트레스' },
  { emoji: '💭', label: '자존감·성격 고민' },
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

  // Chat-level basic info state (synced with pre-survey defaults, editable during Step 1 basic dialogue)
  const [chatGender, setChatGender] = useState<string>(gender || 'female');
  const [chatAge, setChatAge] = useState<number>(
    userAge && userAge >= 19 && userAge <= 24 ? userAge : 21
  );
  const [ageDraft, setAgeDraft] = useState<string>(
    String(userAge && userAge >= 19 && userAge <= 24 ? userAge : 21)
  );

  // Sync with pre-survey values so the user's Page 1 selections are pre-highlighted and pre-filled
  useEffect(() => {
    if (gender) setChatGender(gender);
    if (userAge && userAge >= 19 && userAge <= 24) {
      setChatAge(userAge);
      setAgeDraft(String(userAge));
    }
  }, [gender, userAge]);

  const [nickname, setNickname] = useState<string>('');
  const [nicknameDraft, setNicknameDraft] = useState<string>('');
  const [chatOccupation, setChatOccupation] = useState<string>(userOccupation || '');

  // Custom input toggles & drafts for Occupation, Energy, and Worry
  const [showCustomOccupation, setShowCustomOccupation] = useState<boolean>(false);
  const [customOccupationDraft, setCustomOccupationDraft] = useState<string>('');

  const [showCustomEnergy, setShowCustomEnergy] = useState<boolean>(false);
  const [customEnergyDraft, setCustomEnergyDraft] = useState<string>('');

  const [showCustomWorry, setShowCustomWorry] = useState<boolean>(false);
  const [customWorryDraft, setCustomWorryDraft] = useState<string>('');

  // Stimulus image uses pre-survey gender (or updated chatGender)
  const stimulusImageUrl = getStimulusImageUrl(chatGender || gender, imageType);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  /**
   * Flow State Machine:
   * 1) 1단계 기본 대화 (공통):
   *    'ask_gender' -> 'ask_age' -> 'ask_nickname' -> 'ask_occupation'
   * 2) Pre 조건 분기:
   *    -> 'pre_photo_chat' (사진 대화 2턴) -> 'select_energy' -> 'select_worry' -> 'chat_worry' (5턴) -> 'completed'
   * 3) Mid 조건 분기:
   *    -> 'select_energy' -> 'select_worry' -> 'chat_worry' (5턴) -> 'mid_photo_ask' -> 'mid_photo_chat' (2턴) -> 'completed'
   */
  const [flowStep, setFlowStep] = useState<string>('ask_gender');

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
  }, [messages, isLoading, flowStep, showCustomOccupation, showCustomEnergy, showCustomWorry]);

  // Initial Greeting Setup
  useEffect(() => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const initialPhotoUrl = getStimulusImageUrl(gender, imageType);

    if (currentTiming === 'pre') {
      setMessages([
        {
          id: 'pre-init',
          sender: 'ai',
          text: '안녕! 만나서 반가워 ㅎㅎ 먼저 내 모습 보여주면서 인사할게! (사진_노출됨)\n우리 본격적으로 이야기 나누기 전에 서로 기본적인 것부터 알아가 볼까? 먼저 너는 성별이 어떻게 돼?',
          timestamp: nowStr,
          imageUrl: initialPhotoUrl,
        },
      ]);
    } else {
      setMessages([
        {
          id: 'mid-init',
          sender: 'ai',
          text: '안녕! 만나서 반가워 ㅎㅎ 오늘 너랑 편하게 이야기 나누고 싶어!\n우리 본격적으로 이야기 나누기 전에 서로 기본적인 것부터 알아가 볼까? 먼저 너는 성별이 어떻게 돼?',
          timestamp: nowStr,
        },
      ]);
    }
    setFlowStep('ask_gender');
  }, [currentTiming, gender, imageType]);

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
          gender: chatGender,
          imageType,
          timing: currentTiming,
          nickname: nickname || '친구',
          occupation: chatOccupation || '대학(원)생',
          age: chatAge,
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
      if (data.cleanedNickname && data.cleanedNickname !== nickname) {
        setNickname(data.cleanedNickname);
      }
      return data.text || '응응! 이야기해 줘서 고마워 ㅎㅎ';
    } catch (err) {
      console.error(err);
      return '응응! 네 이야기 들으니 공감된다. 계속 편하게 이야기해 줘 ㅎㅎ';
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // [1단계 기본 대화]: 성별 -> 나이 -> 호칭 -> 직업 (모든 단계 되돌리기 지원)
  // ============================================================================

  // 1-1. 성별 선택
  const handleGenderSelect = (selectedG: 'female' | 'male') => {
    setChatGender(selectedG);
    const label = selectedG === 'female' ? '여성' : '남성';
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'u-gender-' + Date.now(),
      sender: 'user',
      text: label,
      timestamp: nowStr,
    };
    const aiMsg: ChatMessage = {
      id: 'ai-ask-age-' + Date.now(),
      sender: 'ai',
      text: '반가워 ㅎㅎ 나이는 만으로 몇 살이야?',
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

  // 직업에 맞는 일상 컨디션 질문 생성 헬퍼
  const buildEnergyQuestion = (name: string, occ: string) => {
    if (occ.includes('고등')) {
      return ` 요즘 학교 다니고 공부하느라 바쁠 텐데, 하루하루 보내는 네 컨디션은 솔직히 어때?`;
    } else if (occ.includes('대학')) {
      return ` 요즘 학교 다니고 과제하느라 바쁠 텐데, 하루하루 보내는 네 컨디션은 솔직히 어때?`;
    } else if (occ.includes('직장')) {
      return ` 요즘 회사 다니고 일하느라 피곤할 텐데, 하루하루 보내는 네 컨디션은 솔직히 어때?`;
    } else if (occ.includes('취준')) {
      return ` 요즘 취업 준비하고 공부하느라 신경 쓸 게 많을 텐데, 요즘 네 컨디션은 솔직히 어때?`;
    } else {
      return ` 요즘 하루하루 바쁘게 보내면서 네 일상 컨디션은 솔직히 어때?`;
    }
  };

  // 1-4. 직업 선택 완료 -> Pre 조건은 [사진 이야기]로, Mid 조건은 [일상 에너지]로!
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

    if (currentTiming === 'pre') {
      // PRE 조건: 기본 대화 완료 후, 아까 보여준 사진에 대해 이야기하기!
      const aiPhotoAskMsg: ChatMessage = {
        id: 'ai-pre-photo-start-' + Date.now(),
        sender: 'ai',
        text: `오 ${cleanOcc}이구나! 반가워 ${nickname}아 ㅎㅎ\n우리 이제 서로 기본적인 건 다 알았네! 아까 처음에 인사할 때 보여준 내 사진 봤지? 내 모습이나 스타일 보니 어때 보여?`,
        timestamp: nowStr,
      };
      setMessages((prev) => [...prev, userMsg, aiPhotoAskMsg]);
      setPhotoFeedbackCount(0);
      setFlowStep('pre_photo_chat');
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      // MID 조건: 곧바로 일상 에너지 질문으로!
      const aiEnergyMsg: ChatMessage = {
        id: 'ai-energy-q-' + Date.now(),
        sender: 'ai',
        text: `오 ${cleanOcc}이구나! 반가워 ${nickname}아 ㅎㅎ` + buildEnergyQuestion(nickname, cleanOcc),
        timestamp: nowStr,
      };
      setMessages((prev) => [...prev, userMsg, aiEnergyMsg]);
      setShowCustomEnergy(false);
      setFlowStep('select_energy');
    }
  };

  // 되돌리기: 직업 다시 선택
  const handleBackToOccupation = () => {
    setMessages((prev) => prev.slice(0, -2));
    setShowCustomOccupation(false);
    setFlowStep('ask_occupation');
  };

  // ============================================================================
  // [일상 컨디션 & 핵심 고민 선택] (모두 총 6개 버튼: 5개 기본 + 1개 기타 직접 입력)
  // ============================================================================

  // 일상 에너지 상태 선택
  const handleEnergySelect = async (cleanOptText: string) => {
    const cleanOpt = cleanOptText.trim();
    setSelectedEnergy(cleanOpt);
    setShowCustomEnergy(false);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'u-energy-' + Date.now(),
      sender: 'user',
      text: cleanOpt,
      timestamp: nowStr,
    };
    setMessages((prev) => [...prev, userMsg]);

    const aiReplyText = await callAI(cleanOpt, 'daily_status', 1, [userMsg]);

    const aiMsg: ChatMessage = {
      id: 'ai-energy-rep-' + Date.now(),
      sender: 'ai',
      text: `${aiReplyText}\n\n사실 남들한텐 괜찮은 척해도 혼자 있을 땐 말 못 할 고민이 하나씩 있잖아. 요즘 ${nickname} 마음을 제일 무겁게 만드는 고민은 뭐야?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setShowCustomWorry(false);
    setFlowStep('select_worry');
  };

  // 되돌리기: 일상 에너지 다시 선택
  const handleResetEnergy = () => {
    setMessages((prev) => prev.slice(0, -2));
    setShowCustomEnergy(false);
    setFlowStep('select_energy');
  };

  // 핵심 고민 영역 선택
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

    const aiReplyText = await callAI(cleanWorry, 'deep_worry', 1, [userMsg]);
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

  // 되돌리기: 고민 주제 다시 선택
  const handleResetWorry = () => {
    setMessages((prev) => prev.slice(0, -2));
    setShowCustomWorry(false);
    setFlowStep('select_worry');
    setWorryTurnCount(0);
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

    // 분기 A: 사진 이야기 중인 경우 (Pre 기본대화 직후 or Mid 고민대화 직후, 총 2턴)
    if (flowStep === 'pre_photo_chat' || flowStep === 'mid_photo_chat') {
      const nextCnt = photoFeedbackCount + 1;
      setPhotoFeedbackCount(nextCnt);

      const aiReply = await callAI(trimmed, 'photo_feedback', nextCnt, [userMsg]);

      if (flowStep === 'pre_photo_chat' && nextCnt >= 2) {
        // Pre 조건: 사진 이야기 2턴 완료 -> 한 말풍선 안에서 자연스럽게 일상 컨디션 질문으로 연결!
        const combinedAiMsg: ChatMessage = {
          id: 'ai-photo-to-energy-' + Date.now(),
          sender: 'ai',
          text: `${aiReply}\n\n내 모습 좋게 봐줘서 고마워 ㅎㅎ 그나저나 ${nickname}아,${buildEnergyQuestion(nickname, chatOccupation)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, combinedAiMsg]);
        setShowCustomEnergy(false);
        setFlowStep('select_energy');
      } else if (flowStep === 'mid_photo_chat' && nextCnt >= 2) {
        // Mid 조건: 사진 이야기 2턴 완료 -> 자연스럽게 최종 마무리!
        const combinedCompleteMsg: ChatMessage = {
          id: 'ai-complete-mid-' + Date.now(),
          sender: 'ai',
          text: `${aiReply}\n\n오늘 ${nickname} 너랑 깊은 이야기도 나누고 내 모습도 보여줄 수 있어서 진짜 뜻깊었어 ㅎㅎ 오늘 나랑 나눈 대화가 어땠는지 다음 화면에서 솔직하게 남겨줄래?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, combinedCompleteMsg]);
        setFlowStep('completed');
      } else {
        // 1턴째: AI가 사진 소감에 답하고 가벼운 질문 1개를 던짐
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

    // 분기 B: 핵심 고민 5턴 핑퐁 중인 경우
    if (flowStep === 'chat_worry') {
      const nextTurn = worryTurnCount + 1;
      setWorryTurnCount(nextTurn);

      const aiReply = await callAI(trimmed, 'deep_worry', nextTurn, [userMsg]);

      if (nextTurn >= 5) {
        if (currentTiming === 'mid') {
          // MID 조건: 5턴 완주 후 사진 요청 버튼 브릿지!
          const aiMsg: ChatMessage = {
            id: 'ai-worry-turn-5-' + Date.now(),
            sender: 'ai',
            text: `${aiReply}\n\n우리 이렇게 한참 진솔하게 이야기 나누다 보니까 진짜 친해진 것 같아 ㅎㅎ 아 맞다! 계속 대화만 했는데, 내가 실제로 어떻게 생겼는지 안 궁금해?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setFlowStep('mid_photo_ask');
        } else {
          // PRE 조건: 이미 사진 대화를 마쳤으므로 5턴 완주와 함께 최종 완료!
          const completeMsg: ChatMessage = {
            id: 'ai-complete-pre-' + Date.now(),
            sender: 'ai',
            text: `${aiReply}\n\n오늘 ${nickname} 너랑 나눈 대화 진짜 오래 기억에 남을 것 같아 ㅎㅎ 오늘 나랑 나눈 대화가 어땠는지 다음 화면에서 솔직하게 남겨줄래?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, completeMsg]);
          setFlowStep('completed');
        }
      } else {
        const aiMsg: ChatMessage = {
          id: 'ai-worry-turn-' + nextTurn + '-' + Date.now(),
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
    <div className="max-w-3xl mx-auto py-2 sm:py-4 px-2 sm:px-4">
      {/* ChatGPT Style Main Container */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs flex flex-col h-[680px] overflow-hidden text-[#0d0d0d]">
        {/* ChatGPT Minimalist Top Header Bar */}
        <div className="bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors">
              <PanelLeft className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-default">
              <span className="font-semibold text-[15px] tracking-tight text-[#0d0d0d]">
                ChatGPT
              </span>
              <span className="text-xs font-medium text-neutral-400">4o</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            {nickname && (
              <span className="text-[11px] font-medium text-neutral-600 bg-[#f4f4f4] px-2.5 py-0.5 rounded-full">
                {nickname}님과 대화 중
              </span>
            )}
          </div>

          {/* Monochrome Turn Counter Pill */}
          {(flowStep === 'pre_photo_chat' || flowStep === 'mid_photo_chat') && (
            <div className="px-3 py-1 rounded-full bg-[#f4f4f4] border border-neutral-200 text-[#0d0d0d] text-xs font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]" />
              <span>사진 대화 {photoFeedbackCount} / 2</span>
            </div>
          )}

          {flowStep === 'chat_worry' && (
            <div className="px-3 py-1 rounded-full bg-[#f4f4f4] border border-neutral-200 text-[#0d0d0d] text-xs font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]" />
              <span>대화 진행 {worryTurnCount} / 5</span>
            </div>
          )}

          {flowStep === 'completed' && (
            <div className="px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>대화 완료</span>
            </div>
          )}
        </div>

        {/* ChatGPT Message Stream */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 bg-white">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const cleanText = msg.text.replace('(사진_노출됨)', '').trim();

            if (isUser) {
              // ChatGPT User Bubble: Right-aligned soft #f4f4f4 pill, no avatar
              return (
                <div
                  key={msg.id}
                  className="flex justify-end animate-in fade-in slide-in-from-bottom-1 duration-150"
                >
                  <div className="max-w-[80%] sm:max-w-[70%] bg-[#f4f4f4] text-[#0d0d0d] px-4 py-2.5 rounded-3xl text-sm sm:text-[15px] leading-relaxed">
                    <p className="whitespace-pre-wrap">{cleanText}</p>
                  </div>
                </div>
              );
            }

            // ChatGPT AI Message: Left-aligned circular emblem + unboxed clean text on white canvas
            return (
              <div
                key={msg.id}
                className="flex gap-3.5 justify-start items-start animate-in fade-in duration-150"
              >
                <div className="w-7 h-7 rounded-full border border-neutral-200 bg-white text-[#0d0d0d] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <ChatGPTIcon className="w-4 h-4" />
                </div>

                <div className="flex-1 max-w-[88%] sm:max-w-[82%] space-y-2 pt-0.5">
                  <p className="whitespace-pre-wrap text-sm sm:text-[15px] leading-7 text-[#0d0d0d]">
                    {cleanText}
                  </p>

                  {/* Image Stimulus in ChatGPT style */}
                  {msg.imageUrl && (
                    <div className="pt-2">
                      <div className="relative w-full max-w-[260px] rounded-2xl overflow-hidden border border-neutral-200 bg-[#f4f4f4]">
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

          {/* ChatGPT Black Pulsing Dot Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3.5 items-center text-[#0d0d0d]">
              <div className="w-7 h-7 rounded-full border border-neutral-200 bg-white text-[#0d0d0d] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <ChatGPTIcon className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 py-2">
                <span className="w-3 h-3 rounded-full bg-[#0d0d0d] animate-pulse" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ChatGPT Bottom Composer & Interactive Selection Area */}
        <div className="px-4 sm:px-6 pb-4 pt-2 bg-white">
          {/* 1-1. 성별 선택 (앞 페이지에서 선택한 성별에 블랙 하이라이트 표시) */}
          {flowStep === 'ask_gender' && (
            <div className="p-3.5 rounded-3xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2.5">
              <div className="text-xs font-semibold text-neutral-600 px-1">
                <span>성별을 선택해 주세요</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleGenderSelect('female')}
                  className={`py-3 px-4 rounded-2xl border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    chatGender === 'female'
                      ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-100 text-[#0d0d0d]'
                  }`}
                >
                  👧 여성
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderSelect('male')}
                  className={`py-3 px-4 rounded-2xl border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    chatGender === 'male'
                      ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-100 text-[#0d0d0d]'
                  }`}
                >
                  👦 남성
                </button>
              </div>
            </div>
          )}

          {/* 1-2. 나이 입력 (앞 페이지에서 선택한 나이로 기본 세팅 + 상하 화살표 조절) */}
          {flowStep === 'ask_age' && (
            <form onSubmit={handleAgeSubmit} className="p-3.5 rounded-3xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2.5">
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
                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border border-neutral-300 bg-white">
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
                    className="w-16 text-center font-extrabold text-[#0d0d0d] text-sm sm:text-base border-b-2 border-[#0d0d0d] focus:outline-none bg-transparent"
                  />
                  <span className="text-xs sm:text-sm font-bold text-neutral-700">세</span>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#0d0d0d] hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs"
                >
                  확인
                </button>
              </div>
            </form>
          )}

          {/* 1-3. 호칭 입력 */}
          {flowStep === 'ask_nickname' && (
            <form onSubmit={handleNicknameSubmit} className="p-3.5 rounded-3xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2.5">
              <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
                <span>AI 친구가 부를 이름(또는 별명)을 적어주세요</span>
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
                  placeholder="예: 유정"
                  maxLength={15}
                  value={nicknameDraft}
                  onChange={(e) => setNicknameDraft(e.target.value)}
                  autoFocus
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-neutral-300 bg-white text-[#0d0d0d] text-xs sm:text-sm focus:outline-none focus:border-[#0d0d0d] font-semibold"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#0d0d0d] hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs"
                >
                  확인
                </button>
              </div>
            </form>
          )}

          {/* 1-4. 직업 선택 (5종 + 기타 = 총 6개 균등 그리드) */}
          {flowStep === 'ask_occupation' && (
            <div className="p-3.5 rounded-3xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2.5">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OCCUPATION_OPTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOccupationSelect(item.label)}
                    className="py-2.5 px-3 rounded-2xl border border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white hover:border-[#0d0d0d] text-[#0d0d0d] font-semibold text-xs transition-all cursor-pointer text-center"
                  >
                    {item.emoji} {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustomOccupation(true)}
                  className={`py-2.5 px-3 rounded-2xl border font-semibold text-xs transition-all cursor-pointer text-center ${
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
                    className="flex-1 px-3.5 py-2 rounded-2xl border border-neutral-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0d0d0d]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customOccupationDraft.trim()) {
                        handleOccupationSelect(customOccupationDraft.trim());
                      }
                    }}
                    className="px-4 py-2 rounded-2xl bg-[#0d0d0d] text-white font-bold text-xs cursor-pointer"
                  >
                    확인
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. 일상 에너지 상태 (5종 + 기타 = 총 6개 균등 그리드) */}
          {flowStep === 'select_energy' && !isLoading && (
            <div className="p-3.5 rounded-3xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2.5">
              <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
                <span>요즘 일상 컨디션을 골라주세요</span>
                {currentTiming === 'mid' && (
                  <button
                    type="button"
                    onClick={handleBackToOccupation}
                    className="text-[11px] text-neutral-500 hover:text-[#0d0d0d] flex items-center gap-0.5 cursor-pointer font-normal underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    이전으로
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ENERGY_OPTIONS.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleEnergySelect(item.label)}
                    className="p-2.5 rounded-2xl border border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white hover:border-[#0d0d0d] text-[#0d0d0d] font-semibold text-xs text-center transition-all cursor-pointer"
                  >
                    {item.emoji} {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustomEnergy(true)}
                  className={`p-2.5 rounded-2xl border font-semibold text-xs text-center transition-all cursor-pointer ${
                    showCustomEnergy
                      ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white'
                      : 'border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white text-[#0d0d0d]'
                  }`}
                >
                  ✨ 기타 (직접 입력)
                </button>
              </div>

              {showCustomEnergy && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="요즘 일상 상태를 편하게 적어주세요..."
                    value={customEnergyDraft}
                    onChange={(e) => setCustomEnergyDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customEnergyDraft.trim()) {
                        e.preventDefault();
                        handleEnergySelect(customEnergyDraft.trim());
                      }
                    }}
                    autoFocus
                    className="flex-1 px-3.5 py-2 rounded-2xl border border-neutral-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0d0d0d]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customEnergyDraft.trim()) {
                        handleEnergySelect(customEnergyDraft.trim());
                      }
                    }}
                    className="px-4 py-2 rounded-2xl bg-[#0d0d0d] text-white font-bold text-xs cursor-pointer"
                  >
                    전송
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. 핵심 고민 영역 (5종 + 기타 = 총 6개 균등 그리드) */}
          {flowStep === 'select_worry' && !isLoading && (
            <div className="p-3.5 rounded-3xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2.5">
              <div className="text-xs font-semibold text-neutral-600 px-1 flex items-center justify-between">
                <span>요즘 가장 신경 쓰이는 고민은 무엇인가요?</span>
                <button
                  type="button"
                  onClick={handleResetEnergy}
                  className="text-[11px] text-neutral-500 hover:text-[#0d0d0d] flex items-center gap-0.5 cursor-pointer font-normal underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  이전 선택 다시하기
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WORRY_OPTIONS.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleWorrySelect(item.label)}
                    className="p-2.5 rounded-2xl border border-neutral-200 bg-white hover:bg-[#0d0d0d] hover:text-white hover:border-[#0d0d0d] text-[#0d0d0d] font-semibold text-xs text-center transition-all cursor-pointer"
                  >
                    {item.emoji} {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustomWorry(true)}
                  className={`p-2.5 rounded-2xl border font-semibold text-xs text-center transition-all cursor-pointer ${
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
                    placeholder="요즘 고민거리를 직접 적어주세요..."
                    value={customWorryDraft}
                    onChange={(e) => setCustomWorryDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customWorryDraft.trim()) {
                        e.preventDefault();
                        handleWorrySelect(customWorryDraft.trim());
                      }
                    }}
                    autoFocus
                    className="flex-1 px-3.5 py-2 rounded-2xl border border-neutral-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0d0d0d]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customWorryDraft.trim()) {
                        handleWorrySelect(customWorryDraft.trim());
                      }
                    }}
                    className="px-4 py-2 rounded-2xl bg-[#0d0d0d] text-white font-bold text-xs cursor-pointer"
                  >
                    전송
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. Mid 조건: 사진 요청 짧은 버튼 2종 */}
          {flowStep === 'mid_photo_ask' && !isLoading && (
            <div className="p-3.5 rounded-3xl bg-[#f4f4f4] border border-neutral-200/80 space-y-2.5">
              <div className="text-xs font-semibold text-neutral-600 px-1">
                <span>AI 친구에게 답장을 선택해 주세요</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleMidPhotoReveal('응 궁금해! 보여줘')}
                  className="p-3 rounded-2xl border border-[#0d0d0d] bg-white hover:bg-[#0d0d0d] hover:text-white text-[#0d0d0d] font-bold text-xs sm:text-sm text-center transition-all cursor-pointer"
                >
                  📸 응 궁금해! 보여줘
                </button>
                <button
                  type="button"
                  onClick={() => handleMidPhotoReveal('오 어떻게 생겼어?')}
                  className="p-3 rounded-2xl border border-[#0d0d0d] bg-white hover:bg-[#0d0d0d] hover:text-white text-[#0d0d0d] font-bold text-xs sm:text-sm text-center transition-all cursor-pointer"
                >
                  ✨ 오 어떻게 생겼어?
                </button>
              </div>
            </div>
          )}

          {/* 5. ChatGPT Signature Rounded Pill Composer (사진 이야기 2턴 & 고민 대화 5턴) */}
          {(flowStep === 'pre_photo_chat' || flowStep === 'chat_worry' || flowStep === 'mid_photo_chat') && (
            <form onSubmit={handleSendMessage} className="space-y-1.5">
              <div className="flex items-center gap-2 bg-[#f4f4f4] rounded-full border border-neutral-200/90 pl-5 pr-2 py-2 shadow-2xs focus-within:border-neutral-400 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="메시지 ChatGPT..."
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

              {/* 사진 이야기 시작 직후(0턴)에는 직업 선택으로 되돌아가기 가능 */}
              {flowStep === 'pre_photo_chat' && photoFeedbackCount === 0 && !isLoading && (
                <div className="flex justify-end pr-2">
                  <button
                    type="button"
                    onClick={handleBackToOccupation}
                    className="text-[11px] text-neutral-400 hover:text-[#0d0d0d] flex items-center gap-0.5 cursor-pointer underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    직업 다시 선택하기
                  </button>
                </div>
              )}

              {/* 고민 대화 1턴째일 때 주제 다시 선택하기 버튼 제공 */}
              {flowStep === 'chat_worry' && worryTurnCount <= 1 && !isLoading && (
                <div className="flex justify-end pr-2">
                  <button
                    type="button"
                    onClick={handleResetWorry}
                    className="text-[11px] text-neutral-400 hover:text-[#0d0d0d] flex items-center gap-0.5 cursor-pointer underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    고민 주제 다시 선택하기
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
                className="w-full py-3.5 px-5 rounded-full bg-[#0d0d0d] hover:bg-neutral-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>대화 완료! 다음 설문으로 이동하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="text-center mt-2">
            <span className="text-[11px] text-neutral-400">
              AI 친구와 편안하게 대화를 나누어 보세요.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
