/**
 detects low-end hardware and provides recommendations for feature disabling
 */

export interface HardwareProfile {
  isLowEnd: boolean;
  cores: number;
  ram: number | null; // in GB, null if unavailable
  gpu: "unknown" | "integrated" | "discrete";
  effectiveType: "4g" | "3g" | "2g" | "slow-2g" | "unknown";
  userPreference: boolean | null; // null = auto, true = force low-end, false = force normal
}

export interface PerformanceRecommendations {
  disableCursorTracking: boolean;
  disableBackdropFilter: boolean;
  disableAnimations: boolean;
  disableShadows: boolean;
  disableSheenEffects: boolean;
  reduceAnimationDuration: boolean;
  throttleMouseEvents: boolean;
  throttleScrollEvents: boolean;
}

export interface CustomPerformanceProfile {
  disableCursorTracking: boolean;
  disableBackdropFilter: boolean;
  disableShadows: boolean;
  disableSheenEffects: boolean;
  reduceAnimationDuration: boolean;
  throttleMouseEvents: boolean;
  throttleScrollEvents: boolean;
}

const SETTINGS_KEY = "snips.perf.low-hardware";
const CUSTOM_PROFILE_KEY = "snips.perf.custom-profile";

const DEFAULT_CUSTOM_PROFILE: CustomPerformanceProfile = {
  disableCursorTracking: false,
  disableBackdropFilter: false,
  disableShadows: false,
  disableSheenEffects: false,
  reduceAnimationDuration: false,
  throttleMouseEvents: false,
  throttleScrollEvents: false,
};

type NavigatorHardware = Navigator & {
  deviceMemory?: number;
  connection?: {
    effectiveType?: "4g" | "3g" | "2g" | "slow-2g";
  };
};

export function detectHardwareProfile(): HardwareProfile {
  const userPreference = readHardwarePreference();

  const navigator_ = (typeof navigator !== "undefined" ? navigator : null) as NavigatorHardware | null;
  const cores = navigator_?.hardwareConcurrency ?? 0;
  const connection = navigator_?.connection;
  const effectiveType = (connection?.effectiveType ?? "unknown") as HardwareProfile["effectiveType"];
  const deviceMemory = navigator_?.deviceMemory ?? null;

  //detect GPU type
  let gpu: "unknown" | "integrated" | "discrete" = "unknown";
  if (typeof window !== "undefined") {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
        (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (typeof renderer === "string") {
            const rendererLower = renderer.toLowerCase();
            if (rendererLower.includes("intel") || rendererLower.includes("radeon")) {
              gpu = "integrated";
            } else if (
              rendererLower.includes("nvidia") ||
              rendererLower.includes("geforce") ||
              rendererLower.includes("amd") ||
              rendererLower.includes("apple")
            ) {
              gpu = "discrete";
            }
          }
        }
      }
    } catch {
      //silently fail, gpu detection only advisory
    }
  }

  const isLowEnd =
    userPreference !== false &&
    (userPreference === true || cores <= 4 || (deviceMemory !== null && deviceMemory <= 4));

  return {
    isLowEnd,
    cores,
    ram: deviceMemory,
    gpu,
    effectiveType,
    userPreference,
  };
}

export function getPerformanceRecommendations(
  profile: HardwareProfile
): PerformanceRecommendations {
  const mode = readHardwareMode();
  if (mode === "custom") {
    const custom = readCustomPerformanceProfile();
    return {
      disableCursorTracking: custom.disableCursorTracking,
      disableBackdropFilter: custom.disableBackdropFilter,
      disableAnimations: false,
      disableShadows: custom.disableShadows,
      disableSheenEffects: custom.disableSheenEffects,
      reduceAnimationDuration: custom.reduceAnimationDuration,
      throttleMouseEvents: custom.throttleMouseEvents,
      throttleScrollEvents: custom.throttleScrollEvents,
    };
  }

  if (!profile.isLowEnd) {
    return {
      disableCursorTracking: false,
      disableBackdropFilter: false,
      disableAnimations: false,
      disableShadows: false,
      disableSheenEffects: false,
      reduceAnimationDuration: false,
      throttleMouseEvents: false,
      throttleScrollEvents: false,
    };
  }

  return {
    disableCursorTracking: true,
    disableBackdropFilter: true,
    disableAnimations: false,
    disableShadows: true,
    disableSheenEffects: true,
    reduceAnimationDuration: true,
    throttleMouseEvents: true,
    throttleScrollEvents: true,
  };
}


