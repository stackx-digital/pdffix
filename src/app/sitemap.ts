import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { TOOLS } from "@/types";

const BASE = "https://pdfix.my";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/auth/login`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/auth/register`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/privacy-policy`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  // Tool pages — derived from TOOLS registry so new tools are auto-included
  const toolPages: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${BASE}${tool.href}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Blog posts from Supabase (using service role — no cookies needed at build time)
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase env vars");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (posts) {
      blogPages = posts.map((post) => ({
        url: `${BASE}/blog/${post.slug}`,
        lastModified: post.updated_at ?? post.published_at ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {}

  return [...staticPages, ...toolPages, ...blogPages];
}
