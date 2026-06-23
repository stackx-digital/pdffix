import { NextResponse } from "next/server";
import { verifyApiKey, extractBearerToken, adminClient } from "@/lib/apiAuth";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// GET /api/v1/seo/rankings?keyword=...&limit=30
// Returns ranking history, or latest per keyword if no keyword param
export async function GET(req: Request) {
  const token = extractBearerToken(req);
  if (!token || !(await verifyApiKey(token))) return unauth();

  const url = new URL(req.url);
  const keyword = url.searchParams.get("keyword");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "90"), 365);
  const summary = url.searchParams.get("summary") === "true";

  if (summary) {
    // Latest position per keyword
    const { data, error } = await adminClient
      .from("seo_rankings")
      .select("keyword, position, url, search_engine, location, checked_at")
      .order("checked_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Deduplicate: keep only the most recent entry per keyword
    const seen = new Set<string>();
    const latest = (data ?? []).filter((r) => {
      if (seen.has(r.keyword)) return false;
      seen.add(r.keyword);
      return true;
    });

    return NextResponse.json({ rankings: latest });
  }

  let query = adminClient
    .from("seo_rankings")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(limit);

  if (keyword) query = query.eq("keyword", keyword);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rankings: data });
}

// POST /api/v1/seo/rankings — submit one or batch of rankings
export async function POST(req: Request) {
  const token = extractBearerToken(req);
  if (!token || !(await verifyApiKey(token))) return unauth();

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Accept single object or array
  const entries = Array.isArray(body) ? body : [body];

  const rows = entries.map((e: any) => ({
    keyword: e.keyword,
    position: e.position ?? null,
    url: e.url,
    search_engine: e.search_engine ?? "google",
    location: e.location ?? "MY",
    checked_at: e.checked_at ?? new Date().toISOString().slice(0, 10),
  }));

  const missing = rows.filter((r) => !r.keyword || !r.url);
  if (missing.length) {
    return NextResponse.json({ error: "Each entry requires keyword and url" }, { status: 422 });
  }

  const { data, error } = await adminClient
    .from("seo_rankings")
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: data?.length ?? 0, rankings: data }, { status: 201 });
}
