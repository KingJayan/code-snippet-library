"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TagFilterProps = {
	tags: string[];
	activeTag: string | null;
	onTagChange: (tag: string | null) => void;
};

export function TagFilter({ tags, activeTag, onTagChange }: TagFilterProps) {
	if (tags.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			{tags.map((tag) => {
				const isActive = activeTag === tag;
				return (
					<Button
						key={tag}
						type="button"
						variant={isActive ? "secondary" : "ghost"}
						size="xs"
						className="rounded-full"
						onClick={() => onTagChange(isActive ? null : tag)}
						aria-pressed={isActive}
						aria-label={`filter by tag ${tag}`}
					>
						<Badge variant={isActive ? "secondary" : "outline"} className="max-w-32 truncate" title={tag.length > 20 ? tag : undefined}>
							{tag}
						</Badge>
					</Button>
				);
			})}
			{activeTag && (
				<Button
					type="button"
					variant="ghost"
					size="xs"
					onClick={() => onTagChange(null)}
				>
					clear
				</Button>
			)}
		</div>
	);
}
