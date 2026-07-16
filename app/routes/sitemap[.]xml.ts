import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const baseUrl = "https://tuziyo.com";

  const routes = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/ai-toolkit", priority: "0.9", changefreq: "daily" },
    { path: "/pricing", priority: "0.7", changefreq: "weekly" },
    { path: "/privacy", priority: "0.4", changefreq: "weekly" },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
