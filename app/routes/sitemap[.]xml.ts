import { AI_IMAGE_MODELS, AI_IMAGE_MODEL_SLUGS } from "~/data/aiImageModels"

const baseUrl = "https://tuziyo.com"

interface SitemapRoute {
  path: string
  lastmod?: string
  image?: { loc: string; title: string; caption: string }
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}

export async function loader() {
  const staticRoutes = [
    "/",
    "/ai-toolkit",
    "/inpainting",
    "/resize",
    "/crop",
    "/convert",
    "/pricing",
    "/privacy",
  ]
  const modelRoutes: SitemapRoute[] = AI_IMAGE_MODEL_SLUGS.map(slug => {
    const model = AI_IMAGE_MODELS[slug]
    return {
      path: `/ai/models/${slug}`,
      lastmod: model.updatedAt,
      image: {
        loc: `${baseUrl}${model.heroImage.src}`,
        title: `${model.name} AI image prompt reference`,
        caption: model.heroImage.alt,
      },
    }
  })

  const routes: SitemapRoute[] = [
    ...staticRoutes.map(path => ({ path })),
    { path: "/ai/models", lastmod: "2026-07-16" },
    ...modelRoutes,
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${routes.map(route => `  <url>
    <loc>${baseUrl}${route.path}</loc>${route.lastmod ? `
    <lastmod>${route.lastmod}</lastmod>` : ""}${"image" in route && route.image ? `
    <image:image>
      <image:loc>${escapeXml(route.image.loc)}</image:loc>
      <image:title>${escapeXml(route.image.title)}</image:title>
      <image:caption>${escapeXml(route.image.caption)}</image:caption>
    </image:image>` : ""}
  </url>`).join("\n")}
</urlset>`

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
