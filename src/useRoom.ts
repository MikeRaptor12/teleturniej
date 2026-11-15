import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, RoomState, ServerMessage } from "../shared/protocol";

function getPlayerId(): string {
  try {
    let id = localStorage.getItem("playerId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("playerId", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Połączenie z pokojem z automatycznym ponownym łączeniem. */
export function useRoom(code: string | null, name: string) {
  const [state, setState] = useState<RoomState | null>(null);
  const [you, setYou] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  /** czekamy w poczekalni na decyzję hosta */
  const [pending, setPending] = useState(false);
  /** pokój zamknął połączenie na stałe (odrzucenie, wyrzucenie, brak pokoju) */
  const [closedReason, setClosedReason] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  /** różnica: zegar serwera − zegar lokalny (ms) */
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!code) return;
    let closed = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${proto}://${location.host}/api/rooms/${code}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        setConnected(true);
        ws.send(JSON.stringify({ type: "join", playerId: getPlayerId(), name }));
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data) as ServerMessage;
        if (msg.type === "welcome" || msg.type === "state") {
          offsetRef.current = msg.state.serverNow - Date.now();
        }
        if (msg.type === "pending") {
          setPending(true);
        } else if (msg.type === "welcome") {
          setPending(false);
          setYou(msg.you);
          setState(msg.state);
          setError(null);
        } else if (msg.type === "state") {
          setState(msg.state);
        } else if (msg.type === "error") {
          setError(msg.message);
        }
      };
      ws.onclose = (e) => {
        setConnected(false);
        if (closed) return;
        // 4001 wyrzucony, 4003 nie wpuszczony, 4004 brak pokoju, 4401 brak hasła
        if (e.code === 4001 || e.code === 4003 || e.code === 4004 || e.code === 4401) {
          setClosedReason(e.reason || "Rozłączono");
          setPending(false);
          return;
        }
        timer = setTimeout(connect, Math.min(1000 * 2 ** retry++, 8000));
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      wsRef.current?.close();
    };
  }, [code, name]);

  const send = useCallback((msg: ClientMessage) => {
    wsRef.current?.send(JSON.stringify(msg));
  }, []);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  return { state, you, error, connected, pending, closedReason, send, serverNow };
}

/** Przerysowuje komponent co `ms`, np. dla odliczania czasu. */
export function useTick(ms = 100) {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
