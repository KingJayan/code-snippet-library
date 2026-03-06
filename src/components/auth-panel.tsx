"use client";

import { FormEvent } from "react";
import { Loader2, LogIn, LogOut, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthPanelProps = {
  email: string;
  setEmail: (email: string) => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  authActionLoading: boolean;
  authMessage: string | null;
  authError: string | null;
  onSendMagicLink: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onRefreshSession: () => Promise<void>;
};

export function AuthPanel({
  email,
  setEmail,
  isAuthenticated,
  authLoading,
  authActionLoading,
  authMessage,
  authError,
  onSendMagicLink,
  onSignOut,
  onRefreshSession,
}: AuthPanelProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void onSendMagicLink();
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">authentication</h2>
        <p className="text-xs text-muted-foreground">
          {isAuthenticated
            ? "session active"
            : "sign in with magic link to access your snippets"}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void onRefreshSession()}
          disabled={authLoading || authActionLoading}
        >
          <RefreshCw className={authLoading ? "size-4 animate-spin" : "size-4"} />
          refresh session
        </Button>

        {isAuthenticated && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void onSignOut()}
            disabled={authActionLoading}
          >
            {authActionLoading ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            sign out
          </Button>
        )}
      </div>

      {!isAuthenticated && (
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="pl-9"
              required
            />
          </div>
          <Button type="submit" disabled={authActionLoading}>
            {authActionLoading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            send magic link
          </Button>
        </form>
      )}

      {authMessage && (
        <p className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-300">
          {authMessage}
        </p>
      )}

      {authError && (
        <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {authError}
        </p>
      )}
    </section>
  );
}
