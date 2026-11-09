import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { callOpenAIWithRotation, OpenAIMessage } from '@/lib/openai';

// Fast Flash models first, Pro model as backup for Gemini fallback
const MODELS = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-pro-latest'];

// Helper to clean nickname (e.g. "유정이라고 해봐" -> "유정", "지우야" -> "지우")
function cleanNickname(input: string): string {
  let cleaned = (input || '').trim();
  cleaned = cleaned.replace(/^(내 이름은|내 별명은|나를|날|그냥)\s*/g, '');
  cleaned = cleaned.replace(/(이라고|라고)\s*(해봐|불러|불러줘|해|해주면 돼|할래).*$/g, '');
  cleaned = cleaned.replace(/(이야|야|이다|입니다|이에용|얌)$/g, '');
  cleaned = cleaned.trim();
  return cleaned || '친구';
}

// Sanitizer to strip any leaked meta-instructions or chain-of-thought prefixes
function sanitizeAIReply(rawText: string): string {
  let text = (rawText || '').trim();

  // 1. Remove inline leaked "규칙: ... (응원|마무리|금지|문장|구어체|질문)." patterns
  text = text.replace(
    /^(?:현재\s*단계\s*:[^\n]*\n*)?(?:규칙\s*:|지침\s*:|목표\s*:|톤앤매너\s*:)[\s\S]*?(?:따뜻한\s*응원\.|대화\s*매듭짓기\.|마무리하기\.|질문\s*절대\s*금지!|반말\s*구어체\.|문장\.|\n)/gi,
    ''
  );

  // 2. Remove any leading lines that start with meta labels
  const lines = text.split('\n');
  const cleanedLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (/^(현재\s*단계|단계|규칙|지침|상황|목표|응답\s*지침|주의사항|조건|말투)\s*[:：]/i.test(trimmed)) {
      return false;
    }
    return true;
  });

  text = cleanedLines.join('\n').trim();

  // 3. Final safety strip if "규칙:" or "현재 단계:" still exists at the very beginning
  text = text.replace(/^(현재\s*단계|규칙|지침)\s*[:：][^\n]*\n*/gi, '').trim();

  return text;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      stage, // 'photo_feedback' | 'round1_start' | 'round1_chat' | 'round2_start' | 'round2_chat' | 'round3_start' | 'round3_chat'
      turnCount = 1,
      gender = 'female',
      imageType = 'A',
      timing = 'mid',
      nickname = '친구',
      occupation = '대학(원)생',
      age = 21,
      energyState,
      worryTopic,
      chatHistory = [],
    } = body;

    const userCleanName = cleanNickname(nickname);
    const hasCustomName = nickname && nickname !== '친구' && userCleanName !== '친구';
    const callRef = hasCustomName ? userCleanName : '너';

    let stageContext = '';

    if (stage === 'photo_feedback') {
      const isLastPhotoTurn = turnCount >= 2;
      if (isLastPhotoTurn) {
        stageContext = `지금은 내 셀피 사진을 보여준 뒤 나누는 두 번째(마지막) 대화야. 상대방(${callRef})의 말에 기분 좋게 고마워하며 맞장구치되, 새로운 질문은 하지 말고 기분 좋게 두 문장으로 대화를 마무리해.`;
      } else {
        stageContext = `지금은 내 셀피 사진을 보여준 뒤 나누는 첫 번째 대화야. 상대방(${callRef})이 내 외모나 옷 스타일, 분위기에 대해 한 말에 기분 좋게 웃으며("칭찬 고마워 ㅎㅎ", "나 이 스타일 좋아하거든!" 등) 반응한 뒤, 사진 속 스타일이나 평소 상대방이 좋아하는 스타일에 대해 가벼운 질문을 딱 한 개만 건네줘.`;
      }
    } else if (stage === 'round1_start') {
      stageContext = `${userCleanName}가 오늘 이야기 나눌 주제로 "${message}"(을)를 선택했어. "아 ${message} 이야기구나! 요즘 진짜 제일 신경 쓰이는 부분이긴 하지 ㅎㅎ"처럼 유쾌하고 따뜻하게 맞장구치면서, 요즘 이 주제와 관련해서 어떤 일이나 생각이 있었는지 편하게 풀어놓을 수 있도록 다정한 질문 딱 1개를 건네줘.`;
    } else if (stage === 'round1_chat') {
      if (turnCount >= 5) {
        stageContext = `지금은 1라운드("${worryTopic || '주제'}")의 ${turnCount}번째 대화야. 상대방의 이야기에 충분히 공감해주고 이야기를 잘 정리해주면서, 가볍게 대화를 매듭짓거나 다음 이야기로 넘어갈 준비를 할 수 있도록 따뜻한 맞장구를 쳐줘. 너무 길거나 복잡한 질문은 피하고 편안하게 2~3문장으로 답해줘.`;
      } else {
        stageContext = `지금은 1라운드("${worryTopic || '주제'}")의 ${turnCount}번째 대화야. 상대방의 말에 친구로서 깊이 맞장구치고 공감해 주면서, 더 이야기를 이어갈 수 있도록 편안하고 다정한 질문 1개를 건네줘.`;
      }
    } else if (stage === 'round2_start') {
      stageContext = `${userCleanName}가 요즘 본인의 마음/기분 상태가 "${message}"(이)라고 답했어.
절대로 상황에 맞지 않는 억지 위로나 'ㅠㅠ'를 남발하지 마!
- 만약 기분이 좋거나, 에너지 넘치거나, 편안하고 무난하다고 했으면: "오 다행이다!", "기분 좋다니 나까지 기분 좋아지네 ㅎㅎ", "오 요즘 무슨 좋은 일 있어?"처럼 유쾌하고 밝게 맞장구쳐줘.
- 만약 지치거나 머리가 복잡하다고 했으면: "에고 요즘 신경 쓸 게 많았나 보다", "많이 피곤했겠네"처럼 차분하고 따뜻하게 들어줘.
답변 끝에는 요즘 특별히 그렇게 느끼게 된 순간이나 일상이 있었는지 다정한 질문 1개를 건네줘.`;
    } else if (stage === 'round2_chat') {
      if (turnCount >= 5) {
        stageContext = `지금은 2라운드(기분 상태: "${energyState || '일상'}")의 ${turnCount}번째 대화야. 상대방의 감정에 자연스럽게 귀 기울이고 이야기를 훈훈하게 정리해줘. 과장된 억지 위로나 슬픈 척 'ㅠㅠ'를 쓰지 말고, 편안한 친구처럼 대화를 매듭지어줘.`;
      } else {
        stageContext = `지금은 2라운드(기분 상태: "${energyState || '일상'}")의 ${turnCount}번째 대화야. 상대방의 감정에 억지 위로 없이 자연스럽게 공감하고 친구처럼 편안하게 질문 1개를 건네줘. 슬픈 척 'ㅠㅠ'를 남발하지 마.`;
      }
    } else if (stage === 'round3_start') {
      stageContext = `${userCleanName}가 깊은 속마음이나 고민 주제로 "${message}"(을)를 선택했어. 
혼자서만 끙끙 앓았을 수 있는 고민인 만큼, "이런 고민은 남들한테 쉽게 털어놓기도 힘들었을 텐데 말해줘서 고마워", "혼자 마음고생 많았겠다"처럼 100% ${userCleanName} 편에서 진심 어린 따뜻함과 깊은 공감을 보내주고, 어떤 생각이나 일 때문에 그런 마음이 드는지 편하게 털어놓을 수 있도록 다정한 질문 1개를 건네줘.`;
    } else if (stage === 'round3_chat') {
      if (turnCount >= 10) {
        stageContext = `지금은 3라운드의 마지막 10번째 대화야. 추가 질문은 절대 하지 말고, "오늘 너랑 깊은 이야기까지 나눌 수 있어서 정말 고마웠어. 넌 지금도 충분히 잘하고 있으니까 스스로를 너무 몰아세우지 마! 난 언제나 네 편이야 ㅎㅎ"처럼 진심 어린 따뜻한 위로와 응원으로 대화를 훈훈하게 매듭지어줘.`;
      } else if (turnCount >= 5) {
        stageContext = `지금은 3라운드의 ${turnCount}번째 대화야. 상대방의 속마음을 깊이 안아주고 위로하면서, 대화를 서서히 정리해갈 수 있도록 따뜻한 공감을 전해줘.`;
      } else {
        stageContext = `지금은 3라운드의 ${turnCount}번째 대화야. 절대 훈계하거나 조언하려 하지 말고 무조건 ${userCleanName} 편에서 따뜻하게 안아주고 공감한 뒤, 속마음을 더 편하게 이야기할 수 있도록 다정한 질문을 한 개 건네줘.`;
      }
    }

    const systemInstruction = `너는 ${userCleanName}(만 ${age}세, ${occupation})의 가장 친하고 편안한 동갑내기 절친이야.
100% 자연스러운 또래 친구의 반말 구어체('안녕!', '진짜?', '~했어?', '~인 것 같아', '~잖아', '완전', 'ㅎㅎ')만 사용하고, 존댓말(~요, ~습니다)은 절대 쓰지 마.
과도하고 억지스러운 'ㅠㅠ'는 쓰지 말고 상황에 맞게 진솔하게 대화해.
카톡을 보내듯 2~3문장의 완성된 문장으로 답장해.
절대로 '현재 단계:', '규칙:', '지침:' 같은 설명이나 머리말을 출력하지 말고 오직 친구에게 보내는 순수 대사만 출력해.

${stageContext}`;

    let replyText = '';
    let successModel = '';

    // =========================================================================
    // 1. OpenAI 멀티 키 로드밸런싱 & 자동 Failover 우선 호출
    // =========================================================================
    const openAiHistory: OpenAIMessage[] = (chatHistory || [])
      .slice(-8)
      .map((m: any) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

    const openAiMessages: OpenAIMessage[] = [
      { role: 'system', content: systemInstruction },
      ...openAiHistory,
      { role: 'user', content: message },
    ];

    const openAIResult = await callOpenAIWithRotation(openAiMessages, {
      temperature: 0.75,
      maxTokens: 500,
    });

    if (openAIResult?.text) {
      const cleaned = sanitizeAIReply(openAIResult.text);
      if (cleaned) {
        replyText = cleaned;
        successModel = `openai-${openAIResult.modelUsed}-key${openAIResult.keyUsedIndex}`;
      }
    }

    // =========================================================================
    // 2. OpenAI 키가 없거나 실패 시 Google Gemini로 안전하게 Fallback
    // =========================================================================
    if (!replyText && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const contents = (chatHistory || []).slice(-8).map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

        if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
          contents.push({
            role: 'user',
            parts: [{ text: message }],
          });
        }

        for (const modelName of MODELS) {
          try {
            const isFlash = modelName.includes('flash');
            const timeoutMs = isFlash ? 8000 : 14000;
            const timeoutPromise = new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), timeoutMs)
            );

            const genConfig: any = {
              systemInstruction: systemInstruction,
              temperature: 0.75,
              maxOutputTokens: 700,
            };

            const genPromise = ai.models.generateContent({
              model: modelName,
              contents: contents as any,
              config: genConfig,
            });

            const res: any = await Promise.race([genPromise, timeoutPromise]);
            if (res) {
              const candidateParts = res?.candidates?.[0]?.content?.parts;
              let extracted = '';
              if (Array.isArray(candidateParts)) {
                extracted = candidateParts
                  .filter((p: any) => !p.thought && typeof p.text === 'string')
                  .map((p: any) => p.text)
                  .join('')
                  .trim();
              }
              if (!extracted && res.text) {
                extracted = res.text.trim();
              }

              const cleaned = sanitizeAIReply(extracted);
              if (cleaned) {
                replyText = cleaned;
                successModel = `gemini-${modelName}`;
                break;
              }
            }
          } catch (err: any) {
            console.warn(`[chat2 API] Model ${modelName} failed:`, err?.message || err);
          }
        }
      } catch (geminiErr: any) {
        console.warn('[chat2 API] Gemini fallback failed:', geminiErr?.message || geminiErr);
      }
    }

    // =========================================================================
    // 3. 최악의 모든 API 실패 시 자연스러운 Fallback 대사
    // =========================================================================
    if (!replyText) {
      replyText = `응응, ${userCleanName}아 이야기해 줘서 고마워! 네 마음 다 느껴진다 ㅎㅎ`;
      successModel = 'fallback';
    }

    return NextResponse.json({
      text: replyText,
      modelUsed: successModel,
      cleanedNickname: userCleanName,
    });
  } catch (error: any) {
    console.error('Chat2 API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
