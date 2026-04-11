"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Settings2, Sparkles, SlidersHorizontal, Accessibility, Zap, Link, Github } from "lucide-react";
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
import {
  detectHardwareProfile,
  readCustomPerformanceProfile,
  readHardwareMode,
  writeHardwarePreference,
  applyHardwareOptimizations,
  writeCustomPerformanceProfile,
  type CustomPerformanceProfile,
} from "@/lib/hardware-detection";

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
type SettingsGroup = "ai" | "preferences" | "accessibility" | "performance" | "credits";

function readInitialA11ySettings(): A11ySettings {
  return {
    reducedMotion: readBoolSetting(SETTINGS_KEYS.reducedMotion),
    largerText: readBoolSetting(SETTINGS_KEYS.largerText),
    strongerFocus: readBoolSetting(SETTINGS_KEYS.strongerFocus),
  };
}

function readInitialAiMode(): AiMode {
  const savedMode = readStringSetting(SETTINGS_KEYS.aiDefaultMode, "improve");
  return AI_MODE_OPTIONS.includes(savedMode as AiMode) ? (savedMode as AiMode) : "improve";
}

export function AccessibilitySettings() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(() => readInitialA11ySettings());
  const [aiSimilaritySearch, setAiSimilaritySearch] = useState(() => readBoolSetting(SETTINGS_KEYS.aiSimilaritySearch));
  const [compactLayout, setCompactLayout] = useState(() => readBoolSetting(SETTINGS_KEYS.compactLayout));
  const [showHints, setShowHints] = useState(() => readBoolSetting(SETTINGS_KEYS.showHints, true));
  const [wrapCodeLines, setWrapCodeLines] = useState(() => readBoolSetting(SETTINGS_KEYS.wrapCodeLines));
  const [vimShortcuts, setVimShortcuts] = useState(() => readBoolSetting(SETTINGS_KEYS.vimShortcuts));
  const [aiPanelOpenByDefault, setAiPanelOpenByDefault] = useState(() => readBoolSetting(SETTINGS_KEYS.aiPanelOpenByDefault, true));
  const [aiDefaultMode, setAiDefaultMode] = useState<AiMode>(() => readInitialAiMode());
  const [codeTheme, setCodeTheme] = useState(() => readStringSetting(SETTINGS_KEYS.codeTheme, "github-dark"));
  const [hardwarePreference, setHardwarePreference] = useState<"auto" | "low" | "normal" | "custom">(() => readHardwareMode());
  const [customProfile, setCustomProfile] = useState<CustomPerformanceProfile>(() => readCustomPerformanceProfile());
  const [hardwareProfile, setHardwareProfile] = useState(() => detectHardwareProfile());
  const [activeGroup, setActiveGroup] = useState<SettingsGroup>("ai");

  useEffect(() => {
    applyRootClass("a11y-reduce-motion", settings.reducedMotion);
    applyRootClass("a11y-large-text", settings.largerText);
    applyRootClass("a11y-strong-focus", settings.strongerFocus);
    applyRootClass("pref-compact", compactLayout);
  }, [compactLayout, settings.largerText, settings.reducedMotion, settings.strongerFocus]);

  useEffect(() => {
    const handleHardwarePreferenceChange = () => {
      setHardwarePreference(readHardwareMode());
      setCustomProfile(readCustomPerformanceProfile());
      setHardwareProfile(detectHardwareProfile());
    };

    window.addEventListener("snips-hardware-preference-changed", handleHardwarePreferenceChange);
    return () => {
      window.removeEventListener("snips-hardware-preference-changed", handleHardwarePreferenceChange);
    };
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

  function toggleVimShortcuts() {
    const next = !vimShortcuts;
    setVimShortcuts(next);
    writeBoolSetting(SETTINGS_KEYS.vimShortcuts, next);
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

  function updateHardwarePreference(pref: "auto" | "low" | "normal" | "custom") {
    setHardwarePreference(pref);
    writeHardwarePreference(pref);
    applyHardwareOptimizations();
  }

  function toggleCustomProfileSetting(key: keyof CustomPerformanceProfile) {
    setCustomProfile((current) => {
      const next = { ...current, [key]: !current[key] };
      writeCustomPerformanceProfile(next);
      applyHardwareOptimizations();
      return next;
    });
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
                <button type="button" className={navButtonClass("performance")} onClick={() => setActiveGroup("performance")}>
                  <span className="inline-flex items-center gap-1"><Zap className="size-3" /> perf</span>
                </button>
                <button type="button" className={navButtonClass("accessibility")} onClick={() => setActiveGroup("accessibility")}>
                  <span className="inline-flex items-center gap-1"><Accessibility className="size-3" /> a11y</span>
                </button>
                <button type="button" className={navButtonClass("credits")} onClick={() => setActiveGroup("credits")}>
                  <span className="inline-flex items-center gap-1"><Link className="size-3" /> credits</span>
                </button>
              </div>
            </nav>

            <div className="min-h-0 overflow-y-auto theme-scrollbar p-4">
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

                  <button
                    type="button"
                    onClick={toggleVimShortcuts}
                    className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">vim-style keyboard shortcuts</p>
                      <p className="text-xs text-muted-foreground">enable global vim keys and textarea vim mode</p>
                    </div>
                    {vimShortcuts ? <Check className="size-4 text-foreground" /> : null}
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
              {activeGroup === "performance" && (
                <section className="space-y-2">
                  <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                    <p className="text-xs font-medium mb-2">hardware profile detected</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p><span className="text-foreground">cores:</span> {hardwareProfile.cores || "unknown"}</p>
                      <p><span className="text-foreground">ram:</span> {hardwareProfile.ram ? `${hardwareProfile.ram}GB` : "unknown"}</p>
                      <p><span className="text-foreground">status:</span> {hardwareProfile.isLowEnd ? "low-end device" : "high-performance device"}</p>
                    </div>
                  </div>

                  <label className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card px-3 py-2">
                    <span className="text-sm font-medium">performance mode</span>
                    <select
                      className="mt-1 h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={hardwarePreference}
                      onChange={(event) => updateHardwarePreference(event.target.value as "auto" | "low" | "normal" | "custom")}
                    >
                      <option value="auto">auto-detect (recommended)</option>
                      <option value="low">force low-end optimizations</option>
                      <option value="normal">force normal performance</option>
                      <option value="custom">custom profile</option>
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {hardwarePreference === "auto" 
                        ? "automatically optimizes based on your hardware" 
                        : hardwarePreference === "low" 
                        ? "disables visual effects like blur, sheen, and cursor tracking"
                        : hardwarePreference === "custom"
                        ? "use your own hardware/performance profile"
                        : "enables all visual effects"}
                    </p>
                  </label>

                  {hardwarePreference === "custom" && (
                    <div className="rounded-lg border border-border/70 bg-card px-3 py-2 space-y-2">
                      <p className="text-sm font-medium">custom hardware/performance profile</p>

                      <button
                        type="button"
                        onClick={() => toggleCustomProfileSetting("disableCursorTracking")}
                        className="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span>disable cursor tracking effects</span>
                        {customProfile.disableCursorTracking ? <Check className="size-3.5" /> : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCustomProfileSetting("disableBackdropFilter")}
                        className="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span>disable backdrop blur</span>
                        {customProfile.disableBackdropFilter ? <Check className="size-3.5" /> : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCustomProfileSetting("disableShadows")}
                        className="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span>disable shadow effects</span>
                        {customProfile.disableShadows ? <Check className="size-3.5" /> : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCustomProfileSetting("disableSheenEffects")}
                        className="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span>disable sheen effects</span>
                        {customProfile.disableSheenEffects ? <Check className="size-3.5" /> : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCustomProfileSetting("reduceAnimationDuration")}
                        className="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span>reduce animation durations</span>
                        {customProfile.reduceAnimationDuration ? <Check className="size-3.5" /> : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCustomProfileSetting("throttleMouseEvents")}
                        className="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span>throttle pointer events</span>
                        {customProfile.throttleMouseEvents ? <Check className="size-3.5" /> : null}
                      </button>
                    </div>
                  )}

                  <div className="rounded-lg border border-border/70 bg-card px-3 py-2 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">low-end optimizations disable:</p>
                    <ul className="list-inside space-y-0.5 ml-1">
                      <li>• backdrop blur effects</li>
                      <li>• cursor tracking effects</li>
                      <li>• sheen/shine animations</li>
                      <li>• shadow effects</li>
                      <li>• animation durations halved</li>
                    </ul>
                  </div>
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
              {activeGroup === "credits" && (
                <section className="space-y-2">
                  <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                    <p className="text-sm font-medium">made with :)</p>
                    <p className="text-xs text-muted-foreground mt-1">built by jayan.</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Github className="size-4" />
                      <p className="text-sm font-medium">github repository</p>
                    </div>
                    <p className="mt-1 text-xs text-foreground/90">
                      suggestions? fill out <a href="https://github.com/KingJayan/code-snippet-library/issues/new/choose" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">an issue</a> or <a href="https://github.com/KingJayan/code-snippet-library/compare" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">create a pr</a>.
                    </p>
                  </div>
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
