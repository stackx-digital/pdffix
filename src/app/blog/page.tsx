import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAllPosts } from "@/lib/blog";
import { Calendar, Tag, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — PDF Tips & Guides | PDFix",
  description: "Free PDF tutorials, tips, and guides. Learn how to compress, merge, sign, and edit PDF files online without installing software.",
  alternates: { canonical: "https://pdfix.my/blog" },
  openGraph: {
    title: "Blog — PDF Tips & Guides | PDFix",
    description: "Free PDF tutorials, tips, and guides. Learn how to compress, merge, sign, and edit PDF files online.",
    url: "https://pdfix.my/blog",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">PDF Tips & Guides</h1>
          <p className="text-gray-500 mt-2">Practical tutorials on working with PDF files — faster, smarter, and for free.</p>
        </div>

        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="group border border-gray-200 rounded-2xl p-6 hover:border-red-200 hover:shadow-sm transition-all bg-white">
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                    <Tag className="w-3 h-3" />{tag}
                  </span>
                ))}
              </div>

              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                  {post.title}
                </h2>
              </Link>

              <p className="text-gray-500 text-sm leading-relaxed mb-4">{post.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(post.date)}
                  <span className="mx-1">·</span>
                  {post.author}
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Read more <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <p className="text-gray-400 text-center py-16">No posts yet. Check back soon!</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
