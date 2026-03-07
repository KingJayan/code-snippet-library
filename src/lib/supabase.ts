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

function normalizeBaseUrl(url: string) {
	return url.trim().replace(/\/$/, "");
}

function getMagicLinkRedirectUrl() {
	const configuredBaseUrl =
		process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL;

	if (typeof window !== "undefined") {
		const origin = window.location.origin;
		const hostname = window.location.hostname;

		if (hostname !== "localhost" && hostname !== "127.0.0.1") {
			return `${normalizeBaseUrl(origin)}/snippets`;
		}

		if (configuredBaseUrl) {
			return `${normalizeBaseUrl(configuredBaseUrl)}/snippets`;
		}

		return `${normalizeBaseUrl(origin)}/snippets`;
	}

	if (configuredBaseUrl) {
		return `${normalizeBaseUrl(configuredBaseUrl)}/snippets`;
	}

	return undefined;
}

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
			emailRedirectTo: getMagicLinkRedirectUrl(),
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
