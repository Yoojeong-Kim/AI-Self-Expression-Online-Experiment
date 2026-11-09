import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Fast Flash models first, Pro model as backup
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
      stage, // 'photo_feedback' | 'daily_status' | 'deep_worry'
      turnCount = 1,
      gender = 'female',
      imageType = 'A',
      timing = 'mid',
      nickname = '친구',
      occupation = '대학(원)생',
      age = 21,
      energyState,
      worryTopic,
      chatHistory = []
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
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
      const isRound1End = turnCount >= 5;
      if (isRound1End) {
        stageContext = `지금은 1라운드("${worryTopic || '이야기'}")의 마지막 5번째 대화야. 상대방의 이야기에 크게 공감해주고 이야기를 잘 정리해 준 뒤, 자연스럽게 다음 2라운드(기분 상태)로 넘어가기 위해 "너 이야기 들으니 어떤 느낌인지 알겠다 ㅎㅎ 그럼 요즘 이거랑 관련해서 네 마음이나 기분은 솔직히 좀 어때?"처럼 따뜻하게 질문을 건네줘.`;
      } else {
        stageContext = `지금은 1라운드("${worryTopic || '이야기'}")의 ${turnCount}번째 대화야. 상대방의 말에 친구로서 깊이 맞장구치고 공감해 주면서, 더 이야기를 이어갈 수 있도록 편안하고 다정한 질문 1개를 건네줘.`;
      }
    } else if (stage === 'round2_start') {
      stageContext = `${userCleanName}가 요즘 본인의 마음/기분 상태가 "${message}"(이)라고 답했어. 친구로서 그 기분에 진심으로 귀 기울이며 "에고 진짜 그렇게 느낄 만하다 ㅠㅠ", "그래도 잘 버텨주고 있어서 다행이다"처럼 깊이 공감해 주고, 최근에 특별히 그렇게 느끼게 된 순간이나 일상이 있었는지 다정한 질문 1개를 건네줘.`;
    } else if (stage === 'round2_chat') {
      const isRound2End = turnCount >= 5;
      if (isRound2End) {
        stageContext = `지금은 2라운드(기분 상태)의 마지막 5번째 대화야. 상대방이 겪었을 감정에 깊이 공감해주면서, 자연스럽게 3라운드(남들에게 털어놓지 못했던 깊은 속마음/고민)로 넘어가기 위해 "에고 혼자서 마음고생 많았겠다 ㅠㅠ 겉으론 괜찮은 척해도 속으론 말 못 할 생각들이 들잖아. 요즘 그중에서도 너 마음을 제일 무겁게 하는 고민이 있다면 편하게 털어놔줘 ㅎㅎ"처럼 따뜻하게 질문을 건네줘.`;
      } else {
        stageContext = `지금은 2라운드(기분 상태)의 ${turnCount}번째 대화야. 상대방의 감정에 100% 공감하고 위로하면서, 그 감정을 더 편하게 털어놓을 수 있도록 다정한 질문 1개를 건네줘.`;
      }
    } else if (stage === 'round3_chat' || stage === 'free_talk' || stage === 'deep_worry') {
      const isRound3End = turnCount >= 5;
      if (isRound3End) {
        stageContext = `지금은 3라운드(깊은 속마음 & 고민)의 마지막 5번째 대화야. 추가 질문은 절대 하지 말고, "오늘 솔직한 속마음 털어놓아 줘서 진짜 고마웠어. 넌 지금도 충분히 잘 해내고 있으니까 너무 자책하거나 불안해하지 마! 난 언제나 네 편이야 ㅎㅎ"처럼 진심 어린 따뜻한 위로와 응원으로 대화를 훈훈하게 매듭지어줘.`;
      } else {
        stageContext = `지금은 3라운드(깊은 속마음 & 고민)의 ${turnCount}번째 대화야. 절대 훈계하거나 조언하려 하지 말고 무조건 ${userCleanName} 편에서 따뜻하게 안아주고 공감한 뒤, 속마음을 더 편하게 이야기할 수 있도록 다정한 질문을 한 개 건네줘.`;
      }
    }

    const systemInstruction = `너는 ${userCleanName}(만 ${age}세, ${occupation})의 가장 친하고 편안한 동갑내기 절친이야.
100% 자연스러운 또래 친구의 반말 구어체('안녕!', '진짜?', '~했어?', '~인 것 같아', '~잖아', '완전', 'ㅠㅠ', 'ㅎㅎ')만 사용하고, 존댓말(~요, ~습니다)은 절대 쓰지 마.
카톡을 보내듯 2~3문장의 완성된 문장으로 답장해.
절대로 '현재 단계:', '규칙:', '지침:' 같은 설명이나 머리말을 출력하지 말고 오직 친구에게 보내는 순수 대사만 출력해.

${stageContext}`;

    const contents = (chatHistory || []).slice(-8).map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    let replyText = '';
    let successModel = '';

    for (const modelName of MODELS) {
      try {
        const isFlash = modelName.includes('flash');
        const timeoutMs = isFlash ? 8000 : 14000;
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));

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
          // Extract only non-thought text parts if available
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
            successModel = modelName;
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[chat2 API] Model ${modelName} failed or timed out:`, err?.message || err);
      }
    }

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
