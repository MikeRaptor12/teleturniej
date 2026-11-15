// Etap 2 – Zgadnij film. Czysta logika, bez WebSocketów.
// Podpowiedzi odsłaniają się co kilka sekund; im wcześniej ktoś trafi, tym więcej punktów.
import type { FilmView } from "../../shared/protocol";
import { FILMS, type Film } from "../content/films";
import { matches } from "./fuzzy";
import { shuffle } from "./util";

export const FILM = {
  films: 6,
  introMs: 5000,
  hintMs: 9000,
  revealMs: 7000,
  /** punkty za trafienie przy 1., 2., … podpowiedzi */
  points: [500, 400, 300, 200, 100],
  maxAttempts: 3,
  maxGuessLength: 80,
};

export interface FilmState {
  kind: "film";
  order: number[];
  index: number;
  step: FilmView["step"];
  /** ile podpowiedzi jest odsłoniętych (1–5) */
  shown: number;
  endsAt: number | null;
  /** gracze, którzy trafili: id -> punkty */
  solved: Record<string, number>;
  /** liczba prób (trafionych i chybionych) */
  attempts: Record<string, number>;
}

interface ScoredPlayer {
  id: string;
  score: number;
}

/** Ostatnia podpowiedź: tytuł z odsłoniętą pierwszą literą każdego słowa. */
export function titleMask(title: string): string {
  return title
    .split(" ")
    .map((word) =>
      [...word]
        .map((ch, i) => (i === 0 || !/[\p{L}\p{N}]/u.test(ch) ? ch : "_"))
        .join(" "),
    )
    .join("   ");
}

function hintsFor(film: Film): string[] {
  return [...film.hints, `Tytuł: ${titleMask(film.title)}`];
}

const HINT_COUNT = 5;

export function filmStart(now: number): FilmState {
  return {
    kind: "film",
    order: shuffle(FILMS.map((_, i) => i)).slice(0, FILM.films),
    index: 0,
    step: "intro",
    shown: 0,
    endsAt: now + FILM.introMs,
    solved: {},
    attempts: {},
  };
}

function current(s: FilmState): Film {
  return FILMS[s.order[s.index]];
}

/**
 * Próba odgadnięcia tytułu. Zwraca true, jeśli stan się zmienił.
 * Punkty dopisuje od razu – i tak są widoczne dopiero jako wynik w tabeli.
 */
export function filmGuess(s: FilmState, player: ScoredPlayer | undefined, text: unknown, now: number): boolean {
  if (!player || s.step !== "hints" || s.endsAt === null || now > s.endsAt) return false;
  if (player.id in s.solved) return false;
  const used = s.attempts[player.id] ?? 0;
  if (used >= FILM.maxAttempts) return false;
  const guess = String(text ?? "").slice(0, FILM.maxGuessLength);
  if (!guess.trim()) return false;

  s.attempts[player.id] = used + 1;
  if (matches(guess, current(s).accept)) {
    const points = FILM.points[s.shown - 1] ?? 0;
    s.solved[player.id] = points;
    player.score += points;
  }
  return true;
}

/** Każdy połączony gracz już trafił albo wykorzystał wszystkie próby. */
export function filmEveryoneDone(s: FilmState, activeIds: string[]): boolean {
  return (
    s.step === "hints" &&
    activeIds.length > 0 &&
    activeIds.every((id) => id in s.solved || (s.attempts[id] ?? 0) >= FILM.maxAttempts)
  );
}

function beginFilm(s: FilmState, now: number) {
  s.step = "hints";
  s.shown = 1;
  s.endsAt = now + FILM.hintMs;
  s.solved = {};
  s.attempts = {};
}

function reveal(s: FilmState, now: number) {
  s.step = "reveal";
  s.endsAt = now + FILM.revealMs;
}

/** Przejście dalej (alarm albo wszyscy skończyli). */
export function filmAdvance(s: FilmState, now: number, early = false) {
  switch (s.step) {
    case "intro":
      beginFilm(s, now);
      break;
    case "hints":
      if (!early && s.shown < HINT_COUNT) {
        s.shown++;
        s.endsAt = now + FILM.hintMs;
      } else {
        reveal(s, now);
      }
      break;
    case "reveal":
      if (s.index + 1 < s.order.length) {
        s.index++;
        beginFilm(s, now);
      } else {
        s.step = "summary";
        s.endsAt = null;
      }
      break;
    case "summary":
      break;
  }
}

export function filmView(s: FilmState): FilmView {
  const film = current(s);
  const playing = s.step === "hints" || s.step === "reveal";
  return {
    kind: "film",
    step: s.step,
    index: s.index,
    total: s.order.length,
    endsAt: s.endsAt,
    durationMs:
      s.step === "intro" ? FILM.introMs : s.step === "hints" ? FILM.hintMs : s.step === "reveal" ? FILM.revealMs : null,
    // tylko odsłonięte podpowiedzi; w kroku "reveal" wszystkie
    hints: playing ? hintsFor(film).slice(0, s.step === "reveal" ? HINT_COUNT : s.shown) : [],
    hintCount: HINT_COUNT,
    pointsNow: s.step === "hints" ? (FILM.points[s.shown - 1] ?? 0) : null,
    solved: playing ? s.solved : {},
    attempts: playing ? s.attempts : {},
    maxAttempts: FILM.maxAttempts,
    // tytuł trafia do klientów dopiero po odsłonięciu
    title: s.step === "reveal" ? film.title : null,
  };
}
