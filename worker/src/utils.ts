import { AwsClient } from "aws4fetch"
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

export function getImageContentTypeFromKey(key: string) {
  const extension = key.split(".").pop()?.toLowerCase()
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg"
  if (extension === "png") return "image/png"
  if (extension === "webp") return "image/webp"
  return undefined
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

export function getGeneratedImagePrefix(userId: string) {
  return `generated-images/${toSafePathSegment(userId)}/`
}

export function generateR2Key(userId: string) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${toSafePathSegment(userId)}/${year}/${month}${day}`
}

export async function createPresignedGetUrl(
  env: Env,
  key: string,
  expiresInSeconds = 3600
): Promise<string | undefined> {
  if (!key) return undefined
  if (/^https?:\/\//i.test(key)) return key

  const missingConfig = [
    ["R2_ACCOUNT_ID", env.R2_ACCOUNT_ID],
    ["R2_BUCKET_NAME", env.R2_BUCKET_NAME],
    ["R2_ACCESS_KEY_ID", env.R2_ACCESS_KEY_ID],
    ["R2_SECRET_ACCESS_KEY", env.R2_SECRET_ACCESS_KEY],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missingConfig.length > 0) {
    throw new Error(`Missing R2 signing configuration: ${missingConfig.join(", ")}`)
  }

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  })

  const url = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`
  )
  url.searchParams.set("X-Amz-Expires", String(expiresInSeconds))

  const signedRequest = await client.sign(url.toString(), {
    method: "GET",
    aws: {
      signQuery: true,
    },
  })

  return signedRequest.url
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
