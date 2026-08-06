import { AI_IMAGE_MODELS, AI_IMAGE_MODEL_SLUGS } from "~/data/aiImageModels"
import { COMPARISON_PAGES, SEO_PAGE_UPDATED_AT } from "~/data/seoLandingPages"

const baseUrl = "https://tuziyo.com"

interface SitemapRoute {
  path: string
  lastmod?: string
  image?: { loc: string }
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export async function loader() {
  const staticRoutes = ["/", "/ai-toolkit", "/studio", "/pricing", "/privacy", "/terms", "/contact"]
  const modelRoutes: SitemapRoute[] = AI_IMAGE_MODEL_SLUGS.map(slug => {
    const model = AI_IMAGE_MODELS[slug]
    return {
      path: `/ai/models/${slug}`,
      lastmod: model.updatedAt,
      image: {
        loc: `${baseUrl}${model.heroImage.src}`,
      },
    }
  })
  const comparisonRoutes: SitemapRoute[] = Object.values(COMPARISON_PAGES).map(page => ({
    path: `/ai/compare/${page.slug}`,
    lastmod: SEO_PAGE_UPDATED_AT,
    image: {
      loc: `${baseUrl}${page.candidates[0].image}`,
    },
  }))

  const routes: SitemapRoute[] = [
    ...staticRoutes.map(path => ({ path })),
    { path: "/ai/models", lastmod: "2026-07-16" },
    {
      path: "/ai/video-models/minimax-h3",
      lastmod: "2026-08-04",
      image: {
        loc: `${baseUrl}/showcase/case324.jpg`,
      },
    },
    ...modelRoutes,
    ...comparisonRoutes,
    { path: "/prompts/ai-image-prompts", lastmod: SEO_PAGE_UPDATED_AT },
    { path: "/prompts/ai-image-prompts-examples", lastmod: SEO_PAGE_UPDATED_AT },
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${routes
  .map(
    route => `  <url>
    <loc>${baseUrl}${route.path}</loc>${
      route.lastmod
        ? `
    <lastmod>${route.lastmod}</lastmod>`
        : ""
    }${
      "image" in route && route.image
        ? `
    <image:image>
      <image:loc>${escapeXml(route.image.loc)}</image:loc>
    </image:image>`
        : ""
    }
  </url>`
  )
  .join("\n")}
</urlset>`

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
