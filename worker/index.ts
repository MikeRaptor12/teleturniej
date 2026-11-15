export { GameRoom } from "./room";

export interface Env {
  ROOMS: DurableObjectNamespace;
  ASSETS: Fetcher;
}

// Bez liter/cyfr łatwych do pomylenia (O/0, I/1)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomCode(len = 4): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // POST /api/rooms -> nowy kod pokoju
    if (url.pathname === "/api/rooms" && request.method === "POST") {
      return json({ code: randomCode() });
    }

    // GET /api/rooms/ABCD/ws -> WebSocket do pokoju
    const match = url.pathname.match(/^\/api\/rooms\/([A-Z]{4})\/ws$/);
    if (match) {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }
      const stub = env.ROOMS.get(env.ROOMS.idFromName(match[1]));
      return stub.fetch(request);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
