// @ts-expect-error Bun provides this module at test runtime; the app tsconfig intentionally uses Node types.
import { describe, expect, test } from "bun:test"
import { getCanonicalRedirect } from "./canonicalRedirect"

describe("getCanonicalRedirect", () => {
  test("redirects www and removes the application trailing slash in one hop", () => {
    const response = getCanonicalRedirect(
      new Request("https://www.tuziyo.com/ai-toolkit/?utm_source=test")
    )

    expect(response?.status).toBe(301)
    expect(response?.headers.get("Location")).toBe("https://tuziyo.com/ai-toolkit?utm_source=test")
  })

  test("keeps the Astro blog trailing slash", () => {
    expect(getCanonicalRedirect(new Request("https://tuziyo.com/blog/guide/"))).toBeNull()
  })

  test("redirects the blog index to its trailing-slash URL", () => {
    const response = getCanonicalRedirect(new Request("https://tuziyo.com/blog"))

    expect(response?.headers.get("Location")).toBe("https://tuziyo.com/blog/")
  })

  test("does not redirect an already canonical application URL", () => {
    expect(getCanonicalRedirect(new Request("https://tuziyo.com/pricing"))).toBeNull()
  })
})
