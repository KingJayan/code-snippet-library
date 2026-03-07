import type { ChatRequestBody, ChatMessage } from "@/lib/ai/chat-types";
import { fetchWithTimeout, parseOpenAIStyleReply, type ProviderResult } from "@/lib/ai/providers/shared";

export async function callOpenRouterProvider(params: {
  body: ChatRequestBody;
  messages: ChatMessage[];
}): Promise<ProviderResult> {
  const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.body.apiKey ?? ""}`,
      "HTTP-Referer": "https://localhost",
      "X-Title": "snips ai editor",
    },
    body: JSON.stringify({
      model: params.body.model,
      messages: params.messages,
      temperature: 0.1,
      top_p: 0.9,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (payload as { error?: { message?: string } })?.error?.message ??
      `provider returned ${response.status}`;
    return { error: message, reply: null };
  }

  return { error: null, reply: parseOpenAIStyleReply(payload) };
}
