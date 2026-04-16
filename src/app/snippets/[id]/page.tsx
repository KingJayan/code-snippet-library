"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Pin,
  Share2,
  Globe,
  Lock,
  PanelRightOpen,
  Play,
} from "lucide-react";
import { InlineToast, type ToastTone } from "@/components/inline-toast";
import { AiChatSidebar } from "@/components/ai-chat-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CodeBlock } from "@/components/code-block";
import { CodeEditor } from "@/components/code-editor";
import { WorkspaceSideNav } from "@/components/workspace-side-nav";
import { LANGUAGE_OPTIONS } from "@/lib/constants";
import {
  deleteSnippet,
  getSnippetById,
  incrementSnippetCopyCount,
  incrementSnippetViewCount,
  listSnippets,
  togglePinSnippet,
  togglePublicSnippet,
  updateSnippet,
} from "@/lib/snippet-service";
import { formatSnippetForCopy, type SnippetCopyMode } from "@/lib/copy-modes";
import { isAiSimilarityEnabled, rankSimilarSnippets, type SimilarSnippetResult } from "@/lib/ai/client-tools";
import { readBoolSetting, SETTINGS_KEYS } from "@/lib/settings";
import { timeAgo } from "@/lib/time";
import { renderMarkdown as renderMarkdownDescription } from "@/lib/utils";
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
  const [editingMode, setEditingMode] = useState(false);
  const [editingDraft, setEditingDraft] = useState<SnippetDraft | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [editingSaving, setEditingSaving] = useState(false);
  const [editingTagsInput, setEditingTagsInput] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");
  const [shareState, setShareState] = useState<"idle" | "done" | "failed">("idle");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<ToastTone>("info");
  const [aiCodeOverride, setAiCodeOverride] = useState<string | null>(null);
  const [aiChatMinimized, setAiChatMinimized] = useState(false);
  const [renderAiChat, setRenderAiChat] = useState(true);
  const [similarityEnabled, setSimilarityEnabled] = useState(false);
  const [similarityLoading, setSimilarityLoading] = useState(false);
  const [similarityError, setSimilarityError] = useState<string | null>(null);
  const [similarSnippets, setSimilarSnippets] = useState<SimilarSnippetResult[]>([]);
  const [vimShortcutsEnabled, setVimShortcutsEnabled] = useState(false);
  const [executionStats, setExecutionStats] = useState<{
    runtimeMs: number | null;
    memoryKb: number | null;
  } | null>(null);
  const [copyMode, setCopyMode] = useState<SnippetCopyMode>("raw");
  const countedViewRef = useRef<string | null>(null);

  const snippetId = useMemo(() => params?.id ?? "", [params?.id]);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    setToastMessage(message);
    setToastTone(tone);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 1800);
  }, []);

  const copyCode = useCallback(async () => {
    if (!snippet) return;

    try {
      const text = formatSnippetForCopy({
        code: snippet.code,
        language: snippet.language,
        mode: copyMode,
      });

      await navigator.clipboard.writeText(text);
      void incrementSnippetCopyCount(snippet.id);
      setSnippet((current) =>
        current ? { ...current, copy_count: current.copy_count + 1 } : current
      );
      setCopyState("done");
      showToast(`copied (${copyMode})`, "success");
      setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      setCopyState("failed");
      showToast("copy failed", "error");
      setTimeout(() => setCopyState("idle"), 1200);
    }
  }, [copyMode, showToast, snippet]);

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
    if (!snippet) return;
    if (countedViewRef.current === snippet.id) return;

    countedViewRef.current = snippet.id;
    setSnippet((current) =>
      current ? { ...current, view_count: current.view_count + 1 } : current
    );
    void incrementSnippetViewCount(snippet.id);
  }, [snippet]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!snippet) {
        return;
      }

      const key = event.key.toLowerCase();
      const isEditableElement = isTypingElement(event.target);

      if (key === "escape" && editingMode) {
        event.preventDefault();
        cancelEditing();
        return;
      }

      if (isEditableElement) {
        return;
      }

      if (key === "e") {
        event.preventDefault();
        if (!editingMode) {
          startEditing();
        }
      }

      if (key === "c") {
        event.preventDefault();
        void copyCode();
      }

      if (vimShortcutsEnabled && key === "y") {
        event.preventDefault();
        void copyCode();
      }

      if (vimShortcutsEnabled && key === "p") {
        event.preventDefault();
        const currentSnippet = snippet;
        if (!currentSnippet) {
          return;
        }

        const newPinnedState = !currentSnippet.pinned;
        setActionError(null);
        showToast(newPinnedState ? "pinning..." : "unpinning...", "info");

        void (async () => {
          const { error: serviceError } = await togglePinSnippet(currentSnippet.id, newPinnedState);

          if (serviceError) {
            setActionError(serviceError);
            showToast(serviceError, "error");
            return;
          }

          const updated = { ...currentSnippet, pinned: newPinnedState };
          setSnippet(updated);
          writeCachedSnippet(updated);
          showToast(newPinnedState ? "pinned" : "unpinned", "success");
        })();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copyCode, showToast, snippet, vimShortcutsEnabled, editingMode]);

  useEffect(() => {
    if (!aiChatMinimized) {
      setRenderAiChat(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setRenderAiChat(false);
    }, 240);

    return () => window.clearTimeout(timeout);
  }, [aiChatMinimized]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setSimilarityEnabled(isAiSimilarityEnabled());
    setVimShortcutsEnabled(readBoolSetting(SETTINGS_KEYS.vimShortcuts, false));
    const aiPanelOpen = readBoolSetting(SETTINGS_KEYS.aiPanelOpenByDefault, true);
    setAiChatMinimized(!aiPanelOpen);
    setRenderAiChat(aiPanelOpen);

    function onSettingsChange() {
      setSimilarityEnabled(isAiSimilarityEnabled());
      setVimShortcutsEnabled(readBoolSetting(SETTINGS_KEYS.vimShortcuts, false));

      const openByDefault = readBoolSetting(SETTINGS_KEYS.aiPanelOpenByDefault, true);
      if (openByDefault) {
        setRenderAiChat(true);
        setAiChatMinimized(false);
      } else {
        setAiChatMinimized(true);
      }
    }

    window.addEventListener("snips-settings-changed", onSettingsChange);
    return () => window.removeEventListener("snips-settings-changed", onSettingsChange);
  }, []);

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
    setAiCodeOverride(null);

    showToast("changes saved", "success");
    return null;
  }

  function startEditing() {
    if (!snippet) return;
    setEditingMode(true);
    setEditingDraft({
      title: snippet.title,
      language: snippet.language,
      description: snippet.description,
      code: aiCodeOverride || snippet.code,
      tags: snippet.tags.map((t) => t.name),
    });
    setEditingTagsInput(snippet.tags.map((t) => t.name).join(", "));
    setEditingError(null);
  }

  function cancelEditing() {
    setEditingMode(false);
    setEditingDraft(null);
    setEditingTagsInput("");
    setEditingError(null);
  }

  async function saveEditing() {
    if (!editingDraft) return;

    const tags = [...new Set(
      editingTagsInput
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )];

    if (!editingDraft.title.trim()) {
      setEditingError("title is required");
      return;
    }

    if (!editingDraft.code.trim()) {
      setEditingError("code is required");
      return;
    }

    setEditingSaving(true);
    setEditingError(null);

    const error = await handleEdit({
      ...editingDraft,
      tags,
    });

    if (!error) {
      setEditingMode(false);
      setAiCodeOverride(null);
    }

    setEditingSaving(false);
  }

  function applyAiCodeSuggestion(nextCode: string) {
    setAiCodeOverride(nextCode);
    showToast("ai suggestion loaded into editor", "success");
    window.setTimeout(() => {
      startEditing();
    }, 100);
  }

  async function handleFindSimilar() {
    if (!snippet) return;

    setSimilarityLoading(true);
    setSimilarityError(null);

    try {
      const { data: summaries, error: summaryError } = await listSnippets({
        workspaceId: snippet.workspace_id,
        limit: 30,
      });

      if (summaryError) {
        throw new Error(summaryError);
      }

      const candidates = (summaries ?? [])
        .filter((candidate) => candidate.id !== snippet.id)
        .slice(0, 12);

      if (candidates.length === 0) {
        setSimilarSnippets([]);
        return;
      }

      const detailedResults = await Promise.all(
        candidates.map(async (candidate) => {
          const { data } = await getSnippetById(candidate.id);
          return data;
        })
      );

      const detailedCandidates = detailedResults.filter(Boolean) as SnippetWithTags[];

      if (detailedCandidates.length === 0) {
        setSimilarSnippets([]);
        return;
      }

      const ranked = await rankSimilarSnippets({
        target: snippet,
        candidates: detailedCandidates,
      });

      setSimilarSnippets(ranked);
    } catch (findError) {
      setSimilarityError(findError instanceof Error ? findError.message : "failed to find similar snippets");
    } finally {
      setSimilarityLoading(false);
    }
  }

  const handleTogglePin = useCallback(async () => {
    if (!snippet) return;

    const newPinnedState = !snippet.pinned;
    setActionError(null);
    showToast(newPinnedState ? "pinning..." : "unpinning...", "info");

    const { error: serviceError } = await togglePinSnippet(snippet.id, newPinnedState);

    if (serviceError) {
      setActionError(serviceError);
      showToast(serviceError, "error");
      return;
    }

    const updated = { ...snippet, pinned: newPinnedState };
    setSnippet(updated);
    writeCachedSnippet(updated);
    showToast(newPinnedState ? "pinned" : "unpinned", "success");
  }, [showToast, snippet]);

  async function handleShare() {
    if (!snippet) return;

    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const detailPath = `/snippets/${snippet.id}`;
      const url = snippet.public ? `${baseUrl}/public/${snippet.id}` : `${baseUrl}${detailPath}`;
      await navigator.clipboard.writeText(url);
      setShareState("done");
      showToast(snippet.public ? "public link copied" : "link copied", "success");
      setTimeout(() => setShareState("idle"), 1200);
    } catch {
      setShareState("failed");
      showToast("share failed", "error");
      setTimeout(() => setShareState("idle"), 1200);
    }
  }

  async function handleTogglePublic() {
    if (!snippet) return;

    const newPublicState = !snippet.public;
    setActionError(null);
    showToast(newPublicState ? "making public..." : "making private...", "info");

    const { error: serviceError } = await togglePublicSnippet(snippet.id, newPublicState);

    if (serviceError) {
      setActionError(serviceError);
      showToast(serviceError, "error");
      return;
    }

    const updated = { ...snippet, public: newPublicState };
    setSnippet(updated);
    writeCachedSnippet(updated);
    showToast(newPublicState ? "snippet is now public" : "snippet is now private", "success");
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:gap-6 sm:py-8">
      <InlineToast message={toastMessage} tone={toastTone} />

      <WorkspaceSideNav 
        compactSnipsOnly 
        snippetsHref="/snippets" 
        showPublicLink={false} 
        showPlaygroundLink 
        playgroundSnippetId={snippet.id}
      />

      <section className="sticky top-2 z-20 rounded-2xl border border-border/70 bg-card/90 p-2.5 backdrop-blur supports-[backdrop-filter]:bg-card/70 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow sm:p-3">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          <Link href="/snippets" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
            <span className="inline-flex items-center gap-1">
              <ArrowLeft className="size-4" />
              back
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <select
              className="h-7 sm:h-8 rounded-md border border-input bg-background px-1.5 sm:px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={copyMode}
              onChange={(event) => setCopyMode(event.target.value as SnippetCopyMode)}
              aria-label="copy mode"
            >
              <option value="raw">raw code</option>
              <option value="markdown">markdown block</option>
              <option value="line-numbers">with line numbers</option>
            </select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => void copyCode()}
                    aria-label="copy"
                  >
                    <Copy className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>
                  {copyState === "done" ? "copied" : copyState === "failed" ? "failed" : "copy"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => void handleShare()}
                    aria-label="share"
                  >
                    <Share2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>
                  {shareState === "done" ? "copied" : shareState === "failed" ? "failed" : "share"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={snippet.public ? "default" : "outline"}
                    size="icon-sm"
                    onClick={() => void handleTogglePublic()}
                    aria-label={snippet.public ? "public" : "private"}
                  >
                    {snippet.public ? <Globe className="size-4" /> : <Lock className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>{snippet.public ? "public" : "private"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="icon-sm" onClick={viewRaw} aria-label="view raw">
                    <Eye className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>view raw</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={downloadSnippet}
                    aria-label="download"
                  >
                    <Download className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>download</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={snippet.pinned ? "default" : "outline"}
                    size="icon-sm"
                    onClick={() => void handleTogglePin()}
                    aria-label={snippet.pinned ? "pinned" : "pin"}
                  >
                    <Pin className={`size-4 ${snippet.pinned ? "fill-current" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>{snippet.pinned ? "pinned" : "pin"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => startEditing()}
                    aria-label="edit"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>edit</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    aria-label="delete"
                  >
                    {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </section>

      <header className={`space-y-2 rounded-2xl border border-border/70 p-3 sm:space-y-3 sm:p-4 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow ${
        editingMode ? "bg-card/80 border-accent/50" : "bg-card/70"
      }`}>
        {editingMode && editingDraft ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-tight text-muted-foreground">editing snippet</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={editingSaving}
                >
                  cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => void saveEditing()}
                  disabled={editingSaving}
                >
                  {editingSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  {editingSaving ? "saving..." : "save"}
                </Button>
              </div>
            </div>

            {editingError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {editingError}
              </p>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">title</span>
              <Input
                value={editingDraft.title}
                onChange={(e) => setEditingDraft({ ...editingDraft, title: e.target.value })}
                placeholder="title"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">description</span>
              <Textarea
                value={editingDraft.description}
                onChange={(e) => setEditingDraft({ ...editingDraft, description: e.target.value })}
              placeholder="description (optional)"
                className="h-16 resize-none"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">language</span>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={editingDraft.language}
                  onChange={(e) => setEditingDraft({ ...editingDraft, language: e.target.value })}
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">tags (comma separated)</span>
                <Input
                  value={editingTagsInput}
                  onChange={(e) => setEditingTagsInput(e.target.value)}
                  placeholder="react, typescript"
                />
              </label>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <h1 className="text-xl font-semibold tracking-tight">{snippet.title}</h1>
                {snippet.description && (
                  <div
                    className="text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownDescription(snippet.description) }}
                  />
                )}
              </div>
              {snippet.public && (
                <Badge variant="default" className="shrink-0">
                  <Globe className="size-3 mr-1" />
                  public
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{snippet.language}</Badge>
              <Badge variant="outline" className="text-[10px]">{`chars ${snippet.benchmark_chars ?? 0}`}</Badge>
              <Badge variant="outline" className="text-[10px]">{`bytes ${snippet.benchmark_bytes ?? 0}`}</Badge>
              <Badge variant="outline" className="text-[10px]">{`bits ${snippet.benchmark_bits ?? 0}`}</Badge>
              <Badge variant="outline" className="text-[10px]">{`lines ${snippet.benchmark_lines ?? 0}`}</Badge>
              <Badge variant="outline" className="text-[10px]">{`views ${snippet.view_count}`}</Badge>
              <Badge variant="outline" className="text-[10px]">{`copies ${snippet.copy_count}`}</Badge>
              {executionStats?.runtimeMs !== null && executionStats?.runtimeMs !== undefined && (
                <Badge variant="outline" className="text-[10px]">{`runtime ${executionStats.runtimeMs}ms`}</Badge>
              )}
              {executionStats?.memoryKb !== null && executionStats?.memoryKb !== undefined && (
                <Badge variant="outline" className="text-[10px]">{`memory ${executionStats.memoryKb}kb`}</Badge>
              )}
              {snippet.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="max-w-32 truncate" title={tag.name.length > 20 ? tag.name : undefined}>
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
          </>
        )}
      </header>

      <section className={renderAiChat ? "grid items-start gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_380px]" : "space-y-3"}>
        <div className="space-y-2 sm:space-y-3">
          {aiChatMinimized && (
            <div className="flex justify-end animate-subtle-fade-up">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="transition-all duration-200 ease-out"
                onClick={() => {
                  setRenderAiChat(true);
                  setAiChatMinimized(false);
                }}
              >
                <PanelRightOpen className="size-4" />
                open ai chat
              </Button>
            </div>
          )}
          
          <section className="rounded-2xl border border-border/70 bg-card/70 p-3 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-tight">playground</h2>
              <Link href={`/playground/${snippet.id}`} passHref legacyBehavior>
                <Button type="button" variant="outline" size="sm" asChild>
                  <a>
                    <Play className="size-4" />
                    open playground
                  </a>
                </Button>
              </Link>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              test and run this code in an isolated environment
            </p>
          </section>

          {editingMode && editingDraft ? (
            <section className="rounded-2xl border border-border/70 border-accent/50 bg-card/70 p-3 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground">code</span>
                <CodeEditor
                  value={editingDraft.code}
                  onChange={(value) => setEditingDraft({ ...editingDraft, code: value })}
                  language={editingDraft.language}
                  className="h-[50vh] min-h-[280px] sm:h-[56vh] sm:min-h-[360px] lg:h-[62vh] lg:max-h-[780px] overflow-hidden rounded-md border border-input"
                />
              </label>
            </section>
          ) : (
            <CodeBlock
              code={snippet.code}
              language={snippet.language}
              className="h-[50vh] min-h-[280px] sm:h-[56vh] sm:min-h-[360px] lg:h-[62vh] lg:max-h-[780px]"
            />
          )}

          {similarityEnabled && (
            <section className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-3 animate-subtle-fade-up vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold tracking-tight">ai similar snippets</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleFindSimilar()}
                  disabled={similarityLoading}
                >
                  {similarityLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  {similarityLoading ? "searching..." : "find similar"}
                </Button>
              </div>

              {similarityError && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                  {similarityError}
                </p>
              )}

              {similarSnippets.length > 0 ? (
                <ul className="space-y-2">
                  {similarSnippets.map((item) => (
                    <li key={item.id} className="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/snippets/${item.id}`} className="truncate text-sm font-medium hover:underline">
                          {item.title}
                        </Link>
                        <Badge variant="outline" className="text-[10px]">{item.score}%</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">run search to discover related snippets.</p>
              )}
            </section>
          )}
        </div>

        {renderAiChat && (
          <div
            className={`h-[50vh] min-h-[320px] sm:h-[56vh] sm:min-h-[420px] lg:h-[62vh] lg:min-h-[520px] lg:max-h-[780px] overflow-hidden transition-all duration-300 ease-out xl:sticky xl:top-24 ${
              aiChatMinimized
                ? "pointer-events-none max-h-0 translate-y-2 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <AiChatSidebar
              snippet={snippet}
              onApplyCode={applyAiCodeSuggestion}
              onMinimize={() => setAiChatMinimized(true)}
            />
          </div>
        )}
      </section>
    </main>
  );
}
