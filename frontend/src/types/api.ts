// Shared DTO types matching the backend API contract exactly.

export type EventStatus = "DRAFT" | "LIVE" | "ENDED";
export type SessionStatus = "SCHEDULED" | "LIVE" | "ENDED";
export type StageMode = "IDLE" | "QUESTION" | "POLL" | "GAME" | "BREAK";
export type QuestionStatus = "PENDING" | "APPROVED" | "ON_SCREEN" | "REJECTED";
export type PollStatus = "DRAFT" | "ACTIVE" | "CLOSED";
export type SurveyStatus = "DRAFT" | "ACTIVE" | "CLOSED";
export type SurveyQuestionType = "RATING" | "TEXT" | "SINGLE_CHOICE" | "DROPDOWN";
export type GameStatus = "DRAFT" | "ACTIVE" | "CLOSED";
export type CampaignStatus = "DRAFT" | "SENT";
export type AttendeeTag = "ATTENDEE" | "VIP" | "SPEAKER" | "SPONSOR" | "WAITLIST";
export type PresentationStatus = "DRAFT" | "ACTIVE" | "CLOSED";

export interface PresentationDto {
  id: string;
  sessionId: string;
  title: string;
  originalFilename: string;
  slideCount: number;
  currentSlide: number;
  status: PresentationStatus;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SessionDto {
  id: string;
  eventId: string;
  title: string;
  speakerName: string;
  hallName: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  stageMode: StageMode;
}

export interface EventDto {
  id: string;
  name: string;
  description: string;
  joinCode: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  sessions: SessionDto[];
}

export interface QuestionDto {
  id: string;
  sessionId: string;
  authorName: string | null;
  body: string;
  status: QuestionStatus;
  createdAt: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PollDto {
  id: string;
  sessionId: string;
  prompt: string;
  status: PollStatus;
  options: PollOption[];
}

export interface SurveyQuestionDto {
  id: string;
  prompt: string;
  type: SurveyQuestionType;
  options: string[];
}

export interface SurveyDto {
  id: string;
  sessionId: string;
  title: string;
  status: SurveyStatus;
  questions: SurveyQuestionDto[];
}

export interface SurveyResultAggregateCount {
  option: string;
  count: number;
}

export interface SurveyResultQuestion {
  questionId: string;
  prompt: string;
  type: SurveyQuestionType;
  aggregate: SurveyResultAggregateCount[] | string[];
}

export interface SurveyResults {
  surveyId: string;
  title: string;
  responseCount: number;
  questions: SurveyResultQuestion[];
}

export interface GameOptionDto {
  id: string;
  label: string;
  answerCount: number;
  correct: boolean;
}

export interface GameQuestionDto {
  id: string;
  sessionId: string;
  prompt: string;
  status: GameStatus;
  points: number;
  options: GameOptionDto[];
}

export interface LeaderboardEntryDto {
  playerId: string;
  playerName: string;
  totalPoints: number;
  correctAnswers: number;
  totalAnswers: number;
}

export interface SessionLeaderboardDto {
  sessionId: string;
  entries: LeaderboardEntryDto[];
}

export interface EmailCampaignDto {
  id: string;
  eventId: string;
  subject: string;
  body: string;
  status: CampaignStatus;
  targetTags: AttendeeTag[];
  recipientCount: number | null;
  sentAt: string | null;
  createdAt: string;
}

export interface AudienceSizeDto {
  audienceSize: number;
}

export interface AttendeeDto {
  id: string;
  email: string;
  tag: AttendeeTag;
  createdAt: string;
}

export interface CampaignAnalyticsDto {
  totalRecipients: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface JoinEventResponse {
  event: {
    id: string;
    name: string;
    description: string;
  };
  sessions: SessionDto[];
}

export interface StageState {
  stageMode: StageMode;
  question: QuestionDto | null;
  poll: PollDto | null;
  leaderboard: SessionLeaderboardDto | null;
}

export interface WsFrame<T = unknown> {
  type: string;
  payload: T;
}
