import {createHmac, timingSafeEqual} from "node:crypto";

/**
 * Per-visitor budget, held in a signed cookie.
 *
 * There is no way to identify an anonymous visitor. IP fails on CGNAT — a
 * university or a mobile carrier shares one address across thousands of people,
 * so an IP limit punishes the innocent. Cookies die in incognito. Browser
 * fingerprinting is hostile to privacy, defeated by the browsers that care
 * about it, and the libraries worth using are paid. A login would work and the
 * hub advertises "No login" on its front page.
 *
 * So this does not try to identify anyone. The counter lives in the cookie
 * itself, signed so it cannot be edited, and a server-side store would buy
 * nothing: it would have to be keyed on the same cookie, and clearing that
 * cookie defeats both designs identically.
 *
 * What actually protects the deployment is elsewhere — the provider's own 429
 * caps total spend, and the curated offline answers mean the worst case is the
 * hub replying as it did before any key existed. This layer only stops one
 * visitor from burning the day's quota by accident or boredom, and it is
 * deliberately generous: someone determined enough to open an incognito window
 * for twenty more questions is not the threat worth engineering against.
 */

const COOKIE_NAME = "stander_q";
const WINDOW_MS = 24 * 60 * 60 * 1000;

/** Answered normally up to here. A curious visitor never reaches it. */
const OPEN_LIMIT = 20;
/** Still answered past that, but paced — friction deters without punishing. */
const THROTTLE_LIMIT = 35;
const THROTTLE_DELAY_MS = 1000;

export interface QuotaState {
  count: number;
  windowStart: number;
}

export type QuotaTier = "open" | "throttled" | "exhausted" | "disabled";

export interface QuotaVerdict {
  tier: QuotaTier;
  /** Pause before answering. Zero except in the throttled tier. */
  delayMs: number;
  state: QuotaState;
}

function secret(): string | null {
  const value = process.env.STANDX_AGENT_COOKIE_SECRET?.trim();
  return value ? value : null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function parseCookie(header: string | null, name: string): string | null {
  if (!header) {
    return null;
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return null;
}

/** Reads and verifies the cookie. Anything tampered with or stale starts over. */
export function readQuota(request: Request): QuotaState {
  const fresh: QuotaState = {count: 0, windowStart: Date.now()};
  const key = secret();
  if (!key) {
    return fresh;
  }

  const raw = parseCookie(request.headers.get("cookie"), COOKIE_NAME);
  if (!raw) {
    return fresh;
  }

  const separator = raw.lastIndexOf(".");
  if (separator === -1) {
    return fresh;
  }

  const payload = raw.slice(0, separator);
  const provided = Buffer.from(raw.slice(separator + 1));
  const expected = Buffer.from(sign(payload, key));

  // Length check first: timingSafeEqual throws on a mismatch rather than
  // returning false, and the length is not a secret.
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return fresh;
  }

  const [countText, startText] = payload.split(".");
  const count = Number.parseInt(countText, 10);
  const windowStart = Number.parseInt(startText, 10);

  if (!Number.isFinite(count) || !Number.isFinite(windowStart) || count < 0) {
    return fresh;
  }
  if (Date.now() - windowStart >= WINDOW_MS) {
    return fresh;
  }

  return {count, windowStart};
}

/** Charges one request against the budget and says how to serve it. */
export function chargeQuota(state: QuotaState): QuotaVerdict {
  if (!secret()) {
    // No secret configured: per-visitor limiting is off, and the provider's own
    // rate limit plus the offline fallback are the only guards. Documented in
    // `.env.example` so this is a deployment choice rather than a surprise.
    return {tier: "disabled", delayMs: 0, state};
  }

  const next: QuotaState = {count: state.count + 1, windowStart: state.windowStart};

  if (next.count <= OPEN_LIMIT) {
    return {tier: "open", delayMs: 0, state: next};
  }
  if (next.count <= THROTTLE_LIMIT) {
    return {tier: "throttled", delayMs: THROTTLE_DELAY_MS, state: next};
  }
  return {tier: "exhausted", delayMs: 0, state: next};
}

/** `Set-Cookie` value carrying the charged state, or null when disabled. */
export function quotaCookie(state: QuotaState): string | null {
  const key = secret();
  if (!key) {
    return null;
  }

  const payload = `${state.count}.${state.windowStart}`;
  const value = `${payload}.${sign(payload, key)}`;
  const maxAge = Math.max(
    0,
    Math.floor((state.windowStart + WINDOW_MS - Date.now()) / 1000)
  );
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}
