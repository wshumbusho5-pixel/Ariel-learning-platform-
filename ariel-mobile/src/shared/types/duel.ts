export enum DuelStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export interface DuelPlayer {
  id: string;
  username: string;
  score: number;
}

export interface DuelResult {
  room_id: string;
  p1_id: string;
  p1_username: string;
  p2_id: string;
  p2_username: string;
  p1_score: number;
  p2_score: number;
  winner_id: string | null;
  result: 'win' | 'lose' | 'tie';
}

export interface DuelRoom {
  room_id: string;
  status: DuelStatus;
  p1_username: string;
  p2_username: string | null;
  p1_score: number;
  p2_score: number;
}

export interface DuelCard {
  id: string;
  question: string;
  subject: string;
  choices: string[];
}

// WebSocket message types for duels
export type DuelWsMessageType =
  | 'connected'
  | 'waiting'
  | 'player_joined'
  | 'game_start'
  | 'round_start'
  | 'answer_submitted'
  | 'round_result'
  | 'game_over'
  | 'opponent_answered'
  | 'opponent_disconnected'
  | 'error';

export interface DuelWsConnected {
  type: 'connected';
  room_id: string;
  your_username: string;
  opponent_username: string | null;
}

export interface DuelWsWaiting {
  type: 'waiting';
  message: string;
}

export interface DuelWsPlayerJoined {
  type: 'player_joined';
  opponent_username: string;
}

export interface DuelWsGameStart {
  type: 'game_start';
  countdown: number;
}

export interface DuelWsRoundStart {
  type: 'round_start';
  round: number;
  total: number;
  question: string;
  subject: string;
  choices: string[];
}

export interface DuelWsRoundResult {
  type: 'round_result';
  round: number;
  correct_answer: string;
  you_correct: boolean;
  opponent_correct: boolean;
  you_score: number;
  opponent_score: number;
  result: 'win' | 'lose' | 'tie';
}

export interface DuelWsGameOver {
  type: 'game_over';
  you_score: number;
  opponent_score: number;
  result: 'win' | 'lose' | 'tie';
}

export interface DuelWsOpponentAnswered {
  type: 'opponent_answered';
}

export interface DuelWsOpponentDisconnected {
  type: 'opponent_disconnected';
}

export interface DuelWsAnswerSubmitted {
  type: 'answer_submitted';
  message?: string;
}

export interface DuelWsError {
  type: 'error';
  message: string;
}

export type DuelWsMessage =
  | DuelWsConnected
  | DuelWsWaiting
  | DuelWsPlayerJoined
  | DuelWsGameStart
  | DuelWsRoundStart
  | DuelWsAnswerSubmitted
  | DuelWsRoundResult
  | DuelWsGameOver
  | DuelWsOpponentAnswered
  | DuelWsOpponentDisconnected
  | DuelWsError;

// Messages sent to server
export interface DuelWsSubmitAnswer {
  type: 'submit_answer';
  answer: string;
}

export interface DuelWsPing {
  type: 'ping';
}

export type DuelWsClientMessage = DuelWsSubmitAnswer | DuelWsPing;
