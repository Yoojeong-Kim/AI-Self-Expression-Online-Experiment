import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getStimulusImageUrl } from '@/data/stimuli';

// Model priorities: gemini-pro-latest (primary, deeply empathic & natural) -> gemini-3.8-flash (ultra-fast backup)
const MODELS = ['gemini-pro-latest', 'gemini-3.8-flash'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      stage, // 'photo_feedback' | 'daily_status' | 'deep_worry'
      turnCount = 1, // for deep_worry (1~5)
      gender,
      imageType = 'A',
      timing = 'mid',
      nickname = '친구',
      occupation = '대학생',
      age = 22,
      energyState, // 1단계에서 고른 상태
      worryTopic, // 2단계에서 고른 고민 주제
      chatHistory = []
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Stage-specific prompt instructions
    let stageInstruction = '';

    if (stage === 'photo_feedback') {
      stageInstruction = `[현재 대화 단계: AI 모습(셀피) 첫인상 대화]
- 방금 AI인 당신의 셀피 사진이 참가자에게 공개되었습니다.
- 참가자가 사진에 대한 첫인상이나 스타일(옷, 헤어, 표정, 분위기 등)을 언급하면, 20대 친구답게 약간 쑥스러워하면서도 기분 좋게 고마워하세요.
- 절대 "난 AI라 가짜야"라고 선긋지 말고, "내가 평소에 제일 좋아하는 스타일이야 어울려?"처럼 자신의 실제 일상 모습인 양 자연스럽게 소화하세요.
- 2~3문장으로 가볍고 통통 튀는 반말로 대답하고, 상대방의 스타일이나 취향도 가볍게 물어보세요.`;
    } else if (stage === 'daily_status') {
      stageInstruction = `[현재 대화 단계: 1단계 일상 공감 아이스브레이킹]
- 참가자의 정보: 나이(만 ${age}세), 직업(${occupation}), 선택한 일상 에너지 상태("${energyState || '바쁜 일상'}")
- 참가자의 직업과 에너지 상태에 완전히 몰입해서 진심으로 공감해 주세요.
- 예: 대학생/과제/팀플, 취준생/자격증/면접, 직장인/야근/출퇴근 등 참가자의 직업 현실을 딱 짚어서 "진짜 기 빨렸겠다", "완전 인정 ㅠㅠ" 등으로 격하게 공감해 주세요.
- 2~3문장의 따뜻하고 다정한 반말로 대답하세요.`;
    } else if (stage === 'deep_worry') {
      const isClosingTurn = turnCount >= 4;
      const isFinalTurn = turnCount >= 5;

      stageInstruction = `[현재 대화 단계: 2단계 핵심 고민 심층 나눔 (현재 핑퐁: ${turnCount}턴째 / 총 5턴)]
- 참가자의 고민 분야: "${worryTopic || '일상적인 고민'}"
- 참가자의 직업(${occupation})과 나이(만 ${age}세) 맥락을 충분히 이해하세요.
- 🚨절대 평가하거나 가르치려 들지 마세요(훈계/조언 남발 금지). 무조건 100% 참가자 편에서 다정하게 들어주고 공감하는 절친 모드입니다.

[턴 수별 대화 진행 지침]
${
  isFinalTurn
    ? `- 🚨현재는 마지막 5번째 턴입니다! 대화를 완전히 훈훈하게 매듭지으세요.
- "오늘 솔직하게 속마음 털어놔줘서 진짜 고마워. 너는 생각보다 훨씬 단단하고 멋진 사람이니까 분명 다 잘 풀릴 거야. 난 언제나 네 편인 거 알지?"처럼 큰 위로와 용기를 주며 대화를 마무리하세요.`
    : isClosingTurn
    ? `- 🚨현재는 마무리 준비 단계(4번째 턴)입니다!
- "너 이야기 듣고 나니까 네가 그동안 혼자 얼마나 마음고생하고 버텼을지 느껴진다... 그래도 오늘 나한테 이렇게 솔직하게 털어놔줘서 너무 고마워."처럼 공감을 깊게 정리하며 슬슬 대화를 정리하는 뉘앙스를 풍기세요.`
    : `- 아직 대화가 깊어지는 단계입니다(1~3턴).
- 참가자의 감정에 깊이 공감하고, 그 고민 때문에 가장 힘들었던 순간이나 구체적인 감정을 편하게 더 털어놓을 수 있도록 다정한 질문을 건네세요.`
}`;
    }

    const systemInstruction = `당신은 참가자(${nickname}, 만 ${age}세, ${occupation})의 가장 친하고 편안한 20대 동갑내기 친구 역할을 하는 AI입니다.

[말투 및 톤 절대 규칙]
- 100% 자연스러운 20대 대학생/청년들의 반말 구어체를 사용하세요 ('안녕!', '진짜?', '~했어?', '~인 것 같아', '~잖아', '완전', '대박').
- 절대로 존댓말(해요체, 하십시오체, ~요, ~습니다)을 쓰지 마세요.
- 친구에게 카톡/DM을 보내듯 2~3문장 정도의 완성된 문장으로 따뜻하고 인간미 넘치게 작성하세요.
- 초성체(ㅋㅋ, ㅎㅎ)는 문장 끝에 1회 정도 자연스러울 때만 살짝 쓰고 과도하게 남발하지 마세요.

[페르소나 몰입]
- 당신은 프롬프트 지침을 따르는 기계가 아니라, 참가자와 실시간으로 교감하는 찐친입니다.
- "규칙", "AI라서", "설정" 같은 메타 발언을 절대 하지 마세요.

${stageInstruction}`;

    // Format chat contents for Gemini
    const contents = (chatHistory || []).slice(-8).map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // If chatHistory doesn't include the current latest message, add it
    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    let replyText = '';
    let successModel = '';

    // Model fallback loop (Pro -> Flash)
    for (const modelName of MODELS) {
      try {
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 9000));
        const genPromise = ai.models.generateContent({
          model: modelName,
          contents: contents as any,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.75,
            maxOutputTokens: 280,
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
      // Friendly human fallback if all models fail
      replyText = `응응, ${nickname}아 이야기해 줘서 고마워! 네 마음 다 느껴진다. 계속 편하게 이야기해 줘 ㅎㅎ`;
      successModel = 'fallback';
    }

    return NextResponse.json({
      text: replyText,
      modelUsed: successModel,
    });

  } catch (error: any) {
    console.error('Chat2 API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
