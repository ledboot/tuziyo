const origin = (process.argv[2] || process.env.SEO_AUDIT_ORIGIN || "http://localhost:3000").replace(
  /\/$/,
  ""
)

const expectedCanonicalOrigin = "https://tuziyo.com"
const unpublishedRoutes = ["/inpainting", "/resize", "/crop", "/convert"]

function matches(html: string, pattern: RegExp) {
  return [...html.matchAll(pattern)]
}

async function fetchText(path: string) {
  const response = await fetch(`${origin}${path}`, { redirect: "manual" })
  return { response, text: await response.text() }
}

async function sitemapPaths(path: string) {
  const sitemap = await fetchText(path)
  if (!sitemap.response.ok) {
    throw new Error(`${path} returned ${sitemap.response.status}`)
  }

  return matches(sitemap.text, /<loc>(https?:\/\/[^<]+)<\/loc>/g).map(match => {
    const url = new URL(match[1])
    return `${url.pathname}${url.search}`
  })
}

const applicationPaths = await sitemapPaths("/sitemap.xml")
const blogSitemaps = await sitemapPaths("/sitemap-index.xml")
const blogPaths = (await Promise.all(blogSitemaps.map(sitemapPaths))).flat()
const paths = [...new Set([...applicationPaths, ...blogPaths])]

if (paths.length === 0) {
  throw new Error("Sitemap contains no URLs")
}

const failures: string[] = []

for (const path of paths) {
  const { response, text } = await fetchText(path)
  if (response.status !== 200) failures.push(`${path}: HTTP ${response.status}`)

  const robots = matches(text, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/gi)
    .map(match => match[1].toLowerCase())
    .join(",")
  if (robots.includes("noindex")) failures.push(`${path}: noindex is present`)

  const canonical = matches(
    text,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/gi
  ).map(match => match[1])
  const expectedCanonical = `${expectedCanonicalOrigin}${path === "/" ? "/" : path}`
  if (canonical.length !== 1 || canonical[0] !== expectedCanonical) {
    failures.push(
      `${path}: canonical ${canonical.join(", ") || "missing"}; expected ${expectedCanonical}`
    )
  }

  const h1Count = matches(text, /<h1(?:\s[^>]*)?>/gi).length
  if (h1Count !== 1) failures.push(`${path}: found ${h1Count} H1 elements`)
}

for (const path of unpublishedRoutes) {
  const { response } = await fetchText(path)
  if (response.status !== 404) failures.push(`${path}: expected 404, received ${response.status}`)
}

if (failures.length > 0) {
  throw new Error(`SEO audit failed:\n${failures.map(failure => `- ${failure}`).join("\n")}`)
}

console.log(`SEO audit passed for ${paths.length} indexed routes; 4 unpublished routes return 404.`)

export {}
