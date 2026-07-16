import type { MetaDescriptor } from "react-router"

export const SITE_NAME = "tuziyo"
export const SITE_ORIGIN = "https://tuziyo.com"
export const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/web-app-manifest-512x512.png`

interface SeoOptions {
  title: string
  description: string
  path: string
  keywords?: string
  type?: "website" | "article"
  schema?: Record<string, unknown> | Record<string, unknown>[]
}

export function createSeoMeta({
  title,
  description,
  path,
  keywords,
  type = "website",
  schema,
}: SeoOptions): MetaDescriptor[] {
  const canonical = new URL(path, SITE_ORIGIN).toString()

  return [
    { title },
    { name: "description", content: description },
    ...(keywords ? [{ name: "keywords", content: keywords }] : []),
    { name: "author", content: SITE_NAME },
    { name: "robots", content: "index, follow, max-image-preview:large" },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_US" },
    { property: "og:image", content: DEFAULT_SOCIAL_IMAGE },
    { property: "og:image:alt", content: `${SITE_NAME} AI creative tools` },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: DEFAULT_SOCIAL_IMAGE },
    ...(schema ? [{ "script:ld+json": schema }] : []),
  ]
}

export function createNoIndexMeta(title: string): MetaDescriptor[] {
  return [
    { title },
    { name: "robots", content: "noindex, nofollow, noarchive" },
  ]
}

export function createWebApplicationSchema({
  name,
  description,
  path,
  category = "MultimediaApplication",
  free = true,
}: {
  name: string
  description: string
  path: string
  category?: string
  free?: boolean
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url: new URL(path, SITE_ORIGIN).toString(),
    applicationCategory: category,
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    ...(free
      ? {
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }
      : {}),
  }
}
