"use client";

import { useEffect, useState } from "react";
import {
  detectHardwareProfile,
  getPerformanceRecommendations,
  createThrottledHandler,
} from "@/lib/hardware-detection";

export function VfxCursorTracker() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handlePreferenceChange = () => setVersion((current) => current + 1);
    window.addEventListener("snips-hardware-preference-changed", handlePreferenceChange);
    return () => {
      window.removeEventListener("snips-hardware-preference-changed", handlePreferenceChange);
    };
  }, []);

  const profile = detectHardwareProfile();
  const recommendations = getPerformanceRecommendations(profile);

  useEffect(() => {
    if (recommendations.disableCursorTracking) {
      return;
    }

    const root = document.documentElement;

    const setCursorVars = (x: number, y: number) => {
      root.style.setProperty("--cursor-x", `${x}px`);
      root.style.setProperty("--cursor-y", `${y}px`);
    };

    setCursorVars(window.innerWidth * 0.5, window.innerHeight * 0.3);

    let activeSheenHost: HTMLElement | null = null;

    const updateSheen = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        activeSheenHost = null;
        return;
      }

      const sheenHost = target.closest(".vfx-sheen");
      if (!(sheenHost instanceof HTMLElement)) {
        activeSheenHost = null;
        return;
      }

      activeSheenHost = sheenHost;
      const rect = sheenHost.getBoundingClientRect();
      sheenHost.style.setProperty("--sheen-x", `${event.clientX - rect.left}px`);
      sheenHost.style.setProperty("--sheen-y", `${event.clientY - rect.top}px`);
    };

    const onPointerMove = (event: PointerEvent) => {
      setCursorVars(event.clientX, event.clientY);

      if (activeSheenHost) {
        const rect = activeSheenHost.getBoundingClientRect();
        activeSheenHost.style.setProperty("--sheen-x", `${event.clientX - rect.left}px`);
        activeSheenHost.style.setProperty("--sheen-y", `${event.clientY - rect.top}px`);
        return;
      }

      updateSheen(event);
    };

    const onPointerLeave = () => {
      activeSheenHost = null;
    };


    const throttledOnPointerMove = recommendations.throttleMouseEvents
      ? (createThrottledHandler as any)(onPointerMove, 32)
      : onPointerMove;

    window.addEventListener("pointermove", throttledOnPointerMove as any, { passive: true });
    document.addEventListener("pointerenter", updateSheen as EventListener, true);
    document.addEventListener("pointerover", updateSheen as EventListener, true);
    document.addEventListener("pointerleave", onPointerLeave, true);

    return () => {
      window.removeEventListener("pointermove", throttledOnPointerMove as any);
      document.removeEventListener("pointerenter", updateSheen as EventListener, true);
      document.removeEventListener("pointerover", updateSheen as EventListener, true);
      document.removeEventListener("pointerleave", onPointerLeave, true);
    };
  }, [recommendations.disableCursorTracking, recommendations.throttleMouseEvents, version]);

  return null;
}
