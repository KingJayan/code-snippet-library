"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Accessibility,
  Check,
  ChevronDown,
  Github,
  Link,
  Palette,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
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
  applyHardwareOptimizations,
  detectHardwareProfile,
  getPerformanceRecommendations,
  readCustomPerformanceProfile,
  readHardwareMode,
  writeCustomPerformanceProfile,
  writeHardwarePreference,
  type CustomPerformanceProfile,
} from "@/lib/hardware-detection";
import { APP_VERSION } from "@/lib/app-version";

type A11ySettings = {
  reducedMotion: boolean;
  largerText: boolean;
  strongerFocus: boolean;
};

type PersonalizationPreset = "balanced" | "focused" | "expressive" | "custom";
type UiDensity = "comfortable" | "compact";
type AnimationLevel = "full" | "reduced" | "minimal";
type RecentChange = {
  key: string;
  label: string;
  at: number;
};

const RECENT_CHANGES_KEY = "snips.pref.recent-changes";

const CODE_THEME_OPTIONS = [
  { value: "github-dark", label: "github dark" },
  { value: "github-light", label: "github light" },
  { value: "dracula", label: "dracula" },
  { value: "nord", label: "nord" },
  { value: "monokai", label: "monokai" },
  { value: "one-dark-pro", label: "one dark" },
];

const AI_MODE_OPTIONS = ["improve", "refactor", "debug", "explain"] as const;
const PERSONALIZATION_PRESETS: Array<{ value: PersonalizationPreset; label: string }> = [
  { value: "balanced", label: "balanced" },
  { value: "focused", label: "focused" },
  { value: "expressive", label: "expressive" },
  { value: "custom", label: "custom" },
];

const SETTINGS_LABELS: Record<string, string> = {
  [SETTINGS_KEYS.aiSimilaritySearch]: "ai similarity search",
  [SETTINGS_KEYS.aiPanelOpenByDefault]: "open ai panel by default",
  [SETTINGS_KEYS.aiDefaultMode]: "default ai mode",
  [SETTINGS_KEYS.compactLayout]: "compact layout",
  [SETTINGS_KEYS.showHints]: "show productivity hints",
  [SETTINGS_KEYS.wrapCodeLines]: "wrap long code lines",
  [SETTINGS_KEYS.vimShortcuts]: "vim shortcuts",
  [SETTINGS_KEYS.codeTheme]: "default code theme",
  [SETTINGS_KEYS.reducedMotion]: "reduced ui motion",
  [SETTINGS_KEYS.largerText]: "larger text",
  [SETTINGS_KEYS.strongerFocus]: "stronger focus outlines",
  [SETTINGS_KEYS.personalizationPreset]: "personalization preset",
  [SETTINGS_KEYS.uiDensity]: "ui density",
  [SETTINGS_KEYS.animationLevel]: "animation level",
  [SETTINGS_KEYS.lowHardwareMode]: "performance mode",
  "snips.perf.custom.disableCursorTracking": "disable cursor tracking",
  "snips.perf.custom.disableBackdropFilter": "disable backdrop blur",
  "snips.perf.custom.disableShadows": "disable shadows",
  "snips.perf.custom.disableSheenEffects": "disable sheen effects",
  "snips.perf.custom.reduceAnimationDuration": "reduce animation durations",
  "snips.perf.custom.throttleMouseEvents": "throttle pointer events",
  "snips.perf.custom.throttleScrollEvents": "throttle scroll events",
};

type AiMode = (typeof AI_MODE_OPTIONS)[number];
type SettingsGroup =
  | "personalization"
  | "ai"
  | "preferences"
  | "accessibility"
  | "performance"
  | "credits";

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

function readInitialRecentChanges(): RecentChange[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_CHANGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentChange[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item?.key === "string" && typeof item?.label === "string").slice(0, 6);
  } catch {
    return [];
  }
}

