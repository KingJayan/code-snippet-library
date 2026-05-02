import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

let serverSupabaseClient: ReturnType<typeof createClient> | null = null;

function getServerSupabaseClient() {
  if (serverSupabaseClient) return serverSupabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  serverSupabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serverSupabaseClient;
}

export async function GET() {
  try {
    const client = getServerSupabaseClient();
    if (!client) {
      return NextResponse.json({ ok: true, db: "not-configured" });
    }

    const { data, error } = await client.from("snippets").select("id").limit(1);
    if (error) {
      return NextResponse.json({ ok: true, db: "query-error", error: error.message });
    }

    return NextResponse.json({ ok: true, db: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
