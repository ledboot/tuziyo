export function getCanonicalRedirect(request: Request): Response | null {
  const url = new URL(request.url)
  let shouldRedirect = false

  if (url.hostname === "www.tuziyo.com") {
    url.hostname = "tuziyo.com"
    shouldRedirect = true
  }

  if (url.pathname === "/blog") {
    url.pathname = "/blog/"
    shouldRedirect = true
  } else if (
    url.pathname !== "/" &&
    !url.pathname.startsWith("/blog/") &&
    url.pathname.endsWith("/")
  ) {
    url.pathname = url.pathname.replace(/\/+$/, "")
    shouldRedirect = true
  }

  if (!shouldRedirect) return null

  return new Response(null, {
    status: 301,
    headers: { Location: url.toString() },
  })
}
