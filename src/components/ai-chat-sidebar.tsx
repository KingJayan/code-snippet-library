"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, KeyRound, Loader2, PanelRightClose, Send, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { readStringSetting, SETTINGS_KEYS } from "@/lib/settings";
import type { SnippetWithTags } from "@/lib/types";

type ProviderId = "openai" | "anthropic" | "gemini" | "openrouter" | "ollama" | "openai-compatible" | "puterjs";
type ChatMode = "improve" | "refactor" | "debug" | "explain";

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat?: (
          prompt: string,
          options?: { model?: string }
        ) => Promise<unknown>;
      };
    };
  }
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ProviderOption = {
  id: ProviderId;
  label: string;
  placeholderModel: string;
  requiresApiKey: boolean;
  supportsBaseUrl: boolean;
  description: string;
};

const PROVIDERS: ProviderOption[] = [
  {
    id: "openai",
    label: "OpenAI (GPT / Codex)",
    placeholderModel: "gpt-5-mini",
    requiresApiKey: true,
    supportsBaseUrl: false,
    description: "Use OpenAI models including GPT and Codex variants.",
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    placeholderModel: "claude-sonnet-4-5",
    requiresApiKey: true,
    supportsBaseUrl: false,
    description: "Use Anthropic Claude models.",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    placeholderModel: "gemini-2.5-pro",
    requiresApiKey: true,
    supportsBaseUrl: false,
    description: "Use Gemini models from Google AI Studio.",
  },
  {
    id: "openrouter",
    label: "OpenRouter (Qwen / Llama / etc)",
    placeholderModel: "qwen/qwen3-coder",
    requiresApiKey: true,
    supportsBaseUrl: false,
    description: "Access many model families including Qwen and Llama.",
  },
  {
    id: "ollama",
    label: "Ollama (Local)",
    placeholderModel: "qwen2.5-coder:14b",
    requiresApiKey: false,
    supportsBaseUrl: true,
    description: "Use local models running in Ollama.",
  },
  {
    id: "openai-compatible",
    label: "OpenAI-Compatible (Custom)",
    placeholderModel: "llama-3.1-70b-instruct",
    requiresApiKey: true,
    supportsBaseUrl: true,
    description: "Any endpoint that supports /chat/completions.",
  },
  {
    id: "puterjs",
    label: "PuterJS AI",
    placeholderModel: "gpt-4.1-mini",
    requiresApiKey: false,
    supportsBaseUrl: false,
    description: "Use PuterJS browser AI models.",
  },
];

const CUSTOM_MODEL_VALUE = "__custom_model__";

const PROVIDER_MODELS: Record<ProviderId, string[]> = {
  openai: ["gpt-5-mini", "gpt-5", "codex-mini-latest", "gpt-4.1-mini"],
  anthropic: ["claude-sonnet-4-5", "claude-3-7-sonnet-latest", "claude-3-5-haiku-latest"],
  gemini: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
  openrouter: ["qwen/qwen3-coder", "meta-llama/llama-3.1-70b-instruct", "deepseek/deepseek-r1"],
  ollama: ["qwen2.5-coder:14b", "llama3.1:8b", "deepseek-coder:6.7b"],
  "openai-compatible": ["llama-3.1-70b-instruct", "mistral-large-latest", "gpt-4.1-mini"],
  puterjs: ["gpt-4.1-mini", "gpt-4o-mini", "claude-3-5-sonnet"],
};

const STORAGE_KEYS = {
  provider: "snips.ai.provider",
  model: "snips.ai.model",
  mode: "snips.ai.mode",
  apiKey: "snips.ai.apiKey",
  baseUrl: "snips.ai.baseUrl",
};

const MODE_OPTIONS: Array<{ value: ChatMode; label: string }> = [
  { value: "improve", label: "improve" },
  { value: "refactor", label: "refactor" },
  { value: "debug", label: "debug" },
  { value: "explain", label: "explain" },
];
const MODE_VALUES = MODE_OPTIONS.map((option) => option.value);
const MAX_CHAT_MESSAGES = 24;

