import type { Context } from "hono"
import type { Env } from "../types"
import { getImageContentTypeFromKey, normalizeContentType } from "../utils"

export const IMAGE_VARIANTS = {
  small: {
    width: 128,
    height: 128,
    fit: "cover",
  },
  large: {
    width: 1280,
    height: 1280,
    fit: "scale-down",
  },
} as const

export type ImageVariant = keyof typeof IMAGE_VARIANTS
export type MediaType = "image" | "video" | "audio"

const GENERATED_IMAGE_PREFIX = "generated-images/"
const MEDIA_URL_VERSION = "v1"
const MEDIA_URL_TTL_SECONDS = 60 * 60
const MAX_CLOCK_SKEW_SECONDS = 60
const INTERNAL_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30
const OUTPUT_FORMAT = "image/webp" as const
const OUTPUT_QUALITY = 85
const encoder = new TextEncoder()
let signingKeyCache: { secret: string; key: Promise<CryptoKey> } | null = null

function isImageVariant(value: string): value is ImageVariant {
  return Object.hasOwn(IMAGE_VARIANTS, value)
}

function isMediaType(value: string): value is MediaType {
  return value === "image" || value === "video" || value === "audio"
}

function normalizeGeneratedImageKey(value: string) {
  const key = value.replace(/^\/+/, "")
  if (!key.startsWith(GENERATED_IMAGE_PREFIX) || key.includes("..") || key.includes("\\")) {
    return null
  }
  return key
}

function encodeKey(key: string) {
  return key
    .split("/")
    .map(segment => encodeURIComponent(segment))
    .join("/")
}

function getMediaKeyFromRequest(requestUrl: string, mediaType: MediaType, variant: ImageVariant) {
  const prefix = `/api/media/${mediaType}/${variant}/`
  const pathname = new URL(requestUrl).pathname
  if (!pathname.startsWith(prefix)) return null

  try {
    return normalizeGeneratedImageKey(
      pathname
        .slice(prefix.length)
        .split("/")
        .map(segment => decodeURIComponent(segment))
        .join("/")
    )
  } catch {
    return null
  }
}

function createSignaturePayload(
  mediaType: MediaType,
  variant: ImageVariant,
  key: string,
  expiresAt: number
) {
  return [MEDIA_URL_VERSION, mediaType, variant, key, String(expiresAt)].join("\n")
}

function bytesToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, "0")).join("")
}

function hexToBytes(value: string) {
  if (!/^[0-9a-f]{64}$/i.test(value)) return null
  const bytes = new Uint8Array(value.length / 2)
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16)
  }
  return bytes
}

function getSigningKey(secret: string) {
  if (!secret) {
    throw new Error("MEDIA_SIGNING_SECRET is required")
  }
  if (!signingKeyCache || signingKeyCache.secret !== secret) {
    signingKeyCache = {
      secret,
      key: crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      ),
    }
  }
  return signingKeyCache.key
}

async function signMediaPayload(secret: string, payload: string) {
  const signingKey = await getSigningKey(secret)
  return bytesToHex(await crypto.subtle.sign("HMAC", signingKey, encoder.encode(payload)))
}

async function verifyMediaSignature(secret: string, payload: string, signature: string) {
  const signatureBytes = hexToBytes(signature)
  if (!signatureBytes) return false
  const signingKey = await getSigningKey(secret)
  return crypto.subtle.verify("HMAC", signingKey, signatureBytes, encoder.encode(payload))
}

