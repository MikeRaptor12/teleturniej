// Wspólne typy komunikatów między przeglądarką a pokojem gry (Durable Object).

export const MAX_PLAYERS = 10;

export type Phase = "lobby" | "playing" | "finished";

export interface PublicPlayer {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  isHost: boolean;
}

/** Widok etapu 1 – Szybki strzał (ABCD). */
export interface QuizView {
  kind: "quiz";
  step: "intro" | "question" | "reveal" | "summary";
  /** numer pytania od 0 */
  index: number;
  total: number;
  /** czas serwera (ms), kiedy kończy się bieżący krok */
  endsAt: number | null;
  durationMs: number | null;
  question: string | null;
  options: string[] | null;
  /** id graczy, którzy już odpowiedzieli (bez zdradzania odpowiedzi) */
  answered: string[];
  /** poprawna odpowiedź – tylko w kroku "reveal" */
  correct: number | null;
  /** wyniki pytania – tylko w kroku "reveal" */
  results: Record<string, { choice: number | null; points: number }> | null;
}

/** Etap jeszcze niezaimplementowany. */
export interface PlaceholderView {
  kind: "placeholder";
}

export type RoundView = QuizView | PlaceholderView;

export interface RoomState {
  code: string;
  phase: Phase;
  /** 1–5, 0 w lobby */
  stage: number;
  players: PublicPlayer[];
  round: RoundView | null;
  /** czas serwera w chwili wysłania – do synchronizacji zegara */
  serverNow: number;
}

// Klient -> serwer
export type ClientMessage =
  | { type: "join"; playerId: string; name: string }
  | { type: "start" }
  | { type: "kick"; playerId: string }
  | { type: "answer"; choice: number }
  /** host: przejście dalej (po podsumowaniu etapu / na końcu gry) */
  | { type: "next" };

// Serwer -> klient
export type ServerMessage =
  | { type: "welcome"; you: string; state: RoomState }
  | { type: "state"; state: RoomState }
  | { type: "error"; message: string };

export const STAGES = [
  { id: 1, name: "Szybki strzał" },
  { id: 2, name: "Zgadnij film" },
  { id: 3, name: "Kłamczuch" },
  { id: 4, name: "Gdzie to jest? / Bliżej = lepiej" },
  { id: 5, name: "Wielki Finał" },
] as const;
