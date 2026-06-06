/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://pdffix.io",
  generateRobotsTxt: true,
  exclude: ["/dashboard", "/auth/*", "/api/*"],
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/" }]
  }
};
