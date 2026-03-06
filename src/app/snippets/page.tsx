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
import { Plus, RefreshCw } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AuthPanel } from "@/components/auth-panel";
import { InlineToast, type ToastTone } from "@/components/inline-toast";
import { UserChip } from "@/components/user-chip";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-bar";
import { SnippetCard } from "@/components/snippet-card";
import { SnippetDialog } from "@/components/snippet-dialog";
import { TagFilter } from "@/components/tag-filter";
import { createSnippet, listSnippets } from "@/lib/snippet-service";
import {
  getCurrentUser,
  sendMagicLink,
  signOutUser,
  supabase,
} from "@/lib/supabase";
import type { SnippetDraft, SnippetSummaryWithTags } from "@/lib/types";

const LIST_CACHE_KEY = "snips.list.cache.v1";

function isTypingElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

function readCachedSnippets(): SnippetSummaryWithTags[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(LIST_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SnippetSummaryWithTags[];
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch {
    return [];
  }
}

function writeCachedSnippets(next: SnippetSummaryWithTags[]) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(LIST_CACHE_KEY, JSON.stringify(next));
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<ToastTone>("info");

  const listParentRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);

  function showToast(message: string, tone: ToastTone = "info") {
    setToastMessage(message);
    setToastTone(tone);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 1800);
  }

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

  const fetchSnippets = useCallback(async (signal?: AbortSignal) => {
    const requestId = ++requestIdRef.current;
    const { data, error: serviceError } = await listSnippets({ signal });

    if (requestId !== requestIdRef.current || signal?.aborted) {
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
    writeCachedSnippets(nextSnippets);
  }, []);

  const refreshAll = useCallback(async (options?: { background?: boolean }) => {
    const isBackground = Boolean(options?.background);
    const user = await checkSession();

    if (!user) {
      setError(null);
      setSnippets([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const cached = readCachedSnippets();
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
    await fetchSnippets(controller.signal);
  }, [checkSession, fetchSnippets]);

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

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        setDialogOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
    const query = deferredSearch.trim().toLowerCase();

    return snippets.filter((snippet) => {
      if (activeTag && !snippet.tags.some((tag) => tag.name === activeTag)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        snippet.title,
        snippet.description,
        snippet.language,
        ...snippet.tags.map((tag) => tag.name),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [activeTag, deferredSearch, snippets]);

  const rowVirtualizer = useVirtualizer({
    count: filteredSnippets.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 164,
    overscan: 8,
  });

  async function handleCreate(draft: SnippetDraft) {
    if (!isAuthenticated) {
      return "sign in first to create snippets";
    }

    showToast("saving snippet...", "info");

    const { data, error: serviceError } = await createSnippet(draft);

    if (serviceError) {
      showToast(serviceError, "error");
      return serviceError;
    }

    if (data) {
      const next = [
        {
          id: data.id,
          user_id: data.user_id,
          title: data.title,
          language: data.language,
          description: data.description,
          created_at: data.created_at,
          updated_at: data.updated_at,
          tags: data.tags,
        },
        ...snippets,
      ];

      setSnippets(next);
      writeCachedSnippets(next);
      showToast("snippet saved", "success");
    }

    return null;
  }

  async function handleRefresh() {
    showToast("syncing...", "info");
    await refreshAll({ background: false });
    if (!error) {
      showToast("synced", "success");
    }
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <AppLogo />
          <p className="text-sm text-muted-foreground">
            quick add with <span className="font-medium">n</span>, save with {" "}
            <span className="font-medium">cmd/ctrl+enter</span>
          </p>
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
            disabled={!isAuthenticated}
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

      <section className="rounded-2xl border border-border/70 bg-card/70 p-3">
        <div className="space-y-3">
          <SearchBar value={search} onChange={setSearch} />
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
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-40 animate-pulse rounded-xl border border-border/50 bg-muted/40"
            />
          ))}
        </section>
      ) : filteredSnippets.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
          <h2 className="text-sm font-medium">no snippets found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            adjust search/filter or add a new snippet
          </p>
        </section>
      ) : (
        <section
          ref={listParentRef}
          className="h-[62vh] overflow-y-auto rounded-2xl border border-border/70 bg-card/30 p-2"
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
                    onTagClick={(tag) => setActiveTag(tag)}
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
    </main>
  );
}
