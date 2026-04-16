import type { PostgrestError } from "@supabase/supabase-js";
import { computeSnippetBenchmarks } from "@/lib/snippet-benchmarks";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  ServiceResult,
  Snippet,
  SnippetDraft,
  SnippetSummaryWithTags,
  SnippetWithTags,
  Tag,
  Workspace,
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
  workspaceId?: string;
};

type GetSnippetOptions = {
  signal?: AbortSignal;
};

type WorkspaceRow = Workspace;

function withError<T>(error: unknown): ServiceResult<T> {
  if (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && /abort|aborted/i.test(error.message))
  ) {
    return { data: null, error: null };
  }

  let message =
    error instanceof Error
      ? error.message
      : "something went wrong. please try again.";

  if (message.toLowerCase().includes("jwt") || 
      message.toLowerCase().includes("token") ||
      message.toLowerCase().includes("session")) {
    message = "session expired. refresh the page and sign in again.";
  }

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
    if (error.message.toLowerCase().includes("jwt") || 
        error.message.toLowerCase().includes("token")) {
      throw new Error("session expired. refresh the page and sign in again.");
    }
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

function normalizeWorkspaceName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    is_public: row.is_public,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listWorkspaces(): Promise<ServiceResult<Workspace[]>> {
  try {
    const client = requireClient();
    await requireUserId(client);

    const { data, error } = await client
      .from("workspaces")
      .select("id, owner_id, name, is_public, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to fetch workspaces");
    }

    return {
      data: (data as WorkspaceRow[]).map(normalizeWorkspace),
      error: null,
    };
  } catch (error) {
    return withError<Workspace[]>(error);
  }
}

export async function createWorkspace(name: string): Promise<ServiceResult<Workspace>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);
    const normalizedName = normalizeWorkspaceName(name);

    if (!normalizedName) {
      throw new Error("workspace name is required");
    }

    const { data, error } = await client
      .from("workspaces")
      .insert({ owner_id: userId, name: normalizedName })
      .select("id, owner_id, name, is_public, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to create workspace");
    }

    return { data: normalizeWorkspace(data as WorkspaceRow), error: null };
  } catch (error) {
    return withError<Workspace>(error);
  }
}

