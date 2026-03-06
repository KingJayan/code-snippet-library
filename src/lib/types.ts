// database types - mirrors supabase schema

export type Snippet = {
  id: string;
  user_id: string;
  title: string;
  language: string;
  description: string;
  code: string;
  pinned: boolean;
  public: boolean;
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
  title: string;
  language: string;
  description: string;
  code: string;
  tags: string[];
};

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};