export async function createSignedImageVariantUrl(
  env: Env,
  imageKey: string | null,
  variant: ImageVariant,
  expiresAt = Math.floor(Date.now() / 1000) + MEDIA_URL_TTL_SECONDS
) {
  if (!imageKey || /^https?:\/\//i.test(imageKey)) return null
  const key = normalizeGeneratedImageKey(imageKey)
  if (!key) return null

  const mediaType: MediaType = "image"
  const payload = createSignaturePayload(mediaType, variant, key, expiresAt)
  const signature = await signMediaPayload(env.MEDIA_SIGNING_SECRET, payload)
  const mediaBaseUrl = new URL(env.MEDIA_BASE_URL)
  if (mediaBaseUrl.protocol !== "http:" && mediaBaseUrl.protocol !== "https:") {
    throw new Error("MEDIA_BASE_URL must use HTTP or HTTPS")
  }
  const url = new URL(`/api/media/${mediaType}/${variant}/${encodeKey(key)}`, mediaBaseUrl.origin)
  url.searchParams.set("expires", String(expiresAt))
  url.searchParams.set("signature", signature)
  return url.toString()
}

function getClientCacheControl(expiresAt: number) {
  const remainingSeconds = Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
  return `private, max-age=${remainingSeconds}`
}

function toClientResponse(response: Response, expiresAt: number) {
  const headers = new Headers(response.headers)
  headers.set("Cache-Control", getClientCacheControl(expiresAt))
  headers.set("X-Content-Type-Options", "nosniff")
  return new Response(response.body, {
    status: response.status,
    headers,
  })
}

function getInternalCacheKey(
  requestUrl: string,
  mediaType: MediaType,
  variant: ImageVariant,
  key: string
) {
  const url = new URL(requestUrl)
  url.pathname = `/__media_cache/${MEDIA_URL_VERSION}/${mediaType}/${variant}/${encodeKey(key)}`
  url.search = ""
  return new Request(url.toString(), { method: "GET" })
}

export async function handleServeMediaVariant(c: Context<{ Bindings: Env }>) {
  const requestedMediaType = c.req.param("type")
  if (!requestedMediaType || !isMediaType(requestedMediaType)) {
    return c.text("Unknown media type", 404)
  }
  if (requestedMediaType !== "image") {
    return c.text("Media type is not supported yet", 404)
  }

  const variant = c.req.param("variant")
  if (!variant || !isImageVariant(variant)) {
    return c.text("Unknown media variant", 404)
  }

  const key = getMediaKeyFromRequest(c.req.url, requestedMediaType, variant)
  if (!key) {
    return c.text("Invalid media key", 400)
  }

  const requestUrl = new URL(c.req.url)
  const expiresValue = requestUrl.searchParams.get("expires")
  const signature = requestUrl.searchParams.get("signature")
  if (!expiresValue || !/^\d+$/.test(expiresValue) || !signature) {
    return c.text("Invalid or expired media signature", 403)
  }

  const expiresAt = Number(expiresValue)
  const now = Math.floor(Date.now() / 1000)
  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt > now + MEDIA_URL_TTL_SECONDS + MAX_CLOCK_SKEW_SECONDS
  ) {
    return c.text("Invalid or expired media signature", 403)
  }

  const payload = createSignaturePayload(requestedMediaType, variant, key, expiresAt)
  if (!(await verifyMediaSignature(c.env.MEDIA_SIGNING_SECRET, payload, signature))) {
    return c.text("Invalid or expired media signature", 403)
  }

  const cache =
    typeof caches === "undefined" ? null : (caches as CacheStorage & { default: Cache }).default
  const cacheKey = getInternalCacheKey(c.req.url, requestedMediaType, variant, key)
  const cachedResponse = await cache?.match(cacheKey)
  if (cachedResponse) return toClientResponse(cachedResponse, expiresAt)

  const object = await c.env.R2.get(key)
  if (!object) {
    return c.text("Media not found", 404)
  }

  const contentType = normalizeContentType(
    object.httpMetadata?.contentType || getImageContentTypeFromKey(key) || ""
  )
  if (!contentType.startsWith("image/")) {
    return c.text("Object is not an image", 415)
  }

  try {
    const transformed = await c.env.IMAGES.input(object.body)
      .transform(IMAGE_VARIANTS[variant])
      .output({ format: OUTPUT_FORMAT, quality: OUTPUT_QUALITY })
    const transformedResponse = transformed.response()
    const headers = new Headers(transformedResponse.headers)
    headers.set("Cache-Control", `public, max-age=${INTERNAL_CACHE_TTL_SECONDS}`)
    headers.set("Content-Type", transformed.contentType())
    headers.set("X-Content-Type-Options", "nosniff")

    const internalResponse = new Response(transformedResponse.body, {
      status: transformedResponse.status,
      headers,
    })
    await cache?.put(cacheKey, internalResponse.clone())
    return toClientResponse(internalResponse, expiresAt)
  } catch (error) {
    console.error(`Failed to transform R2 image ${key} as ${variant}:`, error)
    return c.text("Image transformation failed", 502)
  }
}
