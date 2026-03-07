import type { ChatRequestBody, ChatMessage } from "@/lib/ai/chat-types";
import { fetchWithTimeout, parseGeminiReply, type ProviderResult } from "@/lib/ai/providers/shared";

export async function callGeminiProvider(params: {
  body: ChatRequestBody;
  messages: ChatMessage[];
}): Promise<ProviderResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.body.model)}:generateContent?key=${encodeURIComponent(params.body.apiKey ?? "")}`;

  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: params.messages.find((message) => message.role === "system")?.content ?? "" }],
      },
      contents: params.messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
      generationConfig: {
        temperature: 0.1,
        topP: 0.9,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (payload as { error?: { message?: string } })?.error?.message ??
      `provider returned ${response.status}`;
    return { error: message, reply: null };
  }

  return { error: null, reply: parseGeminiReply(payload) };
}
