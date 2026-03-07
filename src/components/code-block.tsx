"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGUAGES } from "@/lib/constants";
import { readBoolSetting, SETTINGS_KEYS } from "@/lib/settings";

const HIGHLIGHT_CACHE = new Map<string, string>();
const MAX_HIGHLIGHT_CACHE_ENTRIES = 120;

function setHighlightCache(key: string, html: string) {
	if (HIGHLIGHT_CACHE.has(key)) {
		HIGHLIGHT_CACHE.delete(key);
	}

	HIGHLIGHT_CACHE.set(key, html);

	if (HIGHLIGHT_CACHE.size <= MAX_HIGHLIGHT_CACHE_ENTRIES) {
		return;
	}

	const oldestKey = HIGHLIGHT_CACHE.keys().next().value;
	if (typeof oldestKey === "string") {
		HIGHLIGHT_CACHE.delete(oldestKey);
	}
}

const THEMES = [
  { value: "github-dark", label: "github dark" },
  { value: "github-light", label: "github light" },
  { value: "dracula", label: "dracula" },
  { value: "nord", label: "nord" },
  { value: "monokai", label: "monokai" },
  { value: "one-dark-pro", label: "one dark" },
] as const;

type Theme = typeof THEMES[number]["value"];

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "github-dark";
  try {
    const stored = localStorage.getItem("code-theme");
    const isValid = THEMES.some((t) => t.value === stored);
    return isValid ? (stored as Theme) : "github-dark";
  } catch {
    return "github-dark";
  }
}

function setStoredTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("code-theme", theme);
  } catch {
    return;
  }
}

function cacheKeyFor(code: string, language: string, theme: string) {
	const start = code.slice(0, 120);
	const end = code.slice(-120);
	return `${theme}:${language}:${code.length}:${start}:${end}`;
}

type CodeBlockProps = {
	code: string;
	language: string;
};

export function CodeBlock({ code, language }: CodeBlockProps) {
	const [html, setHtml] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");
	const [theme, setTheme] = useState<Theme>("github-dark");
	const [showThemes, setShowThemes] = useState(false);
	const [wrapLines, setWrapLines] = useState(false);
	const [copyResetTimer, setCopyResetTimer] = useState<number | null>(null);

	useEffect(() => {
		setTheme(getStoredTheme());
		setWrapLines(readBoolSetting(SETTINGS_KEYS.wrapCodeLines));
	}, []);

	useEffect(() => {
		return () => {
			if (copyResetTimer !== null) {
				window.clearTimeout(copyResetTimer);
			}
		};
	}, [copyResetTimer]);

	useEffect(() => {
		function handleSettingsChange(event: Event) {
			const customEvent = event as CustomEvent<{ key?: string; value?: string }>;
			if (customEvent.detail?.key === SETTINGS_KEYS.wrapCodeLines) {
				setWrapLines(customEvent.detail.value === "1");
			}

			if (customEvent.detail?.key === SETTINGS_KEYS.codeTheme && customEvent.detail.value) {
				const next = customEvent.detail.value as Theme;
				const isValid = THEMES.some((themeOption) => themeOption.value === next);
				if (isValid) {
					setTheme(next);
				}
			}
		}

		window.addEventListener("snips-settings-changed", handleSettingsChange as EventListener);
		return () => window.removeEventListener("snips-settings-changed", handleSettingsChange as EventListener);
	}, []);

	useEffect(() => {
		if (!showThemes) return;

		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;
			if (!target.closest("[data-theme-selector]")) {
				setShowThemes(false);
			}
		}

		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, [showThemes]);

	const shikiLanguage = useMemo(
		() => LANGUAGES[language]?.shiki ?? "plaintext",
		[language]
	);

	const cacheKey = useMemo(() => cacheKeyFor(code, shikiLanguage, theme), [code, shikiLanguage, theme]);

	useEffect(() => {
		let cancelled = false;

		const cached = HIGHLIGHT_CACHE.get(cacheKey);
		if (cached) {
			setError(null);
			setHtml(cached);
			return () => {
				cancelled = true;
			};
		}

		async function highlight() {
			setError(null);
			setHtml(null);

			try {
				const { codeToHtml } = await import("shiki");
				const output = await codeToHtml(code, {
					lang: shikiLanguage,
					theme: theme,
				});

				if (!cancelled) {
					setHighlightCache(cacheKey, output);
					setHtml(output);
				}
			} catch {
				if (!cancelled) {
					setError("highlight unavailable. showing plain code.");
				}
			}
		}

		void highlight();

		return () => {
			cancelled = true;
		};
	}, [cacheKey, code, shikiLanguage, theme]);

	function changeTheme(newTheme: Theme) {
		setTheme(newTheme);
		setStoredTheme(newTheme);
		setShowThemes(false);
	}

	async function copyCode() {
		if (copyResetTimer !== null) {
			window.clearTimeout(copyResetTimer);
		}

		try {
			await navigator.clipboard.writeText(code);
			setCopyState("done");
			setCopyResetTimer(window.setTimeout(() => setCopyState("idle"), 1200));
		} catch {
			setCopyState("failed");
			setCopyResetTimer(window.setTimeout(() => setCopyState("idle"), 1200));
		}
	}

	return (
		<section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xs vfx-surface vfx-sheen vfx-edge-light vfx-float-shadow">
			<div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
				<span className="font-mono text-xs text-zinc-300">{language}</span>
				<div className="flex items-center gap-1">
					<div className="relative" data-theme-selector>
						<Button
							variant="ghost"
							size="xs"
							className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
							onClick={() => setShowThemes(!showThemes)}
							aria-label="change theme"
						>
							<Palette className="size-3" />
						</Button>
						{showThemes && (
							<div className="absolute right-0 top-full z-50 mt-1 min-w-32 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
								{THEMES.map((t) => (
									<button
										key={t.value}
										onClick={() => changeTheme(t.value)}
										className={`w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-800 ${
											theme === t.value ? "bg-zinc-800 text-white" : "text-zinc-300"
										}`}
									>
										{t.label}
									</button>
								))}
							</div>
						)}
					</div>
					<Button
						variant="ghost"
						size="xs"
						className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
						onClick={copyCode}
						aria-label="copy code"
					>
						<Copy className="size-3" />
						{copyState === "done"
							? "copied"
							: copyState === "failed"
								? "failed"
								: "copy"}
					</Button>
				</div>
			</div>

			{error && (
				<p className="border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
					{error}
				</p>
			)}

			{html ? (
				<div
					className={`shiki-wrap text-sm ${wrapLines ? "wrap-lines overflow-x-hidden" : "overflow-x-auto"}`}
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			) : (
				<div className="space-y-3 p-4">
					{!error && (
						<div className="flex items-center gap-2 text-xs text-zinc-300">
							<Loader2 className="size-3 animate-spin" />
							rendering syntax highlight...
						</div>
					)}
					<pre className="overflow-x-auto font-mono text-xs leading-relaxed text-zinc-100">
						{code}
					</pre>
				</div>
			)}
		</section>
	);
}
