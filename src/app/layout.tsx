import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  function applyTheme(){
    if(media.matches){
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
  applyTheme();
  if(media.addEventListener){
    media.addEventListener('change', applyTheme);
  } else if(media.addListener){
    media.addListener(applyTheme);
  }
})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider delayDuration={200}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
