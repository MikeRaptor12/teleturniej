import { useEffect, useRef, useState } from "react";
import type { ClientMessage, FilmView, PublicPlayer } from "../../shared/protocol";
import { useTick } from "../useRoom";

interface Props {
  view: FilmView;
  players: PublicPlayer[];
  you: string | null;
  send: (msg: ClientMessage) => void;
  serverNow: () => number;
}

const HINT_LABELS = ["Emoji", "Fabuła na opak", "Fakt", "Fakt", "Tytuł"];

export function Film({ view, players, you, send, serverNow }: Props) {
  useTick(100);
  const [text, setText] = useState("");
  // ostatnio wysłana próba – serwer odpowiada tylko licznikiem prób, więc pamiętamy ją lokalnie
  const [lastGuess, setLastGuess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText("");
    setLastGuess(null);
  }, [view.index]);

  const remainingMs = view.endsAt ? Math.max(0, view.endsAt - serverNow()) : 0;
  const progress = view.durationMs ? remainingMs / view.durationMs : 0;

  const solvedPoints = you ? view.solved[you] : undefined;
  const solved = solvedPoints !== undefined;
  const used = you ? (view.attempts[you] ?? 0) : 0;
  const left = view.maxAttempts - used;
  const canGuess = view.step === "hints" && !solved && left > 0;

  // po chybionej próbie wracamy kursorem do pola
  useEffect(() => {
    if (canGuess) inputRef.current?.focus();
  }, [canGuess, used, view.index]);

  if (view.step === "intro") {
    return (
      <div className="quiz-intro">
        <p className="muted">Etap 2</p>
        <h2 className="big">Zgadnij film</h2>
        <p>
          {view.total} filmów · podpowiedzi odsłaniają się co kilka sekund · {view.maxAttempts} próby na film
        </p>
        <p className="muted">Im wcześniej trafisz, tym więcej punktów. Literówki wybaczamy.</p>
        <p className="countdown">{Math.ceil(remainingMs / 1000)}</p>
      </div>
    );
  }

  if (view.step === "summary") {
    return (
      <div className="quiz-intro">
        <h2 className="big">Koniec etapu 2!</h2>
        <p className="muted">Tak wygląda tabela przed etapem 3.</p>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !canGuess) return;
    setLastGuess(t);
    setText("");
    send({ type: "guess", text: t });
  };

  const connected = players.filter((p) => p.connected);
  const solvedCount = Object.keys(view.solved).length;

  return (
    <div className="film">
      <div className="row between muted">
        <span>
          Film {view.index + 1} / {view.total}
        </span>
        <span>
          Trafili: {solvedCount} / {connected.length}
        </span>
      </div>
      <div className="timer">
        <div
          className={`timer-fill ${view.step === "hints" && remainingMs < 3000 ? "hurry" : ""}`}
          style={{ width: `${(view.step === "hints" ? progress : 0) * 100}%` }}
        />
      </div>

      {view.step === "hints" && (
        <p className="center-text muted">
          Podpowiedź {view.hints.length} / {view.hintCount} · trafienie teraz:{" "}
          <strong className="accent">{view.pointsNow} pkt</strong>
          {view.hints.length < view.hintCount && " · następna za " + Math.ceil(remainingMs / 1000) + " s"}
        </p>
      )}

      <ol className="hints">
        {view.hints.map((h, i) => (
          <li key={i} className={i === 0 ? "hint emoji" : "hint"}>
            <span className="hint-label">{HINT_LABELS[i]}</span>
            <span>{h}</span>
          </li>
        ))}
      </ol>

      {view.step === "hints" && (
        <>
          {solved ? (
            <p className="center-text big-ok">✅ Trafione! +{solvedPoints} pkt – czekamy na resztę…</p>
          ) : left > 0 ? (
            <form className="row guess" onSubmit={submit}>
              <input
                ref={inputRef}
                value={text}
                maxLength={80}
                placeholder="Wpisz tytuł filmu…"
                onChange={(e) => setText(e.target.value)}
              />
              <button disabled={!text.trim()}>Zgaduję</button>
            </form>
          ) : (
            <p className="center-text muted">Koniec prób – poczekaj na odsłonięcie.</p>
          )}
          {!solved && used > 0 && lastGuess && (
            <p className="center-text warn">
              ❌ „{lastGuess}” to nie to. {left > 0 ? `Zostały próby: ${left}` : ""}
            </p>
          )}
        </>
      )}

      {view.step === "reveal" && (
        <div className="reveal">
          <p className="center-text">To był film:</p>
          <h2 className="question">🎬 {view.title}</h2>
          <ul className="who">
            {players.map((p) => {
              const pts = view.solved[p.id];
              return (
                <li key={p.id} className={pts !== undefined ? "ok" : "bad"}>
                  {p.name}: {pts !== undefined ? `+${pts}` : "–"}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
