"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2, Palette } from "lucide-react";

import { LANGUAGES } from "@/lib/constants";
import { emitSettingsChanged, readBoolSetting, SETTINGS_KEYS } from "@/lib/settings";
import { cn } from "@/lib/utils";

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
  { value: "github-dark", label: "github dark", bg: "#24292e", border: "#444d56", text: "#e1e4e8" },
  { value: "github-light", label: "github light", bg: "#ffffff", border: "#e1e4e8", text: "#24292e" },
  { value: "dracula", label: "dracula", bg: "#282a36", border: "#44475a", text: "#f8f8f2" },
  { value: "nord", label: "nord", bg: "#2e3440", border: "#434c5e", text: "#d8dee9" },
  { value: "monokai", label: "monokai", bg: "#272822", border: "#3e3d32", text: "#f8f8f2" },
  { value: "one-dark-pro", label: "one dark", bg: "#282c34", border: "#3e4452", text: "#abb2bf" },
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
	className?: string;
};

export function CodeBlock({ code, language, className }: CodeBlockProps) {
	const [html, setHtml] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");
	const [theme, setTheme] = useState<Theme>(() => {
		if (typeof window === "undefined") return "github-dark";
		return getStoredTheme();
	});
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
		emitSettingsChanged(SETTINGS_KEYS.codeTheme, newTheme);
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

	const themeColors = THEMES.find((t) => t.value === theme) ?? THEMES[0];

	return (
		<section
			className={cn("flex min-h-0 flex-col overflow-hidden rounded-2xl shadow-xs vfx-surface vfx-sheen vfx-edge-light vfx-float-shadow", className)}
			style={{ backgroundColor: themeColors.bg, borderColor: themeColors.border, borderWidth: 1, borderStyle: "solid" }}
		>
			<div
				className="flex items-center justify-between px-3 py-2"
				style={{ borderBottom: `1px solid ${themeColors.border}` }}
			>
				<span className="font-mono text-xs" style={{ color: themeColors.text }}>{language}</span>
				<div className="flex items-center gap-1">
					<div className="relative" data-theme-selector>
						<button
							className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs opacity-70 transition-opacity hover:opacity-100"
							style={{ color: themeColors.text }}
							onClick={() => setShowThemes(!showThemes)}
							aria-label="change theme"
						>
							<Palette className="size-3" />
						</button>
						{showThemes && (
							<div
								className="absolute right-0 top-full z-50 mt-1 min-w-32 rounded-lg py-1 shadow-lg"
								style={{ backgroundColor: themeColors.bg, border: `1px solid ${themeColors.border}` }}
							>
								{THEMES.map((t) => (
									<button
										key={t.value}
										onClick={() => changeTheme(t.value)}
										className="w-full px-3 py-1.5 text-left text-xs transition-colors"
										style={{
											color: t.text,
											backgroundColor: t.value === theme ? t.border : "transparent",
										}}
										onMouseEnter={(e) => { if (t.value !== theme) (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${t.border}66`; }}
										onMouseLeave={(e) => { if (t.value !== theme) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
									>
										{t.label}
									</button>
								))}
							</div>
						)}
					</div>
					<button
						className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs opacity-70 transition-opacity hover:opacity-100"
						style={{ color: themeColors.text }}
						onClick={copyCode}
						aria-label="copy code"
					>
						<Copy className="size-3" />
						{copyState === "done"
							? "copied"
							: copyState === "failed"
								? "failed"
								: "copy"}
					</button>
				</div>
			</div>

			{error && (
				<p className="px-3 py-2 text-xs" style={{ borderBottom: `1px solid ${themeColors.border}`, color: themeColors.text, opacity: 0.7 }}>
					{error}
				</p>
			)}

			{html ? (
				<div className={wrapLines ? "min-h-0 flex-1 overflow-y-auto overflow-x-hidden" : "min-h-0 flex-1 overflow-auto"}>
					<div
						className={`shiki-wrap text-sm ${wrapLines ? "wrap-lines" : ""}`}
						dangerouslySetInnerHTML={{ __html: html }}
					/>
				</div>
			) : (
				<div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
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
