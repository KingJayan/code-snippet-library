"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus, RefreshCw, Code2, Keyboard, Search, Loader2 } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AuthPanel } from "@/components/auth-panel";
import { FloatingActionButton } from "@/components/floating-action-button";
import { InlineToast, type ToastTone } from "@/components/inline-toast";
import { ShortcutsPanel } from "@/components/shortcuts-panel";
import { UserChip } from "@/components/user-chip";
import { WorkspaceSideNav } from "@/components/workspace-side-nav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchBar } from "@/components/search-bar";
import { SnippetCard } from "@/components/snippet-card";
import { SnippetDialog } from "@/components/snippet-dialog";
import { TagFilter } from "@/components/tag-filter";
import {
  createSnippet,
  createWorkspace,
  deleteSnippet,
  deleteWorkspace,
  listSnippets,
  listWorkspaces,
  moveSnippetToWorkspace,
  renameWorkspace,
  togglePinSnippet,
  toggleWorkspacePublic,
} from "@/lib/snippet-service";
import {
  getCurrentUser,
  sendMagicLink,
  signOutUser,
  supabase,
} from "@/lib/supabase";
import { readBoolSetting, SETTINGS_KEYS } from "@/lib/settings";
import type { SnippetDraft, SnippetSummaryWithTags, Workspace } from "@/lib/types";

const LIST_CACHE_KEY = "snips.list.cache.v1";

type SearchTokens = {
  query: string;
  tag: string | null;
  language: string | null;
  pinnedOnly: boolean;
};

function parseSearchTokens(input: string): SearchTokens {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  const queryParts: string[] = [];
  let tag: string | null = null;
  let language: string | null = null;
  let pinnedOnly = false;

  for (const part of parts) {
    const lower = part.toLowerCase();

    if (lower.startsWith("tag:")) {
      const value = lower.slice(4).trim();
      if (value) tag = value;
      continue;
    }

    if (lower.startsWith("lang:") || lower.startsWith("language:")) {
      const value = lower.includes(":") ? lower.split(":").slice(1).join(":").trim() : "";
      if (value) language = value;
      continue;
    }

    if (lower === "is:pinned" || lower === "pinned:true") {
      pinnedOnly = true;
      continue;
    }

    queryParts.push(part);
  }

  return {
    query: queryParts.join(" ").toLowerCase(),
    tag,
    language,
    pinnedOnly,
  };
}

