import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey, adminClient } from "@/lib/apiAuth";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  return profile?.is_admin ? user : null;
}

// GET /api/v1/keys — list all keys (label, prefix, active, last_used)
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await adminClient
    .from("api_keys")
    .select("id, label, key_prefix, is_active, created_at, last_used_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data });
}

// POST /api/v1/keys — generate new key
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { body = {}; }

  const label = body.label ?? "SEO Agent";
  const { raw, prefix, hash } = generateApiKey();

  const { error } = await adminClient
    .from("api_keys")
    .insert({ label, key_hash: hash, key_prefix: prefix });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Raw key returned ONCE — never stored in plain text
  return NextResponse.json({ key: raw, prefix, label, message: "Save this key — it will not be shown again." }, { status: 201 });
}

// DELETE /api/v1/keys?id=<uuid> — revoke key
export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await adminClient.from("api_keys").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
