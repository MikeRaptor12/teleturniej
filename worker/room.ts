import { DurableObject } from "cloudflare:workers";
import type { Env } from "./index";
import {
  MAX_PLAYERS,
  STAGES,
  type ClientMessage,
  type PublicPlayer,
  type RoomState,
  type RoundView,
  type ServerMessage,
} from "../shared/protocol";
import {
  quizAdvance,
  quizAnswer,
  quizEveryoneAnswered,
  quizStart,
  quizView,
  type QuizState,
} from "./stages/quiz";
import { filmAdvance, filmEveryoneDone, filmGuess, filmStart, filmView, type FilmState } from "./stages/film";

interface StoredPlayer {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
}

type RoundState = QuizState | FilmState | { kind: "placeholder" };

interface Stored {
  code: string;
  phase: RoomState["phase"];
  stage: number;
  hostId: string | null;
  players: StoredPlayer[];
  round: RoundState | null;
}

interface Attachment {
  playerId: string | null;
}

/**
 * Jeden pokój gry. Serwer jest jedynym źródłem prawdy:
 * liczy punkty, pilnuje czasu (alarmy) i nie wysyła poprawnych odpowiedzi przed odsłonięciem.
 * Używa WebSocket Hibernation API, żeby bezczynny pokój nic nie kosztował.
 */
export class GameRoom extends DurableObject<Env> {
  private data: Stored | null = null;

  private async load(code = ""): Promise<Stored> {
    if (!this.data) {
      const stored = await this.ctx.storage.get<Stored>("room");
      this.data = stored
        ? { ...stored, round: stored.round ?? null }
        : { code, phase: "lobby", stage: 0, hostId: null, players: [], round: null };
    }
    if (!this.data.code && code) this.data.code = code;
    return this.data;
  }

  private async save() {
    if (this.data) await this.ctx.storage.put("room", this.data);
  }

