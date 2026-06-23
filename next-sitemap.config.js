const fs = require("fs");
const path = require("path");

function getBlogSlugs() {
  const dir = path.join(__dirname, "src/content/blog");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://pdfix.my",
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  exclude: ["/dashboard", "/dashboard/*", "/auth/*", "/api/*"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/dashboard", "/auth", "/api"] },
    ],
  },
  additionalPaths: async (config) => [
    { loc: "/", changefreq: "daily", priority: 1.0, lastmod: new Date().toISOString() },
    { loc: "/tools/edit-pdf", changefreq: "weekly", priority: 0.9 },
    { loc: "/tools/compress-pdf", changefreq: "weekly", priority: 0.9 },
    { loc: "/tools/merge-pdf", changefreq: "weekly", priority: 0.9 },
    { loc: "/tools/split-pdf", changefreq: "weekly", priority: 0.8 },
    { loc: "/tools/pdf-to-image", changefreq: "weekly", priority: 0.8 },
    { loc: "/tools/image-to-pdf", changefreq: "weekly", priority: 0.8 },
    { loc: "/tools/e-sign", changefreq: "weekly", priority: 0.8 },
    { loc: "/tools/ocr", changefreq: "weekly", priority: 0.8 },
    { loc: "/tools/watermark", changefreq: "weekly", priority: 0.7 },
    { loc: "/tools/unlock-pdf", changefreq: "weekly", priority: 0.7 },
    { loc: "/tools/rotate-pdf", changefreq: "weekly", priority: 0.7 },
    { loc: "/tools/crop-pdf", changefreq: "weekly", priority: 0.7 },
    { loc: "/tools/delete-page", changefreq: "weekly", priority: 0.7 },
    { loc: "/tools/extract-pages", changefreq: "weekly", priority: 0.7 },
    { loc: "/tools/organize-pdf", changefreq: "weekly", priority: 0.7 },
    { loc: "/tools/pdf-forms", changefreq: "weekly", priority: 0.7 },
    { loc: "/tools/flatten-pdf", changefreq: "weekly", priority: 0.6 },
    { loc: "/tools/batch-compress", changefreq: "weekly", priority: 0.6 },
    { loc: "/tools/add-page-numbers", changefreq: "weekly", priority: 0.6 },
    { loc: "/tools/pdf-to-text", changefreq: "weekly", priority: 0.8 },
    { loc: "/tools/doc-to-markdown", changefreq: "weekly", priority: 0.7 },
    { loc: "/pricing", changefreq: "monthly", priority: 0.8 },
    { loc: "/blog", changefreq: "weekly", priority: 0.8 },
    ...getBlogSlugs().map((slug) => ({
      loc: `/blog/${slug}`,
      changefreq: "monthly",
      priority: 0.7,
    })),
    { loc: "/privacy-policy", changefreq: "monthly", priority: 0.4 },
  ],
};
