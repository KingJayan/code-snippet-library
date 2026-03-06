"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ShortcutsPanelProps = {
  open: boolean;
  onClose: () => void;
  shortcuts: Array<{ key: string; action: string }>;
};

export function ShortcutsPanel({ open, onClose, shortcuts }: ShortcutsPanelProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border/70 bg-card/95 p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium">keyboard shortcuts</h2>
          <Button variant="ghost" size="xs" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {shortcuts.map(({ key, action }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
            >
              <span className="text-sm text-muted-foreground">{action}</span>
              <kbd className="rounded border border-border bg-background px-2 py-1 font-mono text-xs">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
