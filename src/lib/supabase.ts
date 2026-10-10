import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// These two values are public by design (they ship to every browser);
// row-level security in the database is what protects each account's data.
// Environment variables override these (e.g. for a separate staging project).
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://rzovegnmenkqmelslmfp.supabase.co";
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "sb_publishable_bwAcmR6YhIh64L7a9RU5BA_4WHF8_XL";

export const supabase: SupabaseClient | null =
  import.meta.env.VITE_DEMO_MODE !== "true" && url && anonKey ? createClient(url.trim(), anonKey.trim(), { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const hasBackend = supabase !== null;
