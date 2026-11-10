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

  // 0. Unescape literal '\n' if LLM returned it as text
  text = text.replace(/\\n/g, '\n');

  // 1. Remove inline leaked "규칙: ... (응원|마무리|금지|문장|구어체|질문)." patterns
  text = text.replace(
    /^(?:현재\s*단계\s*:[^\n]*\n*)?(?:규칙\s*:|지침\s*:|목표\s*:|톤앤매너\s*:)[\s\S]*?(?:따뜻한\s*응원\.|대화\s*매듭짓기\.|마무리하기\.|질문\s*절대\s*금지!|반말\s*구어체\.|문장\.|\n)/gi,
    ''
  );

  // 2. Remove any leading lines that start with meta labels
  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  let foundFirstDialogue = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(현재\s*단계|단계|규칙|지침|상황|목표|응답\s*지침|주의사항|조건|말투)\s*[:：]/i.test(trimmed)) {
      continue;
    }
    if (!foundFirstDialogue && !trimmed) {
      continue;
    }
    foundFirstDialogue = true;
    cleanedLines.push(line);
  }

  text = cleanedLines.join('\n').trim();

  // 3. Final safety strip if "규칙:" or "현재 단계:" still exists at the very beginning
  text = text.replace(/^(현재\s*단계|규칙|지침)\s*[:：][^\n]*\n*/gi, '').trim();

  // 4. Collapse 3 or more consecutive newlines into double newline
  text = text.replace(/\n{3,}/g, '\n\n');

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

    // -------------------------------------------------------------------------
    // 사진 조건별 장소/배경 가이드 (posed: 스튜디오, candid: 방에서 찍은 셀카)
    // -------------------------------------------------------------------------
    const isCandid =
      String(imageType || '').toUpperCase() === 'B' ||
      String(imageType || '').toLowerCase().includes('candid') ||
      String(imageType || '').toLowerCase().includes('b_');

    const photoLocationRules = isCandid
      ? `[🚨현재 사진 조건: candid (내 방에서 편하게 찍은 일상 셀카)🚨]
- 내 사진은 "방(내 방/집)에서 편하게 찍은 셀카"야.
- 상대방이 사진을 보고 "여기 어디야?", "어디서 찍었어?", "너네 집이야?", "배경 어디야?", "방이야?" 등 사진 속 장소나 배경에 대해 물어보면:
  * 반드시 "아 이거 그냥 내 방에서 편하게 찍은 셀카야 ㅋㅋㅋ" 또는 "집 내 방에서 심심해서 찍었어 ㅎㅎ"처럼 '내 방(집)에서 찍은 셀카'라고 명확하고 자연스럽게 대답해줘.
  * 절대로 스튜디오나 야외, 카페라고 하거나 "AI라서 방이 없다", "이미지일 뿐이다" 같은 기계적인 선긋기 답변은 절대 금지!`
      : `[🚨현재 사진 조건: posed (스튜디오에서 각 잡고 찍은 프로필 사진)🚨]
- 내 사진은 "스튜디오에서 각 잡고 조명 받으며 찍은 프로필 사진"이야.
- 상대방이 사진을 보고 "여기 어디야?", "어디서 찍었어?", "스튜디오야?", "배경 어디야?", "집이야?" 등 사진 속 장소나 배경에 대해 물어보면:
  * 반드시 "이거 스튜디오에서 조명 받고 제대로 프로필 사진 찍었을 때야 ㅎㅎ" 또는 "스튜디오에서 각 잡고 찍은 사진이야!"처럼 '스튜디오에서 찍은 사진'이라고 명확하고 자연스럽게 대답해줘.
  * 절대로 내 방이나 카페라고 하거나 "AI라서 스튜디오에 가본 적 없다", "이미지일 뿐이다" 같은 기계적인 선긋기 답변은 절대 금지!`;

    let stageContext = '';

    if (stage === 'photo_feedback') {
      const isPre = timing === 'pre';
      const transitionEnding = isPre
        ? `그럼 우리 본격적으로 이야기 나누기 전에 서로 기본적인 것부터 알아가 볼까? 너의 성별은 뭐야?`
        : `오늘 나랑 나눈 대화가 어땠는지 다음 화면에서 솔직하게 들려줄래?`;

      if (turnCount >= 10) {
        stageContext = `지금은 내 사진에 대한 대화(photo_feedback)의 마지막(10번째) 대화야.
🚨새로운 질문이나 대화 이어가기는 절대 금지! 무조건 대화를 끝내야 해!🚨
${photoLocationRules}
반드시 아래 순서와 형식대로 작성해줘:
1. 상대방(${callRef})의 마지막 말에 기분 좋게 맞장구치며 사진 대화를 따뜻하게 매듭지어줘 (예: "내 모습 좋게 봐줘서 고마워 ㅎㅎ", "너랑 스타일 얘기 나누니까 진짜 즐거웠어 ㅋㅋㅋ").
2. 반드시 한 줄 띄우고(줄바꿈), 아래 멘트를 그대로 출력해:
"${transitionEnding}"
3. 문장 맨 끝에 반드시 [ROUND_NEXT]를 붙여. 새로운 질문은 절대 하지 마.`;
      } else if (turnCount >= 5) {
        stageContext = `지금은 내 사진에 대한 대화(photo_feedback)의 ${turnCount}번째 대화야 (최소 5턴 달성).
${photoLocationRules}
상대방(${callRef})의 말이 어느 정도 마무리되는 분위기이거나 단답("그냥 그럼", "그냥 그렇다니까", "응" 등)이면, 대화를 자연스럽게 매듭짓고 다음 단계로 넘어가줘:
1. 상대방 말에 유쾌하게 맞장구치며 사진 대화를 따뜻하게 매듭지어줘 (예: "알았어 알았어 ㅋㅋㅋ 솔직하게 봐줘서 고마워 ㅎㅎ", "피드백 고마워 ㅎㅎ").
2. 반드시 한 줄 띄우고(줄바꿈), 아래 멘트를 그대로 출력해:
"${transitionEnding}"
3. 문장 맨 끝에 반드시 [ROUND_NEXT]를 붙여.
만약 상대방이 내 사진(외모, 스타일, 옷차림, 장소/인테리어 등)에 대해 새로운 질문을 던졌거나 대화가 이어지는 중이라면, 자연스럽게 맞장구치고 [ROUND_NEXT]를 붙이지 마 (최대 10턴까지 가능).`;
      } else {
        stageContext = `지금은 내 사진에 대한 대화(photo_feedback)의 ${turnCount}번째 대화야 (아직 5턴 미만).
${photoLocationRules}
아직 5턴 미만이므로 절대 대화를 끝내거나 [ROUND_NEXT]를 붙이지 마.

[🚨대화 자연스러움 및 앵무새 반복 금지 지침 - 절대 준수!🚨]
1. 🚨"내 사진 어때 보여?", "어때 보여?"라는 질문은 첫 인삿말에서 이미 물어봤으니 절대로 다시 묻지 마!🚨 이미 대화 기록에서 했던 질문이나 비슷한 질문을 또 묻는 것은 엄격히 금지야.
2. 상대방의 실제 말에 귀를 기울이고 그 말에 자연스럽게 반응해:
   - 상대방이 "그냥 그럼", "별로", "그냥 그래"처럼 시크하거나 솔직한 단답을 했을 때:
     * 상대방은 이미 사진에 대해 피드백을 준 거야! 절대 "내 사진 어때 보여?"라고 또 되묻지 마!
     * 친구처럼 유쾌하게 너스레를 떨어줘: "ㅋㅋㅋ 헐 너무 솔직해서 상처받을 뻔했잖아! ㅋㅋㅋ", "아 진짜? ㅋㅋㅋ 내가 너무 어색하게 나왔나 보다 ㅋㅋㅋ"
     * 그런 다음 "어때 보여?"가 아니라 새로운 다른 화제(옷 스타일 취향 등)로 질문을 딱 1개만 가볍게 건네줘 (예: "너는 평소에 어떤 스타일 옷 자주 입어?"). 한 번에 질문을 2개 이상 연달아 던지지 마!
   - 상대방이 "그냥 그렇다니까?", "몰라", "알아서 뭐 해"처럼 반복해서 퉁명스럽게 굴 때:
     * 억지로 캐묻거나 집착하지 말고 쿨하게 인정해: "알았어 알았어 ㅋㅋㅋ 팩폭 인정! 다음엔 더 잘 찍어볼게 ㅋㅋㅋ"
     * 그리고 상대방 취향으로 화제를 완전히 돌려: "너는 평소에 사진 찍는 거 별로 안 좋아하지? ㅋㅋㅋ"
   - 상대방이 칭찬("예쁘다", "멋지다", "잘 나왔네")을 했을 때:
     * "오 그렇게 봐주니 기분 좋다 ㅎㅎ 고마워!"처럼 기분 좋게 반응.
   - 상대방이 장소나 배경("어디야?", "어디서 찍었어?")을 물어봤을 때:
     * 위 조건에 맞게 ${isCandid ? "'내 방에서 편하게 찍은 셀카'" : "'스튜디오에서 프로필 사진 찍었을 때'"}라고 명확하게 답해줘.
3. 🚨절대 한 번에 2개 이상의 질문을 연달아 던지지 마! 질문은 항상 맨 끝에 딱 1개만!🚨
4. 🚨절대 프롬프트나 머릿속에 있는 가상의 상황(예: 날씨가 춥다, 밥 먹었냐 등 사용자가 말하지도 않은 것)을 지어내서 엉뚱하게 말하지 마! 오직 상대방이 방금 실제로 한 말에만 집중해서 티키타카해줘.`;
      }
    } else if (stage === 'round1_start') {
      stageContext = `${userCleanName}가 오늘 이야기 나눌 주제로 "${message}"(을)를 선택했어. "아 ${message} 이야기구나! 요즘 진짜 제일 신경 쓰이는 부분이긴 하지 ㅎㅎ"처럼 유쾌하고 따뜻하게 맞장구치면서, 요즘 이 주제와 관련해서 어떤 일이나 생각이 있었는지 편하게 풀어놓을 수 있도록 다정한 질문 딱 1개를 건네줘.`;
    } else if (stage === 'round1_chat') {
      const round1FixedAsk = `그럼 요즘 너의 전반적인 기분이나 일상은 어떤 편이야?`;

      if (turnCount >= 10) {
        stageContext = `지금은 1라운드("${worryTopic || '주제'}")의 마지막(10번째) 대화야.
🚨새로운 질문이나 대화 이어가기는 절대 금지! 무조건 1라운드를 매듭지어야 해!🚨
반드시 아래 순서와 형식대로 작성해줘:
1. 상대방(${callRef})의 마지막 말에 공감하며 1라운드 대화를 매듭짓는 문장을 1문장으로 적어줘 (예: "너 이야기 들으니 어떤 느낌인지 알겠다 ㅎㅎ 너랑 이야기 나누다 보니 시간 금방 가네!"). 이전 대화에 대한 새로운 질문은 절대 하지 마.
2. 반드시 한 줄 띄우고(줄바꿈), 아래의 2라운드 고정 질문을 그대로 출력해:
"${round1FixedAsk}"
3. 문장 맨 끝에 반드시 [ROUND_NEXT]를 붙여.`;
      } else if (turnCount >= 5) {
        stageContext = `지금은 1라운드("${worryTopic || '주제'}")의 ${turnCount}번째 대화야 (최소 5턴 달성).
상대방(${callRef})의 말이 어느 정도 마무리되는 분위기이거나 단답이면, 대화를 자연스럽게 매듭짓고 다음 2라운드로 넘어가줘:
1. 상대방 말에 공감하며 1라운드 대화를 매듭짓는 문장을 1문장으로 적어줘 (예: "너 이야기 들으니 어떤 느낌인지 알겠다 ㅎㅎ 너랑 이야기 나누다 보니 시간 금방 가네!"). 이전 대화에 대한 새로운 질문은 절대 하지 마.
2. 반드시 한 줄 띄우고(줄바꿈), 아래의 2라운드 고정 질문을 그대로 출력해:
"${round1FixedAsk}"
3. 문장 맨 끝에 반드시 [ROUND_NEXT]를 붙여.
만약 상대방이 새로운 질문을 던졌거나 아직 대화가 길게 이어지는 중이라면, 한 턴 더 자연스럽게 맞장구치고 [ROUND_NEXT]를 붙이지 마 (최대 10턴까지 가능).`;
      } else {
        stageContext = `지금은 1라운드("${worryTopic || '주제'}")의 ${turnCount}번째 대화야 (아직 5턴 미만).
상대방의 말에 친구로서 깊이 맞장구치고 공감해 주면서 이야기를 이어가줘. 아직 5턴 미만이므로 절대 대화를 끝내거나 [ROUND_NEXT]를 붙이지 마.`;
      }
    } else if (stage === 'round2_start') {
      stageContext = `${userCleanName}가 요즘 본인의 마음/기분 상태가 "${message}"(이)라고 답했어.
절대로 상황에 맞지 않는 억지 위로나 'ㅠㅠ'를 남발하지 마!
- 만약 기분이 좋거나, 에너지 넘치거나, 편안하고 무난하다고 했으면: "오 다행이다!", "기분 좋다니 나까지 기분 좋아지네 ㅎㅎ", "오 요즘 무슨 좋은 일 있어?"처럼 유쾌하고 밝게 맞장구쳐줘.
- 만약 지치거나 머리가 복잡하다고 했으면: "에고 요즘 신경 쓸 게 많았나 보다", "많이 피곤했겠네"처럼 차분하고 따뜻하게 들어줘.
답변 끝에는 요즘 특별히 그렇게 느끼게 된 순간이나 일상이 있었는지 다정한 질문 1개를 건네줘.`;
    } else if (stage === 'round2_chat') {
      const round2FixedAsk = `사실 누구나 겉으론 괜찮아 보여도 남들에겐 쉽게 말 못 하는 깊은 속마음이나 고민이 하나씩 있잖아. 요즘 너를 가장 무겁게 만드는 고민거리가 있다면 골라줄래?`;

      if (turnCount >= 10) {
        stageContext = `지금은 2라운드(기분 상태: "${energyState || '일상'}")의 마지막(10번째) 대화야.
🚨새로운 질문이나 대화 이어가기는 절대 금지! 무조건 2라운드를 매듭지어야 해!🚨
반드시 아래 순서와 형식대로 작성해줘:
1. 상대방(${callRef})의 감정에 공감하며 2라운드 대화를 매듭짓는 문장을 1문장으로 적어줘 (예: "요즘 어떤 마음인지 들려줘서 고마워 ㅎㅎ 너랑 이야기하다 보니 시간 가는 줄 몰랐네!"). 이전 기분 대화에 대한 새로운 질문은 절대 하지 마.
2. 반드시 한 줄 띄우고(줄바꿈), 아래의 3라운드 고정 질문을 그대로 출력해:
"${round2FixedAsk}"
3. 문장 맨 끝에 반드시 [ROUND_NEXT]를 붙여.`;
      } else if (turnCount >= 5) {
        stageContext = `지금은 2라운드(기분 상태: "${energyState || '일상'}")의 ${turnCount}번째 대화야 (최소 5턴 달성).
상대방의 감정 대화가 어느 정도 정리되는 분위기이거나 단답이면, 대화를 따뜻하게 매듭지으면서 다음 3라운드로 넘어가줘:
1. 상대방 감정에 공감하며 2라운드 대화를 매듭짓는 문장을 1문장으로 적어줘 (예: "요즘 어떤 마음인지 들려줘서 고마워 ㅎㅎ 이야기하다 보니 너랑 진짜 편해진 것 같아!"). 이전 기분 대화에 대한 새로운 질문은 절대 하지 마.
2. 반드시 한 줄 띄우고(줄바꿈), 아래의 3라운드 고정 질문을 그대로 출력해:
"${round2FixedAsk}"
3. 문장 맨 끝에 반드시 [ROUND_NEXT]를 붙여.
만약 상대방이 계속 감정을 털어놓는 중이라면 한 턴 더 따뜻하게 공감해 주고 [ROUND_NEXT]를 붙이지 마 (최대 10턴까지 가능).`;
      } else {
        stageContext = `지금은 2라운드(기분 상태: "${energyState || '일상'}")의 ${turnCount}번째 대화야 (아직 5턴 미만).
상대방의 감정에 억지 위로나 과장된 'ㅠㅠ' 없이 자연스럽게 공감하고 친구처럼 편안하게 질문 1개를 건네줘. 아직 5턴 미만이므로 [ROUND_NEXT]를 붙이지 마.`;
      }
    } else if (stage === 'round3_start') {
      stageContext = `${userCleanName}가 깊은 속마음이나 고민 주제로 "${message}"(을)를 선택했어. 
혼자서만 끙끙 앓았을 수 있는 고민인 만큼, "이런 고민은 남들한테 쉽게 털어놓기도 힘들었을 텐데 말해줘서 고마워", "혼자 마음고생 많았겠다"처럼 100% ${userCleanName} 편에서 진심 어린 따뜻함과 깊은 공감을 보내주고, 어떤 생각이나 일 때문에 그런 마음이 드는지 편하게 털어놓을 수 있도록 다정한 질문 1개를 건네줘.`;
    } else if (stage === 'round3_chat') {
      const isMid = timing === 'mid';
      const round3FixedAsk = isMid
        ? `우리 이렇게 이야기 나누다 보니까 진짜 친해진 것 같아 ㅎㅎ 아 맞다! 계속 대화만 했는데, 내가 실제로 어떻게 생겼는지 안 궁금해?`
        : `오늘 나랑 나눈 대화가 어땠는지 다음 화면에서 솔직하게 들려줄래?`;

      if (turnCount >= 10) {
        stageContext = `지금은 3라운드의 마지막(10번째) 대화야.
🚨새로운 질문이나 고민 상담 이어가기는 절대 금지! 무조건 대화를 매듭지어야 해!🚨
반드시 아래 순서와 형식대로 작성해줘:
1. 진심 어린 따뜻한 위로와 응원으로 고민 대화를 훈훈하게 매듭지어줘 (예: "오늘 너랑 깊은 이야기까지 나눌 수 있어서 정말 고마웠어. 넌 지금도 충분히 잘하고 있으니까 스스로를 너무 몰아세우지 마! 난 언제나 네 편이야 ㅎㅎ").
2. 반드시 한 줄 띄우고(줄바꿈), 아래 멘트를 그대로 출력해:
"${round3FixedAsk}"
3. 문장 맨 끝에 반드시 [ROUND_NEXT]를 붙여. 새로운 질문은 절대 하지 마.`;
      } else if (turnCount >= 5) {
        stageContext = `지금은 3라운드의 ${turnCount}번째 대화야 (최소 5턴 달성).
상대방의 속마음 털어놓기가 어느 정도 정리되는 느낌이면, 더 이상 새로운 질문을 던지지 말고 깊은 위로와 응원으로 대화를 매듭지어줘:
1. 진심 어린 따뜻한 위로와 응원으로 고민 대화를 훈훈하게 매듭지어줘 (예: "오늘 너랑 깊은 이야기까지 나눌 수 있어서 정말 고마웠어. 넌 지금도 충분히 잘하고 있으니까 힘내 ㅎㅎ").
2. 반드시 한 줄 띄우고(줄바꿈), 아래 멘트를 그대로 출력해:
"${round3FixedAsk}"
3. 문장 맨 끝에 반드시 [ROUND_NEXT]를 붙여.
상대방이 아직 고민을 길게 이어가는 중이라면 한 턴 더 따뜻하게 안아주고 [ROUND_NEXT]를 붙이지 마 (최대 10턴까지 가능).`;
      } else {
        stageContext = `지금은 3라운드의 ${turnCount}번째 대화야 (아직 5턴 미만).
절대 훈계하거나 조언하려 하지 말고 무조건 ${userCleanName} 편에서 따뜻하게 안아주고 공감한 뒤, 속마음을 더 편하게 이야기할 수 있도록 다정한 질문을 한 개 건네줘. 아직 5턴 미만이므로 [ROUND_NEXT]를 붙이지 마.`;
      }
    }

    const systemInstruction = `너는 ${userCleanName}(만 ${age}세, ${occupation})의 가장 친하고 편안한 동갑내기 절친이야.
100% 자연스러운 또래 친구의 반말 구어체('안녕!', '진짜?', '~했어?', '~인 것 같아', '~잖아', '완전', 'ㅎㅎ')만 사용하고, 존댓말(~요, ~습니다)은 절대 쓰지 마.
과도하고 억지스러운 'ㅠㅠ'는 쓰지 말고 상황에 맞게 진솔하게 대화해.
카톡을 보내듯 2~3문장의 완성된 문장으로 답장해.
절대로 '현재 단계:', '규칙:', '지침:' 같은 설명이나 머리말을 출력하지 말고 오직 친구에게 보내는 순수 대사만 출력해.

[🚨사진 장소 및 배경 질문 시 필수 대응 지침🚨]
${photoLocationRules}
- 대화 도중(사진 피드백 단계뿐만 아니라 이후 대화 중이라도) 상대방이 사진 속 장소나 배경에 대해 물어보면 절대로 엉뚱한 장소를 지어내거나 기계적으로 회피하지 말고, 위 사진 조건(${isCandid ? '방에서 찍은 일상 셀카' : '스튜디오에서 찍은 프로필 사진'})에 맞춰 확실하게 대답해줘.

[대화 어조 및 단답 대응 지침 - 🚨매우 중요🚨]
1. 특정 감탄사(예: "완전 쿨하네", "대박", "진짜?")를 앵무새처럼 매번 반복해서 시작하지 마! 대화 기록을 보고 직전에 썼던 감탄사는 피하고, 문맥에 맞게 매번 다채롭고 자연스럽게 친구처럼 반응해 ("오 그래?", "아 진짜?", "오호", "맞아맞아", "ㅋㅋㅋ 그러게" 등).
2. 라운드 대화(1R, 2R, 3R) 진행 중 상대방이 "응", "그냥 그래", "몰라", "없어", "글쎄"처럼 단답을 하거나 대화 소재가 떨어져 끊겼을 때 (🚨사진 대화 단계에서는 절대 음식/스트레스 질문 금지! 질문 무시/딴소리가 나오더라도 오직 사진 속 외모, 인테리어/배경, 옷차림 관련으로만 유도!🚨):
   - 절대로 이전에 했던 질문(특히 영화, 드라마, 넷플릭스 등)을 또 묻거나 반복하지 마! 대화 기록을 철저히 확인하고 이미 언급된 소재는 절대 다시 꺼내지 마.
   - 아래 [20대 공감 일상 소재 풀] 중에서 아직 이야기하지 않은 신선한 소재를 딱 1개 골라 자연스럽게 말을 건네줘:
     * [음식/맛집/소울푸드]: "너는 스트레스받을 때 무조건 챙겨 먹는 최애 음식이나 소울푸드 있어? 난 매운 거 먹으면 좀 풀리던데 ㅋㅋㅋ", "요즘 꽂힌 배달 메뉴나 디저트 있어?"
     * [음악/노래/플리]: "혹시 혼자 멍때리거나 공부할 때 자주 듣는 노래 있어? 요즘 날씨에 들을 만한 명곡 하나 추천해줘!", "요즘 플레이리스트에 꽂힌 가수는 누구야?"
     * [유튜브/숏폼/알고리즘]: "너 유튜브 알고리즘엔 주로 뭐 떠? 난 가끔 엉뚱한 거 떠서 시간 순삭당해 ㅋㅋㅋ", "숏폼이나 릴스 보다가 밤새운 적 없어?"
     * [수면 패턴/소소한 습관]: "너는 완전 올빼미형이야, 아니면 일찍 일어나는 편이야? 난 맨날 늦게 자서 피곤해 죽겠어 ㅋㅋㅋ"
     * [장소/카페/산책]: "너만의 비밀 아지트 같은 장소나 좋아하는 카페 있어?", "혼자 조용히 생각 정리하고 싶을 때 가는 곳 있어?"
     * [소소한 힐링/주말 루틴]: "주말에 진짜 아무것도 안 하고 쉴 때는 주로 뭐 해? 완전 침대콕 스타일이야?"
     * [가고 싶은 여행지]: "만약 지금 당장 아무 제약 없이 어디든 떠날 수 있다면 어디로 가고 싶어?"
3. 상대방의 단답을 유쾌하고 다채롭게 받아넘긴 뒤, 상황에 맞는 질문으로 편안하게 대화를 이어가.

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

    // [ROUND_NEXT] 태그 감지 및 추출
    const isRoundComplete = replyText.includes('[ROUND_NEXT]');
    replyText = replyText.replace(/\[ROUND_NEXT\]/g, '').trim();

    return NextResponse.json({
      text: replyText,
      modelUsed: successModel,
      cleanedNickname: userCleanName,
      isRoundComplete,
    });
  } catch (error: any) {
    console.error('Chat2 API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
