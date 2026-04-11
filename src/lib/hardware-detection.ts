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

const SETTINGS_KEY = "snips.perf.low-hardware";

export function detectHardwareProfile(): HardwareProfile {
  const userPreference = readHardwarePreference();

  const navigator_ = typeof navigator !== "undefined" ? navigator : null;
  const cores = navigator_?.hardwareConcurrency ?? 0;
  const connection = (navigator_ as any)?.connection;
  const effectiveType = (connection?.effectiveType ?? "unknown") as any;
  const deviceMemory = (navigator_ as any)?.deviceMemory ?? null;

  //detect GPU type
  let gpu: "unknown" | "integrated" | "discrete" = "unknown";
  if (typeof window !== "undefined") {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = (gl as any).getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
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


export function readHardwarePreference(): boolean | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(SETTINGS_KEY);
    if (value === null) return null;
    if (value === "auto") return null;
    if (value === "low") return true;
    if (value === "normal") return false;
    return null;
  } catch {
    return null;
  }
}


export function writeHardwarePreference(preference: "auto" | "low" | "normal") {
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