export function AccessibilitySettings() {
  const [open, setOpen] = useState(false);
  const [settingsQuery, setSettingsQuery] = useState("");
  const [settings, setSettings] = useState<A11ySettings>(() => readInitialA11ySettings());
  const [aiSimilaritySearch, setAiSimilaritySearch] = useState(() => readBoolSetting(SETTINGS_KEYS.aiSimilaritySearch));
  const [compactLayout, setCompactLayout] = useState(() => readBoolSetting(SETTINGS_KEYS.compactLayout));
  const [showHints, setShowHints] = useState(() => readBoolSetting(SETTINGS_KEYS.showHints, true));
  const [wrapCodeLines, setWrapCodeLines] = useState(() => readBoolSetting(SETTINGS_KEYS.wrapCodeLines));
  const [vimShortcuts, setVimShortcuts] = useState(() => readBoolSetting(SETTINGS_KEYS.vimShortcuts));
  const [aiPanelOpenByDefault, setAiPanelOpenByDefault] = useState(() => readBoolSetting(SETTINGS_KEYS.aiPanelOpenByDefault, true));
  const [aiDefaultMode, setAiDefaultMode] = useState<AiMode>(() => readInitialAiMode());
  const [codeTheme, setCodeTheme] = useState(() => readStringSetting(SETTINGS_KEYS.codeTheme, "github-dark"));
  const [personalizationPreset, setPersonalizationPreset] = useState<PersonalizationPreset>(() => {
    const saved = readStringSetting(SETTINGS_KEYS.personalizationPreset, "balanced");
    return PERSONALIZATION_PRESETS.some((item) => item.value === saved)
      ? (saved as PersonalizationPreset)
      : "balanced";
  });
  const [uiDensity, setUiDensity] = useState<UiDensity>(() => {
    const saved = readStringSetting(SETTINGS_KEYS.uiDensity, "comfortable");
    return saved === "compact" ? "compact" : "comfortable";
  });
  const [animationLevel, setAnimationLevel] = useState<AnimationLevel>(() => {
    const saved = readStringSetting(SETTINGS_KEYS.animationLevel, "full");
    return saved === "reduced" || saved === "minimal" ? saved : "full";
  });
  const [hardwarePreference, setHardwarePreference] = useState<"auto" | "low" | "normal" | "custom">(() => readHardwareMode());
  const [customProfile, setCustomProfile] = useState<CustomPerformanceProfile>(() => readCustomPerformanceProfile());
  const [hardwareProfile, setHardwareProfile] = useState(() => detectHardwareProfile());
  const [activeGroup, setActiveGroup] = useState<SettingsGroup>("personalization");
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>(() => readInitialRecentChanges());

  const panelWrapRef = useRef<HTMLDivElement>(null);
  const panelInnerRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = settingsQuery.trim().toLowerCase();
  const perfRecommendations = useMemo(
    () => getPerformanceRecommendations(hardwareProfile),
    [hardwareProfile]
  );
  const recommendedPerformanceMode = hardwareProfile.isLowEnd ? "low" : "normal";

  function matchesQuery(...terms: string[]) {
    if (!normalizedQuery) return true;
    return terms.some((term) => term.toLowerCase().includes(normalizedQuery));
  }

  function pushRecentChange(key: string, fallbackLabel?: string) {
    const label = SETTINGS_LABELS[key] ?? fallbackLabel ?? key;
    setRecentChanges((current) => {
      const next: RecentChange[] = [
        { key, label, at: Date.now() },
        ...current.filter((entry) => entry.key !== key),
      ].slice(0, 6);

      try {
        window.localStorage.setItem(RECENT_CHANGES_KEY, JSON.stringify(next));
      } catch {
        return next;
      }

      return next;
    });
  }

  useEffect(() => {
    applyRootClass("a11y-reduce-motion", settings.reducedMotion);
    applyRootClass("a11y-large-text", settings.largerText);
    applyRootClass("a11y-strong-focus", settings.strongerFocus);
    applyRootClass("pref-compact", compactLayout);
    applyRootClass("pref-density-compact", uiDensity === "compact");
    applyRootClass("pref-anim-reduced", animationLevel === "reduced");
    applyRootClass("pref-anim-minimal", animationLevel === "minimal");
  }, [
    animationLevel,
    compactLayout,
    settings.largerText,
    settings.reducedMotion,
    settings.strongerFocus,
    uiDensity,
  ]);

  useEffect(() => {
    const handleHardwarePreferenceChange = () => {
      setHardwarePreference(readHardwareMode());
      setCustomProfile(readCustomPerformanceProfile());
      setHardwareProfile(detectHardwareProfile());
      pushRecentChange(SETTINGS_KEYS.lowHardwareMode, "performance mode");
    };

    const handleSettingsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>;
      if (!customEvent.detail?.key) return;
      pushRecentChange(customEvent.detail.key);
    };

    window.addEventListener("snips-hardware-preference-changed", handleHardwarePreferenceChange);
    window.addEventListener("snips-settings-changed", handleSettingsChanged as EventListener);

    return () => {
      window.removeEventListener("snips-hardware-preference-changed", handleHardwarePreferenceChange);
      window.removeEventListener("snips-settings-changed", handleSettingsChanged as EventListener);
    };
  }, []);

  useLayoutEffect(() => {
    const outer = panelWrapRef.current;
    const inner = panelInnerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      outer.style.height = `${inner.offsetHeight}px`;
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [activeGroup]);

  const enabledCount = useMemo(() => {
    const a11yCount = Object.values(settings).filter(Boolean).length;
    return a11yCount + (aiSimilaritySearch ? 1 : 0);
  }, [aiSimilaritySearch, settings]);

  function applyPersonalizationPreset(preset: PersonalizationPreset) {
    setPersonalizationPreset(preset);
    writeStringSetting(SETTINGS_KEYS.personalizationPreset, preset);

    if (preset === "custom") return;

    const nextValues =
      preset === "focused"
        ? {
            density: "compact" as UiDensity,
            motion: "reduced" as AnimationLevel,
            hints: false,
            aiPanel: false,
            vim: true,
            compact: true,
          }
        : preset === "expressive"
        ? {
            density: "comfortable" as UiDensity,
            motion: "full" as AnimationLevel,
            hints: true,
            aiPanel: true,
            vim: false,
            compact: false,
          }
        : {
            density: "comfortable" as UiDensity,
            motion: "full" as AnimationLevel,
            hints: true,
            aiPanel: true,
            vim: false,
            compact: false,
          };

    setUiDensity(nextValues.density);
    setAnimationLevel(nextValues.motion);
    setShowHints(nextValues.hints);
    setAiPanelOpenByDefault(nextValues.aiPanel);
    setVimShortcuts(nextValues.vim);
    setCompactLayout(nextValues.compact);

    writeStringSetting(SETTINGS_KEYS.uiDensity, nextValues.density);
    writeStringSetting(SETTINGS_KEYS.animationLevel, nextValues.motion);
    writeBoolSetting(SETTINGS_KEYS.showHints, nextValues.hints);
    writeBoolSetting(SETTINGS_KEYS.aiPanelOpenByDefault, nextValues.aiPanel);
    writeBoolSetting(SETTINGS_KEYS.vimShortcuts, nextValues.vim);
    writeBoolSetting(SETTINGS_KEYS.compactLayout, nextValues.compact);
    applyRootClass("pref-compact", nextValues.compact);
    applyRootClass("pref-density-compact", nextValues.density === "compact");
    applyRootClass("pref-anim-reduced", nextValues.motion === "reduced");
    applyRootClass("pref-anim-minimal", nextValues.motion === "minimal");
  }

  function updateUiDensity(nextDensity: UiDensity) {
    setUiDensity(nextDensity);
    writeStringSetting(SETTINGS_KEYS.uiDensity, nextDensity);
    applyRootClass("pref-density-compact", nextDensity === "compact");

    if (personalizationPreset !== "custom") {
      setPersonalizationPreset("custom");
      writeStringSetting(SETTINGS_KEYS.personalizationPreset, "custom");
    }
  }

  function updateAnimationLevel(nextLevel: AnimationLevel) {
    setAnimationLevel(nextLevel);
    writeStringSetting(SETTINGS_KEYS.animationLevel, nextLevel);
    applyRootClass("pref-anim-reduced", nextLevel === "reduced");
    applyRootClass("pref-anim-minimal", nextLevel === "minimal");

    if (personalizationPreset !== "custom") {
      setPersonalizationPreset("custom");
      writeStringSetting(SETTINGS_KEYS.personalizationPreset, "custom");
    }
  }

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

    if (personalizationPreset !== "custom") {
      setPersonalizationPreset("custom");
      writeStringSetting(SETTINGS_KEYS.personalizationPreset, "custom");
    }
  }

  function toggleShowHints() {
    const next = !showHints;
    setShowHints(next);
    writeBoolSetting(SETTINGS_KEYS.showHints, next);

    if (personalizationPreset !== "custom") {
      setPersonalizationPreset("custom");
      writeStringSetting(SETTINGS_KEYS.personalizationPreset, "custom");
    }
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

    if (personalizationPreset !== "custom") {
      setPersonalizationPreset("custom");
      writeStringSetting(SETTINGS_KEYS.personalizationPreset, "custom");
    }
  }

  function toggleAiPanelDefault() {
    const next = !aiPanelOpenByDefault;
    setAiPanelOpenByDefault(next);
    writeBoolSetting(SETTINGS_KEYS.aiPanelOpenByDefault, next);

    if (personalizationPreset !== "custom") {
      setPersonalizationPreset("custom");
      writeStringSetting(SETTINGS_KEYS.personalizationPreset, "custom");
    }
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
      pushRecentChange(`snips.perf.custom.${key}`);
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

  const showRecentInThisSection = activeGroup === "personalization" || !normalizedQuery;

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
                configure ai features, personalization, and accessibility preferences.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="border-b border-border/70 px-4 py-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-1.5">
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                value={settingsQuery}
                onChange={(event) => setSettingsQuery(event.target.value)}
                placeholder="search all settings…"
                className="h-6 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[130px_minmax(0,1fr)]">
            <nav className="border-r border-border/70 bg-muted/20 p-2">
              <div className="space-y-1">
                <button type="button" className={navButtonClass("personalization")} onClick={() => setActiveGroup("personalization")}>
                  <span className="inline-flex items-center gap-1"><Palette className="size-3" /> personal</span>
                </button>
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

            <div
              ref={panelWrapRef}
              className="overflow-hidden transition-[height] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
            <div key={activeGroup} ref={panelInnerRef} className="max-h-[60vh] overflow-y-auto theme-scrollbar p-4 animate-subtle-fade-up">
              {showRecentInThisSection && recentChanges.length > 0 && (
                <section className="mb-3 rounded-lg border border-border/70 bg-card px-3 py-2">
                  <p className="text-xs font-medium">recently changed</p>
                  <div className="mt-1 space-y-1">
                    {recentChanges.slice(0, 4).map((item) => (
                      <p key={item.key} className="text-xs text-muted-foreground">{item.label}</p>
                    ))}
                  </div>
                </section>
              )}

              {activeGroup === "personalization" && (
                <section className="space-y-2">
                  {matchesQuery("preset", "personalization", "focused", "balanced", "expressive") && (
                    <label className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card px-3 py-2">
                      <span className="text-sm font-medium">personalization preset</span>
                      <select
                        className="mt-1 h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={personalizationPreset}
                        onChange={(event) => applyPersonalizationPreset(event.target.value as PersonalizationPreset)}
                      >
                        {PERSONALIZATION_PRESETS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">practical presets for look + workflow defaults.</p>
                    </label>
                  )}

                  {matchesQuery("density", "spacing", "compact", "comfortable") && (
                    <label className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card px-3 py-2">
                      <span className="text-sm font-medium">ui density</span>
                      <select
                        className="mt-1 h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={uiDensity}
                        onChange={(event) => updateUiDensity(event.target.value as UiDensity)}
                      >
                        <option value="comfortable">comfortable</option>
                        <option value="compact">compact</option>
                      </select>
                    </label>
                  )}

                  {matchesQuery("animation", "motion", "speed") && (
                    <label className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card px-3 py-2">
                      <span className="text-sm font-medium">animation level</span>
                      <select
                        className="mt-1 h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={animationLevel}
                        onChange={(event) => updateAnimationLevel(event.target.value as AnimationLevel)}
                      >
                        <option value="full">full</option>
                        <option value="reduced">reduced</option>
                        <option value="minimal">minimal</option>
                      </select>
                    </label>
                  )}

                  {matchesQuery("ai panel", "layout", "workflow", "default") && (
                    <button
                      type="button"
                      onClick={toggleAiPanelDefault}
                      className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                    >
                      <div>
                        <p className="text-sm font-medium">open ai panel by default</p>
                        <p className="text-xs text-muted-foreground">layout default on snippet detail page</p>
                      </div>
                      {aiPanelOpenByDefault ? <Check className="size-4 text-foreground" /> : null}
                    </button>
                  )}

                  {matchesQuery("vim", "hints", "workflow", "shortcuts") && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={toggleVimShortcuts}
                        className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                      >
                        <span className="text-xs">vim shortcuts</span>
                        {vimShortcuts ? <Check className="size-3.5 text-foreground" /> : null}
                      </button>
                      <button
                        type="button"
                        onClick={toggleShowHints}
                        className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent"
                      >
                        <span className="text-xs">show hints</span>
                        {showHints ? <Check className="size-3.5 text-foreground" /> : null}
                      </button>
                    </div>
                  )}
                </section>
              )}

              {activeGroup === "ai" && (
                <section className="space-y-2">
                  {matchesQuery("similarity", "ai", "related", "search") && (
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
                  )}

                  {matchesQuery("ai panel", "default") && (
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
                  )}

                  {matchesQuery("mode", "default ai mode", "improve", "refactor", "debug", "explain") && (
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
                  )}
                </section>
              )}

              {activeGroup === "preferences" && (
                <section className="space-y-2">
                  {matchesQuery("compact", "density", "layout") && (
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
                  )}

                  {matchesQuery("hints", "productivity", "labels") && (
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
                  )}

                  {matchesQuery("wrap", "code", "line") && (
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
                  )}

                  {matchesQuery("vim", "shortcuts") && (
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
                  )}

                  {matchesQuery("theme", "code", "appearance") && (
                    <label className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card px-3 py-2">
                      <span className="text-sm font-medium">default code theme</span>
                      <div className="relative mt-1">
                        <select
                          className="h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                          value={codeTheme}
                          onChange={(event) => updateCodeTheme(event.target.value)}
                        >
                          {CODE_THEME_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </label>
                  )}
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">performance mode</span>
                      <span className="rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                        recommended: {recommendedPerformanceMode}
                      </span>
                    </div>
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
                        <span className="inline-flex items-center gap-2">
                          disable cursor tracking effects
                          {perfRecommendations.disableCursorTracking ? <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">recommended</span> : null}
                        </span>
                        {customProfile.disableCursorTracking ? <Check className="size-3.5" /> : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCustomProfileSetting("disableBackdropFilter")}
                        className="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span className="inline-flex items-center gap-2">
                          disable backdrop blur
                          {perfRecommendations.disableBackdropFilter ? <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">recommended</span> : null}
                        </span>
                        {customProfile.disableBackdropFilter ? <Check className="size-3.5" /> : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCustomProfileSetting("disableShadows")}
                        className="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span className="inline-flex items-center gap-2">
                          disable shadow effects
                          {perfRecommendations.disableShadows ? <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">recommended</span> : null}
                        </span>
                        {customProfile.disableShadows ? <Check className="size-3.5" /> : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCustomProfileSetting("disableSheenEffects")}
                        className="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span className="inline-flex items-center gap-2">
                          disable sheen effects
                          {perfRecommendations.disableSheenEffects ? <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">recommended</span> : null}
                        </span>
                        {customProfile.disableSheenEffects ? <Check className="size-3.5" /> : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCustomProfileSetting("reduceAnimationDuration")}
                        className="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span className="inline-flex items-center gap-2">
                          reduce animation durations
                          {perfRecommendations.reduceAnimationDuration ? <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">recommended</span> : null}
                        </span>
                        {customProfile.reduceAnimationDuration ? <Check className="size-3.5" /> : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCustomProfileSetting("throttleMouseEvents")}
                        className="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span className="inline-flex items-center gap-2">
                          throttle pointer events
                          {perfRecommendations.throttleMouseEvents ? <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">recommended</span> : null}
                        </span>
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
                  {matchesQuery("motion", "reduce", "animation") && (
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
                  )}

                  {matchesQuery("text", "readability", "larger") && (
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
                  )}

                  {matchesQuery("focus", "keyboard", "outline") && (
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
                  )}
                </section>
              )}

              {activeGroup === "credits" && (
                <section className="space-y-2">
                  <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                    <p className="text-sm font-medium">made with :)</p>
                    <p className="text-xs text-muted-foreground mt-1">built by jayan.</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">app version {APP_VERSION}</p>
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
          </div>

          <div className="border-t border-border/70 px-4 py-2">
            <p className="text-xs text-muted-foreground">{enabledCount} setting{enabledCount === 1 ? "" : "s"} enabled</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
