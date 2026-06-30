import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/auth", "/api", "/admin"],
    },
    sitemap: "https://pdfix.my/sitemap.xml",
    host: "https://pdfix.my",
  };
}