export async function renameWorkspace(
  id: string,
  name: string
): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    await requireUserId(client);
    const normalizedName = normalizeWorkspaceName(name);

    if (!normalizedName) {
      throw new Error("workspace name is required");
    }

    const { error } = await client
      .from("workspaces")
      .update({ name: normalizedName })
      .eq("id", id);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to rename workspace");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function toggleWorkspacePublic(
  id: string,
  isPublic: boolean
): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    await requireUserId(client);

    const { error } = await client
      .from("workspaces")
      .update({ is_public: isPublic })
      .eq("id", id);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to update workspace sharing");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function deleteWorkspace(id: string): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    await requireUserId(client);

    const { error } = await client
      .from("workspaces")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to delete workspace");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
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
    workspace_id: row.workspace_id,
    title: row.title,
    language: row.language,
    description: row.description,
    code: row.code,
    pinned: row.pinned,
    public: row.public,
    benchmark_chars: row.benchmark_chars,
    benchmark_bytes: row.benchmark_bytes,
    benchmark_bits: row.benchmark_bits,
    benchmark_lines: row.benchmark_lines,
    view_count: row.view_count,
    copy_count: row.copy_count,
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
    workspace_id: row.workspace_id,
    title: row.title,
    language: row.language,
    description: row.description,
    pinned: row.pinned,
    public: row.public,
    benchmark_chars: row.benchmark_chars,
    benchmark_bytes: row.benchmark_bytes,
    benchmark_bits: row.benchmark_bits,
    benchmark_lines: row.benchmark_lines,
    view_count: row.view_count,
    copy_count: row.copy_count,
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
    .upsert(normalized.map((name) => ({ name })), { onConflict: "name", ignoreDuplicates: true });

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
        "id, user_id, workspace_id, title, language, description, pinned, public, benchmark_chars, benchmark_bytes, benchmark_bits, benchmark_lines, view_count, copy_count, created_at, updated_at, snippet_tags(tags(id, name))"
      )
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(requestedLimit);

    if (options?.workspaceId) {
      query = query.eq("workspace_id", options.workspaceId);
    }

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
        "id, user_id, workspace_id, title, language, description, code, pinned, public, benchmark_chars, benchmark_bytes, benchmark_bits, benchmark_lines, view_count, copy_count, created_at, updated_at, snippet_tags(tags(id, name))"
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

    if (!draft.workspace_id) {
      throw new Error("workspace is required");
    }

    const benchmarks = computeSnippetBenchmarks(draft.code);

    const { data, error } = await client
      .from("snippets")
      .insert({
        user_id: userId,
        workspace_id: draft.workspace_id,
        title: draft.title.trim(),
        language: draft.language,
        description: draft.description.trim(),
        code: draft.code,
        benchmark_chars: benchmarks.benchmark_chars,
        benchmark_bytes: benchmarks.benchmark_bytes,
        benchmark_bits: benchmarks.benchmark_bits,
        benchmark_lines: benchmarks.benchmark_lines,
        view_count: 0,
        copy_count: 0,
      })
      .select("id, user_id, workspace_id, title, language, description, code, pinned, public, benchmark_chars, benchmark_bytes, benchmark_bits, benchmark_lines, view_count, copy_count, created_at, updated_at")
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
    const benchmarks = computeSnippetBenchmarks(draft.code);

    const { data, error } = await client
      .from("snippets")
      .update({
        title: draft.title.trim(),
        language: draft.language,
        description: draft.description.trim(),
        code: draft.code,
        benchmark_chars: benchmarks.benchmark_chars,
        benchmark_bytes: benchmarks.benchmark_bytes,
        benchmark_bits: benchmarks.benchmark_bits,
        benchmark_lines: benchmarks.benchmark_lines,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, user_id, workspace_id, title, language, description, code, pinned, public, benchmark_chars, benchmark_bytes, benchmark_bits, benchmark_lines, view_count, copy_count, created_at, updated_at")
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

export async function togglePinSnippet(
  id: string,
  pinned: boolean
): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    const { error } = await client
      .from("snippets")
      .update({ pinned })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to pin snippet");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function moveSnippetToWorkspace(
  id: string,
  workspaceId: string
): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    const { error } = await client
      .from("snippets")
      .update({ workspace_id: workspaceId })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to move snippet");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function togglePublicSnippet(
  id: string,
  isPublic: boolean
): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    const { error } = await client
      .from("snippets")
      .update({ public: isPublic })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to update public status");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function listPublicSnippets(
  options?: ListSnippetsOptions
): Promise<ServiceResult<SnippetSummaryWithTags[]>> {
  try {
    const client = requireClient();

    const requestedLimit =
      typeof options?.limit === "number" && options.limit > 0
        ? Math.min(options.limit, MAX_LIST_ITEMS)
        : MAX_LIST_ITEMS;

    let query = client
      .from("snippets")
      .select(
        "id, user_id, workspace_id, title, language, description, pinned, public, benchmark_chars, benchmark_bytes, benchmark_bits, benchmark_lines, view_count, copy_count, created_at, updated_at, snippet_tags(tags(id, name))"
      )
      .eq("public", true)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(requestedLimit);

    if (options?.signal && typeof (query as { abortSignal?: unknown }).abortSignal === "function") {
      query = (query as unknown as { abortSignal: (signal: AbortSignal) => typeof query })
        .abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to fetch public snippets");
    }

    return {
      data: (data as SnippetSummaryRow[]).map(normalizeSnippetSummary),
      error: null,
    };
  } catch (error) {
    return withError<SnippetSummaryWithTags[]>(error);
  }
}

export async function getPublicSnippetById(
  id: string
): Promise<ServiceResult<SnippetWithTags>> {
  try {
    const client = requireClient();

    const { data, error } = await client
      .from("snippets")
      .select(
        "id, user_id, workspace_id, title, language, description, code, pinned, public, benchmark_chars, benchmark_bytes, benchmark_bits, benchmark_lines, view_count, copy_count, created_at, updated_at, snippet_tags(tags(id, name))"
      )
      .eq("id", id)
      .eq("public", true)
      .single();

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "snippet not found or not public");
    }

    return {
      data: normalizeSnippet(data as SnippetRow),
      error: null,
    };
  } catch (error) {
    return withError<SnippetWithTags>(error);
  }
}

async function bumpCounter(id: string, field: "view_count" | "copy_count", publicOnly = false) {
  const client = requireClient();

  const rpcName = field === "view_count" ? "increment_snippet_view" : "increment_snippet_copy";
  const { data, error } = await client.rpc(rpcName, {
    p_snippet_id: id,
    p_public_only: publicOnly,
  });

  if (error) {
    throw new Error(parseSupabaseError(error) ?? `failed to update ${field}`);
  }

  if (data !== true) {
    throw new Error(`failed to update ${field}`);
  }
}

export async function incrementSnippetViewCount(id: string): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    await requireUserId(client);
    await bumpCounter(id, "view_count", false);
    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function incrementSnippetCopyCount(id: string): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    await requireUserId(client);
    await bumpCounter(id, "copy_count", false);
    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function incrementPublicSnippetViewCount(id: string): Promise<ServiceResult<boolean>> {
  try {
    requireClient();
    await bumpCounter(id, "view_count", true);
    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function incrementPublicSnippetCopyCount(id: string): Promise<ServiceResult<boolean>> {
  try {
    requireClient();
    await bumpCounter(id, "copy_count", true);
    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}
