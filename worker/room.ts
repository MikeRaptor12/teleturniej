import { DurableObject } from "cloudflare:workers";
import type { Env } from "./index";
import {
  MAX_PLAYERS,
  type ClientMessage,
  type PublicPlayer,
  type RoomState,
  type ServerMessage,
} from "../shared/protocol";

interface StoredPlayer {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
}

interface Stored {
  code: string;
  phase: RoomState["phase"];
  stage: number;
  hostId: string | null;
  players: StoredPlayer[];
}

interface Attachment {
  playerId: string | null;
}

/**
 * Jeden pokój gry. Serwer jest jedynym źródłem prawdy:
 * liczy punkty, pilnuje czasu i nie wysyła poprawnych odpowiedzi przed odsłonięciem.
 * Używa WebSocket Hibernation API, żeby bezczynny pokój nic nie kosztował.
 */
export class GameRoom extends DurableObject<Env> {
  private data: Stored | null = null;

  private async load(code: string): Promise<Stored> {
    if (!this.data) {
      this.data = (await this.ctx.storage.get<Stored>("room")) ?? {
        code,
        phase: "lobby",
        stage: 0,
        hostId: null,
        players: [],
      };
    }
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
    const room = await this.load("");
    let msg: ClientMessage;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return this.send(ws, { type: "error", message: "Niepoprawny komunikat" });
    }

    const att = ws.deserializeAttachment() as Attachment;

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
          player = { id: playerId, name, score: 0, joinedAt: Date.now() };
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
        if (att.playerId !== room.hostId) {
          return this.send(ws, { type: "error", message: "Tylko host może zacząć" });
        }
        if (room.players.length < 2) {
          return this.send(ws, { type: "error", message: "Potrzeba co najmniej 2 graczy" });
        }
        room.phase = "stage";
        room.stage = 1;
        await this.save();
        return this.broadcast();
      }

      case "kick": {
        if (att.playerId !== room.hostId || msg.playerId === room.hostId) return;
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

  async webSocketClose(ws: WebSocket) {
    const room = await this.load("");
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

  // --- pomocnicze ---

  private isConnected(playerId: string, except?: WebSocket) {
    return this.ctx.getWebSockets().some((s) => {
      if (s === except) return false;
      return (s.deserializeAttachment() as Attachment).playerId === playerId;
    });
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
    return { code: room.code, phase: room.phase, stage: room.stage, players };
  }

  private send(ws: WebSocket, msg: ServerMessage) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* gniazdo już zamknięte */
    }
  }

  private broadcast(except?: WebSocket) {
    const msg: ServerMessage = { type: "state", state: this.publicState(except) };
    for (const s of this.ctx.getWebSockets()) {
      if (s !== except) this.send(s, msg);
    }
  }
}
