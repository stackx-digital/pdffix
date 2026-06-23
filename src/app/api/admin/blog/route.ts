import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import matter from "gray-matter";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// POST /api/admin/blog — upload .md/.mdx file
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["md", "mdx"].includes(ext ?? "")) {
    return NextResponse.json({ error: "Only .md and .mdx files are accepted" }, { status: 400 });
  }

  const raw = await file.text();
  const { data: frontmatter, content } = matter(raw);

  const title = frontmatter.title ?? file.name.replace(/\.(md|mdx)$/, "");
  const slug = frontmatter.slug
    ? String(frontmatter.slug).replace(/^\/blog\//, "")
    : slugify(title);
  const description = frontmatter.description ?? frontmatter.meta_description ?? "";
  const date = frontmatter.date ? String(frontmatter.date).slice(0, 10) : new Date().toISOString().slice(0, 10);
  const author = frontmatter.author ?? "PDFix Team";
  const tags: string[] = Array.isArray(frontmatter.tags)
    ? frontmatter.tags
    : Array.isArray(frontmatter.target_keywords)
      ? frontmatter.target_keywords
      : [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .upsert({
      slug,
      title,
      description,
      content: content.trim(),
      date,
      author,
      tags,
      published: true,
    }, { onConflict: "slug" })
    .select("slug, title")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, slug: data.slug, title: data.title });
}

// DELETE /api/admin/blog — delete a post by slug
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("blog_posts").delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/blog — toggle published status
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug, published } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("blog_posts").update({ published }).eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
