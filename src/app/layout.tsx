import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AccessibilitySettings } from "@/components/accessibility-settings";
import { ThemeToggle } from "@/components/theme-toggle";
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
})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <TooltipProvider delayDuration={200}>
          {children}
          <AccessibilitySettings />
          <ThemeToggle />
        </TooltipProvider>
      </body>
    </html>
  );
}
