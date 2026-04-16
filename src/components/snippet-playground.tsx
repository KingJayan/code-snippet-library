"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  executeInBrowser,
  type BrowserExecutionResult,
} from "@/lib/execution/browser-runner";
import { renderMarkdown } from "@/lib/utils";

type PlaygroundLanguage = "python" | "cpp" | "txt" | "md";

type SnippetPlaygroundProps = {
  initialCode: string;
  initialLanguage: string;
  onExecutionStats?: (stats: { runtimeMs: number | null; memoryKb: number | null }) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

const LANGUAGE_OPTIONS: Array<{ value: PlaygroundLanguage; label: string }> = [
  { value: "python", label: "python" },
  { value: "cpp", label: "c++" },
  { value: "txt", label: "txt" },
  { value: "md", label: "md" },
];

function toPlaygroundLanguage(language: string): PlaygroundLanguage {
  if (language === "python" || language === "cpp" || language === "txt" || language === "md") {
    return language;
  }

  if (language === "markdown") {
    return "md";
  }

  if (language === "plaintext") {
    return "txt";
  }

  return "python";
}

export function SnippetPlayground({
  initialCode,
  initialLanguage,
  onExecutionStats,
  onDirtyChange,
}: SnippetPlaygroundProps) {
  const [language, setLanguage] = useState<PlaygroundLanguage>(() => toPlaygroundLanguage(initialLanguage));
  const [code, setCode] = useState(initialCode);
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BrowserExecutionResult | null>(null);

  const lineCount = useMemo(() => (code.length === 0 ? 0 : code.split("\n").length), [code]);
  const isDirty = code !== initialCode;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  async function runCode() {
    setRunning(true);
    setError(null);

    try {
      const payload = await executeInBrowser({
        language,
        code,
        stdin,
      });

      setResult(payload);
      onExecutionStats?.({
        runtimeMs: payload.runtimeMs,
        memoryKb: payload.memoryKb,
      });
    } catch (executionError) {
      setResult(null);
      setError(executionError instanceof Error ? executionError.message : "execution failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-3 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">playground</h2>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as PlaygroundLanguage)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            onClick={() => void runCode()}
            disabled={running || language === "txt" || language === "md"}
            title={language === "txt" ? "plain text files can't be run" : language === "md" ? "use preview tab for markdown" : undefined}
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {running ? "running..." : "run"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        python runs locally in-browser via pyodide. c++ is disabled in hosted mode.
        {language === "txt" && " plain text files have no runnable output."}
      </p>

      <div className={`grid gap-3 ${language !== "txt" && language !== "md" ? "lg:grid-cols-[minmax(0,1fr)_300px]" : ""}`}>
        <label className="flex min-h-0 flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            {language === "md" ? "markdown source" : language === "txt" ? "text content" : `code editor (${lineCount} lines)`}
          </span>
          <Textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="min-h-64 font-mono text-xs leading-relaxed"
            placeholder={language === "md" ? "write markdown..." : language === "txt" ? "plain text..." : "write or paste runnable code"}
            data-vim-editor="1"
          />
        </label>

        {language !== "txt" && language !== "md" && (
          <label className="flex min-h-0 flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">input panel (stdin)</span>
            <Textarea
              value={stdin}
              onChange={(event) => setStdin(event.target.value)}
              className="min-h-64 font-mono text-xs leading-relaxed"
              placeholder="optional stdin input"
            />
          </label>
        )}
      </div>

      {language === "md" && (
        <div className="rounded-xl border border-border/70 bg-background/40 p-4">
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">preview</h3>
          {code.trim() ? (
            <div
              className="prose prose-sm max-w-none text-sm text-foreground dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(code) }}
            />
          ) : (
            <p className="text-xs text-muted-foreground">(nothing to preview)</p>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {language !== "txt" && language !== "md" && (
        <div className="space-y-2 rounded-xl border border-border/70 bg-background/40 p-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>runtime: {result?.runtimeMs ?? "-"} ms</span>
            <span>memory: {result?.memoryKb ?? "-"} kb</span>
          </div>

          <div className="grid gap-2 lg:grid-cols-2">
            <section className="min-h-28 max-h-96 resize-y overflow-auto rounded-lg border border-border/70 bg-background/70 p-2">
              <h3 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">output</h3>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                {result?.stdout || "(empty)"}
              </pre>
            </section>
            <section className="min-h-28 max-h-96 resize-y overflow-auto rounded-lg border border-border/70 bg-background/70 p-2">
              <h3 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">errors</h3>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-destructive">
                {result?.stderr || "(none)"}
              </pre>
            </section>
          </div>
        </div>
      )}
    </section>
  );
}
