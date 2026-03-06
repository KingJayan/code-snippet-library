import type { PostgrestError } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  ServiceResult,
  Snippet,
  SnippetDraft,
  SnippetSummaryWithTags,
  SnippetWithTags,
  Tag,
} from "@/lib/types";

type SnippetRow = Snippet & {
  snippet_tags?: Array<{
    tags: Tag | Tag[] | null;
  }>;
};

type SnippetSummaryRow = Omit<Snippet, "code"> & {
  snippet_tags?: Array<{
    tags: Tag | Tag[] | null;
  }>;
};

const MAX_LIST_ITEMS = 200;

type ListSnippetsOptions = {
  signal?: AbortSignal;
  limit?: number;
};

type GetSnippetOptions = {
  signal?: AbortSignal;
};

function withError<T>(error: unknown): ServiceResult<T> {
  const message =
    error instanceof Error
      ? error.message
      : "something went wrong. please try again.";

  return { data: null, error: message };
}

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "supabase is not configured. add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local"
    );
  }

  return supabase;
}

async function requireUserId(client: NonNullable<typeof supabase>) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("you must sign in to manage snippets");
  }

  return user.id;
}

function normalizeTags(tagNames: string[]) {
  return [...new Set(tagNames.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

function normalizeSnippet(row: SnippetRow): SnippetWithTags {
  const tags =
    row.snippet_tags
      ?.flatMap((item) => {
        if (!item.tags) {
          return [];
        }

        return Array.isArray(item.tags) ? item.tags : [item.tags];
      })
      .filter((tag): tag is Tag => Boolean(tag?.id && tag?.name)) ?? [];

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    language: row.language,
    description: row.description,
    code: row.code,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags,
  };
}

function normalizeSnippetSummary(row: SnippetSummaryRow): SnippetSummaryWithTags {
  const tags =
    row.snippet_tags
      ?.flatMap((item) => {
        if (!item.tags) {
          return [];
        }

        return Array.isArray(item.tags) ? item.tags : [item.tags];
      })
      .filter((tag): tag is Tag => Boolean(tag?.id && tag?.name)) ?? [];

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    language: row.language,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags,
  };
}

async function upsertTags(client: NonNullable<typeof supabase>, tagNames: string[]) {
  const normalized = normalizeTags(tagNames);
  if (normalized.length === 0) {
    return [] as Tag[];
  }

  const { error: upsertError } = await client
    .from("tags")
    .upsert(normalized.map((name) => ({ name })), { onConflict: "name" });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const { data, error } = await client
    .from("tags")
    .select("id, name")
    .in("name", normalized);

  if (error) {
    throw new Error(error.message);
  }

  return data as Tag[];
}

function parseSupabaseError(error: PostgrestError | null) {
  if (!error) return null;

  const message = `${error.message} ${error.details ?? ""} ${error.hint ?? ""}`;

  if (
    message.includes("Could not find the table 'public.snippets'") ||
    message.includes("relation \"public.snippets\" does not exist")
  ) {
    return "table public.snippets is missing in supabase. run supabase/schema.sql in the sql editor, then refresh api schema cache in project settings > api.";
  }

  if (
    message.includes("Could not find the table 'public.tags'") ||
    message.includes("Could not find the table 'public.snippet_tags'") ||
    message.includes("relation \"public.tags\" does not exist") ||
    message.includes("relation \"public.snippet_tags\" does not exist")
  ) {
    return "snippet tables are incomplete in supabase. run supabase/schema.sql and refresh api schema cache.";
  }

  if (message.includes("row-level security")) {
    return "permission denied by rls policy. ensure you are signed in and policies are applied.";
  }

  return error.message;
}

export async function listSnippets(
  options?: ListSnippetsOptions
): Promise<ServiceResult<SnippetSummaryWithTags[]>> {
  try {
    const client = requireClient();
    await requireUserId(client);

    const requestedLimit =
      typeof options?.limit === "number" && options.limit > 0
        ? Math.min(options.limit, MAX_LIST_ITEMS)
        : MAX_LIST_ITEMS;

    let query = client
      .from("snippets")
      .select(
        "id, user_id, title, language, description, created_at, updated_at, snippet_tags(tags(id, name))"
      )
      .order("updated_at", { ascending: false })
      .limit(requestedLimit);

    if (options?.signal && typeof (query as { abortSignal?: unknown }).abortSignal === "function") {
      query = (query as unknown as { abortSignal: (signal: AbortSignal) => typeof query })
        .abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to fetch snippets");
    }

    return {
      data: (data as SnippetSummaryRow[]).map(normalizeSnippetSummary),
      error: null,
    };
  } catch (error) {
    return withError<SnippetSummaryWithTags[]>(error);
  }
}

export async function getSnippetById(
  id: string,
  options?: GetSnippetOptions
): Promise<ServiceResult<SnippetWithTags>> {
  try {
    const client = requireClient();
    await requireUserId(client);

    let query = client
      .from("snippets")
      .select(
        "id, user_id, title, language, description, code, created_at, updated_at, snippet_tags(tags(id, name))"
      )
      .eq("id", id)
      .single();

    if (options?.signal && typeof (query as { abortSignal?: unknown }).abortSignal === "function") {
      query = (query as unknown as { abortSignal: (signal: AbortSignal) => typeof query })
        .abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to fetch snippet");
    }

    return {
      data: normalizeSnippet(data as SnippetRow),
      error: null,
    };
  } catch (error) {
    return withError<SnippetWithTags>(error);
  }
}

export async function createSnippet(
  draft: SnippetDraft
): Promise<ServiceResult<SnippetWithTags>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    const { data, error } = await client
      .from("snippets")
      .insert({
        user_id: userId,
        title: draft.title.trim(),
        language: draft.language,
        description: draft.description.trim(),
        code: draft.code,
      })
      .select("id, user_id, title, language, description, code, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to create snippet");
    }

    const tags = await upsertTags(client, draft.tags);

    if (tags.length > 0) {
      const { error: mapError } = await client.from("snippet_tags").insert(
        tags.map((tag) => ({
          snippet_id: (data as Snippet).id,
          tag_id: tag.id,
        }))
      );

      if (mapError) {
        throw new Error(parseSupabaseError(mapError) ?? "failed to attach tags");
      }
    }

    return {
      data: {
        ...(data as Snippet),
        tags,
      },
      error: null,
    };
  } catch (error) {
    return withError<SnippetWithTags>(error);
  }
}

