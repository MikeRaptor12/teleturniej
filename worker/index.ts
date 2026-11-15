import { GameRoom } from "./room";
import {
  LoginGuard,
  authCookie,
  clearCookie,
  isAuthorized,
  passwordMatches,
  sameOrigin,
  tokenFor,
} from "./auth";

export { GameRoom, LoginGuard };

export interface Env {
  ROOMS: DurableObjectNamespace<GameRoom>;
  LOGIN_GUARD: DurableObjectNamespace<LoginGuard>;
  ASSETS: Fetcher;
  /** sekret: hasło do strony (wrangler secret put ACCESS_PASSWORD albo panel Cloudflare) */
  ACCESS_PASSWORD?: string;
}

// Bez liter/cyfr łatwych do pomylenia (O/0, I/1)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomCode(len = 4): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });

/** WebSocket, który od razu się zamyka z powodem – klient wie, żeby nie łączyć się ponownie. */
function rejectSocket(code: number, reason: string): Response {
  const { 0: client, 1: server } = new WebSocketPair();
  server.accept();
  server.close(code, reason);
  return new Response(null, { status: 101, webSocket: client });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const secure = url.protocol === "https:";

    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    if (!sameOrigin(request)) {
      return json({ error: "Niedozwolone źródło żądania" }, 403);
    }

    // GET /api/session -> czy jestem zalogowany
    if (url.pathname === "/api/session" && request.method === "GET") {
      return json({
        ok: await isAuthorized(request, env.ACCESS_PASSWORD),
        configured: Boolean(env.ACCESS_PASSWORD),
      });
    }

    // POST /api/login { password }
    if (url.pathname === "/api/login" && request.method === "POST") {
      if (!env.ACCESS_PASSWORD) {
        return json({ error: "Hasło do strony nie jest ustawione w Cloudflare (ACCESS_PASSWORD)." }, 503);
      }
      const ip = request.headers.get("CF-Connecting-IP") ?? "local";
      const guard = env.LOGIN_GUARD.get(env.LOGIN_GUARD.idFromName(ip));
      const status = await guard.check();
      if (!status.allowed) {
        const min = Math.ceil(status.retryAfterSec / 60);
        return json({ error: `Za dużo błędnych prób. Spróbuj za ${min} min.` }, 429, {
          "retry-after": String(status.retryAfterSec),
        });
      }
      let password = "";
      try {
        password = String(((await request.json()) as { password?: unknown }).password ?? "").slice(0, 200);
      } catch {
        /* puste hasło */
      }
      if (!(await passwordMatches(password, env.ACCESS_PASSWORD))) {
        await guard.fail();
        return json({ error: "Złe hasło" }, 401);
      }
      await guard.reset();
      return json({ ok: true }, 200, { "set-cookie": authCookie(await tokenFor(env.ACCESS_PASSWORD), secure) });
    }

    // POST /api/logout
    if (url.pathname === "/api/logout" && request.method === "POST") {
      return json({ ok: true }, 200, { "set-cookie": clearCookie(secure) });
    }

    // --- wszystko poniżej wymaga zalogowania ---
    const authorized = await isAuthorized(request, env.ACCESS_PASSWORD);

    // POST /api/rooms -> nowy pokój (tylko tak powstają pokoje; zgadnięty kod nic nie da)
    if (url.pathname === "/api/rooms" && request.method === "POST") {
      if (!authorized) return json({ error: "Najpierw podaj hasło" }, 401);
      for (let i = 0; i < 10; i++) {
        const code = randomCode();
        if (await env.ROOMS.get(env.ROOMS.idFromName(code)).create(code)) {
          return json({ code });
        }
      }
      return json({ error: "Nie udało się założyć pokoju, spróbuj ponownie" }, 503);
    }

    // GET /api/rooms/ABCD/ws -> WebSocket do pokoju
    const match = url.pathname.match(/^\/api\/rooms\/([A-Z]{4})\/ws$/);
    if (match) {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }
      if (!authorized) return rejectSocket(4401, "Najpierw podaj hasło");
      const stub = env.ROOMS.get(env.ROOMS.idFromName(match[1]));
      return stub.fetch(request);
    }

    return json({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
