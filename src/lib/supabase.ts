// supabase browser client

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
	process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
	? createClient(supabaseUrl as string, supabasePublishableKey as string)
	: null;

export async function getCurrentUser() {
	if (!supabase) return null;

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error) {
		console.error("session check failed:", error);
	}

	return user;
}

export async function sendMagicLink(email: string) {
	if (!supabase) {
		return "supabase is not configured";
	}

	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: {
			emailRedirectTo:
				typeof window !== "undefined"
					? `${window.location.origin}/snippets`
					: undefined,
		},
	});

	return error?.message ?? null;
}

export async function signOutUser() {
	if (!supabase) {
		return "supabase is not configured";
	}

	const { error } = await supabase.auth.signOut();
	return error?.message ?? null;
}
