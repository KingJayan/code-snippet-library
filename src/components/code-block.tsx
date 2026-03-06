"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGUAGES } from "@/lib/constants";

const HIGHLIGHT_CACHE = new Map<string, string>();

function cacheKeyFor(code: string, language: string) {
	const start = code.slice(0, 120);
	const end = code.slice(-120);
	return `${language}:${code.length}:${start}:${end}`;
}

type CodeBlockProps = {
	code: string;
	language: string;
};

export function CodeBlock({ code, language }: CodeBlockProps) {
	const [html, setHtml] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");

	const shikiLanguage = useMemo(
		() => LANGUAGES[language]?.shiki ?? "plaintext",
		[language]
	);

	const cacheKey = useMemo(() => cacheKeyFor(code, shikiLanguage), [code, shikiLanguage]);

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
					theme: "github-dark",
				});

				if (!cancelled) {
					HIGHLIGHT_CACHE.set(cacheKey, output);
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
	}, [cacheKey, code, shikiLanguage]);

	async function copyCode() {
		try {
			await navigator.clipboard.writeText(code);
			setCopyState("done");
			setTimeout(() => setCopyState("idle"), 1200);
		} catch {
			setCopyState("failed");
			setTimeout(() => setCopyState("idle"), 1200);
		}
	}

	return (
		<section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xs">
			<div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
				<span className="font-mono text-xs text-zinc-300">{language}</span>
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

			{error && (
				<p className="border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
					{error}
				</p>
			)}

			{html ? (
				<div
					className="shiki-wrap overflow-x-auto text-sm"
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