  async fetch(request: Request): Promise<Response> {
    const code = new URL(request.url).pathname.split("/")[3];
    await this.load(code);

    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ playerId: null } satisfies Attachment);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const room = await this.load();
    let msg: ClientMessage;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return this.send(ws, { type: "error", message: "Niepoprawny komunikat" });
    }

    const att = ws.deserializeAttachment() as Attachment;
    const isHost = att.playerId !== null && att.playerId === room.hostId;
    const now = Date.now();

    switch (msg.type) {
      case "join": {
        const name = String(msg.name ?? "").trim().slice(0, 20);
        const playerId = String(msg.playerId ?? "").slice(0, 64);
        if (!name || !playerId) {
          return this.send(ws, { type: "error", message: "Podaj nick" });
        }
        let player = room.players.find((p) => p.id === playerId);
        if (!player) {
          if (room.phase !== "lobby") {
            return this.send(ws, { type: "error", message: "Gra już trwa" });
          }
          if (room.players.length >= MAX_PLAYERS) {
            return this.send(ws, { type: "error", message: "Pokój jest pełny" });
          }
          player = { id: playerId, name, score: 0, joinedAt: now };
          room.players.push(player);
        } else {
          player.name = name; // powrót po rozłączeniu
        }
        room.hostId ??= playerId;
        ws.serializeAttachment({ playerId } satisfies Attachment);
        await this.save();
        this.send(ws, { type: "welcome", you: playerId, state: this.publicState() });
        return this.broadcast();
      }

      case "start": {
        if (!isHost) return this.send(ws, { type: "error", message: "Tylko host może zacząć" });
        if (room.phase !== "lobby") return;
        if (room.players.length < 2) {
          return this.send(ws, { type: "error", message: "Potrzeba co najmniej 2 graczy" });
        }
        for (const p of room.players) p.score = 0;
        room.phase = "playing";
        this.startStage(1, now);
        await this.persistAndSchedule();
        return this.broadcast();
      }

      case "answer": {
        const round = room.round;
        if (!att.playerId || room.phase !== "playing" || round?.kind !== "quiz") return;
        if (!quizAnswer(round, att.playerId, msg.choice, now)) return;
        // wszyscy połączeni odpowiedzieli -> nie czekamy do końca czasu
        if (quizEveryoneAnswered(round, this.connectedPlayerIds())) {
          quizAdvance(round, room.players, now);
        }
        await this.persistAndSchedule();
        return this.broadcast();
      }

      case "guess": {
        const round = room.round;
        if (!att.playerId || room.phase !== "playing" || round?.kind !== "film") return;
        const player = room.players.find((p) => p.id === att.playerId);
        if (!filmGuess(round, player, msg.text, now)) return;
        // wszyscy trafili albo wyczerpali próby -> od razu odsłonięcie
        if (filmEveryoneDone(round, this.connectedPlayerIds())) {
          filmAdvance(round, now, true);
        }
        await this.persistAndSchedule();
        return this.broadcast();
      }

      case "next": {
        if (!isHost) return;
        if (room.phase === "finished") {
          // nowa gra w tym samym pokoju
          room.phase = "lobby";
          room.stage = 0;
          room.round = null;
          for (const p of room.players) p.score = 0;
        } else if (room.phase === "playing" && this.stageFinished()) {
          if (room.stage >= STAGES.length) {
            room.phase = "finished";
            room.round = null;
          } else {
            this.startStage(room.stage + 1, now);
          }
        } else {
          return;
        }
        await this.persistAndSchedule();
        return this.broadcast();
      }

      case "kick": {
        if (!isHost || msg.playerId === room.hostId) return;
        room.players = room.players.filter((p) => p.id !== msg.playerId);
        for (const s of this.ctx.getWebSockets()) {
          const a = s.deserializeAttachment() as Attachment;
          if (a.playerId === msg.playerId) s.close(4001, "Wyrzucony z pokoju");
        }
        await this.save();
        return this.broadcast();
      }
    }
  }

  /** Alarm = koniec czasu bieżącego kroku etapu. */
  async alarm() {
    const room = await this.load();
    const round = room.round;
    const endsAt = roundEndsAt(round);
    if (room.phase !== "playing" || !round || endsAt === null) return;
    const now = Date.now();
    if (now + 50 < endsAt) {
      // alarm przyszedł za wcześnie – przestaw
      await this.ctx.storage.setAlarm(endsAt);
      return;
    }
    if (round.kind === "quiz") quizAdvance(round, room.players, now);
    else if (round.kind === "film") filmAdvance(round, now);
    await this.persistAndSchedule();
    this.broadcast();
  }

  async webSocketClose(ws: WebSocket) {
    const room = await this.load();
    const { playerId } = ws.deserializeAttachment() as Attachment;
    // Host wyszedł -> przekaż rolę następnemu połączonemu graczowi
    if (playerId && playerId === room.hostId && !this.isConnected(playerId, ws)) {
      const next = room.players.find((p) => p.id !== playerId && this.isConnected(p.id, ws));
      if (next) {
        room.hostId = next.id;
        await this.save();
      }
    }
    this.broadcast(ws);
  }

  async webSocketError(ws: WebSocket) {
    await this.webSocketClose(ws);
  }

  // --- etapy ---

  private startStage(stage: number, now: number) {
    const room = this.data!;
    room.stage = stage;
    switch (stage) {
      case 1:
        room.round = quizStart(now);
        break;
      case 2:
        room.round = filmStart(now);
        break;
      default:
        room.round = { kind: "placeholder" }; // etapy 3–5: wkrótce
    }
  }

  private stageFinished(): boolean {
    const round = this.data!.round;
    if (!round) return true;
    if (round.kind === "placeholder") return true;
    return round.step === "summary";
  }

  private async persistAndSchedule() {
    const endsAt = roundEndsAt(this.data?.round ?? null);
    await this.save();
    if (this.data?.phase === "playing" && endsAt !== null) {
      await this.ctx.storage.setAlarm(endsAt);
    } else {
      await this.ctx.storage.deleteAlarm();
    }
  }

  // --- pomocnicze ---

  private connectedPlayerIds(): string[] {
    const ids = new Set<string>();
    for (const s of this.ctx.getWebSockets()) {
      const a = s.deserializeAttachment() as Attachment;
      if (a.playerId) ids.add(a.playerId);
    }
    return this.data!.players.filter((p) => ids.has(p.id)).map((p) => p.id);
  }

  private isConnected(playerId: string, except?: WebSocket) {
    return this.ctx.getWebSockets().some((s) => {
      if (s === except) return false;
      return (s.deserializeAttachment() as Attachment).playerId === playerId;
    });
  }

  private roundView(): RoundView | null {
    const round = this.data!.round;
    if (!round) return null;
    if (round.kind === "quiz") return quizView(round);
    if (round.kind === "film") return filmView(round);
    return round;
  }

  private publicState(except?: WebSocket): RoomState {
    const room = this.data!;
    const players: PublicPlayer[] = room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      connected: this.isConnected(p.id, except),
      isHost: p.id === room.hostId,
    }));
    return {
      code: room.code,
      phase: room.phase,
      stage: room.stage,
      players,
      round: this.roundView(),
      serverNow: Date.now(),
    };
  }

  private send(ws: WebSocket, msg: ServerMessage) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* gniazdo już zamknięte */
    }
  }

  private broadcast(except?: WebSocket) {
    if (!this.data) return;
    const msg: ServerMessage = { type: "state", state: this.publicState(except) };
    for (const s of this.ctx.getWebSockets()) {
      if (s !== except) this.send(s, msg);
    }
  }
}

/** Kiedy kończy się bieżący krok etapu (null = czekamy na hosta). */
function roundEndsAt(round: RoundState | null): number | null {
  if (!round || round.kind === "placeholder") return null;
  return round.endsAt;
}
