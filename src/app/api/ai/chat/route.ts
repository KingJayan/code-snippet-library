import { NextResponse } from "next/server";

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatProvider = "openai" | "anthropic" | "gemini" | "ollama" | "openrouter" | "openai-compatible";

type ChatRequestBody = {
  provider: ChatProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  messages: ChatMessage[];
  snippet?: {
    title?: string;
    language?: string;
    description?: string;
    code?: string;
  };
};

const REQUEST_TIMEOUT_MS = 45_000;

function isValidMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== "object") return false;
  const candidate = message as ChatMessage;
  return (
    (candidate.role === "system" || candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0
  );
}

function normalizeMessages(messages: ChatMessage[], snippet?: ChatRequestBody["snippet"]): ChatMessage[] {
  const context = snippet?.code
    ? [
        "You are a senior software engineer helping improve code snippets.",
        "When suggesting edits, be concrete and include a revised code block.",
        "Focus on correctness, efficiency/performance, and maintainability.",
        "Try to avoid stylistic suggestions unless they significantly improve readability, and never suggest changes that go against common conventions and standards for the snippet's language, unless specifically asked to.",
        "",
        `Snippet title: ${snippet.title ?? "untitled"}`,
        `Language: ${snippet.language ?? "unknown"}`,
        `Description: ${snippet.description ?? ""}`,
        "Current code:",
        "```",
        snippet.code,
        "```",
      ].join("\n")
    : null;

  const systemMessage: ChatMessage = {
    role: "system",
    content: context
      ? `${context}\n\nAlways include a short explanation and provide full updated code when asked to edit.`
      : "You are a senior software engineer helping improve code snippets.",
  };

  const cleaned = messages.filter(isValidMessage).slice(-24);
  return [systemMessage, ...cleaned];
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseOpenAIStyleReply(payload: unknown): string | null {
  const data = payload as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim() ? content : null;
}

function parseAnthropicReply(payload: unknown): string | null {
  const data = payload as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text = data?.content?.filter((part) => part.type === "text").map((part) => part.text ?? "").join("\n");
  return text && text.trim() ? text : null;
}

function parseGeminiReply(payload: unknown): string | null {
  const data = payload as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((part) => part.text ?? "").join("\n");
  return text && text.trim() ? text : null;
}

function parseOllamaReply(payload: unknown): string | null {
  const data = payload as {
    message?: { content?: string };
  };

  const content = data?.message?.content;
  return typeof content === "string" && content.trim() ? content : null;
}

async function callOpenAICompatible(opts: {
  baseUrl: string;
  model: string;
  apiKey: string;
  messages: ChatMessage[];
  extraHeaders?: Record<string, string>;
}) {
  const response = await fetchWithTimeout(`${opts.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
      ...opts.extraHeaders,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: 0.2,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (payload as { error?: { message?: string } })?.error?.message ??
      `provider returned ${response.status}`;
    return { error: message, reply: null as string | null };
  }

  return { error: null as string | null, reply: parseOpenAIStyleReply(payload) };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    if (!body.provider || !body.model || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "provider, model, and messages are required" }, { status: 400 });
    }

    const messages = normalizeMessages(body.messages, body.snippet);
    if (!messages.length) {
      return NextResponse.json({ error: "at least one message is required" }, { status: 400 });
    }

    const provider = body.provider;

    if (provider !== "ollama" && (!body.apiKey || !body.apiKey.trim())) {
      return NextResponse.json({ error: "api key is required for this provider" }, { status: 400 });
    }

    if (provider === "openai") {
      const result = await callOpenAICompatible({
        baseUrl: "https://api.openai.com/v1",
        model: body.model,
        apiKey: body.apiKey ?? "",
        messages,
      });

      if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
      if (!result.reply) return NextResponse.json({ error: "empty response from provider" }, { status: 502 });
      return NextResponse.json({ reply: result.reply });
    }

    if (provider === "openrouter") {
      const result = await callOpenAICompatible({
        baseUrl: "https://openrouter.ai/api/v1",
        model: body.model,
        apiKey: body.apiKey ?? "",
        messages,
        extraHeaders: {
          "HTTP-Referer": "https://localhost",
          "X-Title": "snips ai editor",
        },
      });

      if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
      if (!result.reply) return NextResponse.json({ error: "empty response from provider" }, { status: 502 });
      return NextResponse.json({ reply: result.reply });
    }

    if (provider === "openai-compatible") {
      if (!body.baseUrl?.trim()) {
        return NextResponse.json({ error: "base url is required for openai-compatible provider" }, { status: 400 });
      }

      const result = await callOpenAICompatible({
        baseUrl: body.baseUrl,
        model: body.model,
        apiKey: body.apiKey ?? "",
        messages,
      });

      if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
      if (!result.reply) return NextResponse.json({ error: "empty response from provider" }, { status: 502 });
      return NextResponse.json({ reply: result.reply });
    }

    if (provider === "anthropic") {
      const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": body.apiKey ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: body.model,
          max_tokens: 1500,
          messages: messages
            .filter((message) => message.role !== "system")
            .map((message) => ({
              role: message.role === "assistant" ? "assistant" : "user",
              content: message.content,
            })),
          system: messages.find((message) => message.role === "system")?.content,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (payload as { error?: { message?: string } })?.error?.message ??
          `provider returned ${response.status}`;
        return NextResponse.json({ error: message }, { status: 502 });
      }

      const reply = parseAnthropicReply(payload);
      if (!reply) {
        return NextResponse.json({ error: "empty response from provider" }, { status: 502 });
      }

      return NextResponse.json({ reply });
    }

    if (provider === "gemini") {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(body.model)}:generateContent?key=${encodeURIComponent(body.apiKey ?? "")}`;

      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: messages.find((message) => message.role === "system")?.content ?? "" }],
          },
          contents: messages
            .filter((message) => message.role !== "system")
            .map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content }],
            })),
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (payload as { error?: { message?: string } })?.error?.message ??
          `provider returned ${response.status}`;
        return NextResponse.json({ error: message }, { status: 502 });
      }

      const reply = parseGeminiReply(payload);
      if (!reply) {
        return NextResponse.json({ error: "empty response from provider" }, { status: 502 });
      }

      return NextResponse.json({ reply });
    }

    if (provider === "ollama") {
      const endpoint = `${(body.baseUrl?.trim() || "http://localhost:11434").replace(/\/$/, "")}/api/chat`;

      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: body.model,
          stream: false,
          messages,
          options: {
            temperature: 0.2,
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (payload as { error?: string })?.error ??
          `provider returned ${response.status}`;
        return NextResponse.json({ error: message }, { status: 502 });
      }

      const reply = parseOllamaReply(payload);
      if (!reply) {
        return NextResponse.json({ error: "empty response from provider" }, { status: 502 });
      }

      return NextResponse.json({ reply });
    }

    return NextResponse.json({ error: "unsupported provider" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
