import { NextResponse } from "next/server";
import { verifyApiKey, extractBearerToken, adminClient } from "@/lib/apiAuth";

interface Props { params: { slug: string } }

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// GET /api/v1/blog/:slug
export async function GET(req: Request, { params }: Props) {
  const token = extractBearerToken(req);
  if (!token || !(await verifyApiKey(token))) return unauth();

  const { data, error } = await adminClient
    .from("blog_posts")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  return NextResponse.json({ post: data });
}

// PUT /api/v1/blog/:slug — full update
export async function PUT(req: Request, { params }: Props) {
  const token = extractBearerToken(req);
  if (!token || !(await verifyApiKey(token))) return unauth();

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, meta_title, meta_description, description, content, tags, author, published, target_keywords } = body;
  const allTags = [...new Set([...(tags ?? []), ...(target_keywords ?? [])])];

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (title || meta_title)       updates.title = meta_title ?? title;
  if (description || meta_description) updates.description = meta_description ?? description;
  if (content)                   updates.content = content;
  if (allTags.length)            updates.tags = allTags;
  if (author)                    updates.author = author;
  if (published !== undefined)   updates.published = published;

  const { data, error } = await adminClient
    .from("blog_posts")
    .update(updates)
    .eq("slug", params.slug)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  return NextResponse.json({ post: data });
}

// PATCH /api/v1/blog/:slug — partial update (e.g. toggle published)
export async function PATCH(req: Request, { params }: Props) {
  const token = extractBearerToken(req);
  if (!token || !(await verifyApiKey(token))) return unauth();

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.published !== undefined) updates.published = body.published;
  if (body.title)                   updates.title = body.title;
  if (body.description)             updates.description = body.description;

  const { data, error } = await adminClient
    .from("blog_posts")
    .update(updates)
    .eq("slug", params.slug)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  return NextResponse.json({ post: data });
}

// DELETE /api/v1/blog/:slug
export async function DELETE(req: Request, { params }: Props) {
  const token = extractBearerToken(req);
  if (!token || !(await verifyApiKey(token))) return unauth();

  const { error } = await adminClient
    .from("blog_posts")
    .delete()
    .eq("slug", params.slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
