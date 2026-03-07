import type { ChatRequestBody, ChatMessage } from "@/lib/ai/chat-types";
import { fetchWithTimeout, parseOllamaReply, type ProviderResult } from "@/lib/ai/providers/shared";

export async function callOllamaProvider(params: {
  body: ChatRequestBody;
  messages: ChatMessage[];
}): Promise<ProviderResult> {
  const endpoint = `${(params.body.baseUrl?.trim() || "http://localhost:11434").replace(/\/$/, "")}/api/chat`;

  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.body.model,
      stream: false,
      messages: params.messages,
      options: {
        temperature: 0.1,
        top_p: 0.9,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (payload as { error?: string })?.error ??
      `provider returned ${response.status}`;
    return { error: message, reply: null };
  }

  return { error: null, reply: parseOllamaReply(payload) };
}
