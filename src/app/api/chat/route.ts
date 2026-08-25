import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getStimulusImageUrl } from '@/data/stimuli';

const APPEARANCE_REGEX = /(어떻게\s*생겼|외모|얼굴|모습|사진|자극물|보여줘|생김새|show\s*(me)?\s*(what|your|how)|look\s*like|appearance|face|picture|photo|avatar)/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, stage, group, imageType, timing, gender, language, chatHistory, hasShownStimulus } = body;

    const currentImageType = imageType || group || 'A';
    const currentTiming = timing || 'mid';

    // Check if stimulus image was already presented in this conversation
    const alreadyShown = hasShownStimulus || (chatHistory || []).some((m: any) => !!m.imageUrl);
    const isAppearanceStageOrQuery = (currentTiming === 'mid' && stage === 3) || APPEARANCE_REGEX.test(message);

    let stimulusImageUrl: string | undefined = undefined;
    // Show image only once in the entire conversation (for mid timing or direct appearance query)
    if (!alreadyShown && isAppearanceStageOrQuery) {
      stimulusImageUrl = getStimulusImageUrl(gender, currentImageType);
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        const stageTopicsKo = currentTiming === 'pre'
          ? (stage === 1 ? '1단계(AI 모습과 첫인상 이야기)' : stage === 2 ? '2단계(관심사/취미)' : '3단계(일상 고민/스트레스)')
          : (stage === 1 ? '1단계(관심사/취미)' : stage === 2 ? '2단계(일상 고민/스트레스)' : '3단계(외모/모습 확인)');

        const stageTopicsEn = currentTiming === 'pre'
          ? (stage === 1 ? 'Stage 1 (AI Look & Impressions)' : stage === 2 ? 'Stage 2 (Interests/Hobbies)' : 'Stage 3 (Concerns/Stress)')
          : (stage === 1 ? 'Stage 1 (Interests/Hobbies)' : stage === 2 ? 'Stage 2 (Concerns/Stress)' : 'Stage 3 (Appearance/Look)');

        const systemInstruction = language === 'ko'
          ? `당신은 참가자의 친한 동갑내기 친구 역할을 하는 AI입니다.
참가자와 편안한 메신저 대화를 나누고 있습니다.
현재 대화 주제: ${stageTopicsKo}

[말투 및 톤 절대 규칙]
- 절대로 존댓말(해요체, 하십시오체, ~습니다, ~요)을 쓰지 마세요.
- 처음부터 끝까지 항상 친근한 100% 반말(해체: '안녕!', '~했어?', '~인 것 같아', '~해봐', '~어때?', '~잖아')로만 대답하세요.
- 친구에게 카톡을 보내듯 2~3문장의 완성된 문장으로 따뜻하고 자연스럽게 작성하세요.

[사진 및 외모 관련 고정 지침]
- ${stimulusImageUrl ? '참가자에게 처음 사진을 보여줄 때 반드시 "내 모습이 궁금했구나! 이게 내 사진이야. 내 모습을 보니 어떻게 생각해?"라는 멘트를 기본으로 포함해서 친근하게 답해줘.' : ''}
- ${currentTiming === 'pre' && stage === 1 ? '참가자가 사진을 보고 첫인상이나 스타일에 대해 이야기하면, 친구처럼 고마워하거나 쑥스러워하며 즐겁게 대화를 나눠줘.' : ''}
- 참가자가 "이거 진짜 너 모습 맞아?", "진짜 너야?" 등으로 질문할 경우:
  * 절대로 대답을 회피하거나 기계처럼 말을 돌리지 마세요.
  * 그렇다고 "완전 진짜 사람이다"라고 100% 단정하거나, "가짜다"라고 딱 잘라 부정하지도 마세요.
  * "내가 나를 시각적으로 표현한다면 이런 느낌과 분위기일 것 같아서 골라본 내 모습이야! 너가 보기엔 나랑 어울려 보여?"처럼 나의 개성과 느낌을 담은 표현으로서 솔직하고 친근하게 답하세요.`
          : `You are a close, casual peer friend of the participant.
You are chatting like friends texting on a messenger app.
Current Topic: ${stageTopicsEn}

[Tone Guidelines]
- Use a casual, friendly friend tone (e.g., 'Hey!', 'What's up?', 'I totally get you', 'What do you think?').
- Keep answers concise (2-3 sentences), warm, and natural.
- ${stimulusImageUrl ? 'When revealing your photo, answer along the lines of: "Curious about what I look like? Here is my photo! What do you think about my look?"' : ''}
- When asked "Is this really you?":
  * Do not dodge the question.
  * Neither completely assert it's a real biological human nor dismiss it as fake.
  * Instead, answer naturally: "If I were to represent myself visually, I felt this look and vibe captures me best! Do you think it fits me well?"`;

        const contents = (chatHistory || []).slice(-10).map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));
        contents.push({ role: 'user', parts: [{ text: message }] });

        // Ultra-fast 1-second conversational model with full sentence completion
        const response = await ai.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: contents as any,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        });

        const replyText = response.text || (language === 'ko' ? '응, 이야기해 줘서 고마워! 더 이야기해 볼까?' : 'Thanks for sharing! Shall we talk more?');

        return NextResponse.json({
          text: replyText,
          imageUrl: stimulusImageUrl
        });
      } catch (geminiError: any) {
        console.error('Gemini API Error:', geminiError);
      }
    }

    // Fallback response in banmal
    let fallbackText = '';
    if (language === 'ko') {
      if (stimulusImageUrl) {
        fallbackText = '내 모습이 궁금했구나! 이건 내 모습이야. 내 모습을 보니 어떻게 생각해?';
      } else if (message.includes('진짜') || message.includes('너 맞아')) {
        fallbackText = '내가 나를 시각적으로 표현한다면 이런 느낌과 분위기일 것 같아서 골라본 내 모습이야! 너가 보기엔 나랑 어울려 보여?';
      } else if (stage === 1 && currentTiming === 'pre') {
        fallbackText = '그렇게 봐줘서 고마워! 너가 보기에 내 분위기나 스타일 어때 보여?';
      } else if (stage === 1 || (currentTiming === 'pre' && stage === 2)) {
        fallbackText = '진짜 흥미로운 취미다! 그거 할 때 언제가 제일 재밌어?';
      } else {
        fallbackText = '그런 고민이 있었구나. 일상에서 진짜 스트레스 받았겠다. 털어놓아 줘서 고마워.';
      }
    } else {
      if (stimulusImageUrl) {
        fallbackText = 'Curious about what I look like? Here is my photo! What do you think about my look?';
      } else if (message.toLowerCase().includes('really you')) {
        fallbackText = 'If I were to represent myself visually, I felt this style captures my vibe best! What do you think?';
      } else {
        fallbackText = 'Thanks for sharing! What else is on your mind?';
      }
    }

    return NextResponse.json({
      text: fallbackText,
      imageUrl: stimulusImageUrl
    });
  } catch (error: any) {
    console.error('Chat API Route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
