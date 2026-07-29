import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey, adminClient, FREE_QUOTA } from "@/lib/apiAuth";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET — list caller's API keys
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await adminClient
    .from("api_keys")
    .select("id, label, key_prefix, is_active, created_at, last_used_at, monthly_calls, calls_reset_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ keys: data, quota: { free: FREE_QUOTA } });
}

// POST — generate a new API key
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Max 5 active keys per user
  const { count } = await adminClient
    .from("api_keys")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  if ((count ?? 0) >= 5)
    return NextResponse.json({ error: "Maximum 5 active API keys per account" }, { status: 400 });

  let label = "My API Key";
  try { const body = await req.json(); label = body.label || label; } catch {}

  const { raw, prefix, hash } = generateApiKey();
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await adminClient.from("api_keys").insert({
    user_id: user.id,
    label,
    key_hash: hash,
    key_prefix: prefix,
    monthly_calls: 0,
    calls_reset_at: today,
  } as any);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { key: raw, prefix, label, message: "Save this key — it will not be shown again." },
    { status: 201 }
  );
}

// DELETE ?id=<uuid> — revoke a key
export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await adminClient
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // ensure ownership

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
