export const SETTINGS_KEYS = {
  reducedMotion: "snips.a11y.reduced-motion",
  largerText: "snips.a11y.larger-text",
  strongerFocus: "snips.a11y.stronger-focus",
  aiSimilaritySearch: "snips.ai.similarity-search",
  aiDefaultMode: "snips.ai.mode",
  aiPanelOpenByDefault: "snips.pref.ai-panel-open",
  compactLayout: "snips.pref.compact-layout",
  showHints: "snips.pref.show-hints",
  wrapCodeLines: "snips.pref.wrap-code-lines",
  vimShortcuts: "snips.pref.vim-shortcuts",
  codeTheme: "code-theme",
  lowHardwareMode: "snips.perf.low-hardware",
} as const;

export type SettingKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS];

export function readBoolSetting(key: string, fallback = false) {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    if (value === null) return fallback;
    return value === "1";
  } catch {
    return fallback;
  }
}

export function writeBoolSetting(key: string, value: boolean) {
  if (typeof window === "undefined") return;

  try {
    if (value) {
      window.localStorage.setItem(key, "1");
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    return;
  }

  emitSettingsChanged(key, value ? "1" : "0");
}

export function readStringSetting(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;

  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStringSetting(key: string, value: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }

  emitSettingsChanged(key, value);
}

export function applyRootClass(className: string, enabled: boolean) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  if (enabled) {
    root.classList.add(className);
  } else {
    root.classList.remove(className);
  }
}

export function emitSettingsChanged(key: string, value: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("snips-settings-changed", {
      detail: { key, value },
    })
  );
}
