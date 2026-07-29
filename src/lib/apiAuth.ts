import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";

export const adminClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export const FREE_QUOTA = 100; // calls per month

export function hashKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = "pfx_" + randomBytes(32).toString("hex");
  const prefix = raw.slice(0, 12);
  const hash = hashKey(raw);
  return { raw, prefix, hash };
}

export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-api-key") ?? null;
}

export interface ApiKeyContext {
  keyId: string;
  userId: string | null;
  plan: "free" | "pro";
}

export async function resolveApiKey(raw: string): Promise<ApiKeyContext | null> {
  if (!raw?.startsWith("pfx_")) return null;
  const hash = hashKey(raw);

  const { data: key } = await adminClient
    .from("api_keys")
    .select("id, user_id, is_active, monthly_calls, calls_reset_at")
    .eq("key_hash", hash)
    .maybeSingle();

  if (!key?.is_active) return null;

  // Reset monthly counter if it's a new month
  const today = new Date().toISOString().slice(0, 10);
  const resetMonth = (key.calls_reset_at as string)?.slice(0, 7);
  const thisMonth = today.slice(0, 7);

  let currentCalls: number = key.monthly_calls ?? 0;
  if (resetMonth !== thisMonth) {
    await adminClient
      .from("api_keys")
      .update({ monthly_calls: 0, calls_reset_at: today })
      .eq("id", key.id);
    currentCalls = 0;
  }

  // Determine plan from user profile
  let plan: "free" | "pro" = "free";
  if (key.user_id) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("plan")
      .eq("id", key.user_id)
      .maybeSingle();
    plan = ((profile?.plan as string) === "pro" ? "pro" : "free");
  } else {
    plan = "pro"; // admin/system keys get pro tier
  }

  // Quota check for free tier
  if (plan === "free" && currentCalls >= FREE_QUOTA) return null;

  // Increment counter + update last_used
  await adminClient
    .from("api_keys")
    .update({ monthly_calls: currentCalls + 1, last_used_at: new Date().toISOString() })
    .eq("id", key.id);

  return { keyId: key.id, userId: key.user_id ?? null, plan };
}

async function logApiCall(keyId: string, endpoint: string, status: number) {
  await adminClient
    .from("api_call_log")
    .insert({ api_key_id: keyId, endpoint, status });
}

type Handler = (req: Request, ctx: ApiKeyContext) => Promise<NextResponse>;

// Wraps an API route handler with auth + quota + logging
export function withApiAuth(endpoint: string, handler: Handler) {
  return async (req: Request): Promise<NextResponse> => {
    const raw = extractBearerToken(req);
    if (!raw) {
      return NextResponse.json(
        { error: "Missing API key. Pass via Authorization: Bearer <key> or X-Api-Key: <key> header." },
        { status: 401 }
      );
    }

    const ctx = await resolveApiKey(raw);
    if (!ctx) {
      return NextResponse.json(
        { error: "Invalid or expired API key, or monthly quota exceeded (free: 100 calls/month)." },
        { status: 403 }
      );
    }

    try {
      const res = await handler(req, ctx);
      logApiCall(ctx.keyId, endpoint, res.status).catch(() => {});
      return res;
    } catch (err: unknown) {
      logApiCall(ctx.keyId, endpoint, 500).catch(() => {});
      const msg = err instanceof Error ? err.message : "Internal error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}

// Legacy simple verify (used by admin routes)
export async function verifyApiKey(raw: string): Promise<boolean> {
  if (!raw?.startsWith("pfx_")) return false;
  const hash = hashKey(raw);
  const { data } = await adminClient
    .from("api_keys")
    .select("id")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .maybeSingle();
  return !!data?.id;
}