export async function updateSnippet(
  id: string,
  draft: SnippetDraft
): Promise<ServiceResult<SnippetWithTags>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    const { data, error } = await client
      .from("snippets")
      .update({
        title: draft.title.trim(),
        language: draft.language,
        description: draft.description.trim(),
        code: draft.code,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, user_id, title, language, description, code, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to update snippet");
    }

    const tags = await upsertTags(client, draft.tags);

    const { error: deleteMapError } = await client
      .from("snippet_tags")
      .delete()
      .eq("snippet_id", id);

    if (deleteMapError) {
      throw new Error(
        parseSupabaseError(deleteMapError) ?? "failed to refresh tag links"
      );
    }

    if (tags.length > 0) {
      const { error: mapError } = await client.from("snippet_tags").insert(
        tags.map((tag) => ({
          snippet_id: id,
          tag_id: tag.id,
        }))
      );

      if (mapError) {
        throw new Error(parseSupabaseError(mapError) ?? "failed to attach tags");
      }
    }

    return {
      data: {
        ...(data as Snippet),
        tags,
      },
      error: null,
    };
  } catch (error) {
    return withError<SnippetWithTags>(error);
  }
}

export async function deleteSnippet(id: string): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    const { error } = await client
      .from("snippets")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to delete snippet");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}
