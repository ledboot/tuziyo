import type { Env } from "./types"

const REFERENCE_IMAGE_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export function normalizeContentType(contentType: string) {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? ""
}

export function getReferenceImageExtension(contentType: string) {
  return REFERENCE_IMAGE_CONTENT_TYPES[normalizeContentType(contentType)]
}

export function isAllowedReferenceImageContentType(contentType: string) {
  return Object.hasOwn(REFERENCE_IMAGE_CONTENT_TYPES, normalizeContentType(contentType))
}

function toSafePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_")
}

export function getReferenceImagePrefix(userId: string) {
  return `reference-images/${toSafePathSegment(userId)}/`
}

export function generateR2Key(userId: string) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${toSafePathSegment(userId)}/${year}/${month}${day}`
}

export function getR2PublicUrl(env: Env, key: string) {
  const baseUrl = env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "")
  if (!baseUrl) return undefined
  return `${baseUrl}/${key.replace(/^\/+/, "")}`
}

export function createReferenceImageKey(userId: string, contentType: string) {
  const extension = getReferenceImageExtension(contentType)
  if (!extension) {
    throw new Error("Invalid content type")
  }
  return `reference-images/${generateR2Key(userId)}/${crypto.randomUUID()}.${extension}`
}

export function createGeneratedImageKey(userId: string, extension: string) {
  return `generated-images/${generateR2Key(userId)}/${crypto.randomUUID()}.${extension}`
}

export function arrayBufferToDataUrl(buffer: ArrayBuffer, contentType: string) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ""

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }

  return `data:${normalizeContentType(contentType)};base64,${btoa(binary)}`
}
