import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const robotsTxt =
    "User-agent: *\nAllow: /\n\nSitemap: https://tuziyo.com/sitemap.xml\nSitemap: https://tuziyo.com/blog/sitemap-index.xml\n";

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
