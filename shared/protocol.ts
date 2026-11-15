// Wspólne typy komunikatów między przeglądarką a pokojem gry (Durable Object).

export const MAX_PLAYERS = 10;

export type Phase = "lobby" | "stage" | "final" | "finished";

export interface PublicPlayer {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  isHost: boolean;
}

export interface RoomState {
  code: string;
  phase: Phase;
  /** 1–5, 0 w lobby */
  stage: number;
  players: PublicPlayer[];
}

// Klient -> serwer
export type ClientMessage =
  | { type: "join"; playerId: string; name: string }
  | { type: "start" }
  | { type: "kick"; playerId: string };

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
