import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  published: boolean;
}

export interface Post extends PostMeta {
  content: string;
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, title, description, date, author, tags, published")
    .eq("published", true)
    .order("date", { ascending: false });

  return (data ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    author: p.author,
    tags: p.tags ?? [],
    published: p.published,
  }));
}

export async function getAllPostsAdmin(): Promise<PostMeta[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("slug, title, description, date, author, tags, published")
    .order("date", { ascending: false });

  return (data ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    author: p.author,
    tags: p.tags ?? [],
    published: p.published,
  }));
}

export async function getPost(slug: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!data) return null;
  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    date: data.date,
    author: data.author,
    tags: data.tags ?? [],
    published: data.published,
    content: data.content,
  };
}

export async function getAllSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("published", true);

  return (data ?? []).map((p) => p.slug);
}
