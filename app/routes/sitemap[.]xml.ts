import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const baseUrl = "https://tuziyo.com";

  const routes = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/inpainting", priority: "0.8", changefreq: "weekly" },
    { path: "/resize", priority: "0.8", changefreq: "weekly" },
    { path: "/crop", priority: "0.8", changefreq: "weekly" },
    { path: "/convert", priority: "0.8", changefreq: "weekly" },
    { path: "/blog", priority: "0.9", changefreq: "daily" },
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
