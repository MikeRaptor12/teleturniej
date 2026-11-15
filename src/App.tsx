import { useState } from "react";
import { STAGES } from "../shared/protocol";
import { useRoom } from "./useRoom";
import { Quiz } from "./stages/Quiz";
import { Film } from "./stages/Film";

export default function App() {
  const [session, setSession] = useState<{ code: string; name: string } | null>(() => {
    const code = new URLSearchParams(location.search).get("room");
    const name = sessionStorage.getItem("name");
    return code && name ? { code, name } : null;
  });

  if (!session) {
    return (
      <Home
        onEnter={(code, name) => {
          sessionStorage.setItem("name", name);
          history.replaceState(null, "", `?room=${code}`);
          setSession({ code, name });
        }}
      />
    );
  }
  return <Room code={session.code} name={session.name} />;
}

function Home({ onEnter }: { onEnter: (code: string, name: string) => void }) {
  const [name, setName] = useState(sessionStorage.getItem("name") ?? "");
  const [code, setCode] = useState(new URLSearchParams(location.search).get("room") ?? "");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      const { code } = (await res.json()) as { code: string };
      onEnter(code, name.trim());
    } finally {
      setBusy(false);
    }
  };

  const validName = name.trim().length > 0;
  const validCode = /^[A-Z]{4}$/.test(code);

  return (
    <main className="card center">
      <h1>🎤 Teleturniej</h1>
      <label>
        Twój nick
        <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <button disabled={!validName || busy} onClick={create}>
        Załóż nowy pokój
      </button>
      <div className="divider">albo dołącz</div>
      <div className="row">
        <input
          placeholder="KOD"
          value={code}
          maxLength={4}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
        />
        <button disabled={!validName || !validCode} onClick={() => onEnter(code, name.trim())}>
          Dołącz
        </button>
      </div>
    </main>
  );
}

function Room({ code, name }: { code: string; name: string }) {
  const { state, you, error, connected, send, serverNow } = useRoom(code, name);

  if (!state) {
    return <main className="card center">{error ?? "Łączenie z pokojem…"}</main>;
  }

  const me = state.players.find((p) => p.id === you);
  const link = `${location.origin}/?room=${code}`;

  if (state.phase === "lobby") {
    return (
      <main className="card">
        <header className="row between">
          <h1>Pokój {state.code}</h1>
          <button className="secondary" onClick={() => navigator.clipboard.writeText(link)}>
            Kopiuj link
          </button>
        </header>
        {!connected && <p className="warn">Ponowne łączenie…</p>}
        {error && <p className="warn">{error}</p>}
        <h2>Gracze ({state.players.length})</h2>
        <ul className="players">
          {state.players.map((p) => (
            <li key={p.id} className={p.connected ? "" : "offline"}>
              {p.isHost && "👑 "}
              {p.name}
              {p.id === you && " (ty)"}
              {me?.isHost && !p.isHost && (
                <button className="link" onClick={() => send({ type: "kick", playerId: p.id })}>
                  wyrzuć
                </button>
              )}
            </li>
          ))}
        </ul>
        <h2>Etapy</h2>
        <ol>
          {STAGES.map((s) => (
            <li key={s.id}>{s.name}</li>
          ))}
        </ol>
        {me?.isHost ? (
          <button disabled={state.players.length < 2} onClick={() => send({ type: "start" })}>
            Start gry
          </button>
        ) : (
          <p>Czekamy, aż host wystartuje grę…</p>
        )}
      </main>
    );
  }

  if (state.phase === "finished") {
    const podium = [...state.players].sort((a, b) => b.score - a.score);
    return (
      <main className="card">
        <h1>🏆 Koniec gry!</h1>
        <p className="big center-text">Wygrywa {podium[0]?.name}!</p>
        <Scoreboard players={state.players} you={you} />
        {me?.isHost && (
          <button className="spaced" onClick={() => send({ type: "next" })}>
            Zagraj jeszcze raz
          </button>
        )}
      </main>
    );
  }

  const stage = STAGES.find((s) => s.id === state.stage);
  const round = state.round;
  const canGoNext = round?.kind === "placeholder" || (round != null && round.step === "summary");
  const isLast = state.stage >= STAGES.length;

  return (
    <main className="card wide">
      <header className="row between">
        <h1>
          Etap {state.stage}: {stage?.name}
        </h1>
        <span className="muted">Pokój {state.code}</span>
      </header>
      {!connected && <p className="warn">Ponowne łączenie…</p>}

      {round?.kind === "quiz" && (
        <Quiz view={round} players={state.players} you={you} send={send} serverNow={serverNow} />
      )}
      {round?.kind === "film" && (
        <Film view={round} players={state.players} you={you} send={send} serverNow={serverNow} />
      )}
      {round?.kind === "placeholder" && <p className="muted">Ten etap jest jeszcze w budowie 🚧</p>}

      <Scoreboard players={state.players} you={you} />

      {canGoNext &&
        (me?.isHost ? (
          <button className="spaced" onClick={() => send({ type: "next" })}>
            {isLast ? "Zakończ grę" : `Dalej: etap ${state.stage + 1}`}
          </button>
        ) : (
          <p className="muted">Czekamy na hosta…</p>
        ))}
    </main>
  );
}

function Scoreboard({ players, you }: { players: { id: string; name: string; score: number }[]; you: string | null }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <table className="scores">
      <tbody>
        {sorted.map((p, i) => (
          <tr key={p.id} className={p.id === you ? "me" : ""}>
            <td>{i + 1}.</td>
            <td>{p.name}</td>
            <td>{p.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
