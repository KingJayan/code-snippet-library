"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Copy, Download, Loader2, Eye, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/code-block";
import { WorkspaceSideNav } from "@/components/workspace-side-nav";
import { formatSnippetForCopy, type SnippetCopyMode } from "@/lib/copy-modes";
import {
  getPublicSnippetById,
  incrementPublicSnippetCopyCount,
  incrementPublicSnippetViewCount,
} from "@/lib/snippet-service";
import { timeAgo } from "@/lib/time";
import type { SnippetWithTags } from "@/lib/types";

export default function PublicSnippetPage() {
  const params = useParams<{ id: string }>();

  const [snippet, setSnippet] = useState<SnippetWithTags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");
  const [copyMode, setCopyMode] = useState<SnippetCopyMode>("raw");
  const countedViewRef = useRef<string | null>(null);

  const snippetId = useMemo(() => params?.id ?? "", [params?.id]);

  const load = useCallback(async () => {
    if (!snippetId) {
      setError("invalid snippet id");
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error: serviceError } = await getPublicSnippetById(snippetId);

    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      return;
    }

    setError(null);
    setSnippet(data);
    setLoading(false);
  }, [snippetId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!snippet) return;
    if (countedViewRef.current === snippet.id) return;

    countedViewRef.current = snippet.id;
    queueMicrotask(() => {
      setSnippet((current) =>
        current ? { ...current, view_count: current.view_count + 1 } : current
      );
    });
    void incrementPublicSnippetViewCount(snippet.id);
  }, [snippet]);

  async function copyCode() {
    if (!snippet) return;

    try {
      const text = formatSnippetForCopy({
        code: snippet.code,
        language: snippet.language,
        mode: copyMode,
      });

      await navigator.clipboard.writeText(text);
      void incrementPublicSnippetCopyCount(snippet.id);
      setSnippet((current) =>
        current ? { ...current, copy_count: current.copy_count + 1 } : current
      );
      setCopyState("done");
      setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      setCopyState("failed");
      setTimeout(() => setCopyState("idle"), 1200);
    }
  }

  function viewRaw() {
    if (!snippet) return;

    const blob = new Blob([snippet.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function downloadSnippet() {
    if (!snippet) return;

    const extensionByLanguage: Record<string, string> = {
      typescript: "ts",
      javascript: "js",
      python: "py",
      rust: "rs",
      go: "go",
      cpp: "cpp",
      c: "c",
      java: "java",
      html: "html",
      css: "css",
      sql: "sql",
      json: "json",
      yaml: "yml",
      markdown: "md",
      plaintext: "txt",
    };

    const fileExtension = extensionByLanguage[snippet.language] ?? "txt";
    const safeName = snippet.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "snippet";

    const blob = new Blob([snippet.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeName}.${fileExtension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4">
        <div className="inline-flex items-center">
          <span
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground animate-subtle-pop-in vfx-icon-chip"
            title="loading snippet"
            aria-hidden="true"
          >
            <Loader2 className="size-4 animate-spin" />
          </span>
          <span className="sr-only">loading snippet</span>
        </div>
      </main>
    );
  }

  if (error || !snippet) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 px-4 py-12">
        <Link href="/snippets" className="text-sm text-muted-foreground hover:text-foreground">
          <span className="inline-flex items-center gap-1">
            <ArrowLeft className="size-4" />
            back to snippets
          </span>
        </Link>
        <section className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error ?? "snippet not found or not public"}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-8 motion-safe-enter">
      <WorkspaceSideNav compactSnipsOnly snippetsHref="/snips" showPublicLink={false} showSnippetsLink />

      <section className="sticky top-3 z-20 rounded-xl border border-border/70 bg-card/90 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/70 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/snippets" className="text-sm text-muted-foreground hover:text-foreground">
            <span className="inline-flex items-center gap-1">
              <ArrowLeft className="size-4" />
              back
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={copyMode}
              onChange={(event) => setCopyMode(event.target.value as SnippetCopyMode)}
              aria-label="copy mode"
            >
              <option value="raw">raw code</option>
              <option value="markdown">markdown block</option>
              <option value="with-line-numbers">with line numbers</option>
            </select>
            <Button type="button" variant="outline" size="sm" onClick={() => void copyCode()}>
              <Copy className="size-4" />
              {copyState === "done"
                ? "copied"
                : copyState === "failed"
                  ? "failed"
                  : "copy"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={viewRaw}>
              <Eye className="size-4" />
              view raw
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={downloadSnippet}>
              <Download className="size-4" />
              download
            </Button>
          </div>
        </div>
      </section>

      <header className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">{snippet.title}</h1>
            {snippet.description && (
              <p className="text-sm text-muted-foreground">{snippet.description}</p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0">public</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{snippet.language}</Badge>
          <Badge variant="outline" className="text-[10px]">{`views ${snippet.view_count}`}</Badge>
          <Badge variant="outline" className="text-[10px]">{`copies ${snippet.copy_count}`}</Badge>
          {snippet.tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="max-w-32 truncate" title={tag.name.length > 20 ? tag.name : undefined}>
              {tag.name}
            </Badge>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {`updated ${timeAgo(snippet.updated_at)}`}
          </span>
        </div>
      </header>

      <CodeBlock code={snippet.code} language={snippet.language} />

      <footer className="rounded-xl border border-border/70 bg-muted/20 p-3 text-center text-xs text-muted-foreground vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
        <div className="inline-flex items-center gap-2">
          <span
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground animate-subtle-pop-in vfx-icon-chip"
            title="public snippet"
            aria-hidden="true"
          >
            <Globe className="size-3.5" />
          </span>
          <Link
            href="/snippets"
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground animate-subtle-pop-in vfx-icon-chip"
            title="create your own"
            aria-label="create your own"
          >
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </footer>
    </main>
  );
}
