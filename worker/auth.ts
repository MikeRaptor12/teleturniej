// Hasło do całej strony + ochrona przed zgadywaniem hasła.
//
// Hasło ustawia się jako sekret Cloudflare: ACCESS_PASSWORD (nigdy w repo).
// Po poprawnym logowaniu przeglądarka dostaje ciasteczko z HMAC hasła –
// zmiana hasła automatycznie unieważnia wszystkie stare ciasteczka.
import { DurableObject } from "cloudflare:workers";

export const COOKIE = "tt_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dni
const enc = new TextEncoder();

async function hmac(key: string, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, enc.encode(msg));
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Porównanie w stałym czasie (nie zdradza, ile znaków się zgadza). */
function safeEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false;
  return crypto.subtle.timingSafeEqual(a, b);
}

/** Wartość ciasteczka dla danego hasła. */
export async function tokenFor(password: string): Promise<string> {
  return hex(await hmac(password, "teleturniej-auth-v1"));
}

export async function passwordMatches(given: string, expected: string): Promise<boolean> {
  // porównujemy skróty, żeby długość hasła też nie wyciekała
  const [a, b] = await Promise.all([hmac("cmp", given), hmac("cmp", expected)]);
  return safeEqual(a, b);
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export async function isAuthorized(request: Request, password: string | undefined): Promise<boolean> {
  if (!password) return false; // brak ustawionego hasła = strona zamknięta
  const got = readCookie(request, COOKIE);
  if (!got) return false;
  const want = await tokenFor(password);
  return safeEqual(enc.encode(got).buffer as ArrayBuffer, enc.encode(want).buffer as ArrayBuffer);
}

export function authCookie(token: string, secure: boolean): string {
  return `${COOKIE}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
}

export function clearCookie(secure: boolean): string {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
}

/** Żądania z innych stron (np. podstawiony WebSocket) odrzucamy. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return request.method === "GET" && request.headers.get("Upgrade") !== "websocket";
  return origin === new URL(request.url).origin;
}

const GUARD = {
  maxFailures: 5,
  windowMs: 15 * 60 * 1000,
};

/**
 * Licznik nieudanych logowań – jedna instancja na adres IP.
 * Po 5 błędnych hasłach w ciągu 15 minut kolejne próby są blokowane.
 */
export class LoginGuard extends DurableObject {
  async check(): Promise<{ allowed: boolean; retryAfterSec: number }> {
    const failures = await this.recent();
    if (failures.length < GUARD.maxFailures) return { allowed: true, retryAfterSec: 0 };
    const retry = Math.ceil((failures[0] + GUARD.windowMs - Date.now()) / 1000);
    return { allowed: false, retryAfterSec: Math.max(1, retry) };
  }

  async fail(): Promise<void> {
    const failures = await this.recent();
    failures.push(Date.now());
    await this.ctx.storage.put("failures", failures.slice(-GUARD.maxFailures));
    await this.ctx.storage.setAlarm(Date.now() + GUARD.windowMs);
  }

  async reset(): Promise<void> {
    await this.ctx.storage.deleteAll();
  }

  /** Po upływie okna czyścimy dane – nic nie zostaje w pamięci na zawsze. */
  async alarm() {
    if ((await this.recent()).length === 0) await this.ctx.storage.deleteAll();
  }

  private async recent(): Promise<number[]> {
    const all = (await this.ctx.storage.get<number[]>("failures")) ?? [];
    const since = Date.now() - GUARD.windowMs;
    return all.filter((t) => t > since);
  }
}
