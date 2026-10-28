// server/services/openrouter.service.ts
// Server-side OpenRouter access. The API and provisioning keys live only here —
// the frontend never sees them.
import logger from "../config/logger.js";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";
const APP_TITLE = "ZuZu Playground";
const GENERATION_LOOKUP_ATTEMPTS = 3;
const GENERATION_LOOKUP_DELAY_MS = 1000;
const MS_PER_SECOND = 1000;

export type UpstreamErrorCode =
  | "AUTH"
  | "NO_CREDITS"
  | "FREE_QUOTA_EXHAUSTED"
  | "UPSTREAM_RATE_LIMITED"
  | "MODERATION"
  | "FORBIDDEN"
  | "MODEL_UNAVAILABLE"
  | "BAD_REQUEST"
  | "UPSTREAM_ERROR"
  | "NOT_CONFIGURED";

export type UpstreamError = {
  status: number;
  code: UpstreamErrorCode;
  message: string;
  retry_at?: string;
};

export type GenerationData = {
  data?: {
    latency?: number | null;
    moderation_latency?: number | null;
    generation_time?: number | null;
    tokens_prompt?: number | null;
    tokens_completion?: number | null;
    total_cost?: number | null;
  };
};

type UpstreamErrorBody = {
  error?: {
    message?: string;
    metadata?: { reasons?: unknown };
  };
};

export class OpenRouterConfigError extends Error {
  constructor(keyName: string) {
    super(`${keyName} is not configured on the server`);
    Object.setPrototypeOf(this, OpenRouterConfigError.prototype);
  }
}

function apiKey(): string {
  const key = process.env.ZUZU_OPENROUTER_KEY;
  if (!key) throw new OpenRouterConfigError("ZUZU_OPENROUTER_KEY");
  return key;
}

function provisionKey(): string {
  const key = process.env.ZUZU_OPENROUTER_PROVISION_KEY;
  if (!key) throw new OpenRouterConfigError("ZUZU_OPENROUTER_PROVISION_KEY");
  return key;
}

function authHeaders(key: string): Record<string, string> {
  return {
    Authorization: `Bearer ${key}`,
    "HTTP-Referer":
      process.env.PRODUCTION_FRONTEND_URL || "http://localhost:3000",
    "X-Title": APP_TITLE,
  };
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalize an upstream OpenRouter failure into a status/code the client can act on.
 * 401 is our key's problem, not the user's, so it surfaces as 502.
 */
export function classifyUpstreamError(
  status: number,
  bodyText: string,
  headers: Headers,
): UpstreamError {
  let body: UpstreamErrorBody = {};
  try {
    body = JSON.parse(bodyText) as UpstreamErrorBody;
  } catch {
    // non-JSON error body — fall through with the raw text
  }
  const upstreamMessage =
    body.error?.message || bodyText.slice(0, 300) || `HTTP ${status}`;

  const retryAfterSec = Number(headers.get("retry-after"));
  const retryAfter =
    Number.isFinite(retryAfterSec) && retryAfterSec > 0
      ? new Date(Date.now() + retryAfterSec * MS_PER_SECOND).toISOString()
      : undefined;

  if (status === 401) {
    return {
      status: 502,
      code: "AUTH",
      message: "OpenRouter rejected the server API key.",
    };
  }
  if (status === 402) {
    return {
      status: 402,
      code: "NO_CREDITS",
      message: "OpenRouter account is out of credits.",
    };
  }
  if (status === 429) {
    if (/free-models-per-(day|min)/.test(bodyText)) {
      const resetMs = Number(headers.get("x-ratelimit-reset"));
      const retry_at =
        Number.isFinite(resetMs) && resetMs > 0
          ? new Date(resetMs).toISOString()
          : retryAfter;
      return {
        status: 429,
        code: "FREE_QUOTA_EXHAUSTED",
        message: "OpenRouter free-model quota is exhausted for this account.",
        retry_at,
      };
    }
    return {
      status: 429,
      code: "UPSTREAM_RATE_LIMITED",
      message: `Model is rate limited upstream: ${upstreamMessage}`,
      retry_at: retryAfter,
    };
  }
  if (status === 403) {
    const flagged =
      Boolean(body.error?.metadata?.reasons) ||
      /flagged|moderation/i.test(upstreamMessage);
    return flagged
      ? {
          status: 400,
          code: "MODERATION",
          message: `Prompt was flagged by moderation: ${upstreamMessage}`,
        }
      : { status: 403, code: "FORBIDDEN", message: upstreamMessage };
  }
  if (status === 404) {
    return { status: 404, code: "MODEL_UNAVAILABLE", message: upstreamMessage };
  }
  if (status === 400 || status === 413 || status === 422) {
    return { status: 400, code: "BAD_REQUEST", message: upstreamMessage };
  }
  return { status: 502, code: "UPSTREAM_ERROR", message: upstreamMessage };
}

export type ChatCompletionRequest = {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
};

export function streamChatCompletion(
  request: ChatCompletionRequest,
  signal: AbortSignal,
): Promise<Response> {
  return fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: "POST",
    headers: { ...authHeaders(apiKey()), "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, stream: true }),
    signal,
  });
}

// Generation stats land a moment after the stream closes, so retry briefly.
export async function fetchGeneration(
  generationId: string,
): Promise<GenerationData | null> {
  for (let attempt = 1; attempt <= GENERATION_LOOKUP_ATTEMPTS; attempt++) {
    await sleep(GENERATION_LOOKUP_DELAY_MS);
    try {
      const response = await fetch(
        `${OPENROUTER_API_URL}/generation?id=${encodeURIComponent(generationId)}`,
        { headers: authHeaders(apiKey()) },
      );
      if (response.ok) return (await response.json()) as GenerationData;
      if (response.status !== 404) {
        logger.warn(
          `Generation lookup ${generationId} failed: ${response.status}`,
        );
        return null;
      }
    } catch (err) {
      logger.warn(
        `Generation lookup ${generationId} errored: ${(err as Error).message}`,
      );
      return null;
    }
  }
  logger.warn(
    `Generation ${generationId} not available after ${GENERATION_LOOKUP_ATTEMPTS} attempts`,
  );
  return null;
}

async function proxyGet(
  path: string,
  key: string,
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${OPENROUTER_API_URL}${path}`, {
    headers: authHeaders(key),
  });
  const text = await response.text();
  if (!response.ok) {
    const err = classifyUpstreamError(response.status, text, response.headers);
    return { status: err.status, body: { success: false, ...err } };
  }
  return { status: response.status, body: JSON.parse(text) as unknown };
}

export const fetchKeyInfo = (): Promise<{ status: number; body: unknown }> =>
  proxyGet("/auth/key", apiKey());

export const fetchActivity = (): Promise<{ status: number; body: unknown }> =>
  proxyGet("/activity", provisionKey());