export function readHardwareMode(): "auto" | "low" | "normal" | "custom" {
  if (typeof window === "undefined") return "auto";

  try {
    const value = window.localStorage.getItem(SETTINGS_KEY);
    if (value === "low" || value === "normal" || value === "custom") {
      return value;
    }
    return "auto";
  } catch {
    return "auto";
  }
}

export function readHardwarePreference(): boolean | null {
  const mode = readHardwareMode();
  if (mode === "low") return true;
  if (mode === "normal") return false;
  return null;
}


export function writeHardwarePreference(preference: "auto" | "low" | "normal" | "custom") {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SETTINGS_KEY, preference);
    window.dispatchEvent(
      new CustomEvent("snips-hardware-preference-changed", {
        detail: { preference },
      })
    );
  } catch {
    return;
  }
}

export function readCustomPerformanceProfile(): CustomPerformanceProfile {
  if (typeof window === "undefined") return DEFAULT_CUSTOM_PROFILE;

  try {
    const raw = window.localStorage.getItem(CUSTOM_PROFILE_KEY);
    if (!raw) return DEFAULT_CUSTOM_PROFILE;
    const parsed = JSON.parse(raw) as Partial<CustomPerformanceProfile>;
    return {
      disableCursorTracking: !!parsed.disableCursorTracking,
      disableBackdropFilter: !!parsed.disableBackdropFilter,
      disableShadows: !!parsed.disableShadows,
      disableSheenEffects: !!parsed.disableSheenEffects,
      reduceAnimationDuration: !!parsed.reduceAnimationDuration,
      throttleMouseEvents: !!parsed.throttleMouseEvents,
      throttleScrollEvents: !!parsed.throttleScrollEvents,
    };
  } catch {
    return DEFAULT_CUSTOM_PROFILE;
  }
}

export function writeCustomPerformanceProfile(profile: CustomPerformanceProfile) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CUSTOM_PROFILE_KEY, JSON.stringify(profile));
    window.dispatchEvent(
      new CustomEvent("snips-hardware-preference-changed", {
        detail: { preference: "custom", profile },
      })
    );
  } catch {
    return;
  }
}


export function applyHardwareOptimizations() {
  if (typeof document === "undefined") return;

  const profile = detectHardwareProfile();
  const recommendations = getPerformanceRecommendations(profile);

  const root = document.documentElement;

  if (recommendations.disableCursorTracking) {
    root.classList.add("low-hw-no-cursor-tracking");
  } else {
    root.classList.remove("low-hw-no-cursor-tracking");
  }

  if (recommendations.disableBackdropFilter) {
    root.classList.add("low-hw-no-backdrop-filter");
  } else {
    root.classList.remove("low-hw-no-backdrop-filter");
  }

  if (recommendations.disableShadows) {
    root.classList.add("low-hw-no-shadows");
  } else {
    root.classList.remove("low-hw-no-shadows");
  }

  if (recommendations.disableSheenEffects) {
    root.classList.add("low-hw-no-sheen");
  } else {
    root.classList.remove("low-hw-no-sheen");
  }

  if (recommendations.reduceAnimationDuration) {
    root.classList.add("low-hw-reduce-animations");
  } else {
    root.classList.remove("low-hw-reduce-animations");
  }

  return profile;
}


export function createThrottledHandler(
  handler: (event: Event) => void,
  throttleMs: number = 16
) {
  let lastCall = 0;
  return (event: Event) => {
    const now = Date.now();
    if (now - lastCall >= throttleMs) {
      lastCall = now;
      handler(event);
    }
  };
}
