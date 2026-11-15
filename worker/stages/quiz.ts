// Etap 1 – Szybki strzał. Czysta logika, bez WebSocketów: łatwo ją testować.
import type { QuizView } from "../../shared/protocol";
import { QUIZ_QUESTIONS } from "../content/quiz";

export const QUIZ = {
  questions: 10,
  introMs: 4000,
  questionMs: 15000,
  revealMs: 6000,
  basePoints: 100,
  speedBonus: 100,
};

export interface QuizState {
  kind: "quiz";
  order: number[];
  index: number;
  step: QuizView["step"];
  startedAt: number;
  endsAt: number | null;
  answers: Record<string, { choice: number; at: number }>;
  results: Record<string, { choice: number | null; points: number }> | null;
}

interface ScoredPlayer {
  id: string;
  score: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function quizStart(now: number): QuizState {
  const order = shuffle(QUIZ_QUESTIONS.map((_, i) => i)).slice(0, QUIZ.questions);
  return {
    kind: "quiz",
    order,
    index: 0,
    step: "intro",
    startedAt: now,
    endsAt: now + QUIZ.introMs,
    answers: {},
    results: null,
  };
}

/** Zapisuje odpowiedź. Zwraca false, jeśli odpowiedź jest niedozwolona. */
export function quizAnswer(s: QuizState, playerId: string, choice: number, now: number): boolean {
  if (s.step !== "question" || s.endsAt === null || now > s.endsAt) return false;
  if (playerId in s.answers) return false;
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) return false;
  s.answers[playerId] = { choice, at: now };
  return true;
}

export function quizEveryoneAnswered(s: QuizState, activeIds: string[]): boolean {
  return s.step === "question" && activeIds.length > 0 && activeIds.every((id) => id in s.answers);
}

function beginQuestion(s: QuizState, now: number) {
  s.step = "question";
  s.startedAt = now;
  s.endsAt = now + QUIZ.questionMs;
  s.answers = {};
  s.results = null;
}

function reveal(s: QuizState, players: ScoredPlayer[], now: number) {
  const question = QUIZ_QUESTIONS[s.order[s.index]];
  const results: NonNullable<QuizState["results"]> = {};
  for (const p of players) {
    const a = s.answers[p.id];
    let points = 0;
    if (a && a.choice === question.correct) {
      const remaining = Math.max(0, s.startedAt + QUIZ.questionMs - a.at);
      points = QUIZ.basePoints + Math.round((QUIZ.speedBonus * remaining) / QUIZ.questionMs);
    }
    p.score += points;
    results[p.id] = { choice: a ? a.choice : null, points };
  }
  s.results = results;
  s.step = "reveal";
  s.endsAt = now + QUIZ.revealMs;
}

/** Przejście do następnego kroku (wywoływane przez alarm lub gdy wszyscy odpowiedzieli). */
export function quizAdvance(s: QuizState, players: ScoredPlayer[], now: number) {
  switch (s.step) {
    case "intro":
      beginQuestion(s, now);
      break;
    case "question":
      reveal(s, players, now);
      break;
    case "reveal":
      if (s.index + 1 < s.order.length) {
        s.index++;
        beginQuestion(s, now);
      } else {
        s.step = "summary";
        s.endsAt = null;
        s.results = null;
      }
      break;
    case "summary":
      break;
  }
}

export function quizView(s: QuizState): QuizView {
  const question = QUIZ_QUESTIONS[s.order[s.index]];
  const showQuestion = s.step === "question" || s.step === "reveal";
  return {
    kind: "quiz",
    step: s.step,
    index: s.index,
    total: s.order.length,
    endsAt: s.endsAt,
    durationMs:
      s.step === "intro" ? QUIZ.introMs : s.step === "question" ? QUIZ.questionMs : s.step === "reveal" ? QUIZ.revealMs : null,
    question: showQuestion ? question.q : null,
    options: showQuestion ? [...question.options] : null,
    answered: Object.keys(s.answers),
    // poprawna odpowiedź trafia do klientów dopiero po odsłonięciu
    correct: s.step === "reveal" ? question.correct : null,
    results: s.step === "reveal" ? s.results : null,
  };
}
