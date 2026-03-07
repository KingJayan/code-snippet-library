"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import Link from "next/link";
import { SnippetCard } from "@/components/snippet-card";
import { SearchBar } from "@/components/search-bar";
import { TagFilter } from "@/components/tag-filter";
import { InlineToast } from "@/components/inline-toast";
import { WorkspaceSideNav } from "@/components/workspace-side-nav";
import { listPublicSnippets } from "@/lib/snippet-service";
import type { SnippetSummaryWithTags } from "@/lib/types";
import { ArrowUpRight, Code2, Compass } from "lucide-react";

export default function PublicSnippetsPage() {
  const [snippets, setSnippets] = useState<SnippetSummaryWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "info" | "success" | "error";
  } | null>(null);

  const deferredSearch = useDeferredValue(search);

  const allTags = useMemo(
    () =>
      Array.from(
        new Set(
          snippets.flatMap((s) =>
            s.tags.map((t) => t.name).filter((name) => Boolean(name))
          )
        )
      ).sort(),
    [snippets]
  );

  const filteredSnippets = useMemo(() => {
    return snippets.filter((snippet) => {
      const matchesSearch =
        snippet.title.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        snippet.language.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        snippet.tags.some((tag) =>
          tag.name.toLowerCase().includes(deferredSearch.toLowerCase())
        );

      const matchesTag = !activeTag || snippet.tags.some((t) => t.name === activeTag);

      return matchesSearch && matchesTag;
    });
  }, [snippets, deferredSearch, activeTag]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSnippets = async () => {
      try {
        setIsLoading(true);
        const result = await listPublicSnippets({ signal: controller.signal });

        if (result.error) {
          if (/abort|aborted/i.test(result.error)) {
            return;
          }
          setToast({ message: result.error, tone: "error" });
          return;
        }

        if (result.data) {
          setSnippets(result.data);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setToast({ message: "failed to load public snippets", tone: "error" });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnippets();

    return () => controller.abort();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      if (search) setSearch("");
      else if (activeTag) setActiveTag(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background motion-safe-enter" onKeyDown={handleKeyDown}>
      <WorkspaceSideNav compactSnipsOnly snippetsHref="/snips" showPublicLink={false} showSnippetsLink />

      <header className="sticky top-0 border-b border-border/60 bg-background/95 backdrop-blur-sm vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">public snippets</h1>
              <div
                className="mt-1 inline-flex size-5 items-center justify-center rounded-md text-muted-foreground animate-subtle-pop-in vfx-icon-chip"
                title="browse and discover"
                aria-hidden="true"
              >
                <Compass className="size-3" />
              </div>
              <span className="sr-only">browse and discover</span>
            </div>
            <Link
              href="/snippets"
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground animate-subtle-pop-in vfx-icon-chip"
              title="create your own"
              aria-label="create your own"
            >
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </header>

      <main className="flex-1 animate-subtle-fade-up">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          {allTags.length > 0 && (
            <div className="mb-6">
              <TagFilter
                tags={allTags}
                activeTag={activeTag}
                onTagChange={setActiveTag}
              />
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg border border-border/40 bg-muted/20 animate-pulse"
                />
              ))}
            </div>
          ) : filteredSnippets.length === 0 ? (
            <section className="flex flex-col items-center justify-center space-y-3 py-12 text-center">
              <Code2 className="size-12 text-muted-foreground/50" />
              {snippets.length === 0 ? (
                <>
                  <h2 className="font-medium">no public snippets yet</h2>
                  <p className="text-sm text-muted-foreground">
                    create and share your snippets to see them here
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-medium">no snippets found</h2>
                  <p className="text-sm text-muted-foreground">
                    adjust search or filters to find more
                  </p>
                </>
              )}
            </section>
          ) : (
            <div className="space-y-3">
              {filteredSnippets.map((snippet) => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border/60 bg-muted/30 py-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <Link
            href="https://github.com/kingjayan/code-snippet-library"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground animate-subtle-pop-in vfx-icon-chip"
            title="see the code"
            aria-label="see the code"
          >
            <Code2 className="size-4" />
          </Link>
          <Link
            href="https://github.com/KingJayan/code-snippet-library/blob/master/CONTRIBUTING.md"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground animate-subtle-pop-in vfx-icon-chip"
            title="contribute"
            aria-label="contribute"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </footer>

      {toast && (
        <InlineToast
          message={toast.message}
          tone={toast.tone}
        />
      )}
    </div>
  );
}
