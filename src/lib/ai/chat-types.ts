export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "ollama"
  | "openrouter"
  | "openai-compatible";

export type ChatMode = "improve" | "refactor" | "debug" | "explain";

export type ChatSnippet = {
  title?: string;
  language?: string;
  description?: string;
  code?: string;
};

export type ChatRequestBody = {
  provider: ChatProvider;
  model: string;
  mode?: ChatMode;
  apiKey?: string;
  baseUrl?: string;
  messages: ChatMessage[];
  snippet?: ChatSnippet;
};
