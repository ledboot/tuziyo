import type { Context } from "hono"
import type { Env, UserPayload } from "../types"
import { getModels } from "./image"
import { createPresignedReferenceImagePutUrl } from "../referenceImages"

import { REFERENCE_IMAGE_MAX_BYTES, REFERENCE_IMAGE_UPLOAD_EXPIRES_SECONDS } from "../const"

import {
  createReferenceImageKey,
  getR2PublicUrl,
  isAllowedReferenceImageContentType,
  normalizeContentType,
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

  if (!model.supportsImage) {
    return c.json({ error: "This model does not support reference images" }, 400)
  }

  const contentType = normalizeContentType(body.contentType || "")
  if (!isAllowedReferenceImageContentType(contentType)) {
    return c.json({ error: "Reference image must be PNG, JPEG, or WEBP" }, 400)
  }

  const size = Number(body.size)
  if (!Number.isFinite(size) || size <= 0 || size > REFERENCE_IMAGE_MAX_BYTES) {
    return c.json(
      {
        error: `Reference image must be smaller than ${Math.floor(
          REFERENCE_IMAGE_MAX_BYTES / 1024 / 1024
        )}MB`,
      },
      400
    )
  }

  const key = createReferenceImageKey(user.userId, contentType)

  try {
    const uploadUrl = await createPresignedReferenceImagePutUrl(c.env, key, contentType)
    return c.json({
      key,
      uploadUrl,
      publicUrl: getR2PublicUrl(c.env, key),
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
