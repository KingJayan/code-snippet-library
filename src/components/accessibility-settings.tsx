"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Settings2, Sparkles, SlidersHorizontal, Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  applyRootClass,
  readBoolSetting,
  readStringSetting,
  SETTINGS_KEYS,
  writeBoolSetting,
  writeStringSetting,
} from "@/lib/settings";

type A11ySettings = {
  reducedMotion: boolean;
  largerText: boolean;
  strongerFocus: boolean;
};

const CODE_THEME_OPTIONS = [
  { value: "github-dark", label: "github dark" },
  { value: "github-light", label: "github light" },
  { value: "dracula", label: "dracula" },
  { value: "nord", label: "nord" },
  { value: "monokai", label: "monokai" },
  { value: "one-dark-pro", label: "one dark" },
];

const AI_MODE_OPTIONS = ["improve", "refactor", "debug", "explain"] as const;

type AiMode = (typeof AI_MODE_OPTIONS)[number];
type SettingsGroup = "ai" | "preferences" | "accessibility";

export function AccessibilitySettings() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>({
    reducedMotion: false,
    largerText: false,
    strongerFocus: false,
  });
  const [aiSimilaritySearch, setAiSimilaritySearch] = useState(false);
  const [compactLayout, setCompactLayout] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [wrapCodeLines, setWrapCodeLines] = useState(false);
  const [aiPanelOpenByDefault, setAiPanelOpenByDefault] = useState(true);
  const [aiDefaultMode, setAiDefaultMode] = useState<AiMode>("improve");
  const [codeTheme, setCodeTheme] = useState("github-dark");
  const [activeGroup, setActiveGroup] = useState<SettingsGroup>("ai");

  useEffect(() => {
    const next: A11ySettings = {
      reducedMotion: readBoolSetting(SETTINGS_KEYS.reducedMotion),
      largerText: readBoolSetting(SETTINGS_KEYS.largerText),
      strongerFocus: readBoolSetting(SETTINGS_KEYS.strongerFocus),
    };

    setSettings(next);
    applyRootClass("a11y-reduce-motion", next.reducedMotion);
    applyRootClass("a11y-large-text", next.largerText);
    applyRootClass("a11y-strong-focus", next.strongerFocus);
    setAiSimilaritySearch(readBoolSetting(SETTINGS_KEYS.aiSimilaritySearch));
    const compact = readBoolSetting(SETTINGS_KEYS.compactLayout);
    setCompactLayout(compact);
    applyRootClass("pref-compact", compact);
    setShowHints(readBoolSetting(SETTINGS_KEYS.showHints, true));
    setWrapCodeLines(readBoolSetting(SETTINGS_KEYS.wrapCodeLines));
    setAiPanelOpenByDefault(readBoolSetting(SETTINGS_KEYS.aiPanelOpenByDefault, true));
    const savedMode = readStringSetting(SETTINGS_KEYS.aiDefaultMode, "improve");
    setAiDefaultMode(AI_MODE_OPTIONS.includes(savedMode as AiMode) ? (savedMode as AiMode) : "improve");
    const savedCodeTheme = readStringSetting(SETTINGS_KEYS.codeTheme, "github-dark");
    setCodeTheme(savedCodeTheme);
  }, []);

  const enabledCount = useMemo(() => {
    const a11yCount = Object.values(settings).filter(Boolean).length;
    return a11yCount + (aiSimilaritySearch ? 1 : 0);
  }, [aiSimilaritySearch, settings]);

  function toggleSetting<K extends keyof A11ySettings>(key: K) {
    setSettings((current) => {
      const nextValue = !current[key];
      const next = { ...current, [key]: nextValue };

      if (key === "reducedMotion") {
        writeBoolSetting(SETTINGS_KEYS.reducedMotion, nextValue);
        applyRootClass("a11y-reduce-motion", nextValue);
      }

      if (key === "largerText") {
        writeBoolSetting(SETTINGS_KEYS.largerText, nextValue);
        applyRootClass("a11y-large-text", nextValue);
      }

      if (key === "strongerFocus") {
        writeBoolSetting(SETTINGS_KEYS.strongerFocus, nextValue);
        applyRootClass("a11y-strong-focus", nextValue);
      }

      return next;
    });
  }

  function toggleAiSimilaritySearch() {
    const next = !aiSimilaritySearch;
    setAiSimilaritySearch(next);
    writeBoolSetting(SETTINGS_KEYS.aiSimilaritySearch, next);
  }

  function toggleCompactLayout() {
    const next = !compactLayout;
    setCompactLayout(next);
    writeBoolSetting(SETTINGS_KEYS.compactLayout, next);
    applyRootClass("pref-compact", next);
  }

  function toggleShowHints() {
    const next = !showHints;
    setShowHints(next);
    writeBoolSetting(SETTINGS_KEYS.showHints, next);
  }

  function toggleWrapCodeLines() {
    const next = !wrapCodeLines;
    setWrapCodeLines(next);
    writeBoolSetting(SETTINGS_KEYS.wrapCodeLines, next);
  }

  function toggleAiPanelDefault() {
    const next = !aiPanelOpenByDefault;
    setAiPanelOpenByDefault(next);
    writeBoolSetting(SETTINGS_KEYS.aiPanelOpenByDefault, next);
  }

  function updateAiDefaultMode(mode: AiMode) {
    setAiDefaultMode(mode);
    writeStringSetting(SETTINGS_KEYS.aiDefaultMode, mode);
  }

  function updateCodeTheme(theme: string) {
    setCodeTheme(theme);
    writeStringSetting(SETTINGS_KEYS.codeTheme, theme);
  }

  function navButtonClass(group: SettingsGroup) {
    return `w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
      activeGroup === group
        ? "bg-accent text-foreground"
        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
    }`;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed right-4 bottom-16 z-[60] rounded-full border-border/70 bg-card/90 shadow-lg backdrop-blur"
        onClick={() => setOpen(true)}
        aria-label="open settings"
        title="settings"
      >
        <Settings2 className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden rounded-2xl border-border/70 p-0">
          <DialogHeader>
            <div className="border-b border-border/70 px-5 py-4">
              <DialogTitle>settings</DialogTitle>
              <DialogDescription>
                configure ai features and accessibility preferences.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-[120px_minmax(0,1fr)]">
            <nav className="border-r border-border/70 bg-muted/20 p-2">
              <div className="space-y-1">
                <button type="button" className={navButtonClass("ai")} onClick={() => setActiveGroup("ai")}>
                  <span className="inline-flex items-center gap-1"><Sparkles className="size-3" /> ai</span>
                </button>
                <button type="button" className={navButtonClass("preferences")} onClick={() => setActiveGroup("preferences")}>
                  <span className="inline-flex items-center gap-1"><SlidersHorizontal className="size-3" /> prefs</span>
                </button>
                <button type="button" className={navButtonClass("accessibility")} onClick={() => setActiveGroup("accessibility")}>
                  <span className="inline-flex items-center gap-1"><Accessibility className="size-3" /> a11y</span>
                </button>
              </div>
            </nav>

            <div className="min-h-0 overflow-y-auto p-4">
              {activeGroup === "ai" && (
                <section className="space-y-2">
                  <button
                    type="button"
                    onClick={toggleAiSimilaritySearch}
                    className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">ai similarity search</p>
                      <p className="text-xs text-muted-foreground">find related snippets by code intent (default off)</p>
                    </div>
                    {aiSimilaritySearch ? <Check className="size-4 text-foreground" /> : null}
                  </button>

                  <button
                    type="button"
                    onClick={toggleAiPanelDefault}
                    className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">open ai panel by default</p>
                      <p className="text-xs text-muted-foreground">controls default state on snippet detail page</p>
                    </div>
                    {aiPanelOpenByDefault ? <Check className="size-4 text-foreground" /> : null}
                  </button>

                  <label className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card px-3 py-2">
                    <span className="text-sm font-medium">default ai mode</span>
                    <select
                      className="mt-1 h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={aiDefaultMode}
                      onChange={(event) => updateAiDefaultMode(event.target.value as AiMode)}
                    >
                      {AI_MODE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </section>
              )}

              {activeGroup === "preferences" && (
                <section className="space-y-2">
                  <button
                    type="button"
                    onClick={toggleCompactLayout}
                    className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">compact layout</p>
                      <p className="text-xs text-muted-foreground">reduce spacing for denser information display</p>
                    </div>
                    {compactLayout ? <Check className="size-4 text-foreground" /> : null}
                  </button>

                  <button
                    type="button"
                    onClick={toggleShowHints}
                    className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">show productivity hints</p>
                      <p className="text-xs text-muted-foreground">toggle keyboard and power-search hint labels</p>
                    </div>
                    {showHints ? <Check className="size-4 text-foreground" /> : null}
                  </button>

                  <button
                    type="button"
                    onClick={toggleWrapCodeLines}
                    className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">wrap long code lines</p>
                      <p className="text-xs text-muted-foreground">avoid horizontal scroll in code blocks</p>
                    </div>
                    {wrapCodeLines ? <Check className="size-4 text-foreground" /> : null}
                  </button>

                  <label className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card px-3 py-2">
                    <span className="text-sm font-medium">default code theme</span>
                    <select
                      className="mt-1 h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={codeTheme}
                      onChange={(event) => updateCodeTheme(event.target.value)}
                    >
                      {CODE_THEME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </section>
              )}

              {activeGroup === "accessibility" && (
                <section className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleSetting("reducedMotion")}
                    className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">reduced ui motion</p>
                      <p className="text-xs text-muted-foreground">reduce animations and transitions globally</p>
                    </div>
                    {settings.reducedMotion ? <Check className="size-4 text-foreground" /> : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSetting("largerText")}
                    className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">larger text</p>
                      <p className="text-xs text-muted-foreground">increase base text size for readability</p>
                    </div>
                    {settings.largerText ? <Check className="size-4 text-foreground" /> : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSetting("strongerFocus")}
                    className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">stronger focus outlines</p>
                      <p className="text-xs text-muted-foreground">make keyboard focus states more visible</p>
                    </div>
                    {settings.strongerFocus ? <Check className="size-4 text-foreground" /> : null}
                  </button>
                </section>
              )}
            </div>
          </div>

          <div className="border-t border-border/70 px-4 py-2">
            <p className="text-xs text-muted-foreground">{enabledCount} setting{enabledCount === 1 ? "" : "s"} enabled</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
