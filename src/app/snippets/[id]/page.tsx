/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  Eye,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { InlineToast, type ToastTone } from "@/components/inline-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/code-block";
import { SnippetDialog } from "@/components/snippet-dialog";
import {
  deleteSnippet,
  getSnippetById,
  updateSnippet,
} from "@/lib/snippet-service";
import { timeAgo } from "@/lib/time";
import type { SnippetDraft, SnippetWithTags } from "@/lib/types";

function isTypingElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

function detailCacheKey(id: string) {
  return `snips.detail.cache.${id}`;
}

function readCachedSnippet(id: string): SnippetWithTags | null {
  if (!id || typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(detailCacheKey(id));
    if (!raw) return null;

    return JSON.parse(raw) as SnippetWithTags;
  } catch {
    return null;
  }
}

function writeCachedSnippet(snippet: SnippetWithTags) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(detailCacheKey(snippet.id), JSON.stringify(snippet));
  } catch {
    return;
  }
}

export default function SnippetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [snippet, setSnippet] = useState<SnippetWithTags | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<ToastTone>("info");

  const snippetId = useMemo(() => params?.id ?? "", [params?.id]);

  function showToast(message: string, tone: ToastTone = "info") {
    setToastMessage(message);
    setToastTone(tone);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 1800);
  }

  const copyCode = useCallback(async () => {
    if (!snippet) return;

    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopyState("done");
      showToast("copied", "success");
      setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      setCopyState("failed");
      showToast("copy failed", "error");
      setTimeout(() => setCopyState("idle"), 1200);
    }
  }, [snippet]);

  const load = useCallback(async (signal?: AbortSignal, background?: boolean) => {
    if (!snippetId) {
      setError("invalid snippet id");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const { data, error: serviceError } = await getSnippetById(snippetId, { signal });

    if (signal?.aborted) {
      return;
    }

    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    setSnippet(data);
    setLoading(false);
    setRefreshing(false);

    if (data) {
      writeCachedSnippet(data);
    }
  }, [snippetId]);

  useEffect(() => {
    const cached = readCachedSnippet(snippetId);
    if (cached) {
      queueMicrotask(() => {
        setSnippet(cached);
        setLoading(false);
      });
      void load(undefined, true);
      return;
    }

    const controller = new AbortController();
    void load(controller.signal, false);
    return () => controller.abort();
  }, [load, snippetId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!snippet || isTypingElement(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "e") {
        event.preventDefault();
        setEditOpen(true);
      }

      if (key === "c") {
        event.preventDefault();
        void copyCode();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copyCode, snippet]);

  async function handleDelete() {
    if (!snippet || deleting) return;

    const confirmed = window.confirm("delete this snippet?");
    if (!confirmed) return;

    setDeleting(true);
    setActionError(null);
    showToast("deleting snippet...", "info");

    const { error: serviceError } = await deleteSnippet(snippet.id);

    if (serviceError) {
      setActionError(serviceError);
      setDeleting(false);
      showToast(serviceError, "error");
      return;
    }

    showToast("snippet deleted", "success");
    router.push("/snippets");
  }

  async function handleEdit(draft: SnippetDraft) {
    if (!snippet) return "snippet not found";

    setActionError(null);
    showToast("saving changes...", "info");

    const { data, error: serviceError } = await updateSnippet(snippet.id, draft);

    if (serviceError) {
      setActionError(serviceError);
      showToast(serviceError, "error");
      return serviceError;
    }

    setSnippet(data);
    if (data) {
      writeCachedSnippet(data);
    }

    showToast("changes saved", "success");
    return null;
  }

  function viewRaw() {
    if (!snippet) return;

    const blob = new Blob([snippet.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    showToast("opened raw view", "info");
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

    showToast("download started", "success");
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          loading snippet...
        </p>
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
          {error ?? "snippet not found"}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-8">
      <InlineToast message={toastMessage} tone={toastTone} />

      <section className="sticky top-3 z-20 rounded-xl border border-border/70 bg-card/90 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/snippets" className="text-sm text-muted-foreground hover:text-foreground">
            <span className="inline-flex items-center gap-1">
              <ArrowLeft className="size-4" />
              back
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
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
            <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              delete
            </Button>
          </div>
        </div>
      </section>

      <header className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">{snippet.title}</h1>
          {snippet.description && (
            <p className="text-sm text-muted-foreground">{snippet.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{snippet.language}</Badge>
          {snippet.tags.map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.name}
            </Badge>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {refreshing ? "refreshing..." : `updated ${timeAgo(snippet.updated_at)}`}
          </span>
        </div>

        {actionError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {actionError}
          </p>
        )}
      </header>

      <CodeBlock code={snippet.code} language={snippet.language} />

      <SnippetDialog
        key={`${snippet.id}-${editOpen ? "edit-open" : "edit-closed"}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        initialSnippet={snippet}
        onSave={handleEdit}
      />
    </main>
  );
}
