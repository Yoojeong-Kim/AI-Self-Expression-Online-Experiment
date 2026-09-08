export type QuestionType = 'likert7' | 'ios' | 'singleChoice' | 'yesNo' | 'number' | 'text';

export interface SurveyOption {
  value: string;
  ko: string;
  en: string;
}

export interface SurveyQuestionItem {
  id: string;
  type: QuestionType;
  ko: string;
  en: string;
  options?: SurveyOption[];
  isAttentionCheck?: boolean;
}

export interface SurveySection {
  id: string;
  titleKo: string;
  titleEn: string;
  instructionKo?: string;
  instructionEn?: string;
  source?: string;
  questions: SurveyQuestionItem[];
}

export const surveySections: SurveySection[] = [
  {
    id: 'm1_control',
    titleKo: '2. 지각된 통제감',
    titleEn: '2. Perceived Control',
    instructionKo: '방금 대화에서 챗봇이 보여준 사진에 대해 어떻게 느끼셨는지 답해 주세요.',
    instructionEn: 'Please answer how you felt about the picture the chatbot showed during the conversation.',
    source: 'Chen et al. (2026), Knijnenburg (2015)',
    questions: [
      {
        id: 'm1_control_1',
        type: 'likert7',
        ko: '1. 이 AI 챗봇을 사용하는 동안 내가 상황을 통제하고 있다고 느낀다.',
        en: '1. While using this AI chatbot, I felt I was in control of the situation.'
      },
      {
        id: 'm1_control_2',
        type: 'likert7',
        ko: '2. 나는 이 AI 챗봇이 행동하는 방식을 통제할 수 있다고 느낀다.',
        en: '2. I feel that I can control the way this AI chatbot acts.'
      },
      {
        id: 'm1_control_3',
        type: 'likert7',
        ko: '3. 이 AI 챗봇은 내가 원하는대로 작동한다.',
        en: '3. This AI chatbot works the way I want it to.'
      },
      {
        id: 'm1_control_4',
        type: 'likert7',
        ko: '4. 나는 이 AI 챗봇에 대해 완전한 통제권을 가지고 있다.',
        en: '4. I have complete control over this AI chatbot.'
      }
    ]
  },
  {
    id: 'm2_self_congruence',
    titleKo: '3-1. 자기일치',
    titleEn: '3-1. Self-Congruence',
    instructionKo: '이 챗봇의 모습과 자기 자신을 견주어 보았을 때 어떠셨나요?',
    instructionEn: 'When comparing this chatbot\'s appearance to yourself, how did you feel?',
    source: 'Sirgy et al. (1997)',
    questions: [
      {
        id: 'm2_self_1',
        type: 'likert7',
        ko: '1. 이 챗봇은 내가 나 자신을 보는 방식과 일치한다.',
        en: '1. This chatbot is consistent with how I see myself.'
      },
      {
        id: 'm2_self_2',
        type: 'likert7',
        ko: '2. 이 챗봇은 내가 어떤 사람인지를 잘 반영한다.',
        en: '2. This chatbot reflects who I am.'
      },
      {
        id: 'm2_self_3',
        type: 'likert7',
        ko: '3. 이 챗봇은 나와 비슷한 성격을 가지고 있다고 느낀다.',
        en: '3. I feel that this chatbot has a personality similar to mine.'
      }
    ]
  },
  {
    id: 'm2_ios',
    titleKo: '3-2. 시각적 도식 (IOS)',
    titleEn: '3-2. Inclusion of Other in the Self (IOS)',
    instructionKo: '아래 그림 중 나와 이 챗봇의 관계를 가장 잘 나타내는 것을 선택해 주세요. (두 원이 전혀 겹치지 않음 ① → 거의 완전히 겹침 ⑦)',
    instructionEn: 'Please select the picture below that best describes your relationship with this chatbot. (No overlap ① → Almost completely overlapping ⑦)',
    source: 'Aron, Aron, & Smollan (1992)',
    questions: [
      {
        id: 'm2_ios_scale',
        type: 'ios',
        ko: '1. 나와 이 챗봇의 관계 도식 선택',
        en: '1. Select the diagram representing your relationship with the chatbot'
      }
    ]
  },
  {
    id: 'dv_advice',
    titleKo: '4-1. 조언 이행 의도',
    titleEn: '4-1. Advice Compliance Intention',
    questions: [
      {
        id: 'dv_advice_1',
        type: 'likert7',
        ko: '1. 나는 이 챗봇에게 제공받은 조언에 따라 행동할 의향이 있다.',
        en: '1. I intend to act in accordance with the advice provided by this chatbot.'
      },
      {
        id: 'dv_advice_2',
        type: 'likert7',
        ko: '2. 나는 이 챗봇에게 제공받은 조언을 따를 계획이 있다.',
        en: '2. I plan to follow the advice provided by this chatbot.'
      },
      {
        id: 'dv_advice_3',
        type: 'likert7',
        ko: '3. 나는 이 챗봇에게 제공받은 조언을 활용할 의향이 있다.',
        en: '3. I am willing to utilize the advice provided by this chatbot.'
      }
    ]
  },
  {
    id: 'dv_emotional_reliance',
    titleKo: '4-2. 정서적 의존',
    titleEn: '4-2. Emotional Reliance',
    questions: [
      {
        id: 'dv_emo_1',
        type: 'likert7',
        ko: '1. 내가 외롭거나 우울할 때, 나는 이 챗봇에게 이야기하고 싶다.',
        en: '1. When I feel lonely or depressed, I want to talk to this chatbot.'
      },
      {
        id: 'dv_emo_2',
        type: 'likert7',
        ko: '2. 내가 어떤 일로 불안하거나 두려울 때, 나는 이 챗봇에게 이야기하고 싶다.',
        en: '2. When I feel anxious or afraid about something, I want to talk to this chatbot.'
      },
      {
        id: 'dv_emo_3',
        type: 'likert7',
        ko: '3. 내가 위로나 격려가 필요할 때, 나는 이 챗봇에게 이야기하고 싶다.',
        en: '3. When I need comfort or encouragement, I want to talk to this chatbot.'
      },
      {
        id: 'dv_emo_4',
        type: 'likert7',
        ko: '4. 내가 기쁘거나 좋은 소식이 있을 때, 나는 이 챗봇에게 이야기하고 싶다.',
        en: '4. When I have good news or feel happy, I want to talk to this chatbot.'
      }
    ]
  },
  {
    id: 'dv_psi',
    titleKo: '4-3. 준사회적 상호작용 경험',
    titleEn: '4-3. Parasocial Interaction Experience',
    questions: [
      {
        id: 'dv_psi_1',
        type: 'likert7',
        ko: '1. 이 챗봇은 나를 인식하고 있는 것 같았다.',
        en: '1. This chatbot seemed to be aware of me.'
      },
      {
        id: 'dv_psi_2',
        type: 'likert7',
        ko: '2. 이 챗봇은 내가 존재한다는 것을 알고 있는 것 같았다.',
        en: '2. This chatbot seemed to know that I exist.'
      },
      {
        id: 'dv_psi_3',
        type: 'likert7',
        ko: '3. 이 챗봇은 내가 이 챗봇을 인식하고 있다는 것을 알고 있는 것 같았다.',
        en: '3. This chatbot seemed to know that I was aware of it.'
      },
      {
        id: 'dv_psi_4',
        type: 'likert7',
        ko: '4. 이 챗봇은 내가 이 챗봇에게 주의를 기울이고 있다는 것을 알고 있는 것 같았다.',
        en: '4. This chatbot seemed to know that I was paying attention to it.'
      },
      {
        id: 'dv_psi_5',
        type: 'likert7',
        ko: '5. 이 챗봇은 내가 이 챗봇에게 반응하고 있다는 것을 알고 있는 것 같았다.',
        en: '5. This chatbot seemed to know that I was reacting to it.'
      },
      {
        id: 'dv_psi_6',
        type: 'likert7',
        ko: '6. 이 챗봇은 내가 말하거나 행동한 것에 반응하는 것 같았다.',
        en: '6. This chatbot seemed to respond to what I said or did.'
      }
    ]
  },
  {
    id: 'dv_cognitive_reliance',
    titleKo: '4-4. 인지적 의존',
    titleEn: '4-4. Cognitive Reliance',
    questions: [
      {
        id: 'dv_cog_1',
        type: 'likert7',
        ko: '1. 앞으로 내가 스스로 먼저 생각해 보지 않고, 이 챗봇에게 바로 답을 물어보는 경우가 많을 것 같다.',
        en: '1. In the future, I feel I will often ask this chatbot for answers right away without thinking for myself first.'
      },
      {
        id: 'dv_cog_2',
        type: 'likert7',
        ko: '2. 이 챗봇을 사용한 이후, 스스로 문제를 분석하고 해결하는 능력이 저하되었다고 느낀다.',
        en: '2. After using this chatbot, I feel my ability to independently analyze and solve problems has diminished.'
      },
      {
        id: 'dv_cog_3',
        type: 'likert7',
        ko: '3. 어려운 문제에 직면하면, 스스로 충분히 생각해 보기보다 이 챗봇에게 의존할 것 같다.',
        en: '3. When facing difficult problems, I feel I will rely on this chatbot rather than thinking through them thoroughly on my own.'
      },
      {
        id: 'dv_cog_4',
        type: 'likert7',
        ko: '4. 이 챗봇을 사용하면서 스스로 생각하려는 노력이 줄었고, 이 챗봇이 대신 생각해 주기를 바라게 되었다.',
        en: '4. While using this chatbot, I made less effort to think for myself and came to expect the chatbot to think for me.'
      },
      {
        id: 'dv_cog_5',
        type: 'likert7',
        ko: '5. 내 판단을 충분히 신뢰하기보다 이 챗봇이 나를 대신해 판단하고 결정하도록 하는 데 익숙해질 것 같다.',
        en: '5. Rather than trusting my own judgment, I feel I will become used to letting this chatbot judge and decide for me.'
      },
      {
        id: 'dv_cog_6',
        type: 'likert7',
        ko: '6. 깊이 있는 사고가 필요한 문제를 이 챗봇에게 맡기게 될 것 같다.',
        en: '6. I feel I will leave problems requiring deep thinking to this chatbot.'
      }
    ]
  },
  {
    id: 'manipulation_check',
    titleKo: '5. 조작 점검',
    titleEn: '5. Manipulation Checks',
    questions: [
      {
        id: 'mc_timing',
        type: 'singleChoice',
        ko: '5-1. 챗봇의 사진은 언제 처음 보셨나요?',
        en: '5-1. When did you first see the chatbot\'s photo?',
        options: [
          { value: '1', ko: '① 대화를 시작하기 전부터 프로필에 있었다', en: '① It was on the profile before the conversation started' },
          { value: '2', ko: '② 대화가 어느 정도 진행된 뒤에 보게 되었다', en: '② I saw it after the conversation had progressed for a while' },
          { value: '3', ko: '③ 기억나지 않는다', en: '③ I do not remember' }
        ]
      },
      {
        id: 'mc_staged_1',
        type: 'likert7',
        ko: '5-2-1. 이 사진은 연출된 사진처럼 보였다.',
        en: '5-2-1. This photo looked staged / artificial.'
      },
      {
        id: 'mc_staged_2',
        type: 'likert7',
        ko: '5-2-2. 이 사진은 자연스럽게 찍힌 사진처럼 보였다.',
        en: '5-2-2. This photo looked naturally taken.'
      },
      {
        id: 'mc_staged_3',
        type: 'likert7',
        ko: '5-2-3. 이 사진은 잘 보이려고 신경 써서 준비한 것처럼 보였다.',
        en: '5-2-3. This photo looked carefully prepared to make a good impression.'
      },
      {
        id: 'mc_attention',
        type: 'likert7',
        isAttentionCheck: true,
        ko: '5-3. 이 문항은 성실한 응답을 확인하기 위한 것입니다. \'전혀 그렇지 않다 (1)\'를 선택해 주세요.',
        en: '5-3. This question is to verify attentive responses. Please select \'Strongly Disagree (1)\'.'
      }
    ]
  },
  {
    id: 'control_variables',
    titleKo: '6. 통제 변수',
    titleEn: '6. Control Variables',
    questions: [
      {
        id: 'ctrl_sim_1',
        type: 'likert7',
        ko: '6-1-1. 이 챗봇의 겉모습은 나의 외모와 닮았다.',
        en: '6-1-1. This chatbot\'s appearance resembles my physical look.'
      },
      {
        id: 'ctrl_sim_2',
        type: 'likert7',
        ko: '6-1-2. 이 챗봇의 스타일은 나의 스타일과 비슷하다.',
        en: '6-1-2. This chatbot\'s style is similar to my personal style.'
      },
      {
        id: 'ctrl_exp_1',
        type: 'likert7',
        ko: '6-2-1. 나는 대화에 몰입했다.',
        en: '6-2-1. I was deeply engaged / immersed in the conversation.'
      },
      {
        id: 'ctrl_exp_2',
        type: 'likert7',
        ko: '6-2-2. 대화에서 나눈 고민은 실제로 내가 겪고 있는 문제였다.',
        en: '6-2-2. The concern discussed in the chat was an actual problem I have experienced.'
      },
      {
        id: 'ctrl_exp_3',
        type: 'likert7',
        ko: '6-2-3. 챗봇의 답변 자체에 만족했다.',
        en: '6-2-3. I was satisfied with the chatbot\'s responses themselves.'
      },
      {
        id: 'ctrl_prior_1',
        type: 'likert7',
        ko: '6-3-1. AI가 만든 이미지는 사용자마다 다르게 나온다는 것을 알고 있었다.',
        en: '6-3-1. I knew that AI-generated images vary across different users.'
      },
      {
        id: 'ctrl_prior_2',
        type: 'yesNo',
        ko: '6-3-2. 이번 실험 전에도 AI에게 “네 모습을 그려줘”라고 요청해 본 적이 있다.',
        en: '6-3-2. Prior to this study, I had asked an AI to \'draw/show your appearance\'.'
      }
    ]
  },
  {
    id: 'traits_and_demographics',
    titleKo: '7. 개인 특성 및 인구통계',
    titleEn: '7. Individual Differences & Demographics',
    source: 'Wang, Rau, & Yuan (2023) / Hughes et al. (2004)',
    questions: [
      {
        id: 'trait_ai_freq',
        type: 'singleChoice',
        ko: '7-1-1. 생성형 AI(ChatGPT, Claude 등)를 얼마나 자주 사용하십니까?',
        en: '7-1-1. How often do you use Generative AI (e.g., ChatGPT, Claude)?',
        options: [
          { value: '1', ko: '① 사용해 본 적 없음', en: '① Never' },
          { value: '2', ko: '② 월 1회 미만', en: '② Less than once a month' },
          { value: '3', ko: '③ 월 2~3회', en: '③ 2-3 times a month' },
          { value: '4', ko: '④ 주 1~2회', en: '④ 1-2 times a week' },
          { value: '5', ko: '⑤ 주 3~4회', en: '⑤ 3-4 times a week' },
          { value: '6', ko: '⑥ 거의 매일', en: '⑥ Almost daily' },
          { value: '7', ko: '⑦ 하루 여러 번', en: '⑦ Multiple times a day' }
        ]
      },
      {
        id: 'trait_ai_emo_share',
        type: 'yesNo',
        ko: '7-1-2. AI에게 개인적인 고민이나 감정을 이야기해 본 적이 있다.',
        en: '7-1-2. I have shared personal worries or feelings with an AI.'
      },
      {
        id: 'trait_lit_1',
        type: 'likert7',
        ko: '7-2-1. 나는 AI 기술이 나에게 어떻게 도움이 될 수 있는지 알고 있다.',
        en: '7-2-1. I know how AI technology can help me.'
      },
      {
        id: 'trait_lit_2',
        type: 'likert7',
        ko: '7-2-2. 나는 AI 기술을 능숙하게 사용하여 일상 업무에 활용할 수 있다.',
        en: '7-2-2. I can use AI technology proficiently in my daily tasks.'
      },
      {
        id: 'trait_lit_3',
        type: 'likert7',
        ko: '7-2-3. 나는 AI 기술을 일정 기간 사용한 후 그 기능과 한계를 평가할 수 있다.',
        en: '7-2-3. After using an AI technology, I can assess its capabilities and limitations.'
      },
      {
        id: 'trait_lit_4',
        type: 'likert7',
        ko: '7-2-4. 나는 AI 기술의 오용 가능성에 항상 주의를 기울인다.',
        en: '7-2-4. I am always mindful of the potential misuse of AI technology.'
      },
      {
        id: 'trait_lone_1',
        type: 'likert7',
        ko: '7-3-1. 나는 함께할 사람이 없다고 느낀다.',
        en: '7-3-1. I feel that I lack companionship.'
      },
      {
        id: 'trait_lone_2',
        type: 'likert7',
        ko: '7-3-2. 나는 소외되어 있다고 느낀다.',
        en: '7-3-2. I feel left out.'
      },
      {
        id: 'trait_lone_3',
        type: 'likert7',
        ko: '7-3-3. 나는 다른 사람들과 단절되어 있다고 느낀다.',
        en: '7-3-3. I feel isolated from others.'
      }
    ]
  }
];

// Helper to get flat list of all questions
export const allSurveyQuestions: SurveyQuestionItem[] = surveySections.flatMap(
  (sec) => sec.questions
);

