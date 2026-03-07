"use client";

import type { RefObject } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
	value: string;
	onChange: (value: string) => void;
	inputRef?: RefObject<HTMLInputElement | null>;
};

export function SearchBar({ value, onChange, inputRef }: SearchBarProps) {
	return (
		<div className="relative w-full motion-safe-enter">
			<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-transform duration-200 ease-out" />
			<Input
				ref={inputRef}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder="search title, description, tags..."
				aria-label="search snippets"
				className="h-10 rounded-xl border-border/70 bg-background pr-10 pl-9 transition-all duration-200 ease-out focus-visible:-translate-y-0.5 focus-visible:shadow-sm"
			/>
			{value && (
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					className="absolute top-1/2 right-2 -translate-y-1/2 animate-subtle-pop-in"
					onClick={() => onChange("")}
					aria-label="clear search"
				>
					<X className="size-3" />
				</Button>
			)}
		</div>
	);
}
