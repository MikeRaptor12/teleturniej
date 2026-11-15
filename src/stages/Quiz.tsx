import { useEffect, useState } from "react";
import type { ClientMessage, PublicPlayer, QuizView } from "../../shared/protocol";
import { useTick } from "../useRoom";

const LETTERS = ["A", "B", "C", "D"];

interface Props {
  view: QuizView;
  players: PublicPlayer[];
  you: string | null;
  send: (msg: ClientMessage) => void;
  serverNow: () => number;
}

export function Quiz({ view, players, you, send, serverNow }: Props) {
  useTick(100);
  // własną odpowiedź pamiętamy lokalnie – serwer jej nie ujawnia przed odsłonięciem
  const [myChoice, setMyChoice] = useState<number | null>(null);
  useEffect(() => setMyChoice(null), [view.index]);

  const remainingMs = view.endsAt ? Math.max(0, view.endsAt - serverNow()) : 0;
  const progress = view.durationMs ? remainingMs / view.durationMs : 0;
  const answered = you ? view.answered.includes(you) : false;

  if (view.step === "intro") {
    return (
      <div className="quiz-intro">
        <p className="muted">Etap 1</p>
        <h2 className="big">Szybki strzał</h2>
        <p>{view.total} pytań · 15 sekund na każde · im szybciej, tym więcej punktów</p>
        <p className="countdown">{Math.ceil(remainingMs / 1000)}</p>
      </div>
    );
  }

  if (view.step === "summary") {
    return (
      <div className="quiz-intro">
        <h2 className="big">Koniec etapu 1!</h2>
        <p className="muted">Tak wygląda tabela przed etapem 2.</p>
      </div>
    );
  }

  const myResult = you && view.results ? view.results[you] : null;

  return (
    <div className="quiz">
      <div className="row between muted">
        <span>
          Pytanie {view.index + 1} / {view.total}
        </span>
        <span>
          Odpowiedzieli: {view.answered.length} / {players.filter((p) => p.connected).length}
        </span>
      </div>
      <div className="timer">
        <div
          className={`timer-fill ${view.step === "question" && remainingMs < 5000 ? "hurry" : ""}`}
          style={{ width: `${(view.step === "question" ? progress : 0) * 100}%` }}
        />
      </div>

      <h2 className="question">{view.question}</h2>

      <div className="answers">
        {view.options?.map((opt, i) => {
          const isCorrect = view.correct === i;
          const isMine = (myResult?.choice ?? myChoice) === i;
          const cls = [
            "answer",
            `a${i}`,
            isMine ? "mine" : "",
            view.step === "reveal" ? (isCorrect ? "correct" : "wrong") : "",
          ].join(" ");
          return (
            <button
              key={i}
              className={cls}
              disabled={view.step !== "question" || answered || myChoice !== null}
              onClick={() => {
                setMyChoice(i);
                send({ type: "answer", choice: i });
              }}
            >
              <span className="letter">{LETTERS[i]}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {view.step === "question" && (answered || myChoice !== null) && (
        <p className="muted center-text">Odpowiedź wysłana – czekamy na resztę…</p>
      )}

      {view.step === "reveal" && view.results && (
        <div className="reveal">
          <p className="center-text">
            {myResult && myResult.points > 0
              ? `✅ Dobrze! +${myResult.points} pkt`
              : myResult?.choice === null
                ? "⏰ Brak odpowiedzi"
                : "❌ Niestety źle"}
          </p>
          <ul className="who">
            {players.map((p) => {
              const r = view.results![p.id];
              return (
                <li key={p.id} className={r && r.points > 0 ? "ok" : "bad"}>
                  {p.name}: {r?.choice != null ? LETTERS[r.choice] : "–"}
                  {r && r.points > 0 && ` (+${r.points})`}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
