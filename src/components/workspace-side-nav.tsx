"use client";

import { useState } from "react";
import { ChevronRight, Folder, FolderOpen, Globe, Home, Play } from "lucide-react";
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
  onSnippetDropToWorkspace?: (snippetId: string, workspaceId: string) => void;
  draggingSnippetId?: string | null;
  canSelect?: boolean;
  actions?: WorkspaceAction[];
  workspacePinnedTitles?: Record<string, string[]>;
  showPublicLink?: boolean;
  showSnippetsLink?: boolean;
  showPlaygroundLink?: boolean;
  playgroundSnippetId?: string | null;
  compactSnipsOnly?: boolean;
  snippetsHref?: string;
};

type DesktopPanelSize = "full" | "small" | "tiny";

export function WorkspaceSideNav({
  workspaces = [],
  activeWorkspaceId = null,
  onSelectWorkspace,
  onSnippetDropToWorkspace,
  draggingSnippetId = null,
  canSelect = false,
  actions = [],
  workspacePinnedTitles = {},
  showPublicLink = true,
  showSnippetsLink = false,
  showPlaygroundLink = false,
  playgroundSnippetId = null,
  compactSnipsOnly = false,
  snippetsHref = "/snippets",
}: WorkspaceSideNavProps) {
  const { goto } = useNavigate();
  const [desktopActionsOpen, setDesktopActionsOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [desktopPanelSize, setDesktopPanelSize] = useState<DesktopPanelSize>(() => {
    if (typeof window === "undefined") return "full";
    if (window.innerWidth < 1280) return "tiny";
    if (window.innerWidth < 1536) return "small";
    return "full";
  });
  const [workspacePinsOpen, setWorkspacePinsOpen] = useState<Record<string, boolean>>({});
  const [dragOverWorkspaceId, setDragOverWorkspaceId] = useState<string | null>(null);
  const hasActions = actions.length > 0;
  const mobileIconButtonClass =
    "grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-background/45 text-foreground/75 transition-all duration-200 ease-out hover:bg-accent/55 hover:text-foreground active:scale-95";

  const isTiny = desktopPanelSize === "tiny";

  const desktopPanelFrameClass =
    desktopPanelSize === "full"
      ? "top-6 bottom-6"
      : desktopPanelSize === "small"
        ? "top-10 bottom-10"
        : "top-12 bottom-12";

  const desktopPanelWidthClass = isTiny ? "w-10" : desktopPanelSize === "small" ? "w-44" : "w-60";

  const desktopScrollableAreaClass = "flex-1 min-h-0 space-y-1 overflow-y-auto theme-scrollbar" + (isTiny ? "" : " pr-1");

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
            {showPlaygroundLink && playgroundSnippetId && (
              <button
                type="button"
                onClick={() => goto(`/playground/${playgroundSnippetId}`)}
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground animate-subtle-pop-in vfx-icon-chip mt-2"
                title="open playground"
                aria-label="open playground"
              >
                <Play className="size-4" />
              </button>
            )}
          </div>
        </aside>

        <aside className="fixed inset-x-3 bottom-4 z-40 lg:hidden">
          <div className="flex justify-center gap-2 rounded-2xl border border-border/45 bg-card/82 p-2 backdrop-blur shadow-[0_10px_24px_-18px_hsl(var(--foreground)/0.35)] vfx-surface vfx-glass">
            <button
              type="button"
              onClick={() => goto(snippetsHref)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground animate-subtle-pop-in vfx-icon-chip"
              title="go to snips"
              aria-label="go to snips"
            >
              <Home className="size-4" />
            </button>
            {showPlaygroundLink && playgroundSnippetId && (
              <button
                type="button"
                onClick={() => goto(`/playground/${playgroundSnippetId}`)}
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground animate-subtle-pop-in vfx-icon-chip"
                title="open playground"
                aria-label="open playground"
              >
                <Play className="size-4" />
              </button>
            )}
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <aside className={`fixed left-4 z-40 hidden lg:block ${desktopPanelWidthClass} ${desktopPanelFrameClass} transition-all duration-200 ease-out`}>
        <div className={`flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/78 backdrop-blur shadow-[0_14px_32px_-22px_hsl(var(--foreground)/0.4)] vfx-surface vfx-glass ${isTiny ? "p-1.5 items-center" : "p-2"}`}>

          {/* Header */}
          <div className={`flex shrink-0 pb-2 pt-1 ${isTiny ? "flex-col items-center gap-1" : "items-center justify-between px-2"}`}>
            <div
              className="inline-flex size-5 items-center justify-center rounded-md text-muted-foreground animate-subtle-pop-in vfx-icon-chip"
              title="workspaces"
              aria-hidden="true"
            >
              <Folder className="size-3" />
            </div>
            <span className="sr-only">workspaces</span>

            {isTiny ? (
              <button
                type="button"
                onClick={() => setDesktopPanelSize("small")}
                className="inline-flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground group/expand"
                title="expand panel"
                aria-label="expand panel"
              >
                <ChevronRight className="size-3 transition-transform duration-150 group-hover/expand:translate-x-px" />
              </button>
            ) : (
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
            )}
          </div>

          {/* Workspace list */}
          <div className={desktopScrollableAreaClass}>
            {workspaces.map((workspace) => {
              const active = workspace.id === activeWorkspaceId;
              const pinnedTitles = workspacePinnedTitles[workspace.id] ?? [];
              const pinsOpen = Boolean(workspacePinsOpen[workspace.id]);

              if (isTiny) {
                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => onSelectWorkspace?.(workspace.id)}
                    onDragOver={(event) => {
                      if (!onSnippetDropToWorkspace || !draggingSnippetId) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      if (dragOverWorkspaceId !== workspace.id) setDragOverWorkspaceId(workspace.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverWorkspaceId === workspace.id) setDragOverWorkspaceId(null);
                    }}
                    onDrop={(event) => {
                      if (!onSnippetDropToWorkspace) return;
                      event.preventDefault();
                      const droppedSnippetId =
                        event.dataTransfer.getData("text/snips-snippet-id") ||
                        event.dataTransfer.getData("text/plain");
                      setDragOverWorkspaceId(null);
                      if (!droppedSnippetId) return;
                      onSnippetDropToWorkspace(droppedSnippetId, workspace.id);
                    }}
                    disabled={!canSelect}
                    className={`grid size-7 shrink-0 place-items-center rounded-lg transition-all duration-200 ease-out active:scale-[0.92] ${
                      active
                        ? "bg-accent/65 text-foreground"
                        : dragOverWorkspaceId === workspace.id
                        ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                    title={workspace.name.trim() || "untitled workspace"}
                  >
                    {active ? <FolderOpen className="size-3.5" /> : <Folder className="size-3.5" />}
                  </button>
                );
              }

              return (
                <div key={workspace.id} className="rounded-lg">
                  <button
                    type="button"
                    onClick={() => onSelectWorkspace?.(workspace.id)}
                    onDragOver={(event) => {
                      if (!onSnippetDropToWorkspace || !draggingSnippetId) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      if (dragOverWorkspaceId !== workspace.id) {
                        setDragOverWorkspaceId(workspace.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverWorkspaceId === workspace.id) {
                        setDragOverWorkspaceId(null);
                      }
                    }}
                    onDrop={(event) => {
                      if (!onSnippetDropToWorkspace) return;
                      event.preventDefault();
                      const droppedSnippetId =
                        event.dataTransfer.getData("text/snips-snippet-id") ||
                        event.dataTransfer.getData("text/plain");
                      setDragOverWorkspaceId(null);
                      if (!droppedSnippetId) return;
                      onSnippetDropToWorkspace(droppedSnippetId, workspace.id);
                    }}
                    disabled={!canSelect}
                    className={`group/ws flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-all duration-200 ease-out active:scale-[0.99] ${
                      active
                        ? "bg-accent/65 text-foreground"
                        : dragOverWorkspaceId === workspace.id
                        ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                    title={workspace.name}
                  >
                    {active
                      ? <FolderOpen className="size-3.5 shrink-0 transition-transform duration-150 group-hover/ws:scale-110" />
                      : <Folder className="size-3.5 shrink-0 transition-transform duration-150 group-hover/ws:scale-110" />}
                    <span className="truncate text-xs animate-subtle-slide-right">{workspace.name.trim() || "untitled workspace"}</span>
                  </button>

                  {pinnedTitles.length > 0 && (
                    <div className="mt-0.5 pl-7 pr-1">
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

          {(showPublicLink || showSnippetsLink || showPlaygroundLink || hasActions) && (
            <div className={`bg-border/60 ${isTiny ? "my-1.5 h-px w-6" : "my-2 h-px w-full"}`} />
          )}

          <div className={`shrink-0 ${isTiny ? "flex flex-col items-center gap-1" : "space-y-1"}`}>
            {showPublicLink && (
              isTiny ? (
                <button
                  type="button"
                  onClick={() => goto("/public")}
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  title="public snippets"
                >
                  <Globe className="size-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goto("/public")}
                  className="group/nav flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  title="public snippets"
                >
                  <Globe className="size-3.5 shrink-0 transition-transform duration-150 group-hover/nav:scale-110" />
                  <span className="animate-subtle-slide-right">public snippets</span>
                </button>
              )
            )}

            {showSnippetsLink && (
              isTiny ? (
                <button
                  type="button"
                  onClick={() => goto("/snippets")}
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  title="my snippets"
                >
                  <Home className="size-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goto("/snippets")}
                  className="group/nav flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  title="my snippets"
                >
                  <Home className="size-3.5 shrink-0 transition-transform duration-150 group-hover/nav:scale-110" />
                  <span className="animate-subtle-slide-right">my snippets</span>
                </button>
              )
            )}

            {showPlaygroundLink && playgroundSnippetId && (
              isTiny ? (
                <button
                  type="button"
                  onClick={() => goto(`/playground/${playgroundSnippetId}`)}
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  title="playground"
                >
                  <Play className="size-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goto(`/playground/${playgroundSnippetId}`)}
                  className="group/nav flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  title="playground"
                >
                  <Play className="size-3.5 shrink-0 transition-transform duration-150 group-hover/nav:scale-110" />
                  <span className="animate-subtle-slide-right">playground</span>
                </button>
              )
            )}
          </div>

          {hasActions && !isTiny && (
            <div className="mt-2 w-full" data-workspace-desktop-menu>
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  desktopActionsOpen
                    ? "bg-accent/60 text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
                onClick={() => setDesktopActionsOpen((current) => !current)}
                title="workspace options"
                aria-label="workspace options"
                aria-expanded={desktopActionsOpen}
              >
                <span className="animate-subtle-slide-right">workspace actions</span>
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
                    className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
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

          {showPlaygroundLink && playgroundSnippetId && (
            <button
              type="button"
              onClick={() => goto(`/playground/${playgroundSnippetId}`)}
              className={mobileIconButtonClass}
              title="playground"
            >
              <Play className="size-4" />
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
