"use client";

import { useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
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
	const [error, setError] = useState<string | null>(null);

	const isEditing = Boolean(initialSnippet);
	const saveLabel = useMemo(() => (isEditing ? "save changes" : "save snippet"), [isEditing]);

	function updateField<K extends keyof SnippetDraft>(field: K, value: SnippetDraft[K]) {
		setDraft((prev) => ({ ...prev, [field]: value }));
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
						<Input
							value={draft.title}
							onChange={(event) => updateField("title", event.target.value)}
							placeholder="title"
							maxLength={120}
							autoFocus
						/>

						<div className="grid gap-3 sm:grid-cols-2">
							<label className="flex flex-col gap-1.5">
								<span className="text-xs text-muted-foreground">language</span>
								<select
									className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
									value={draft.language}
									onChange={(event) => updateField("language", event.target.value)}
								>
									{LANGUAGE_OPTIONS.map((language) => (
										<option key={language.value} value={language.value}>
											{language.label}
										</option>
									))}
								</select>
							</label>

							<label className="flex flex-col gap-1.5">
								<span className="text-xs text-muted-foreground">tags (comma separated)</span>
								<Input
									value={tagsInput}
									onChange={(event) => setTagsInput(event.target.value)}
									placeholder="react, robotics, algorithms"
								/>
							</label>
						</div>

						<Textarea
							value={draft.description}
							onChange={(event) => updateField("description", event.target.value)}
							placeholder="short description"
							className="min-h-20"
						/>

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
