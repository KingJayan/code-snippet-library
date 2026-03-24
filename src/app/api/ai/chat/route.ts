import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeMessages } from "@/lib/ai/chat-normalize";
import { providers } from "@/lib/ai/providers";
import { validateAiBaseUrl } from "@/lib/ai/url-security";
import type { ChatMode, ChatRequestBody } from "@/lib/ai/chat-types";

const ALLOWED_MODES: ChatMode[] = ["improve", "refactor", "debug", "explain"];
const AI_CHAT_WINDOW_MS = 60_000;
const AI_CHAT_MAX_REQUESTS_PER_WINDOW = 24;

type RateWindow = {
  count: number;
  windowStart: number;
};

const aiRateWindows = new Map<string, RateWindow>();

let serverSupabaseClient: ReturnType<typeof createClient> | null = null;

function getServerSupabaseClient() {
  if (serverSupabaseClient) {
    return serverSupabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  serverSupabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverSupabaseClient;
}

async function getAuthenticatedUserId(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return { userId: null, error: "authorization required" };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { userId: null, error: "authorization token is missing" };
  }

  const client = getServerSupabaseClient();
  if (!client) {
    return { userId: null, error: "supabase auth is not configured" };
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { userId: null, error: "invalid or expired session" };
  }

  return { userId: data.user.id, error: null };
}

function getRequesterIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const firstForwarded = forwarded.split(",")[0]?.trim();
  if (firstForwarded) {
    return firstForwarded;
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function enforceAiRateLimit(rateKey: string) {
  const now = Date.now();
  const existing = aiRateWindows.get(rateKey);

  if (!existing || now - existing.windowStart >= AI_CHAT_WINDOW_MS) {
    aiRateWindows.set(rateKey, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (existing.count >= AI_CHAT_MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterMs: Math.max(0, AI_CHAT_WINDOW_MS - (now - existing.windowStart)),
    };
  }

  aiRateWindows.set(rateKey, {
    count: existing.count + 1,
    windowStart: existing.windowStart,
  });

  return { allowed: true, retryAfterMs: 0 };
}

function resolveApiKey(providerId: ChatRequestBody["provider"], requestApiKey?: string) {
  if (requestApiKey?.trim()) {
    return requestApiKey.trim();
  }

  const envByProvider: Partial<Record<ChatRequestBody["provider"], string | undefined>> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    "openai-compatible": process.env.OPENAI_COMPATIBLE_API_KEY,
  };

  return envByProvider[providerId]?.trim() || "";
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUserId(request);
    if (!auth.userId) {
      return NextResponse.json({ error: auth.error ?? "unauthorized" }, { status: 401 });
    }

    const ip = getRequesterIp(request);
    const rateKey = `${auth.userId}:${ip}`;
    const rateLimit = enforceAiRateLimit(rateKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "rate limit exceeded. please wait before sending another request.",
          retryAfterMs: rateLimit.retryAfterMs,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
          },
        }
      );
    }

    const body = (await request.json()) as ChatRequestBody;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    if (!body.provider || !body.model || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "provider, model, and messages are required" }, { status: 400 });
    }

    const mode = body.mode ?? "improve";
    if (!ALLOWED_MODES.includes(mode)) {
      return NextResponse.json({ error: "invalid mode" }, { status: 400 });
    }

    const messages = normalizeMessages({
      messages: body.messages,
      snippet: body.snippet,
      mode,
    });
    if (!messages.length) {
      return NextResponse.json({ error: "at least one message is required" }, { status: 400 });
    }

    const provider = providers[body.provider];
    if (!provider) {
      return NextResponse.json({ error: "unsupported provider" }, { status: 400 });
    }

    const resolvedApiKey = resolveApiKey(body.provider, body.apiKey);
    if (provider.requiresApiKey && !resolvedApiKey) {
      return NextResponse.json({ error: "api key is required for this provider" }, { status: 400 });
    }

    if (provider.requiresBaseUrl && !body.baseUrl?.trim()) {
      return NextResponse.json({ error: "base url is required for this provider" }, { status: 400 });
    }

    let sanitizedBaseUrl = body.baseUrl?.trim() ?? "";
    if (body.provider === "openai-compatible") {
      const result = validateAiBaseUrl(sanitizedBaseUrl, "openai-compatible");
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      sanitizedBaseUrl = result.normalized;
    }

    if (body.provider === "ollama" && sanitizedBaseUrl) {
      const result = validateAiBaseUrl(sanitizedBaseUrl, "ollama");
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      sanitizedBaseUrl = result.normalized;
    }

    const result = await provider.handler({
      body: {
        ...body,
        apiKey: resolvedApiKey || undefined,
        baseUrl: sanitizedBaseUrl,
      },
      messages,
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    if (!result.reply) {
      return NextResponse.json({ error: "empty response from provider" }, { status: 502 });
    }

    return NextResponse.json({ reply: result.reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
