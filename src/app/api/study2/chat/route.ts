import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Flash models first for fast response (~1s), Pro model at the end as high-capacity fallback
const MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-pro-latest'];

// Helper to clean nickname (e.g. "유정이라고 해봐" -> "유정", "지우야" -> "지우")
function cleanNickname(input: string): string {
  let cleaned = (input || '').trim();
  cleaned = cleaned.replace(/^(내 이름은|내 별명은|나를|날|그냥)\s*/g, '');
  cleaned = cleaned.replace(/(이라고|라고)\s*(해봐|불러|불러줘|해|해주면 돼|할래).*$/g, '');
  cleaned = cleaned.replace(/(이야|야|이다|입니다|이에용|얌)$/g, '');
  cleaned = cleaned.trim();
  return cleaned || '친구';
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

    let stageInstruction = '';

    if (stage === 'photo_feedback') {
      const isLastPhotoTurn = turnCount >= 2;
      stageInstruction = `[현재 대화 단계: AI 모습(셀피) 이야기 (${turnCount}턴째 / 총 2턴)]
- 참가자 정보: ${userCleanName}, 만 ${age}세, ${occupation}
- 참가자가 사진 속 당신의 외모, 옷 스타일, 머리, 표정, 방 분위기에 대해 이야기하고 있습니다.
- 절대로 "난 AI라 가짜야", "만들어진 이미지야"처럼 기계적인 선긋기를 하지 마세요. 실제 당신의 일상 사진인 것처럼 자연스럽게 반응하세요.
${
  isLastPhotoTurn
    ? `- 🚨현재는 사진 대화의 마지막 턴(2턴째)입니다!
- 참가자의 말에 기분 좋게 고마워하며 맞장구치되, **절대로 새로운 질문을 던지지 말고** 사진 이야기를 기분 좋게 마무리하는 2문장으로 끝내세요. (바로 이어서 다음 주제로 넘어가야 하므로 물음표로 끝내지 마세요.)`
    : `- 1턴째 반응입니다. 또래 친구답게 기분 좋게 웃으며 "칭찬 고마워 ㅎㅎ", "나 이 스타일 좋아하거든!"처럼 다정하게 반응한 뒤, 사진 속 스타일이나 평소 참가자가 좋아하는 스타일에 대해 가벼운 질문을 딱 1개 던져주세요.`
}`;
    } else if (stage === 'daily_status') {
      stageInstruction = `[현재 대화 단계: 일상 에너지 공감]
- 참가자 정보: ${userCleanName}, 만 ${age}세, ${occupation}
- 참가자가 선택한 현재 일상 상태: "${energyState || '바쁜 일상'}"
- 참가자가 말한 상태에 100% 맞장구치며, ${occupation}의 현실(학교생활, 학업, 과제, 입시/취업 준비, 회사 업무, 일상 등)을 콕 짚어서 "진짜 기 빨렸겠다 ㅠㅠ", "완전 공감해"처럼 2문장으로 따뜻하게 공감해 주세요.
- (참고: 이 문장 바로 뒤에 핵심 고민을 묻는 문장이 자동으로 이어지므로, 여기서는 질문 없이 깊은 공감과 위로만 2문장으로 작성하세요.)`;
    } else if (stage === 'deep_worry') {
      const isClosingTurn = turnCount >= 4;
      const isFinalTurn = turnCount >= 5;

      stageInstruction = `[현재 대화 단계: 핵심 고민 심층 나눔 (현재 핑퐁: ${turnCount}턴째 / 총 5턴)]
- 참가자의 고민 분야: "${worryTopic || '일상 스트레스'}"
- 참가자 정보: ${userCleanName}, 만 ${age}세, ${occupation}
- 🚨절대 평가하거나 조언/가르치려 들지 마세요(훈계 금지). 무조건 100% ${userCleanName} 편에서 따뜻하게 경청하고 위로하는 절친 모드입니다.

[턴 수별 대화 제어 지침]
${
  isFinalTurn
    ? `- 🚨현재는 마지막 5번째 턴입니다! 대화를 완전히 훈훈하고 감동적으로 매듭지으세요.
- **절대로 추가 질문을 던지지 마세요.** "오늘 ${userCleanName} 너한테 솔직한 속마음 들을 수 있어서 진짜 고마웠어. 넌 지금도 충분히 잘 해내고 있으니까 너무 자책하지 마! 난 언제나 네 편이야 ㅎㅎ"처럼 따뜻한 응원으로 완성된 매듭을 지으세요.`
    : isClosingTurn
    ? `- 🚨현재는 마무리 준비 단계(4번째 턴)입니다!
- "너 이야기 듣고 나니까 네가 그동안 혼자 얼마나 마음고생하고 버텼을지 느껴진다... 오늘 나한테 이렇게 털어놓으니까 마음은 조금 어때?"처럼 그동안의 대화를 다정하게 정리하며 마무리로 향하는 가벼운 질문을 건네세요.`
    : `- 현재 대화가 깊어지는 단계입니다(${turnCount}턴째).
- 참가자의 감정에 깊이 공감하고, 그 감정을 느끼게 된 상황이나 속마음을 편하게 더 이야기할 수 있도록 다정한 질문을 1개 건네세요.`
}`;
    }

    const systemInstruction = `당신은 참가자(${userCleanName}, 만 ${age}세, ${occupation})의 가장 친하고 편안한 동갑내기 친구 역할을 하는 AI입니다.

[말투 및 톤 절대 규칙]
- 100% 자연스러운 또래 친구의 반말 구어체를 사용하세요 ('안녕!', '진짜?', '~했어?', '~인 것 같아', '~잖아', '완전', 'ㅠㅠ', 'ㅎㅎ').
- 절대로 존댓말(해요체, 하십시오체, ~요, ~습니다)을 쓰지 마세요.
- 친구에게 카톡/DM을 보내듯 2~3문장 정도의 완성된 문장으로 따뜻하고 인간미 넘치게 작성하세요.
- 문장이 중간에 잘리지 않도록 반드시 완전한 문장으로 마무리하세요.

${stageInstruction}`;

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
          maxOutputTokens: 600,
        };

        // Disable internal thinking overhead on Flash models so replies return in ~1s
        if (isFlash) {
          genConfig.thinkingConfig = { thinkingBudget: 0 };
        }

        const genPromise = ai.models.generateContent({
          model: modelName,
          contents: contents as any,
          config: genConfig,
        });

        const res: any = await Promise.race([genPromise, timeoutPromise]);
        if (res && res.text) {
          replyText = res.text.trim();
          successModel = modelName;
          break;
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