function trimMessages(messages: ChatMessage[]) {
  if (messages.length <= MAX_CHAT_MESSAGES) {
    return messages;
  }

  return messages.slice(messages.length - MAX_CHAT_MESSAGES);
}

let puterScriptPromise: Promise<void> | null = null;

async function isPuterLoaded() {
  if (typeof window === "undefined") {
    throw new Error("puterjs is only available in the browser");
  }

  if (window.puter?.ai?.chat) {
    return;
  }

  if (!puterScriptPromise) {
    puterScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById("puterjs-sdk") as HTMLScriptElement | null;

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("failed to load puterjs sdk")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = "puterjs-sdk";
      script.src = "https://js.puter.com/v2/";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("failed to load puterjs sdk"));
      document.head.appendChild(script);
    });
  }

  await puterScriptPromise;

  if (!window.puter?.ai?.chat) {
    throw new Error("puterjs sdk loaded but ai.chat is unavailable");
  }
}

function toPuterReplyText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const candidate = value as {
    text?: string;
    content?: string;
    output?: string;
    message?: { content?: string };
  };

  if (typeof candidate.text === "string") return candidate.text;
  if (typeof candidate.content === "string") return candidate.content;
  if (typeof candidate.output === "string") return candidate.output;
  if (typeof candidate.message?.content === "string") return candidate.message.content;

  return "";
}

function toPuterErrorMessage(error: unknown): string {
  const fallback = "puterjs request failed. try another provider or re-authenticate with puter.";
  if (!(error instanceof Error)) return fallback;

  const message = error.message.toLowerCase();
  if (message.includes("401") || message.includes("unauthorized") || message.includes("whoami")) {
    return "puterjs requires an authenticated puter session. sign in to puter, then retry, or use another provider.";
  }

  return error.message || fallback;
}

function buildPuterPrompt(messages: ChatMessage[], snippet: SnippetWithTags, mode: ChatMode) {
  const modeInstruction: Record<ChatMode, string> = {
    improve: "Task mode: Improve this snippet for correctness, performance, and maintainability.",
    refactor: "Task mode: Refactor this snippet while preserving behavior.",
    debug: "Task mode: Debug this snippet and provide fixed code.",
    explain: "Task mode: Explain this snippet clearly. Only provide edits if explicitly requested.",
  };

  const conversation = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");

  return [
    "You are a senior software engineer helping improve code snippets.",
    "Give concrete fixes and include full updated code when an edit is requested.",
    modeInstruction[mode],
    "",
    `Snippet title: ${snippet.title}`,
    `Language: ${snippet.language}`,
    `Description: ${snippet.description || ""}`,
    "Current code:",
    "```",
    snippet.code,
    "```",
    "",
    "Conversation:",
    conversation,
  ].join("\n");
}

function getProviderById(id: ProviderId): ProviderOption {
  return PROVIDERS.find((provider) => provider.id === id) ?? PROVIDERS[0];
}

function extractCodeBlock(text: string): string | null {
  const fenced = text.match(/```[\w-]*\n([\s\S]*?)```/);
  if (fenced?.[1]?.trim()) {
    return fenced[1].trim();
  }
  return null;
}

type AiChatSidebarProps = {
  snippet: SnippetWithTags;
  onApplyCode: (code: string) => void;
  onMinimize?: () => void;
};

