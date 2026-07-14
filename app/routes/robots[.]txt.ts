import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /auth/
Disallow: /login
Disallow: /profile
Disallow: /session/

Sitemap: https://tuziyo.com/sitemap.xml
Sitemap: https://tuziyo.com/sitemap-index.xml
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
