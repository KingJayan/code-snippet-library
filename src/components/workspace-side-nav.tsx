"use client";

import { useState } from "react";
import { Folder, FolderOpen, Globe, Home } from "lucide-react";
import { useNavigate } from "@/lib/use-navigate";
import type { Workspace } from "@/lib/types";

type WorkspaceAction = {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

type WorkspaceSideNavProps = {
  workspaces?: Workspace[];
  activeWorkspaceId?: string | null;
  onSelectWorkspace?: (workspaceId: string) => void;
  canSelect?: boolean;
  actions?: WorkspaceAction[];
  workspacePinnedTitles?: Record<string, string[]>;
  showPublicLink?: boolean;
  showSnippetsLink?: boolean;
  compactSnipsOnly?: boolean;
  snippetsHref?: string;
};

type DesktopPanelSize = "full" | "small" | "tiny";

export function WorkspaceSideNav({
  workspaces = [],
  activeWorkspaceId = null,
  onSelectWorkspace,
  canSelect = false,
  actions = [],
  workspacePinnedTitles = {},
  showPublicLink = true,
  showSnippetsLink = false,
  compactSnipsOnly = false,
  snippetsHref = "/snippets",
}: WorkspaceSideNavProps) {
  const { goto } = useNavigate();
  const [desktopActionsOpen, setDesktopActionsOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [desktopPanelSize, setDesktopPanelSize] = useState<DesktopPanelSize>("full");
  const [workspacePinsOpen, setWorkspacePinsOpen] = useState<Record<string, boolean>>({});
  const hasActions = actions.length > 0;
  const iconButtonClass =
    "grid h-8 w-8 place-items-center rounded-lg bg-background/45 text-foreground/75 transition-all duration-200 ease-out hover:bg-accent/55 hover:text-foreground active:scale-95";
  const mobileIconButtonClass =
    "grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-background/45 text-foreground/75 transition-all duration-200 ease-out hover:bg-accent/55 hover:text-foreground active:scale-95";

  const desktopPanelFrameClass =
    desktopPanelSize === "full"
      ? "top-6 bottom-6"
      : desktopPanelSize === "small"
        ? "top-16 bottom-16"
        : "top-44 bottom-44";

  const desktopPanelWidthClass = desktopPanelSize === "tiny" ? "w-52" : "w-60";

  const desktopScrollableAreaClass =
    desktopPanelSize === "tiny" ? "flex-1 min-h-0 space-y-1 overflow-y-auto theme-scrollbar pr-1" : "flex-1 space-y-1 overflow-y-auto theme-scrollbar pr-1";

  const panelSizes: DesktopPanelSize[] = ["tiny", "small", "full"];

  if (compactSnipsOnly) {
    return (
      <>
        <aside className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
          <div className="rounded-2xl border border-border/45 bg-card/78 p-2 backdrop-blur shadow-[0_10px_24px_-18px_hsl(var(--foreground)/0.35)] vfx-surface vfx-glass">
            <button
              type="button"
              onClick={() => goto(snippetsHref)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground animate-subtle-pop-in vfx-icon-chip"
              title="go to snips"
              aria-label="go to snips"
            >
              <Home className="size-4" />
            </button>
          </div>
        </aside>

        <aside className="fixed inset-x-3 bottom-4 z-40 lg:hidden">
          <div className="flex justify-center rounded-2xl border border-border/45 bg-card/82 p-2 backdrop-blur shadow-[0_10px_24px_-18px_hsl(var(--foreground)/0.35)] vfx-surface vfx-glass">
            <button
              type="button"
              onClick={() => goto(snippetsHref)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground animate-subtle-pop-in vfx-icon-chip"
              title="go to snips"
              aria-label="go to snips"
            >
              <Home className="size-4" />
            </button>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <aside className={`fixed left-4 z-40 hidden lg:block ${desktopPanelWidthClass} ${desktopPanelFrameClass}`}>
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/78 p-2 backdrop-blur shadow-[0_14px_32px_-22px_hsl(var(--foreground)/0.4)] vfx-surface vfx-glass">
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <div
              className="inline-flex size-5 items-center justify-center rounded-md text-muted-foreground animate-subtle-pop-in vfx-icon-chip"
              title="workspaces"
              aria-hidden="true"
            >
              <Folder className="size-3" />
            </div>
            <span className="sr-only">workspaces</span>
            <div className="flex items-center gap-1">
              {panelSizes.map((size) => {
                const isActive = desktopPanelSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setDesktopPanelSize(size)}
                    className={`rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide transition-colors ${
                      isActive
                        ? "bg-accent/70 text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                    title={`${size} panel`}
                    aria-label={`${size} panel`}
                  >
                    {size[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={desktopScrollableAreaClass}>
            {workspaces.map((workspace) => {
              const active = workspace.id === activeWorkspaceId;
              const pinnedTitles = workspacePinnedTitles[workspace.id] ?? [];
              const pinsOpen = Boolean(workspacePinsOpen[workspace.id]);
              return (
                <div key={workspace.id} className="rounded-lg">
                  <button
                    type="button"
                    onClick={() => onSelectWorkspace?.(workspace.id)}
                    disabled={!canSelect}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-all duration-200 ease-out active:scale-[0.99] ${
                      active
                        ? "bg-accent/65 text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                    title={workspace.name}
                  >
                    {active ? <FolderOpen className="size-4 shrink-0" /> : <Folder className="size-4 shrink-0" />}
                    <span className="truncate">{workspace.name.trim() || "untitled workspace"}</span>
                  </button>

                  {pinnedTitles.length > 0 && (
                    <div className="mt-0.5 pl-8 pr-1">
                      <button
                        type="button"
                        onClick={() =>
                          setWorkspacePinsOpen((current) => ({
                            ...current,
                            [workspace.id]: !current[workspace.id],
                          }))
                        }
                        className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {pinsOpen ? "hide pins" : "show pins"}
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-200 ease-out ${
                          pinsOpen ? "max-h-28 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <ul className="mt-1 space-y-1">
                          {pinnedTitles.slice(0, 3).map((title, index) => (
                            <li
                              key={`${workspace.id}-pin-${index}`}
                              className="truncate text-[11px] text-muted-foreground/95"
                              title={title}
                            >
                              {title}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {(showPublicLink || showSnippetsLink || hasActions) && (
            <div className="my-2 h-px w-full bg-border/60" />
          )}

          <div className="space-y-1">
            {showPublicLink && (
              <button
                type="button"
                onClick={() => goto("/public")}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                title="public snippets"
              >
                <Globe className="size-4 shrink-0" />
                <span>public snippets</span>
              </button>
            )}

            {showSnippetsLink && (
              <button
                type="button"
                onClick={() => goto("/snippets")}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                title="my snippets"
              >
                <Home className="size-4 shrink-0" />
                <span>my snippets</span>
              </button>
            )}
          </div>

          {hasActions && (
            <div className="mt-2 w-full" data-workspace-desktop-menu>
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                  desktopActionsOpen
                    ? "bg-accent/60 text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
                onClick={() => setDesktopActionsOpen((current) => !current)}
                title="workspace options"
                aria-label="workspace options"
                aria-expanded={desktopActionsOpen}
              >
                <span>workspace actions</span>
                <span className="text-base leading-none">{desktopActionsOpen ? "−" : "+"}</span>
              </button>

              <div
                className={`mt-1 w-full overflow-hidden rounded-xl transition-all duration-200 ease-out ${
                  desktopActionsOpen
                    ? "max-h-56 border border-border/45 bg-background/45 p-1.5 opacity-100"
                    : "max-h-0 border border-transparent bg-transparent p-0 opacity-0"
                }`}
              >
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      action.onClick();
                      setDesktopActionsOpen(false);
                    }}
                    disabled={action.disabled}
                    className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                      action.destructive
                        ? "text-destructive hover:bg-destructive/10 disabled:text-destructive/45"
                        : "text-foreground/90 hover:bg-accent/55 disabled:text-muted-foreground"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      <aside className="fixed inset-x-3 bottom-4 z-40 lg:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-border/45 bg-card/82 p-2 backdrop-blur shadow-[0_10px_24px_-18px_hsl(var(--foreground)/0.35)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] vfx-surface vfx-glass theme-scrollbar">
          {workspaces.map((workspace) => {
            const active = workspace.id === activeWorkspaceId;
            return (
              <button
                key={workspace.id}
                type="button"
                onClick={() => onSelectWorkspace?.(workspace.id)}
                disabled={!canSelect}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                  active
                    ? "bg-accent/70 text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
                title={workspace.name}
              >
                {workspace.name}
              </button>
            );
          })}

          {showPublicLink && (
            <button
              type="button"
              onClick={() => goto("/public")}
              className={mobileIconButtonClass}
              title="public snippets"
            >
              <Globe className="size-4" />
            </button>
          )}

          {showSnippetsLink && (
            <button
              type="button"
              onClick={() => goto("/snippets")}
              className={mobileIconButtonClass}
              title="my snippets"
            >
              <Home className="size-4" />
            </button>
          )}

          {hasActions && (
            <div className="ml-auto flex shrink-0 items-center gap-1.5" data-workspace-mobile-menu>
              <button
                type="button"
                className={`${mobileIconButtonClass} ${mobileActionsOpen ? "bg-accent/65 text-foreground" : ""}`}
                onClick={() => setMobileActionsOpen((current) => !current)}
                title="workspace options"
                aria-label="workspace options"
                aria-expanded={mobileActionsOpen}
              >
                <span className="text-sm leading-none font-semibold">⋯</span>
              </button>

              <div
                className={`flex items-center gap-1 overflow-hidden rounded-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  mobileActionsOpen
                    ? "max-w-[18rem] border border-border/45 bg-background/45 p-1.5 opacity-100"
                    : "max-w-0 border border-transparent bg-transparent p-0 opacity-0"
                }`}
              >
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      action.onClick();
                      setMobileActionsOpen(false);
                    }}
                    disabled={action.disabled}
                    className={`shrink-0 rounded-md px-2.5 py-1 text-xs transition-all duration-200 ease-out active:scale-[0.98] ${
                      action.destructive
                        ? "text-destructive hover:bg-destructive/10 disabled:text-destructive/45"
                        : "text-foreground/90 hover:bg-accent/55 disabled:text-muted-foreground"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
