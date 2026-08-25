export type Language = 'ko' | 'en';
export type ImageType = 'A' | 'B';
export type ExperimentGroup = ImageType;
export type DisclosureTiming = 'pre' | 'mid';
export type ExperimentCondition = 'A_pre' | 'A_mid' | 'B_pre' | 'B_mid';
export type Step = 'instructions' | 'chat' | 'survey' | 'complete';

export interface ParticipantInfo {
  id: string;
  imageType: ImageType;
  timing: DisclosureTiming;
  condition: ExperimentCondition;
  // Legacy compatibility
  group: ImageType;
  gender: string;
  birthYear: string;
  occupation: string;
  consentedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  imageUrl?: string;
}

export interface SurveyResponse {
  [questionId: string]: number | string;
}

export interface ExperimentData {
  participant: ParticipantInfo;
  language: Language;
  totalChatSeconds: number;
  chatMessages: ChatMessage[];
  surveyResponses: SurveyResponse;
  startedAt: string;
  submittedAt?: string;
}
