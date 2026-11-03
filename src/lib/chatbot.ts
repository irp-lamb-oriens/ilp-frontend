/**
 * lib/chatbot.ts — public chatbot intake client.
 *
 * Talks to the public POST /api/chatbot/message endpoint (no auth). The server
 * runs the multi-agent pipeline (thinking + specialist agents) and returns a
 * single assistant reply plus any extracted legal-intake fields.
 */

import { API_URL, ApiError } from "./api";

export interface ChatbotReply {
  success: boolean;
  response: string;
  extractedFields: Record<string, unknown>;
  sessionId: string;
}

let SESSION_ID: string | null = null;

/**
 * The thread id is the only key to GET /api/chatbot/history/:id, so it must
 * not be guessable (QA round 1: it was a timestamp plus ~41 bits of
 * Math.random). 122 random bits from crypto.randomUUID where available.
 */
function newSessionId(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c?.randomUUID) return `fe-${c.randomUUID()}`;
  if (c?.getRandomValues) {
    const b = c.getRandomValues(new Uint8Array(16));
    return `fe-${Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")}`;
  }
  return `fe-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
}

export function getChatbotSessionId(): string {
  // Anonymous chat thread id (not an auth token), a per-browser convenience.
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem("ilp_chatbot_session");
      if (stored) return stored;
    } catch {
      // storage unavailable: keep the in-memory id
    }
  }
  if (!SESSION_ID) SESSION_ID = newSessionId();
  return SESSION_ID;
}

export function rememberChatbotSessionId(id: string): void {
  SESSION_ID = id;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("ilp_chatbot_session", id);
    } catch {
      // storage unavailable
    }
  }
}

export async function sendChatbotMessage(
  message: string,
  context: Record<string, unknown> = {},
): Promise<ChatbotReply> {
  const res = await fetch(`${API_URL}/api/chatbot/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: getChatbotSessionId(),
      message,
      context,
      preferredLanguage: "en",
    }),
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = String(data.error);
    } catch {
      // ignore
    }
    throw new ApiError(msg, res.status);
  }

  const reply = (await res.json()) as ChatbotReply;
  if (reply.sessionId) rememberChatbotSessionId(reply.sessionId);
  return reply;
}