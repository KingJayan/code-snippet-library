import { NextResponse } from "next/server";
import { normalizeMessages } from "@/lib/ai/chat-normalize";
import { providers } from "@/lib/ai/providers";
import type { ChatMode, ChatRequestBody } from "@/lib/ai/chat-types";

const ALLOWED_MODES: ChatMode[] = ["improve", "refactor", "debug", "explain"];

export async function POST(request: Request) {
  try {
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

    if (provider.requiresApiKey && (!body.apiKey || !body.apiKey.trim())) {
      return NextResponse.json({ error: "api key is required for this provider" }, { status: 400 });
    }

    if (provider.requiresBaseUrl && !body.baseUrl?.trim()) {
      return NextResponse.json({ error: "base url is required for this provider" }, { status: 400 });
    }

    const result = await provider.handler({ body, messages });
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
