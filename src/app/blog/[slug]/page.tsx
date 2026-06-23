import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getPost, getAllSlugs } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Calendar, Tag, ArrowLeft } from "lucide-react";

interface Props {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `https://pdfix.my/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://pdfix.my/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
}

const mdxComponents = {
  h1: (props: any) => <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2" {...props} />,
  p: (props: any) => <p className="text-gray-600 leading-relaxed mb-4" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside space-y-1.5 mb-4 text-gray-600" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside space-y-1.5 mb-4 text-gray-600" {...props} />,
  li: (props: any) => <li className="leading-relaxed" {...props} />,
  strong: (props: any) => <strong className="font-semibold text-gray-900" {...props} />,
  a: (props: any) => <a className="text-red-600 hover:underline font-medium" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-red-200 pl-4 italic text-gray-500 my-4" {...props} />,
  code: (props: any) => <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
  pre: (props: any) => <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto mb-4 text-sm" {...props} />,
  hr: (props: any) => <hr className="border-gray-200 my-8" {...props} />,
  table: (props: any) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden" {...props} />
    </div>
  ),
  thead: (props: any) => <thead className="bg-gray-50" {...props} />,
  th: (props: any) => <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200" {...props} />,
  td: (props: any) => <td className="px-4 py-3 text-gray-600 border border-gray-200" {...props} />,
};

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Organization", name: post.author },
    datePublished: post.date,
    publisher: {
      "@type": "Organization",
      name: "PDFix",
      url: "https://pdfix.my",
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://pdfix.my/blog/${post.slug}` },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                <Tag className="w-3 h-3" />{tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{post.title}</h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-4">{post.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.date)}</span>
            <span>·</span>
            <span>{post.author}</span>
          </div>
        </header>

        <hr className="border-gray-200 mb-8" />

        {/* Content */}
        <article className="prose-custom">
          <MDXRemote source={post.content} components={mdxComponents} />
        </article>

        {/* CTA */}
        <div className="mt-12 p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
          <p className="font-semibold text-gray-900 mb-2">Try PDFix Free PDF Tools</p>
          <p className="text-sm text-gray-500 mb-4">No sign-up required. All processing happens in your browser.</p>
          <Link href="/tools/compress-pdf" className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
            Explore Free Tools
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Articles
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
