"use client";

import { memo } from "react";
import Link from "next/link";
import { Clock, Code2, ArrowUpRight, Pin, Globe, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LANGUAGES } from "@/lib/constants";
import { timeAgo } from "@/lib/time";
import type { SnippetSummaryWithTags } from "@/lib/types";

interface SnippetCardProps {
  snippet: SnippetSummaryWithTags;
  onTagClick?: (tagName: string) => void;
  onTogglePin?: (id: string, pinned: boolean) => void;
  detailBasePath?: "/snippets" | "/public";
  selected?: boolean;
}

function SnippetCardRaw({
  snippet,
  onTagClick,
  onTogglePin,
  detailBasePath = "/snippets",
  selected = false,
}: SnippetCardProps) {
  const lang = LANGUAGES[snippet.language] ?? {
    label: snippet.language,
    shiki: snippet.language,
  };

  function handlePinClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onTogglePin?.(snippet.id, !snippet.pinned);
  }

  return (
    <Link
      href={`${detailBasePath}/${snippet.id}`}
      className="snippet-card-shell group relative flex flex-col gap-2 sm:gap-3 rounded-lg border border-border/60
                 bg-card p-3 sm:p-4 transition-all duration-200 ease-out motion-safe-enter vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow
                 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-selected={selected ? "true" : "false"}
      aria-current={selected ? "true" : undefined}
      style={selected ? { boxShadow: "0 0 0 2px color-mix(in oklch, var(--ring) 72%, transparent 28%)" } : undefined}
      tabIndex={0}
      title={snippet.title}
    >
      {/* -- header row -------- */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-1">
          <h3 className="truncate text-xs sm:text-sm font-semibold leading-tight tracking-tight text-foreground">
            {snippet.title}
          </h3>

          {snippet.description && (
            <p className="line-clamp-1 text-[11px] sm:text-xs text-muted-foreground">
              {snippet.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/playground/${snippet.id}`}
            className="vfx-icon-chip rounded p-1 transition-colors hover:bg-accent text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
            title="open in playground"
          >
            <Play className="size-3" />
          </Link>

          <button
            onClick={handlePinClick}
            className={`vfx-icon-chip rounded p-1 transition-colors hover:bg-accent ${
              snippet.pinned ? "text-yellow-500" : "text-muted-foreground"
            }`}
            aria-label={snippet.pinned ? "unpin" : "pin"}
          >
            <Pin className={`size-3 ${snippet.pinned ? "fill-current" : ""}`} />
          </button>

          {snippet.public && (
            <Badge variant="outline" className="shrink-0 text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5">
              <Globe className="size-2 mr-0.5" />
              public
            </Badge>
          )}

          <Badge
            variant="secondary"
            className="font-mono text-[8px] sm:text-[10px] uppercase tracking-widest"
          >
            <Code2 className="size-2.5" />
            {lang.label}
          </Badge>
        </div>
      </div>

      <Separator className="opacity-40" />

      {/* -- footer row -------- */}
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {/* tags */}
        <div className="flex min-w-0 flex-1 flex-wrap gap-0.5 sm:gap-1">
          {snippet.tags.slice(0, 4).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="max-w-20 sm:max-w-24 cursor-pointer truncate text-[8px] sm:text-[10px] transition-colors hover:bg-accent"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTagClick?.(tag.name);
              }}
              title={tag.name.length > 20 ? tag.name : undefined}
            >
              {tag.name}
            </Badge>
          ))}
          {snippet.tags.length > 4 && (
            <span className="text-[8px] sm:text-[10px] text-muted-foreground">
              +{snippet.tags.length - 4}
            </span>
          )}
        </div>

        {/* meta + actions */}
        <div className="flex shrink-0 items-center gap-1">
          <span className="flex items-center gap-0.5 text-[8px] sm:text-[10px] text-muted-foreground">
            <Clock className="size-2.5 sm:size-3" />
            {timeAgo(snippet.updated_at)}
          </span>

          <ArrowUpRight className="size-2.5 sm:size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" />
        </div>
      </div>
    </Link>
  );
}

export const SnippetCard = memo(SnippetCardRaw);
