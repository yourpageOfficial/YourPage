export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/s", "/api", "/chat"] },
    ],
    sitemap: "https://yourpage.id/sitemap.xml",
  };
}