function snippetMatchesText(snippet: SnippetSummaryWithTags, query: string) {
  if (!query) return true;

  const haystack = [
    snippet.title,
    snippet.description,
    snippet.language,
    ...snippet.tags.map((tag) => tag.name),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function isTypingElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

function getListCacheKey(workspaceId: string | null) {
  return `${LIST_CACHE_KEY}:${workspaceId ?? "none"}`;
}

function readCachedSnippets(workspaceId: string | null): SnippetSummaryWithTags[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(getListCacheKey(workspaceId));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SnippetSummaryWithTags[];
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch {
    return [];
  }
}

function writeCachedSnippets(workspaceId: string | null, next: SnippetSummaryWithTags[]) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(getListCacheKey(workspaceId), JSON.stringify(next));
  } catch {
    return;
  }
}

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<SnippetSummaryWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<ToastTone>("info");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const [workspaceEditorOpen, setWorkspaceEditorOpen] = useState(false);
  const [workspaceEditorMode, setWorkspaceEditorMode] = useState<"create" | "rename">("create");
  const [workspaceNameInput, setWorkspaceNameInput] = useState("");
  const [deleteWorkspaceOpen, setDeleteWorkspaceOpen] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [vimShortcutsEnabled, setVimShortcutsEnabled] = useState(false);
  const [selectedSnippetIndex, setSelectedSnippetIndex] = useState(0);
  const [draggingSnippetId, setDraggingSnippetId] = useState<string | null>(null);

  const listParentRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const fetchSeqRef = useRef(0);
  const activeWorkspaceIdRef = useRef<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    setToastMessage(message);
    setToastTone(tone);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 1800);
  }, []);

  useEffect(() => {
    activeWorkspaceIdRef.current = activeWorkspaceId;
  }, [activeWorkspaceId]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setShowHints(readBoolSetting(SETTINGS_KEYS.showHints, true));
    setVimShortcutsEnabled(readBoolSetting(SETTINGS_KEYS.vimShortcuts, false));

    function onSettingsChanged(event: Event) {
      const customEvent = event as CustomEvent<{ key?: string; value?: string }>;
      if (customEvent.detail?.key === SETTINGS_KEYS.showHints) {
        setShowHints(customEvent.detail.value === "1");
      }
      if (customEvent.detail?.key === SETTINGS_KEYS.vimShortcuts) {
        setVimShortcutsEnabled(customEvent.detail.value === "1");
      }
    }

    window.addEventListener("snips-settings-changed", onSettingsChanged as EventListener);
    return () => window.removeEventListener("snips-settings-changed", onSettingsChanged as EventListener);
  }, []);

  const checkSession = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const user = await getCurrentUser();
      setIsAuthenticated(Boolean(user));
      if (user?.email) {
        setEmail(user.email);
      }
      return user;
    } catch (sessionError) {
      setIsAuthenticated(false);
      setAuthError(
        sessionError instanceof Error
          ? sessionError.message
          : "failed to check session"
      );
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const fetchSnippets = useCallback(async (workspaceId: string | null, signal?: AbortSignal) => {
    const requestId = ++fetchSeqRef.current;
    const { data, error: serviceError } = await listSnippets({
      signal,
      workspaceId: workspaceId ?? undefined,
    });

    if (requestId !== fetchSeqRef.current || signal?.aborted) {
      return;
    }

    if (serviceError) {
      setError(serviceError);
      setSnippets([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const nextSnippets = data ?? [];

    setError(null);
    setSnippets(nextSnippets);
    setLoading(false);
    setRefreshing(false);
    writeCachedSnippets(workspaceId, nextSnippets);
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    const { data, error: serviceError } = await listWorkspaces();

    if (serviceError) {
      setError(serviceError);
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      return null;
    }

    const next = data ?? [];
    setWorkspaces(next);

    const currentWorkspaceId = activeWorkspaceIdRef.current;
    const resolvedActive = next.some((workspace) => workspace.id === currentWorkspaceId)
      ? currentWorkspaceId
      : (next[0]?.id ?? null);

    if (resolvedActive !== currentWorkspaceId) {
      setActiveWorkspaceId(resolvedActive);
    }

    return resolvedActive;
  }, []);

  const refreshAll = useCallback(async (options?: { background?: boolean }) => {
    const isBackground = Boolean(options?.background);
    const user = await checkSession();

    if (!user) {
      setError(null);
      setSnippets([]);
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const resolvedWorkspaceId = await fetchWorkspaces();

    if (!resolvedWorkspaceId) {
      setSnippets([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const cached = readCachedSnippets(resolvedWorkspaceId);
    if (isBackground && cached.length > 0) {
      setSnippets(cached);
      setLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
      setRefreshing(false);
    }

    setError(null);
    const controller = new AbortController();
    await fetchSnippets(resolvedWorkspaceId, controller.signal);
  }, [checkSession, fetchSnippets, fetchWorkspaces]);

  useEffect(() => {
    if (!isAuthenticated || !activeWorkspaceId) {
      return;
    }

    const cached = readCachedSnippets(activeWorkspaceId);
    if (cached.length > 0) {
      setSnippets(cached);
      setLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
      setRefreshing(false);
    }

    setError(null);
    const controller = new AbortController();
    void fetchSnippets(activeWorkspaceId, controller.signal);

    return () => controller.abort();
  }, [activeWorkspaceId, fetchSnippets, isAuthenticated]);

  useEffect(() => {
    void refreshAll({ background: true });
  }, [refreshAll]);

  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshAll({ background: true });
    });

    return () => subscription.unsubscribe();
  }, [refreshAll]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingElement(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (key === "n") {
        event.preventDefault();
        setDialogOpen(true);
      }

      if (key === "r") {
        event.preventDefault();
        showToast("syncing...", "info");
        void refreshAll({ background: false });
      }

      if (key === "?") {
        event.preventDefault();
        setShowShortcuts(true);
      }

      if (key === "escape") {
        if (dialogOpen) {
          setDialogOpen(false);
        } else if (showShortcuts) {
          setShowShortcuts(false);
        } else if (search) {
          setSearch("");
        } else if (activeTag) {
          setActiveTag(null);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTag, dialogOpen, refreshAll, search, showShortcuts, showToast]);

  const allTags = useMemo(() => {
    const unique = new Set<string>();
    for (const snippet of snippets) {
      for (const tag of snippet.tags) {
        unique.add(tag.name);
      }
    }
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [snippets]);

  const filteredSnippets = useMemo(() => {
    const tokens = parseSearchTokens(deferredSearch);

    return snippets.filter((snippet) => {
      if (tokens.pinnedOnly && !snippet.pinned) {
        return false;
      }

      if (tokens.tag && !snippet.tags.some((tag) => tag.name === tokens.tag)) {
        return false;
      }

      if (tokens.language && snippet.language.toLowerCase() !== tokens.language) {
        return false;
      }

      if (activeTag && !snippet.tags.some((tag) => tag.name === activeTag)) {
        return false;
      }

      return snippetMatchesText(snippet, tokens.query);
    });
  }, [activeTag, deferredSearch, snippets]);

  useEffect(() => {
    if (filteredSnippets.length === 0) {
      setSelectedSnippetIndex(0);
      return;
    }

    setSelectedSnippetIndex((current) => Math.min(current, filteredSnippets.length - 1));
  }, [filteredSnippets]);

  const workspaceById = useMemo(() => {
    return new Map(workspaces.map((workspace) => [workspace.id, workspace]));
  }, [workspaces]);

  const workspacePinnedTitles = useMemo(() => {
    const titlesByWorkspace: Record<string, string[]> = {};

    function collectTitles(source: SnippetSummaryWithTags[]) {
      for (const snippet of source) {
        if (!snippet.pinned || !snippet.workspace_id) continue;

        const title = snippet.title.trim() || "untitled";
        const current = titlesByWorkspace[snippet.workspace_id] ?? [];
        if (current.length < 3 && !current.includes(title)) {
          titlesByWorkspace[snippet.workspace_id] = [...current, title];
        }
      }
    }

    for (const workspace of workspaces) {
      const cached = readCachedSnippets(workspace.id);
      if (cached.length > 0) {
        collectTitles(cached);
      }
    }

    collectTitles(snippets);

    return titlesByWorkspace;
  }, [snippets, workspaces]);

  const rowVirtualizer = useVirtualizer({
    count: filteredSnippets.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 164,
    overscan: 8,
  });

  useEffect(() => {
    if (!vimShortcutsEnabled) {
      return;
    }

    function onVimListNavigation(event: KeyboardEvent) {
      if (isTypingElement(event.target)) {
        return;
      }

      if (filteredSnippets.length === 0) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key !== "j" && key !== "k") {
        return;
      }

      event.preventDefault();

      setSelectedSnippetIndex((current) => {
        const delta = key === "j" ? 1 : -1;
        const next = Math.max(0, Math.min(filteredSnippets.length - 1, current + delta));
        rowVirtualizer.scrollToIndex(next, { align: "auto" });
        return next;
      });
    }

    window.addEventListener("keydown", onVimListNavigation);
    return () => window.removeEventListener("keydown", onVimListNavigation);
  }, [filteredSnippets, rowVirtualizer, vimShortcutsEnabled]);

  async function handleCreate(draft: SnippetDraft) {
    if (!isAuthenticated) {
      return "sign in first to create snippets";
    }

    if (!activeWorkspaceId) {
      return "create a workspace first";
    }

    showToast("saving snippet...", "info");

    const { data, error: serviceError } = await createSnippet({
      ...draft,
      workspace_id: activeWorkspaceId,
    });

    if (serviceError) {
      showToast(serviceError, "error");
      return serviceError;
    }

    if (data) {
      const next = [
        {
          id: data.id,
          user_id: data.user_id,
          workspace_id: data.workspace_id,
          title: data.title,
          language: data.language,
          description: data.description,
          created_at: data.created_at,
          updated_at: data.updated_at,
          pinned: data.pinned,
          public: data.public,
          benchmark_chars: data.benchmark_chars,
          benchmark_bytes: data.benchmark_bytes,
          benchmark_bits: data.benchmark_bits,
          benchmark_lines: data.benchmark_lines,
          view_count: data.view_count,
          copy_count: data.copy_count,
          tags: data.tags,
        },
        ...snippets,
      ];

      setSnippets(next);
      writeCachedSnippets(activeWorkspaceId, next);
      showToast("snippet saved", "success");
    }

    return null;
  }

  async function handleTogglePin(id: string, pinned: boolean) {
    showToast(pinned ? "pinning..." : "unpinning...", "info");

    const { error: serviceError } = await togglePinSnippet(id, pinned);

    if (serviceError) {
      showToast(serviceError, "error");
      return;
    }

    const next = snippets.map((s) =>
      s.id === id ? { ...s, pinned } : s
    ).sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    setSnippets(next);
    writeCachedSnippets(activeWorkspaceId, next);
    showToast(pinned ? "pinned" : "unpinned", "success");
  }

  async function handleDeleteSnippet(id: string) {
    showToast("deleting...", "info");
    const { error: serviceError } = await deleteSnippet(id);
    if (serviceError) {
      showToast(serviceError, "error");
      return;
    }
    const next = snippets.filter((s) => s.id !== id);
    setSnippets(next);
    writeCachedSnippets(activeWorkspaceId, next);
    showToast("snippet deleted", "success");
  }

  async function handleCreateWorkspace() {
    setWorkspaceEditorMode("create");
    setWorkspaceNameInput("");
    setWorkspaceEditorOpen(true);
  }

  async function handleRenameWorkspace() {
    if (!activeWorkspaceId) return;
    if (!activeWorkspace) return;

    setWorkspaceEditorMode("rename");
    setWorkspaceNameInput(activeWorkspace.name);
    setWorkspaceEditorOpen(true);
  }

  async function handleSubmitWorkspaceDialog() {
    const name = workspaceNameInput.trim();
    if (!name) {
      showToast("workspace name is required", "error");
      return;
    }

    setWorkspaceBusy(true);

    if (workspaceEditorMode === "create") {
      const { data, error: serviceError } = await createWorkspace(name);
      setWorkspaceBusy(false);

      if (serviceError) {
        showToast(serviceError, "error");
        return;
      }

      if (data) {
        const next = [data, ...workspaces.filter((workspace) => workspace.id !== data.id)];
        setWorkspaces(next);
        setActiveWorkspaceId(data.id);
        setWorkspaceEditorOpen(false);
        setWorkspaceNameInput("");
        showToast("workspace created", "success");
      }

      return;
    }

    const workspaceId = activeWorkspaceId;
    if (!workspaceId) {
      setWorkspaceBusy(false);
      showToast("select a workspace first", "error");
      return;
    }

    const { error: serviceError } = await renameWorkspace(workspaceId, name);
    setWorkspaceBusy(false);

    if (serviceError) {
      showToast(serviceError, "error");
      return;
    }

    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === workspaceId ? { ...workspace, name } : workspace
      )
    );
    setWorkspaceEditorOpen(false);
    setWorkspaceNameInput("");
    showToast("workspace renamed", "success");
  }

  async function handleToggleWorkspaceShare() {
    if (!activeWorkspace) return;

    setWorkspaceBusy(true);
    const { error: serviceError } = await toggleWorkspacePublic(activeWorkspace.id, !activeWorkspace.is_public);
    setWorkspaceBusy(false);

    if (serviceError) {
      showToast(serviceError, "error");
      return;
    }

    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === activeWorkspace.id
          ? { ...workspace, is_public: !workspace.is_public }
          : workspace
      )
    );
    showToast(activeWorkspace.is_public ? "workspace is now private" : "workspace is now public", "success");
  }

  async function handleDeleteWorkspace() {
    if (!activeWorkspace) return;

    if (workspaces.length <= 1) {
      showToast("you must keep at least one workspace", "error");
      return;
    }

    setDeleteWorkspaceOpen(true);
  }

  async function handleConfirmDeleteWorkspace() {
    if (!activeWorkspace) {
      setDeleteWorkspaceOpen(false);
      return;
    }

    if (workspaces.length <= 1) {
      setDeleteWorkspaceOpen(false);
      showToast("you must keep at least one workspace", "error");
      return;
    }

    setWorkspaceBusy(true);
    const { error: serviceError } = await deleteWorkspace(activeWorkspace.id);
    setWorkspaceBusy(false);

    if (serviceError) {
      showToast(serviceError, "error");
      return;
    }

    const next = workspaces.filter((workspace) => workspace.id !== activeWorkspace.id);
    setWorkspaces(next);
    setActiveWorkspaceId(next[0]?.id ?? null);
    setSnippets([]);
    setDeleteWorkspaceOpen(false);
    showToast("workspace deleted", "success");
  }

  async function handleRefresh() {
    showToast("syncing...", "info");
    await refreshAll({ background: false });
    if (!error) {
      showToast("synced", "success");
    }
  }

  async function handleMoveSnippet(snippetId: string, targetWorkspaceId: string) {
    if (!activeWorkspaceId) {
      setDraggingSnippetId(null);
      return;
    }

    if (targetWorkspaceId === activeWorkspaceId) {
      setDraggingSnippetId(null);
      return;
    }

    const snippet = snippets.find((current) => current.id === snippetId);
    if (!snippet) {
      setDraggingSnippetId(null);
      return;
    }

    showToast("moving snippet...", "info");
    const { error: serviceError } = await moveSnippetToWorkspace(snippetId, targetWorkspaceId);
    setDraggingSnippetId(null);

    if (serviceError) {
      showToast(serviceError, "error");
      return;
    }

    const sourceNext = snippets.filter((current) => current.id !== snippetId);
    setSnippets(sourceNext);
    writeCachedSnippets(activeWorkspaceId, sourceNext);

    const movedSnippet: SnippetSummaryWithTags = {
      ...snippet,
      workspace_id: targetWorkspaceId,
      updated_at: new Date().toISOString(),
    };

    const targetCached = readCachedSnippets(targetWorkspaceId).filter(
      (current) => current.id !== snippetId
    );
    writeCachedSnippets(targetWorkspaceId, [movedSnippet, ...targetCached]);

    const targetWorkspaceName =
      workspaces.find((workspace) => workspace.id === targetWorkspaceId)?.name ?? "workspace";
    showToast(`moved to ${targetWorkspaceName}`, "success");
  }

  async function handleSendMagicLink() {
    if (!email.trim()) {
      setAuthError("email is required");
      return;
    }

    setAuthActionLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    const sendError = await sendMagicLink(email.trim());

    setAuthActionLoading(false);

    if (sendError) {
      setAuthError(sendError);
      return;
    }

    setAuthMessage("magic link sent. check your inbox.");
  }

  async function handleSignOut() {
    setAuthActionLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    const signOutError = await signOutUser();

    setAuthActionLoading(false);

    if (signOutError) {
      setAuthError(signOutError);
      return;
    }

    setAuthMessage("signed out");
    await refreshAll({ background: false });
  }

  const showAuthPanel =
    !isAuthenticated || Boolean(authError) || Boolean(authMessage);
  const activeWorkspace = activeWorkspaceId
    ? (workspaceById.get(activeWorkspaceId) ?? null)
    : null;
  const canDeleteWorkspace = workspaces.length > 1;

  const workspaceUtilities = [
    {
      id: "new",
      label: "new",
      onClick: () => void handleCreateWorkspace(),
      disabled: !isAuthenticated || workspaceBusy,
    },
    {
      id: "rename",
      label: "rename",
      onClick: () => void handleRenameWorkspace(),
      disabled: !isAuthenticated || !activeWorkspace || workspaceBusy,
    },
    {
      id: "share",
      label: activeWorkspace?.is_public ? "make private" : "make public",
      onClick: () => void handleToggleWorkspaceShare(),
      disabled: !isAuthenticated || !activeWorkspace || workspaceBusy,
    },
    {
      id: "delete",
      label: "delete",
      onClick: () => void handleDeleteWorkspace(),
      disabled: !isAuthenticated || !activeWorkspace || workspaceBusy || !canDeleteWorkspace,
      destructive: true,
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 motion-safe-enter">
      <WorkspaceSideNav
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={(workspaceId) => setActiveWorkspaceId(workspaceId)}
        onSnippetDropToWorkspace={(snippetId, workspaceId) => {
          void handleMoveSnippet(snippetId, workspaceId);
        }}
        draggingSnippetId={draggingSnippetId}
        canSelect={isAuthenticated}
        actions={workspaceUtilities}
        workspacePinnedTitles={workspacePinnedTitles}
        showPublicLink
      />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <AppLogo />
          {showHints && (
            <div className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-background/60 px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground animate-subtle-pop-in select-none">
              <Keyboard className="size-2.5 shrink-0" />
              <span>n · cmd+↵</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && email && <UserChip email={email} />}
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleRefresh()}
            disabled={loading}
          >
            <RefreshCw className={loading || refreshing ? "size-4 animate-spin" : "size-4"} />
            refresh
          </Button>
          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            disabled={!isAuthenticated || !activeWorkspaceId}
          >
            <Plus className="size-4" />
            new snippet
          </Button>
        </div>
      </header>

      <InlineToast message={toastMessage} tone={toastTone} />

      {showAuthPanel && (
        <AuthPanel
          email={email}
          setEmail={setEmail}
          isAuthenticated={isAuthenticated}
          authLoading={authLoading}
          authActionLoading={authActionLoading}
          authMessage={authMessage}
          authError={authError}
          onSendMagicLink={handleSendMagicLink}
          onSignOut={handleSignOut}
          onRefreshSession={handleRefresh}
        />
      )}

      <section className="rounded-2xl border border-border/70 bg-card/70 p-3 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
        <div className="space-y-3">
          <SearchBar value={search} onChange={setSearch} inputRef={searchInputRef} />
          {showHints && (
            <p className="inline-flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground animate-subtle-pop-in select-none">
              <Search className="size-3 shrink-0" />
              power search: <span className="font-mono">tag:react</span> · <span className="font-mono">lang:ts</span> · <span className="font-mono">is:pinned</span>
            </p>
          )}
          <TagFilter tags={allTags} activeTag={activeTag} onTagChange={setActiveTag} />
        </div>
      </section>

      {error && (
        <section className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </section>
      )}

      {!loading && isAuthenticated && (
        <section className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>{filteredSnippets.length} snippets</span>
          {activeTag && <span>filter: {activeTag}</span>}
        </section>
      )}

      {loading ? (
        <section className="grid gap-3" aria-live="polite">
          <div className="inline-flex items-center">
            <span
              className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground animate-subtle-pop-in vfx-icon-chip"
              title="loading snippets"
              aria-hidden="true"
            >
              <Loader2 className="size-3.5 animate-spin" />
            </span>
            <span className="sr-only">loading snippets</span>
          </div>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-40 animate-pulse rounded-xl border border-border/50 bg-muted/40"
            />
          ))}
        </section>
      ) : filteredSnippets.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-12 text-center">
          <Code2 className="mx-auto size-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-sm font-medium">
            {snippets.length === 0 ? "no snippets yet" : "no snippets found"}
          </h2>
          <div className="mt-1 inline-flex items-center justify-center">
            <span
              className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground animate-subtle-pop-in vfx-icon-chip"
              title={snippets.length === 0 ? "press n to create your first snippet" : "adjust search or filters"}
              aria-hidden="true"
            >
              {snippets.length === 0 ? <Keyboard className="size-3.5" /> : <Search className="size-3.5" />}
            </span>
            <span className="sr-only">
              {snippets.length === 0 ? "press n to create your first snippet" : "adjust search/filter or add a new snippet"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {snippets.length === 0 ? (
              <>
                press <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">n</kbd> to create your first one
              </>
            ) : (
              "adjust search/filter or add a new snippet"
            )}
          </p>
        </section>
      ) : (
        <section
          ref={listParentRef}
          className="h-[62vh] overflow-y-auto rounded-2xl border border-border/70 bg-card/30 p-2 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow"
        >
          <div
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((row) => {
              const snippet = filteredSnippets[row.index];
              if (!snippet) return null;

              return (
                <div
                  key={snippet.id}
                  className="absolute top-0 left-0 w-full p-1"
                  style={{ transform: `translateY(${row.start}px)` }}
                >
                  <SnippetCard
                    snippet={snippet}
                    selected={vimShortcutsEnabled && row.index === selectedSnippetIndex}
                    onTagClick={(tag) => setActiveTag(tag)}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDeleteSnippet}
                    onDragStart={(id) => setDraggingSnippetId(id)}
                    onDragEnd={() => setDraggingSnippetId(null)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      <SnippetDialog
        key={dialogOpen ? "new-open" : "new-closed"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleCreate}
      />

      <Dialog
        open={workspaceEditorOpen}
        onOpenChange={(open) => {
          setWorkspaceEditorOpen(open);
          if (!open) {
            setWorkspaceNameInput("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border-border/70">
          <DialogHeader>
            <DialogTitle>
              {workspaceEditorMode === "create" ? "new workspace" : "rename workspace"}
            </DialogTitle>
            <DialogDescription>
              {workspaceEditorMode === "create"
                ? "create a focused workspace for your snippets"
                : "update the workspace name"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">workspace name</label>
            <Input
              value={workspaceNameInput}
              onChange={(event) => setWorkspaceNameInput(event.target.value)}
              placeholder="workspace name"
              maxLength={80}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSubmitWorkspaceDialog();
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWorkspaceEditorOpen(false)}
              disabled={workspaceBusy}
            >
              cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmitWorkspaceDialog()}
              disabled={workspaceBusy}
            >
              {workspaceEditorMode === "create" ? "create" : "save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteWorkspaceOpen} onOpenChange={setDeleteWorkspaceOpen}>
        <DialogContent className="max-w-md rounded-2xl border-border/70">
          <DialogHeader>
            <DialogTitle>delete workspace</DialogTitle>
            <DialogDescription>
              {canDeleteWorkspace
                ? (
                  <>
                    delete <span className="font-medium">{activeWorkspace?.name ?? "workspace"}</span> and all snippets in it. this cannot be undone.
                  </>
                )
                : "you must keep at least one workspace."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteWorkspaceOpen(false)}
              disabled={workspaceBusy}
            >
              cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleConfirmDeleteWorkspace()}
              disabled={workspaceBusy || !canDeleteWorkspace}
            >
              delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShortcutsPanel
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={[
          { key: "/", action: "focus search" },
          { key: "n", action: "new snippet" },
          { key: "r", action: "refresh snippets" },
          { key: "?", action: "show shortcuts" },
          { key: "esc", action: "close dialog / clear search / clear tag filter" },
        ]}
      />

      <FloatingActionButton
        onClick={() => setDialogOpen(true)}
        disabled={!isAuthenticated || !activeWorkspaceId}
      />
    </main>
  );
}
