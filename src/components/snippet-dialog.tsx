"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Loader2, Save, Sparkles } from "lucide-react";
import { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateDescriptionForSnippet, generateTagsForSnippet } from "@/lib/ai/client-tools";
import { LANGUAGE_OPTIONS } from "@/lib/constants";
import type { SnippetDraft, SnippetWithTags } from "@/lib/types";

const draftSchema = z.object({
	title: z.string().trim().min(1, "title is required").max(120, "title is too long"),
	language: z.string().trim().min(1, "language is required"),
	description: z.string().max(1000, "description is too long"),
	code: z.string().trim().min(1, "code is required"),
	tags: z.array(z.string().trim().min(1).max(30, "tag is too long")).max(30, "too many tags"),
});

type SnippetDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialSnippet?: SnippetWithTags | null;
	onSave: (draft: SnippetDraft) => Promise<string | null>;
};

function toDraft(snippet?: SnippetWithTags | null): SnippetDraft {
	if (!snippet) {
		return {
			title: "",
			language: "typescript",
			description: "",
			code: "",
			tags: [],
		};
	}

	return {
		title: snippet.title,
		language: snippet.language,
		description: snippet.description,
		code: snippet.code,
		tags: snippet.tags.map((tag) => tag.name),
	};
}

export function SnippetDialog({
	open,
	onOpenChange,
	initialSnippet,
	onSave,
}: SnippetDialogProps) {
	const [draft, setDraft] = useState<SnippetDraft>(() => toDraft(initialSnippet));
	const [tagsInput, setTagsInput] = useState<string>(
		initialSnippet?.tags.map((tag) => tag.name).join(", ") ?? ""
	);
	const [submitting, setSubmitting] = useState(false);
	const [tagging, setTagging] = useState(false);
	const [docGenerating, setDocGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isEditing = Boolean(initialSnippet);
	const saveLabel = useMemo(() => (isEditing ? "save changes" : "save snippet"), [isEditing]);

	function updateField<K extends keyof SnippetDraft>(field: K, value: SnippetDraft[K]) {
		setDraft((prev) => ({ ...prev, [field]: value }));
	}

	async function handleAiTags() {
		if (!draft.code.trim()) {
			setError("paste code first to generate tags");
			return;
		}

		setTagging(true);
		setError(null);

		try {
			const generatedTags = await generateTagsForSnippet({
				title: draft.title,
				language: draft.language,
				description: draft.description,
				code: draft.code,
			});

			const existingTags = tagsInput
				.split(",")
				.map((tag) => tag.trim().toLowerCase())
				.filter(Boolean);

			const merged = [...new Set([...existingTags, ...generatedTags])];
			setTagsInput(merged.join(", "));
		} catch (aiError) {
			setError(aiError instanceof Error ? aiError.message : "failed to generate tags");
		} finally {
			setTagging(false);
		}
	}

	async function handleAiDescription() {
		if (!draft.code.trim()) {
			setError("paste code first to generate docs");
			return;
		}

		setDocGenerating(true);
		setError(null);

		try {
			const description = await generateDescriptionForSnippet({
				title: draft.title,
				language: draft.language,
				description: draft.description,
				code: draft.code,
			});

			updateField("description", description);
		} catch (aiError) {
			setError(aiError instanceof Error ? aiError.message : "failed to generate docs");
		} finally {
			setDocGenerating(false);
		}
	}

	async function submit() {
		const tags = [...new Set(
			tagsInput
				.split(",")
				.map((tag) => tag.trim().toLowerCase())
				.filter(Boolean)
		)];

		const parsed = draftSchema.safeParse({
			title: draft.title,
			language: draft.language,
			description: draft.description,
			code: draft.code,
			tags,
		});

		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "invalid snippet data");
			return;
		}

		setSubmitting(true);
		setError(null);

		const saveError = await onSave({
			...parsed.data,
		});

		setSubmitting(false);

		if (saveError) {
			setError(saveError);
			return;
		}

		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="flex max-h-[92vh] max-w-3xl flex-col overflow-hidden rounded-2xl border-border/70 p-0"
				showCloseButton
			>
				<DialogHeader className="border-b border-border/60 px-5 py-4">
					<DialogTitle className="text-base font-semibold">
						{isEditing ? "edit snippet" : "new snippet"}
					</DialogTitle>
					<DialogDescription>
						paste code, add metadata, then save with {" "}
						<span className="font-medium">cmd/ctrl+enter</span>
					</DialogDescription>
				</DialogHeader>

				<form
					className="flex min-h-0 flex-1 flex-col"
					onSubmit={(event) => {
						event.preventDefault();
						void submit();
					}}
					onKeyDown={(event) => {
						if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
							event.preventDefault();
							void submit();
						}
					}}
				>
					<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
						<label className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">title</span>
								<span className="text-[10px] text-muted-foreground">
									{draft.title.length}/120
								</span>
							</div>
							<Input
								value={draft.title}
								onChange={(event) => updateField("title", event.target.value)}
								placeholder="title"
								maxLength={120}
								autoFocus
							/>
						</label>

						<div className="grid gap-3 sm:grid-cols-2">
							<label className="flex flex-col gap-1.5">
								<span className="text-xs text-muted-foreground">language</span>
								<div className="relative">
									<select
										className="h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
										value={draft.language}
										onChange={(event) => updateField("language", event.target.value)}
									>
										{LANGUAGE_OPTIONS.map((language) => (
											<option key={language.value} value={language.value}>
												{language.label}
											</option>
										))}
									</select>
									<ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
								</div>
							</label>

							<label className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between">
									<span className="text-xs text-muted-foreground">tags (comma separated)</span>
									<Button type="button" variant="ghost" size="xs" onClick={() => void handleAiTags()} disabled={tagging || submitting}>
										{tagging ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
										ai tags
									</Button>
								</div>
								<Input
									value={tagsInput}
									onChange={(event) => setTagsInput(event.target.value)}
									placeholder="react, robotics, algorithms"
								/>
							</label>
						</div>

						<label className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">description</span>
								<Button type="button" variant="ghost" size="xs" onClick={() => void handleAiDescription()} disabled={docGenerating || submitting}>
									{docGenerating ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
									ai docs
								</Button>
								<span className="text-[10px] text-muted-foreground">
									{draft.description.length}/1000
								</span>
							</div>
							<Textarea
								value={draft.description}
								onChange={(event) => updateField("description", event.target.value)}
								placeholder="short description"
								className="min-h-20"
								maxLength={1000}
							/>
						</label>

						<Textarea
							value={draft.code}
							onChange={(event) => updateField("code", event.target.value)}
							placeholder="paste code..."
							className="min-h-72 max-h-[50vh] font-mono text-xs leading-relaxed"
						/>

						{error && (
							<p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
								{error}
							</p>
						)}
					</div>

					<DialogFooter className="border-t border-border/60 px-5 py-4">
						<Button
							type="submit"
							disabled={submitting}
							className="ml-auto"
						>
							{submitting ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									saving...
								</>
							) : (
								<>
									<Save className="size-4" />
									{saveLabel}
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
