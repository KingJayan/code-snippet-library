// database types - mirrors supabase schema

export type Snippet = {
  id: string;
  user_id: string;
  workspace_id: string;
  title: string;
  language: string;
  description: string;
  code: string;
  pinned: boolean;
  public: boolean;
  benchmark_chars: number | null;
  benchmark_bytes: number | null;
  benchmark_bits: number | null;
  benchmark_lines: number | null;
  view_count: number;
  copy_count: number;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type SnippetTag = {
  snippet_id: string;
  tag_id: string;
};

// joined shape used across the ui
export type SnippetWithTags = Snippet & {
  tags: Tag[];
};

export type SnippetSummary = Omit<Snippet, "code">;

export type SnippetSummaryWithTags = SnippetSummary & {
  tags: Tag[];
};

export type SnippetDraft = {
  workspace_id?: string;
  title: string;
  language: string;
  description: string;
  code: string;
  tags: string[];
};

export type Workspace = {
  id: string;
  owner_id: string;
  name: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMembership = {
  workspace_id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  created_at: string;
};

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};