export function AiChatSidebar({ snippet, onApplyCode, onMinimize }: AiChatSidebarProps) {
  const pathname = usePathname();
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [model, setModel] = useState("gpt-5-mini");
  const [mode, setMode] = useState<ChatMode>("improve");
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puterAuthBlocked, setPuterBlocked] = useState(false);

  const providerDetails = useMemo(() => getProviderById(provider), [provider]);
  const providerModels = useMemo(() => PROVIDER_MODELS[provider] ?? [], [provider]);
  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant")?.content ?? "",
    [messages]
  );
  const canApplySuggestedCode = Boolean(extractCodeBlock(latestAssistantMessage));

  if (pathname?.startsWith("/public")) {
    return null;
  }

  useEffect(() => {
    try {
      const storedProvider = localStorage.getItem(STORAGE_KEYS.provider) as ProviderId | null;
      const selectedProvider = storedProvider && PROVIDERS.some((entry) => entry.id === storedProvider)
        ? storedProvider
        : "openai";
      const selectedProviderDetails = getProviderById(selectedProvider);
      const selectedProviderModels = PROVIDER_MODELS[selectedProvider] ?? [];
      const storedModel = localStorage.getItem(STORAGE_KEYS.model) || selectedProviderDetails.placeholderModel;
      const modelIsPreset = selectedProviderModels.includes(storedModel);

      setProvider(selectedProvider);
      setModel(storedModel);
      setUseCustomModel(!modelIsPreset);
      const storedMode = readStringSetting(SETTINGS_KEYS.aiDefaultMode, "improve") as ChatMode;
      setMode(MODE_VALUES.includes(storedMode) ? storedMode : "improve");
      setApiKey(localStorage.getItem(STORAGE_KEYS.apiKey) || "");
      setBaseUrl(localStorage.getItem(STORAGE_KEYS.baseUrl) || "http://localhost:11434");
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.provider, provider);
      localStorage.setItem(STORAGE_KEYS.model, model);
      localStorage.setItem(STORAGE_KEYS.mode, mode);
      localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
      localStorage.setItem(STORAGE_KEYS.baseUrl, baseUrl);
    } catch {
      return;
    }
  }, [apiKey, baseUrl, mode, model, provider]);

  async function sendPrompt(nextPrompt?: string) {
    const text = (nextPrompt ?? prompt).trim();
    if (!text || loading) return;

    if (providerDetails.requiresApiKey && !apiKey.trim()) {
      setError("api key is required for this provider");
      return;
    }

    if (!model.trim()) {
      setError("model is required");
      return;
    }

    setError(null);
    setLoading(true);

    const nextMessages: ChatMessage[] = trimMessages([...messages, { role: "user", content: text }]);
    setMessages(nextMessages);
    setPrompt("");

    try {
      if (provider === "puterjs") {
        if (puterAuthBlocked) {
          setError("puterjs requires an authenticated puter session. use another provider or sign in to puter and refresh.");
          setMessages((current) => current.slice(0, -1));
          return;
        }

        await isPuterLoaded();

        const result = await window.puter?.ai?.chat?.(
          buildPuterPrompt(nextMessages, snippet, mode),
          { model }
        );

        const reply = toPuterReplyText(result).trim();
        if (!reply) {
          setError("empty response from puterjs");
          setMessages((current) => current.slice(0, -1));
          return;
        }

        setPuterBlocked(false);
        setMessages((current) => trimMessages([...current, { role: "assistant", content: reply }]));
        return;
      }

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          model,
          mode,
          apiKey,
          baseUrl,
          messages: nextMessages,
          snippet: {
            title: snippet.title,
            language: snippet.language,
            description: snippet.description,
            code: snippet.code,
          },
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok || !payload.reply) {
        setError(payload.error ?? "chat request failed");
        setMessages((current) => current.slice(0, -1));
        return;
      }

      setMessages((current) => trimMessages([...current, { role: "assistant", content: payload.reply ?? "" }]));
    } catch (requestError) {
      if (provider === "puterjs") {
        const message = toPuterErrorMessage(requestError);
        setError(message);
        if (message.includes("authenticated puter session")) {
          setPuterBlocked(true);
        }
      } else {
        setError(requestError instanceof Error ? requestError.message : "chat request failed");
      }
      setMessages((current) => current.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function applySuggestedCode() {
    const code = extractCodeBlock(latestAssistantMessage);
    if (!code) {
      setError("no fenced code block found in last assistant response");
      return;
    }

    onApplyCode(code);
  }

  function clearChat() {
    setMessages([]);
    setError(null);
  }

  return (
    <aside className="flex h-full min-h-[520px] flex-col rounded-2xl border border-border/70 bg-card/70 animate-subtle-pop-in vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
      <header className="border-b border-border/70 p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Bot className="size-4" />
            ai edits
          </h2>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="xs" onClick={clearChat}>
              clear
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onMinimize}
              aria-label="minimize ai chat"
              title="minimize ai chat"
            >
              <PanelRightClose className="size-4" />
            </Button>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {providerDetails.description}
        </p>
      </header>

      <div className="space-y-2 border-b border-border/70 p-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">provider</span>
          <select
            className="h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={provider}
            onChange={(event) => {
              const next = event.target.value as ProviderId;
              const details = getProviderById(next);
              const nextProviderModels = PROVIDER_MODELS[next] ?? [];

              setProvider(next);
              if (nextProviderModels.includes(model)) {
                setUseCustomModel(false);
              } else {
                setUseCustomModel(false);
                setModel(nextProviderModels[0] ?? details.placeholderModel);
              }
            }}
          >
            {PROVIDERS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">model</span>
          <select
            className="h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={useCustomModel ? CUSTOM_MODEL_VALUE : model}
            onChange={(event) => {
              const next = event.target.value;
              if (next === CUSTOM_MODEL_VALUE) {
                setUseCustomModel(true);
                if (providerModels.includes(model)) {
                  setModel("");
                }
                return;
              }

              setUseCustomModel(false);
              setModel(next);
            }}
          >
            {providerModels.map((providerModel) => (
              <option key={providerModel} value={providerModel}>
                {providerModel}
              </option>
            ))}
            <option value={CUSTOM_MODEL_VALUE}>custom model...</option>
          </select>

          {useCustomModel && (
            <Input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder={providerDetails.placeholderModel}
              className="h-8 text-xs"
            />
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">mode</span>
          <select
            className="h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={mode}
            onChange={(event) => setMode(event.target.value as ChatMode)}
          >
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {provider === "puterjs" && (
          <p className="rounded-md border border-border/70 bg-background/60 px-2 py-1 text-[11px] text-muted-foreground">
            puterjs needs a valid puter session; unauthorized browser calls can appear as 401 in devtools.
          </p>
        )}

        {providerDetails.requiresApiKey && (
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <KeyRound className="size-3" />
              api key (stored locally)
            </span>
            <Input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="paste your api key"
              className="h-8 text-xs"
            />
          </label>
        )}

        {providerDetails.supportsBaseUrl && (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground">base url</span>
            <Input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder={provider === "ollama" ? "http://localhost:11434" : "https://your-host/v1"}
              className="h-8 text-xs"
            />
          </label>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-background/40 p-3 text-xs text-muted-foreground">
            Ask for refactors, bug fixes, tests, or performance edits.
          </div>
        ) : (
          messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                message.role === "assistant"
                  ? "border-border/70 bg-background"
                  : "border-primary/20 bg-primary/5"
              } animate-subtle-fade-up`}
            >
              <p className="mb-1 flex items-center gap-1 font-medium uppercase tracking-wide text-[10px] text-muted-foreground">
                {message.role === "assistant" ? <Sparkles className="size-3" /> : <Wand2 className="size-3" />}
                {message.role}
              </p>
              <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
            </article>
          ))
        )}
      </div>

      <footer className="space-y-2 border-t border-border/70 p-3">
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="ask for a code improvement..."
          className="min-h-20 font-mono text-xs"
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void sendPrompt();
            }
          }}
        />

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => void sendPrompt()}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {loading ? "thinking..." : "send"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applySuggestedCode}
            disabled={!canApplySuggestedCode}
          >
            apply
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">cmd/ctrl+enter to send</p>
      </footer>
    </aside>
  );
}
