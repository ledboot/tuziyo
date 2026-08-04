import type { Context } from "hono"
import type { Env, UserPayload } from "../types"
import { getModels } from "./image"
import { createPresignedReferenceImagePutUrl } from "../referenceImages"

import {
  REFERENCE_AUDIO_MAX_BYTES,
  REFERENCE_IMAGE_MAX_BYTES,
  REFERENCE_IMAGE_UPLOAD_EXPIRES_SECONDS,
  REFERENCE_MEDIA_URL_EXPIRES_SECONDS,
  REFERENCE_VIDEO_MAX_BYTES,
} from "../const"

import {
  createReferenceMediaKey,
  createReferenceImageKey,
  createPresignedGetUrl,
  getReferenceImagePrefix,
  getReferenceMediaPrefix,
  isAllowedReferenceImageContentType,
  isAllowedReferenceMediaContentType,
  normalizeContentType,
  type ReferenceMediaKind,
} from "../utils"

type AuthenticatedContext = Context<{
  Bindings: Env
  Variables: { user: UserPayload | null }
}>

interface PresignReferenceImageRequestBody {
  fileName?: string
  contentType?: string
  size?: number
  model?: string
  kind?: ReferenceMediaKind
}

interface ResolveReferenceMediaRequestBody {
  keys?: string[]
}

export async function handleCreateReferenceImageUpload(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const body = await c.req.json<PresignReferenceImageRequestBody>().catch(() => null)
  if (!body) {
    return c.json({ error: "Invalid upload request" }, 400)
  }

  const model = getModels().find(model => model.id === body.model)
  if (!model) {
    return c.json({ error: "Invalid model" }, 400)
  }

  const kind: ReferenceMediaKind =
    body.kind === "video" || body.kind === "audio" ? body.kind : "image"
  const supportsKind =
    kind === "image"
      ? model.supportsImage
      : model.videoInputModes?.some(mode =>
          kind === "video" ? Boolean(mode.videoCount) : Boolean(mode.audioCount)
        )
  if (!supportsKind) {
    return c.json({ error: `This model does not support reference ${kind}s` }, 400)
  }
  const contentType = normalizeContentType(body.contentType || "")
  const imageConstraints = model.referenceImageConstraints ?? model.referenceMediaConstraints?.image
  const isAllowed =
    kind === "image"
      ? isAllowedReferenceImageContentType(contentType) &&
        (!imageConstraints || imageConstraints.mimeTypes.includes(contentType))
      : isAllowedReferenceMediaContentType(kind, contentType)
  if (!isAllowed) {
    const formats =
      kind === "image"
        ? imageConstraints?.mimeTypes.includes("image/heic")
          ? "PNG, JPEG, WEBP, HEIC, or HEIF"
          : imageConstraints?.mimeTypes.includes("image/webp")
            ? "PNG, JPEG, or WEBP"
            : "PNG or JPEG"
        : kind === "video"
          ? "MP4 or MOV"
          : "MP3 or WAV"
    return c.json({ error: `Reference ${kind} must be ${formats}` }, 400)
  }

  const size = Number(body.size)
  const configuredMaxBytes =
    kind === "image" ? imageConstraints?.maxBytes : model.referenceMediaConstraints?.[kind].maxBytes
  const maxBytes =
    configuredMaxBytes ??
    (kind === "video"
      ? REFERENCE_VIDEO_MAX_BYTES
      : kind === "audio"
        ? REFERENCE_AUDIO_MAX_BYTES
        : REFERENCE_IMAGE_MAX_BYTES)
  if (!Number.isFinite(size) || size <= 0 || size > maxBytes) {
    return c.json(
      {
        error: `Reference ${kind} must not exceed ${Math.floor(maxBytes / 1_000_000)}MB`,
      },
      400
    )
  }

  const key =
    kind === "image"
      ? createReferenceImageKey(user.userId, contentType)
      : createReferenceMediaKey(user.userId, kind, contentType)

  try {
    const uploadUrl = await createPresignedReferenceImagePutUrl(c.env, key, contentType)
    return c.json({
      key,
      uploadUrl,
      publicUrl: await createPresignedGetUrl(c.env, key, REFERENCE_MEDIA_URL_EXPIRES_SECONDS),
      expiresIn: REFERENCE_IMAGE_UPLOAD_EXPIRES_SECONDS,
      headers: {
        "Content-Type": contentType,
      },
    })
  } catch (error) {
    console.error("Create reference image upload error:", error)
    return c.json({ error: "Failed to create upload URL" }, 500)
  }
}

export async function handleResolveReferenceMediaUrls(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const body = await c.req.json<ResolveReferenceMediaRequestBody>().catch(() => null)
  const keys = Array.isArray(body?.keys) ? [...new Set(body.keys)] : []
  if (keys.length === 0 || keys.length > 30) {
    return c.json({ error: "keys must contain between 1 and 30 reference media keys" }, 400)
  }

  const allowedPrefixes = [
    getReferenceImagePrefix(user.userId),
    getReferenceMediaPrefix(user.userId, "video"),
    getReferenceMediaPrefix(user.userId, "audio"),
  ]
  const normalizedKeys = keys.map(key => (typeof key === "string" ? key.replace(/^\/+/, "") : ""))
  if (normalizedKeys.some(key => !key || !allowedPrefixes.some(prefix => key.startsWith(prefix)))) {
    return c.json({ error: "Invalid reference media key" }, 400)
  }

  const items = await Promise.all(
    normalizedKeys.map(async key => ({
      key,
      url: await createPresignedGetUrl(c.env, key, REFERENCE_MEDIA_URL_EXPIRES_SECONDS),
    }))
  )

  return c.json({
    items: items.filter((item): item is { key: string; url: string } => Boolean(item.url)),
    expiresIn: REFERENCE_MEDIA_URL_EXPIRES_SECONDS,
  })
}
