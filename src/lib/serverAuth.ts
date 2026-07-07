import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export function getBearerToken(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

export async function getRequestUser(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return null;

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) return null;
  return data.user;
}

export async function requireAdmin(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return null;

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data.user;

  if (error || !user) return null;

  const ownerEmail = process.env.ADMIN_EMAIL || "canonedu17@gmail.com";
  if (user.email === ownerEmail) {
    return { user, supabaseAdmin };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") return null;
  return { user, supabaseAdmin };
}
