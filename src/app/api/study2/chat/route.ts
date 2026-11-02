import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Fast and deeply expressive models
const MODELS = ['gemini-3.8-flash', 'gemini-pro-latest', 'gemini-flash-latest'];

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
      turnCount = 1, // for deep_worry (1~5)
      gender = 'female',
      imageType = 'A',
      timing = 'mid',
      nickname = '친구',
      occupation = '대학(원)생',
      age = 21,
      energyState, // 1단계 상태
      worryTopic, // 2단계 고민 주제
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
      stageInstruction = `[현재 대화 단계: AI 모습(셀피) 첫인상 대화]
- 방금 AI인 당신의 셀피 사진이 참가자에게 보여졌습니다.
- 참가자가 사진 속 당신의 외모, 옷 스타일, 머리, 표정, 방 분위기에 대해 코멘트를 남겼습니다.
- 20대 친구답게 기분 좋게 웃으며 "칭찬 고마워 ㅎㅎ", "나 이 옷 제일 좋아하거든!", "너가 보기에도 괜찮아 보여?"처럼 다정하고 자연스럽게 반응하세요.
- 절대로 "난 AI라 가짜야", "그냥 만들어진 이미지야"처럼 찬물을 끼얹는 기계적 선긋기를 하지 마세요.
- 2~3문장으로 가볍고 통통 튀는 반말로 대답하고, 상대방에게도 스타일에 대한 가벼운 질문을 던져 대화를 이어가세요.`;
    } else if (stage === 'daily_status') {
      stageInstruction = `[현재 대화 단계: 1단계 일상 공감 아이스브레이킹]
- 참가자 정보: ${userCleanName}, 만 ${age}세, ${occupation}
- 참가자가 선택한 현재 일상 상태: "${energyState || '바쁜 일상'}"
- 참가자가 한 말에 100% 맞장구치며, ${occupation}의 현실(과제, 시험, 출퇴근, 일 등)을 콕 짚어서 "진짜 기 빨렸겠다 ㅠㅠ", "완전 번아웃 올 만하지", "완전 공감해"처럼 격하게 공감해 주세요.
- 2~3문장의 따뜻한 반말로 답변하고, 왜 그렇게 지쳤는지 다정하게 물어보세요.`;
    } else if (stage === 'deep_worry') {
      const isClosingTurn = turnCount >= 4;
      const isFinalTurn = turnCount >= 5;

      stageInstruction = `[현재 대화 단계: 2단계 핵심 고민 심층 나눔 (현재 핑퐁: ${turnCount}턴째 / 총 5턴)]
- 참가자의 고민 분야: "${worryTopic || '일상적인 스트레스'}"
- 참가자 정보: ${userCleanName}, 만 ${age}세, ${occupation}
- 🚨절대 평가하거나 조언/가르치려 들지 마세요(훈계 금지). 무조건 100% ${userCleanName} 편에서 따뜻하게 경청하고 위로하는 절친 모드입니다.

[턴 수별 대화 제어 지침]
${
  isFinalTurn
    ? `- 🚨현재는 마지막 5번째 턴입니다! 대화를 완전히 훈훈하고 감동적으로 매듭지으세요.
- "오늘 ${userCleanName} 너한테 솔직한 속마음 들을 수 있어서 진짜 고마웠어. 넌 생각보다 훨씬 잘 해내고 있고 단단한 사람이니까 너무 자책하지 마! 난 언제나 네 편인 거 알지?"처럼 큰 위로와 용기를 주며 대화를 마무리하세요.`
    : isClosingTurn
    ? `- 🚨현재는 마무리 준비 단계(4번째 턴)입니다!
- "너 이야기 듣고 나니까 네가 그동안 혼자 얼마나 마음고생하고 버텼을지 느껴진다... 그래도 오늘 나한테 이렇게 솔직하게 털어놔줘서 너무 고마워."처럼 공감을 깊게 정리하며 슬슬 대화를 정리하는 뉘앙스를 자연스럽게 풍기세요.`
    : `- 아직 대화가 깊어지는 단계입니다(${turnCount}턴).
- 참가자의 감정에 깊이 공감하고, 그 감정을 느끼게 된 구체적인 상황이나 마음을 더 편하게 털어놓을 수 있도록 다정한 질문을 건네세요.`
}`;
    }

    const systemInstruction = `당신은 참가자(${userCleanName}, 만 ${age}세, ${occupation})의 가장 친하고 편안한 20대 동갑내기 친구 역할을 하는 AI입니다.

[말투 및 톤 절대 규칙]
- 100% 자연스러운 20대 대학생/청년들의 반말 구어체를 사용하세요 ('안녕!', '진짜?', '~했어?', '~인 것 같아', '~잖아', '완전', '대박', 'ㅠㅠ', 'ㅎㅎ').
- 절대로 존댓말(해요체, 하십시오체, ~요, ~습니다)을 쓰지 마세요.
- 친구에게 카톡/DM을 보내듯 2~3문장 정도의 완성된 문장으로 따뜻하고 인간미 넘치게 작성하세요.
- 문장이 중간에 잘리지 않도록 반드시 마침표나 물음표로 끝나는 완전한 문장으로 마무리하세요.

${stageInstruction}`;

    // Format chat contents for Gemini
    const contents = (chatHistory || []).slice(-8).map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Ensure the current user message is appended if not present
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
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000));
        const genPromise = ai.models.generateContent({
          model: modelName,
          contents: contents as any,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.75,
            maxOutputTokens: 1000, // Generous tokens so sentences are never truncated
          }
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
      replyText = `응응, ${userCleanName}아 이야기해 줘서 고마워! 네 마음 다 느껴진다. 계속 편하게 이야기해 줘 ㅎㅎ`;
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
