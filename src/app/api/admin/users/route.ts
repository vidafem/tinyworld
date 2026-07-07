import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { supabaseAdmin } = admin;
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ users: data });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { email, password, full_name, role } = await req.json();
  const { supabaseAdmin } = admin;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data.user) return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });

  if (role === "admin") {
    await supabaseAdmin.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
  }

  return NextResponse.json({ user: data.user });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { userId, newPassword } = await req.json();
  const { supabaseAdmin } = admin;

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const url = new URL(req.url);
  const userId = url.searchParams.get("id");

  if (!userId) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const { supabaseAdmin } = admin;
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
