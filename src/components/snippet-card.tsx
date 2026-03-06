"use client";

import { memo } from "react";
import Link from "next/link";
import { Clock, Code2, ArrowUpRight, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LANGUAGES } from "@/lib/constants";
import { timeAgo } from "@/lib/time";
import type { SnippetSummaryWithTags } from "@/lib/types";

interface SnippetCardProps {
  snippet: SnippetSummaryWithTags;
  onTagClick?: (tagName: string) => void;
  onTogglePin?: (id: string, pinned: boolean) => void;
}

function SnippetCardRaw({ snippet, onTagClick, onTogglePin }: SnippetCardProps) {
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
      href={`/snippets/${snippet.id}`}
      className="group relative flex flex-col gap-3 rounded-lg border border-border/60
                 bg-card p-4 transition-all duration-150
                 hover:border-foreground/20 hover:shadow-sm
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      tabIndex={0}
    >
      {/* -- header row -------- */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-sm font-semibold leading-tight tracking-tight text-foreground">
            {snippet.title}
          </h3>

          {snippet.description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {snippet.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={handlePinClick}
            className={`rounded p-1 transition-colors hover:bg-accent ${
              snippet.pinned ? "text-yellow-500" : "text-muted-foreground"
            }`}
            aria-label={snippet.pinned ? "unpin" : "pin"}
          >
            <Pin className={`size-3.5 ${snippet.pinned ? "fill-current" : ""}`} />
          </button>

          <Badge
            variant="secondary"
            className="font-mono text-[10px] uppercase tracking-widest"
          >
            <Code2 className="size-3" />
            {lang.label}
          </Badge>
        </div>
      </div>

      <Separator className="opacity-40" />

      {/* -- footer row -------- */}
      <div className="flex items-center justify-between gap-2">
        {/* tags */}
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {snippet.tags.slice(0, 4).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="max-w-24 cursor-pointer truncate text-[10px] transition-colors hover:bg-accent"
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
            <span className="text-[10px] text-muted-foreground">
              +{snippet.tags.length - 4}
            </span>
          )}
        </div>

        {/* meta + actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="size-3" />
            {timeAgo(snippet.updated_at)}
          </span>

          <ArrowUpRight className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" />
        </div>
      </div>
    </Link>
  );
}

export const SnippetCard = memo(SnippetCardRaw);
