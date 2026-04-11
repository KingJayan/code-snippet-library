import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AccessibilitySettings } from "@/components/accessibility-settings";
import { DevDebugPanel } from "@/components/dev-debug-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { VfxCursorTracker } from "@/components/vfx-cursor-tracker";
import { VimShortcutsManager } from "@/components/vim-shortcuts-manager";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "snips - code snippet library",
  description: "personal vault for reusable code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var root = document.documentElement;
  var key = 'snips.theme';
  var stored = null;
  try { stored = localStorage.getItem(key); } catch (e) {}
  var next = stored === 'light' || stored === 'dark'
    ? stored
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  if(next === 'dark'){
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  if (localStorage.getItem('snips.a11y.reduced-motion') === '1') {
    root.classList.add('a11y-reduce-motion');
  }

  if (localStorage.getItem('snips.a11y.larger-text') === '1') {
    root.classList.add('a11y-large-text');
  }

  if (localStorage.getItem('snips.a11y.stronger-focus') === '1') {
    root.classList.add('a11y-strong-focus');
  }

  if (localStorage.getItem('snips.pref.compact-layout') === '1') {
    root.classList.add('pref-compact');
  }

  var uiDensity = localStorage.getItem('snips.pref.ui-density');
  if (uiDensity === 'compact') {
    root.classList.add('pref-density-compact');
  }

  var animationLevel = localStorage.getItem('snips.pref.animation-level');
  if (animationLevel === 'reduced') {
    root.classList.add('pref-anim-reduced');
  }
  if (animationLevel === 'minimal') {
    root.classList.add('pref-anim-minimal');
  }

  (function(){
    var userPref = null;
    var mode = 'auto';
    var custom = null;
    try { 
      var stored = localStorage.getItem('snips.perf.low-hardware');
      if (stored === 'custom') mode = 'custom';
      if (stored === 'auto') userPref = null;
      if (stored === 'low') userPref = true;
      if (stored === 'normal') userPref = false;
      if (stored === 'low' || stored === 'normal') mode = stored;
      var customRaw = localStorage.getItem('snips.perf.custom-profile');
      if (customRaw) custom = JSON.parse(customRaw);
    } catch (e) {}

    if (mode === 'custom' && custom) {
      if (custom.disableCursorTracking) root.classList.add('low-hw-no-cursor-tracking');
      if (custom.disableBackdropFilter) root.classList.add('low-hw-no-backdrop-filter');
      if (custom.disableShadows) root.classList.add('low-hw-no-shadows');
      if (custom.disableSheenEffects) root.classList.add('low-hw-no-sheen');
      if (custom.reduceAnimationDuration) root.classList.add('low-hw-reduce-animations');
      return;
    }

    // Auto-detect low-end hardware
    var isLowEnd = userPref !== false && (userPref === true || 
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4)
    );

    if (isLowEnd) {
      root.classList.add('low-hw-no-cursor-tracking');
      root.classList.add('low-hw-no-backdrop-filter');
      root.classList.add('low-hw-no-shadows');
      root.classList.add('low-hw-no-sheen');
      root.classList.add('low-hw-reduce-animations');
    }
  })();
})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <TooltipProvider delayDuration={200}>
          <VfxCursorTracker />
          <VimShortcutsManager />
          {children}
          <DevDebugPanel />
          <AccessibilitySettings />
          <ThemeToggle />
        </TooltipProvider>
      </body>
    </html>
  );
}
