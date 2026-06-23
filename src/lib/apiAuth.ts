import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { randomBytes } from "crypto";

const adminClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export function hashKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = "pfx_" + randomBytes(32).toString("hex");
  const prefix = raw.slice(0, 12);
  const hash = hashKey(raw);
  return { raw, prefix, hash };
}

export async function verifyApiKey(raw: string): Promise<boolean> {
  if (!raw?.startsWith("pfx_")) return false;
  const hash = hashKey(raw);
  const { data } = await adminClient
    .from("api_keys")
    .select("id")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .maybeSingle();

  if (data?.id) {
    // Fire-and-forget last_used update
    adminClient
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", hash)
      .then(() => {});
  }

  return !!data?.id;
}

export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

export { adminClient };
