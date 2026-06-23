import { NextResponse } from "next/server";
import { verifyApiKey, extractBearerToken, adminClient } from "@/lib/apiAuth";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// GET /api/v1/blog — list all posts
export async function GET(req: Request) {
  const token = extractBearerToken(req);
  if (!token || !(await verifyApiKey(token))) return unauth();

  const url = new URL(req.url);
  const published = url.searchParams.get("published");

  let query = adminClient
    .from("blog_posts")
    .select("slug, title, description, date, author, tags, published, created_at, updated_at")
    .order("date", { ascending: false });

  if (published === "true") query = query.eq("published", true);
  if (published === "false") query = query.eq("published", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ posts: data, total: data?.length ?? 0 });
}

// POST /api/v1/blog — create or upsert post
export async function POST(req: Request) {
  const token = extractBearerToken(req);
  if (!token || !(await verifyApiKey(token))) return unauth();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { slug, title, meta_title, meta_description, description, content, tags, author, published, target_keywords } = body;

  if (!slug || !title || !content) {
    return NextResponse.json({ error: "slug, title, and content are required" }, { status: 422 });
  }

  // Merge target_keywords into tags array
  const allTags = [...new Set([...(tags ?? []), ...(target_keywords ?? [])])];

  const payload = {
    slug: slug.replace(/^\/blog\//, ""),
    title: meta_title ?? title,
    description: meta_description ?? description ?? "",
    content,
    date: new Date().toISOString().slice(0, 10),
    author: author ?? "PDFix SEO Agent",
    tags: allTags,
    published: published ?? false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await adminClient
    .from("blog_posts")
    .upsert(payload, { onConflict: "slug" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ post: data }, { status: 201 });
}
