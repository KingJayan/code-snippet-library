"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Home } from "lucide-react";
import { SnippetPlayground } from "@/components/snippet-playground";
import { WorkspaceSideNav } from "@/components/workspace-side-nav";
import { getSnippetById } from "@/lib/snippet-service";
import type { SnippetWithTags } from "@/lib/types";

export default function PlaygroundPage() {
  const params = useParams<{ id: string }>();
  const [snippet, setSnippet] = useState<SnippetWithTags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const countedViewRef = useRef<string | null>(null);

  const snippetId = useMemo(() => params?.id ?? "", [params?.id]);

  const load = useCallback(async () => {
    if (!snippetId) {
      setError("invalid snippet id");
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error: serviceError } = await getSnippetById(snippetId);

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
          {error ?? "snippet not found"}
        </section>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background motion-safe-enter">
      <WorkspaceSideNav compactSnipsOnly snippetsHref="/snippets" showPublicLink={false} showSnippetsLink />

      <header className="sticky top-0 border-b border-border/60 bg-background/95 backdrop-blur-sm vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">{snippet.title || "playground"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{snippet.language}</p>
            </div>
            <Link
              href={`/snippets/${snippet.id}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              view snippet
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 animate-subtle-fade-up">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <SnippetPlayground
            initialCode={snippet.code}
            initialLanguage={snippet.language}
          />
        </div>
      </main>
    </div>
  );
}
