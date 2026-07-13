import type { Context } from "hono"
import { v4 as uuidv4 } from "uuid"
import {
  type Env,
  type ModelConfig,
  type UserPayload,
  ReferenceImageFormat,
  type PreparedReferenceImage,
} from "../types"
import { deductCredits, getUserCredits, calculateRequiredCredits } from "./credits"
import {
  ENABLED_IMAGE_MODEL_IDS,
  PLAN_MODELS_CONFIG,
  getEnabledModels,
  getImageModelPromptMaxLength,
  getPromptCharacterLength,
  isImageModelEnabled,
  validateModelOptions,
} from "../imageModels"
import {
  arrayBufferToDataUrl,
  createReferenceImageKey,
  createGeneratedImageKey,
  getGeneratedImagePrefix,
  getImageContentTypeFromKey,
  getR2PublicUrl,
  createPresignedGetUrl,
  getReferenceImagePrefix,
  isAllowedReferenceImageContentType,
  normalizeContentType,
} from "../utils"
import {
  EVOLINK_TASK_OBJECTS,
  MIME_TYPES,
  PROVIDERS,
  REFERENCE_IMAGE_MAX_BYTES,
  getEvoLinkTaskMimeType,
  type MimeType,
} from "../const"
const BYTEPLUS_MODEL_MAP: Record<string, string> = {
  "bytedance/seedream-4.0": "seedream-4-0-250828",
  "bytedance/seedream-4.5": "seedream-4-5-251128",
  "bytedance/seedream-5-lite": "seedream-5-0-260128",
}

const EVOLINK_MODEL_MAP: Record<string, string> = {
  "google/nano-banana-2-lite": "gemini-3.1-flash-lite-image",
  "google/nano-banana-2": "gemini-3.1-flash-image-preview",
  "google/nano-banana-pro": "gemini-3-pro-image-preview",
  "google/nano-banana": "nano-banana-beta",
  "bytedance/seedream-4.0": "doubao-seedream-4.0",
  "bytedance/seedream-4.5": "doubao-seedream-4.5",
  "bytedance/seedream-5-lite": "doubao-seedream-5.0-lite",
  "bytedance/seedream-5-pro": "doubao-seedream-5.0-pro",
  "openai/gpt-image-1.5": "gpt-image-1.5",
  "openai/gpt-image-2": "gpt-image-2",
}

export interface GenerateInput {
  prompt: string
  model: string
  provider?: string
  size?: string
  quality?: string
  style?: string
  aspect_ratio?: string
  resolution?: string
  output_format?: string
  num_images?: number
  negative_prompt?: string
  sessionId?: string
  google_search?: string | boolean
  image_search?: string | boolean
  thinking_level?: string
  background?: string
  reference_images?: string[]
}

type AuthenticatedContext = Context<{
  Bindings: Env
  Variables: { user: UserPayload | null }
}>

interface ImageRecord {
  id: string
  message_id: string
  session_id: string
  image_url: string
  is_legacy: number
}

interface FavoriteImageRecord {
  favorite_id: string
  content_type: string
  favorite_created_at: number
  id: string
  session_id: string
  session_title: string
  role: string
  provider: string | null
  model: string
  prompt: string | null
  image_url: string
  aspect_ratio: string | null
  resolution: string | null
  image_size: string | null
  quality: string | null
  style: string | null
  negative_prompt: string | null
  output_format: string | null
  num_images: number | null
  google_search: number | null
  image_search: number | null
  created_at: number
}

interface FavoriteRequestBody {
  favorited?: boolean
  favorite?: boolean
  is_favorite?: boolean
}

function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000)
}

function getRequestedImageCount(input: GenerateInput) {
  if (
    input.model === "bytedance/seedream-5-pro" ||
    input.model === "google/nano-banana" ||
    input.model === "google/nano-banana-pro" ||
    input.model === "google/nano-banana-2" ||
    input.model === "google/nano-banana-2-lite"
  ) {
    return 1
  }
  const parsed = Number(input.num_images)
  if (!Number.isFinite(parsed)) return 1
  if (input.model === "openai/gpt-image-2") {
    return Math.min(Math.max(Math.trunc(parsed), 1), 5)
  }
  return Math.min(Math.max(Math.trunc(parsed), 1), 15)
}

const MEDIA_EXTENSIONS: Record<MimeType, readonly string[]> = {
  [MIME_TYPES.IMAGE]: ["png", "jpg", "jpeg", "webp"],
  [MIME_TYPES.VIDEO]: ["mp4", "webm", "mov"],
  [MIME_TYPES.AUDIO]: ["mp3", "wav", "m4a", "aac", "ogg", "flac"],
}

const DEFAULT_MEDIA_EXTENSION: Record<MimeType, string> = {
  [MIME_TYPES.IMAGE]: "png",
  [MIME_TYPES.VIDEO]: "mp4",
  [MIME_TYPES.AUDIO]: "mp3",
}

const DEFAULT_MEDIA_CONTENT_TYPE: Record<MimeType, string> = {
  [MIME_TYPES.IMAGE]: "image/png",
  [MIME_TYPES.VIDEO]: "video/mp4",
  [MIME_TYPES.AUDIO]: "audio/mpeg",
}

function getGeneratedMediaExtension(
  originUrl: string,
  outputFormat: string | undefined,
  mimeType: MimeType
) {
  const urlExtension = originUrl.split("?")[0].split(".").pop()?.toLowerCase()
  if (urlExtension && MEDIA_EXTENSIONS[mimeType].includes(urlExtension)) {
    return urlExtension
  }

  const normalizedOutputFormat = outputFormat?.toLowerCase()
  if (normalizedOutputFormat && MEDIA_EXTENSIONS[mimeType].includes(normalizedOutputFormat)) {
    return normalizedOutputFormat
  }

  return DEFAULT_MEDIA_EXTENSION[mimeType]
}

function getBoundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(Math.trunc(parsed), min), max)
}

function getRequestedFavorite(body: FavoriteRequestBody) {
  return body.favorited ?? body.favorite ?? body.is_favorite
}

async function toPublicImageUrl(env: Env, imageUrl: string | null) {
  if (!imageUrl) return null
  return (await createPresignedGetUrl(env, imageUrl)) ?? null
}

export function buildAiInput(input: GenerateInput, referenceImages: PreparedReferenceImage[] = []) {
  const {
    model,
    prompt,
    aspect_ratio,
    resolution,
    output_format,
    num_images,
    negative_prompt,
    quality,
    style,
    size,
    google_search,
    image_search,
    background,
  } = input

  let aiInput: Record<string, unknown>

  switch (model) {
    case "google/nano-banana-2": {
      aiInput = { prompt }
      if (aspect_ratio) aiInput.aspect_ratio = aspect_ratio
      if (output_format) aiInput.output_format = output_format
      if (resolution) aiInput.resolution = resolution
      if (google_search) aiInput.google_search = google_search === "true"
      if (image_search) aiInput.image_search = image_search === "true"
      break
    }

    case "alibaba/wan-2.6-image": {
      aiInput = { prompt }
      if (size) aiInput.size = size
      if (negative_prompt) aiInput.negative_prompt = negative_prompt
      break
    }

    case "bytedance/seedream-5-lite": {
      aiInput = { prompt }
      if (aspect_ratio) aiInput.aspect_ratio = aspect_ratio
      if (resolution) aiInput.size = resolution
      if (output_format) aiInput.output_format = output_format
      if (num_images) aiInput.max_images = Math.min(num_images, 15)
      if (negative_prompt) aiInput.negative_prompt = negative_prompt
      aiInput.sequential_image_generation = "auto"
      break
    }

    case "bytedance/seedream-5-pro": {
      aiInput = { prompt }
      if (aspect_ratio) aiInput.size = aspect_ratio
      if (resolution) aiInput.quality = resolution
      if (output_format) aiInput.model_params = { output_format }
      break
    }

    case "bytedance/seedream-4.0": {
      aiInput = { prompt }
      if (aspect_ratio) aiInput.aspect_ratio = aspect_ratio
      if (resolution) aiInput.size = resolution
      aiInput.watermark = false
      aiInput.model = "seedream-4-0-250828"
      break
    }

    case "openai/gpt-image-1.5": {
      aiInput = { prompt }
      if (size) aiInput.size = size
      if (quality) aiInput.quality = quality
      break
    }

    case "openai/gpt-image-2": {
      aiInput = { prompt }
      if (size) aiInput.size = size
      if (quality) aiInput.quality = quality
      if (background) aiInput.background = background
      if (resolution) aiInput.resolution = resolution
      break
    }

    default:
      aiInput = { prompt }
  }

  applyReferenceImages(aiInput, model, referenceImages)
  return aiInput
}

function applyReferenceImages(
  aiInput: Record<string, unknown>,
  model: string,
  referenceImages: PreparedReferenceImage[]
) {
  if (referenceImages.length === 0) return

  switch (model) {
    case "google/nano-banana":
    case "google/nano-banana-pro":
    case "google/nano-banana-2":
    case "google/nano-banana-2-lite":
    case "bytedance/seedream-5-lite":
    case "bytedance/seedream-5-pro":
      aiInput.image_input = referenceImages
        .map(image => image.url)
        .filter((url): url is string => Boolean(url))
      break

    case "openai/gpt-image-1.5": {
      const image = referenceImages[0]?.dataUrl
      if (image) aiInput.image = image
      break
    }

    case "openai/gpt-image-2": {
      const images = referenceImages
        .map(image => image.dataUrl)
        .filter((image): image is string => Boolean(image))
      if (images.length > 0) aiInput.images = images
      break
    }
  }
}

async function getUserImage(c: AuthenticatedContext, imageId: string, userId: string) {
  const output = await c.env.DB.prepare(
    `
      SELECT mo.id, mo.message_id, m.session_id, mo.image_url, 0 AS is_legacy
      FROM message_outputs mo
      INNER JOIN messages m ON m.id = mo.message_id AND m.status = 1
      INNER JOIN sessions s ON s.id = m.session_id AND s.status = 1
      WHERE mo.id = ? AND s.user_id = ? AND mo.status = 'completed' AND mo.image_url IS NOT NULL
      LIMIT 1
    `
  )
    .bind(imageId, userId)
    .first<ImageRecord>()

  if (output) return output

  return c.env.DB.prepare(
    `
      SELECT m.id, m.id AS message_id, m.session_id, m.image_url, 1 AS is_legacy
      FROM messages m
      INNER JOIN sessions s ON s.id = m.session_id AND s.status = 1
      WHERE m.id = ? AND s.user_id = ? AND m.status = 1 AND m.image_url IS NOT NULL
      LIMIT 1
    `
  )
    .bind(imageId, userId)
    .first<ImageRecord>()
}

async function prepareReferenceImages(
  c: AuthenticatedContext,
  input: GenerateInput,
  user: UserPayload
): Promise<
  { images: PreparedReferenceImage[]; error?: never } | { images?: never; error: string }
> {
  const referenceImages = input.reference_images ?? []
  if (referenceImages.length === 0) {
    return { images: [] }
  }

  if (!Array.isArray(referenceImages)) {
    return { error: "reference_images must be an array" }
  }

  const modelConfig = getModels().find(model => model.id === input.model)
  if (!modelConfig?.supportsImage) {
    return { error: "This model does not support reference images" }
  }

  const maxCount = modelConfig.referenceImageCount ?? 0
  if (referenceImages.length > maxCount) {
    return { error: `This model supports at most ${maxCount} reference images` }
  }

  const referencePrefix = getReferenceImagePrefix(user.userId)
  const generatedPrefix = getGeneratedImagePrefix(user.userId)
  const preparedImages: PreparedReferenceImage[] = []

  for (const referenceImageKey of referenceImages) {
    if (typeof referenceImageKey !== "string" || referenceImageKey.length === 0) {
      return { error: "Invalid reference image" }
    }

    const key = referenceImageKey.replace(/^\/+/, "")
    if (!key.startsWith(referencePrefix) && !key.startsWith(generatedPrefix)) {
      return { error: "Invalid reference image key" }
    }

    const object = await c.env.R2.head(key)
    if (!object) {
      return { error: "Reference image upload was not found" }
    }

    const contentType = normalizeContentType(
      object.httpMetadata?.contentType || getImageContentTypeFromKey(key) || ""
    )
    if (!isAllowedReferenceImageContentType(contentType)) {
      return { error: "Reference image must be PNG, JPEG, or WEBP" }
    }

    if (object.size > REFERENCE_IMAGE_MAX_BYTES) {
      return { error: "Reference image is too large" }
    }

    let dataUrl: string | undefined
    if (modelConfig.referenceImageFormat === ReferenceImageFormat.BASE64) {
      const objectBody = await c.env.R2.get(key)
      if (!objectBody) {
        return { error: "Reference image upload was not found" }
      }
      dataUrl = arrayBufferToDataUrl(await objectBody.arrayBuffer(), contentType)
    }

    const url = await createPresignedGetUrl(c.env, key)
    if (modelConfig.referenceImageFormat === ReferenceImageFormat.URL && !url) {
      return { error: "R2_PUBLIC_BASE_URL is required for URL reference images" }
    }

    preparedImages.push({
      key,
      url,
      contentType,
      size: object.size,
      dataUrl,
    })
  }

  return { images: preparedImages }
}

export async function handleGetFavorites(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const limit = getBoundedInt(c.req.query("limit") ?? null, 50, 1, 100)
  const offset = getBoundedInt(c.req.query("offset") ?? null, 0, 0, 10000)

  const favorites = await c.env.DB.prepare(
    `
      SELECT
        f.id AS favorite_id,
        f.content_type,
        f.created_at AS favorite_created_at,
        COALESCE(mo.id, m.id) AS id,
        m.id AS message_id,
        mo.id AS output_id,
        m.session_id,
        s.title AS session_title,
        m.role,
        m.provider,
        m.model,
        m.prompt,
        COALESCE(mo.image_url, m.image_url) AS image_url,
        m.aspect_ratio,
        m.resolution,
        m.image_size,
        m.quality,
        m.style,
        m.negative_prompt,
        m.output_format,
        m.num_images,
        m.google_search,
        m.image_search,
        m.created_at
      FROM content_favorites f
      INNER JOIN messages m ON m.id = f.message_id
      LEFT JOIN message_outputs mo ON mo.id = f.output_id AND mo.status = 'completed'
      INNER JOIN sessions s ON s.id = m.session_id AND s.status = 1
      WHERE f.user_id = ? AND f.content_type = 'image' AND s.user_id = ? AND m.status = 1
        AND COALESCE(mo.image_url, m.image_url) IS NOT NULL
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `
  )
    .bind(user.userId, user.userId, limit, offset)
    .all()

  const total = await c.env.DB.prepare(
    `
      SELECT COUNT(*) AS total
      FROM content_favorites f
      INNER JOIN messages m ON m.id = f.message_id
      LEFT JOIN message_outputs mo ON mo.id = f.output_id AND mo.status = 'completed'
      INNER JOIN sessions s ON s.id = m.session_id AND s.status = 1
      WHERE f.user_id = ? AND f.content_type = 'image' AND s.user_id = ? AND m.status = 1
        AND COALESCE(mo.image_url, m.image_url) IS NOT NULL
    `
  )
    .bind(user.userId, user.userId)
    .first<{ total: number }>()

  const results = await Promise.all(
    (favorites.results as unknown as FavoriteImageRecord[]).map(async favorite => ({
      ...favorite,
      url: await toPublicImageUrl(c.env, favorite.image_url),
    }))
  )

  return c.json({
    favorites: results,
    total: total?.total ?? 0,
  })
}

export async function handleSetImageFavorite(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const imageId = c.req.param("id")
  if (!imageId) {
    return c.json({ error: "Image id is required" }, 400)
  }

  const body = await c.req.json<FavoriteRequestBody>().catch(() => ({}))
  const favorited = getRequestedFavorite(body)

  if (typeof favorited !== "boolean") {
    return c.json({ error: "favorited must be a boolean" }, 400)
  }

  const image = await getUserImage(c, imageId, user.userId)
  if (!image) {
    return c.json({ error: "Image not found" })
  }

  if (favorited) {
    if (image.is_legacy) {
      await c.env.DB.prepare(
        `
          INSERT OR IGNORE INTO content_favorites (id, user_id, content_type, message_id, output_id, created_at)
          VALUES (?, ?, 'image', ?, NULL, ?)
        `
      )
        .bind(uuidv4(), user.userId, image.message_id, getCurrentTimestamp())
        .run()
    } else {
      await c.env.DB.prepare(
        `
          INSERT OR IGNORE INTO content_favorites (id, user_id, content_type, message_id, output_id, created_at)
          VALUES (?, ?, 'image', ?, ?, ?)
        `
      )
        .bind(uuidv4(), user.userId, image.message_id, image.id, getCurrentTimestamp())
        .run()
    }
  } else {
    const deleteSql = image.is_legacy
      ? "DELETE FROM content_favorites WHERE user_id = ? AND content_type = 'image' AND message_id = ? AND output_id IS NULL"
      : "DELETE FROM content_favorites WHERE user_id = ? AND content_type = 'image' AND output_id = ?"
    await c.env.DB.prepare(deleteSql)
      .bind(user.userId, image.is_legacy ? image.message_id : image.id)
      .run()
  }

  return c.json({ success: true, favorited })
}

export async function handleDeleteImage(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const imageId = c.req.param("id")
  if (!imageId) {
    return c.json({ error: "Image id is required" }, 400)
  }

  const image = await getUserImage(c, imageId, user.userId)

  if (!image) {
    return c.json({ error: "Image not found" })
  }

  const now = getCurrentTimestamp()
  if (image.is_legacy) {
    await c.env.DB.batch([
      c.env.DB.prepare(
        "DELETE FROM content_favorites WHERE user_id = ? AND content_type = 'image' AND message_id = ? AND output_id IS NULL"
      ).bind(user.userId, image.message_id),
      c.env.DB.prepare("UPDATE messages SET status = 2 WHERE id = ?").bind(image.message_id),
      c.env.DB.prepare(
        "UPDATE sessions SET updated_at = ? WHERE id = ? AND user_id = ? AND status = 1"
      ).bind(now, image.session_id, user.userId),
    ])
  } else {
    await c.env.DB.batch([
      c.env.DB.prepare(
        "DELETE FROM content_favorites WHERE user_id = ? AND content_type = 'image' AND output_id = ?"
      ).bind(user.userId, image.id),
      c.env.DB.prepare(
        "UPDATE message_outputs SET status = 'deleted', deleted_at = ?, updated_at = ? WHERE id = ?"
      ).bind(now, now, image.id),
      c.env.DB.prepare(
        `
          UPDATE messages
          SET status = 2
          WHERE id = ? AND NOT EXISTS (
            SELECT 1 FROM message_outputs WHERE message_id = ? AND status != 'deleted'
          )
        `
      ).bind(image.message_id, image.message_id),
      c.env.DB.prepare(
        "UPDATE sessions SET updated_at = ? WHERE id = ? AND user_id = ? AND status = 1"
      ).bind(now, image.session_id, user.userId),
    ])
  }

  return c.json({
    success: true,
    deletedObject: false,
  })
}

export async function handleGenerate(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const input = await c.req.json<GenerateInput>()

  if (!input.prompt) {
    return c.json({ error: "prompt is required" }, 400)
  }

  if (!input.model || !isImageModelEnabled(input.model)) {
    return c.json(
      { error: `model is unavailable; enabled models: ${ENABLED_IMAGE_MODEL_IDS.join(", ")}` },
      400
    )
  }

  const promptMaxLength = getImageModelPromptMaxLength(input.model)
  if (promptMaxLength !== null && getPromptCharacterLength(input.prompt) > promptMaxLength) {
    return c.json(
      { error: `prompt must not exceed ${promptMaxLength.toLocaleString("en-US")} characters` },
      400
    )
  }

  // Validate model permissions based on user's subscription plan
  const userType = user.userType || "free"
  let planKey: "starter" | "professional" | "creator" = "starter"
  if (userType === "professional") {
    planKey = "professional"
  } else if (userType === "creator") {
    planKey = "creator"
  }

  // Validate concurrent generation task limit
  const concurrentLimits: Record<string, number> = {
    free: 1,
    starter: 1,
    professional: 2,
    creator: 4,
  }
  const limit = concurrentLimits[userType] ?? 1

  const activeTasks = await c.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM generation_tasks WHERE user_id = ? AND status IN ('pending', 'processing')"
  )
    .bind(user.userId)
    .first<{ count: number }>()

  const activeCount = activeTasks?.count ?? 0

  if (activeCount >= limit) {
    return c.json(
      {
        error: `You have reached the maximum number of concurrent generation tasks (${limit} task${limit > 1 ? "s" : ""}) allowed on your ${userType} plan. Please wait for current tasks to complete.`,
      },
      429
    )
  }

  const allowedModelsConfig = PLAN_MODELS_CONFIG[planKey] || []
  const shortName = input.model.split("/").pop() || input.model
  const isSupported = allowedModelsConfig.some(m => m.name === shortName && m.supported)

  if (!isSupported) {
    return c.json(
      {
        error: `This model is not supported on your ${userType} plan. Please upgrade your subscription to unlock this model.`,
      },
      403
    )
  }

  const optionValidation = validateModelOptions(
    input.model,
    input as unknown as Record<string, string | number | boolean>
  )
  if (!optionValidation.valid) {
    return c.json(
      {
        error: `Invalid value for option '${optionValidation.invalidKey}': '${optionValidation.invalidValue}'`,
      },
      400
    )
  }

  // Pre-check credits balance
  const creditsPerImage = calculateRequiredCredits(input.model, input)
  if (!creditsPerImage) {
    return c.json({ error: `Unknown model: ${input.model}` }, 400)
  }
  const userCredits = await getUserCredits(c.env.DB, user.userId)
  if (userCredits.balance < creditsPerImage) {
    return c.json({ error: "Insufficient credits" }, 402)
  }

  // Setup session synchronously if it doesn't exist
  const now = Math.floor(Date.now() / 1000)
  let sessionId = input.sessionId

  if (!sessionId) {
    const title = input.prompt.slice(0, 100).trim() || "New Session"
    sessionId = uuidv4()
    await c.env.DB.prepare(
      `INSERT INTO sessions (id, user_id, title, is_pinned, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`
    )
      .bind(sessionId, user.userId, title, now, now)
      .run()
  } else {
    // Check if session exists
    const session = await c.env.DB.prepare(
      "SELECT * FROM sessions WHERE id = ? AND user_id = ? AND status = 1"
    )
      .bind(sessionId, user.userId)
      .first()
    if (!session) {
      return c.json({ error: "Session not found" }, 404)
    }
  }

  // Prepare reference images (if any)
  const referenceImageResult = await prepareReferenceImages(c, input, user)
  if (referenceImageResult.error) {
    return c.json({ error: referenceImageResult.error }, 400)
  }

  // Generate task ID and insert task as pending
  const taskId = uuidv4()
  const messageId = uuidv4()
  const requestedCount = getRequestedImageCount(input)
  input.num_images = requestedCount
  const toDbValue = (value: unknown) => (value === undefined ? null : value)
  const googleSearchVal = input.google_search === "true" || input.google_search === true ? 1 : 0
  const imageSearchVal = input.image_search === "true" || input.image_search === true ? 1 : 0

  const statements = [
    c.env.DB.prepare(
      `
        INSERT INTO messages (
          id, session_id, user_id, role, provider, model, prompt, aspect_ratio, resolution,
          google_search, image_search, image_size, quality, style, negative_prompt,
          output_format, num_images, image_url, created_at
        )
        VALUES (?, ?, ?, 'user', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
      `
    ).bind(
      messageId,
      sessionId,
      user.userId,
      input.provider || "pending",
      input.model,
      input.prompt,
      toDbValue(input.aspect_ratio),
      toDbValue(input.resolution),
      googleSearchVal,
      imageSearchVal,
      toDbValue(input.size),
      toDbValue(input.quality),
      toDbValue(input.style),
      toDbValue(input.negative_prompt),
      toDbValue(input.output_format),
      requestedCount,
      now
    ),
    c.env.DB.prepare(
      `
        INSERT INTO generation_tasks (
          id, user_id, session_id, message_id, model, status, requested_count,
          completed_count, failed_count, input, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, 'pending', ?, 0, 0, ?, ?, ?)
      `
    ).bind(
      taskId,
      user.userId,
      sessionId,
      messageId,
      input.model,
      requestedCount,
      JSON.stringify(input),
      now,
      now
    ),
    ...Array.from({ length: requestedCount }, (_, outputIndex) =>
      c.env.DB.prepare(
        `
          INSERT INTO message_outputs (
            id, message_id, output_index, status, content_type, created_at, updated_at
          )
          VALUES (?, ?, ?, 'pending', ?, ?, ?)
        `
      ).bind(uuidv4(), messageId, outputIndex, MIME_TYPES.IMAGE, now, now)
    ),
  ]

  await c.env.DB.batch(statements)

  // Run the background generation process
  c.executionCtx.waitUntil(
    runBackgroundGeneration(
      c,
      taskId,
      user.userId,
      sessionId,
      messageId,
      input,
      referenceImageResult.images || []
    )
  )

  return c.json({
    success: true,
    taskId,
    sessionId,
    messageId,
    requestedCount,
  })
}

export function buildEvoLinkPayload(
  evolinkModelName: string,
  input: GenerateInput,
  callbackUrl?: string,
  referenceImages: PreparedReferenceImage[] = []
): Record<string, any> {
  const payload: any = {
    model: evolinkModelName,
    prompt: input.prompt,
  }

  const nanoBananaModels = new Set([
    "gemini-3.1-flash-lite-image",
    "gemini-3.1-flash-image-preview",
    "gemini-3-pro-image-preview",
    "nano-banana-beta",
  ])

  if (!nanoBananaModels.has(evolinkModelName)) {
    payload.n = getRequestedImageCount(input)
  }

  if (callbackUrl) {
    payload.callback_url = callbackUrl
  }

  if (evolinkModelName === "gpt-image-1.5" || evolinkModelName === "gpt-image-2") {
    if (input.resolution) {
      payload.resolution = input.resolution
    }
    payload.size = input.size
    payload.quality = input.quality
  }

  if (evolinkModelName === "doubao-seedream-5.0-lite") {
    const format = input.output_format?.toLowerCase()
    const allowedFormats = ["png", "jpeg"]
    const outputFormat = allowedFormats.includes(format || "") ? format : "png"

    payload.model_params = {
      output_format: outputFormat,
    }
  }

  if (evolinkModelName === "doubao-seedream-5.0-pro") {
    const format = input.output_format?.toLowerCase()
    const outputFormat = format === "png" || format === "jpeg" ? format : "jpeg"

    payload.n = 1
    payload.size = input.aspect_ratio || "auto"
    payload.quality = input.resolution || "1K"
    payload.model_params = { output_format: outputFormat }
  }

  if (nanoBananaModels.has(evolinkModelName)) {
    payload.size = input.aspect_ratio || "auto"

    if (evolinkModelName !== "nano-banana-beta") {
      payload.quality =
        input.resolution || (evolinkModelName === "gemini-3.1-flash-lite-image" ? "1K" : "2K")
    }

    const modelParams: Record<string, unknown> = {}
    if (
      evolinkModelName === "gemini-3.1-flash-image-preview" ||
      evolinkModelName === "gemini-3-pro-image-preview"
    ) {
      modelParams.web_search = input.google_search === true || input.google_search === "true"
    }
    if (evolinkModelName === "gemini-3.1-flash-image-preview") {
      modelParams.image_search = input.image_search === true || input.image_search === "true"
    }
    if (
      evolinkModelName === "gemini-3.1-flash-lite-image" ||
      evolinkModelName === "gemini-3.1-flash-image-preview"
    ) {
      modelParams.thinking_level = input.thinking_level || "auto"
    }
    if (Object.keys(modelParams).length > 0) payload.model_params = modelParams
  }

  if (
    evolinkModelName === "doubao-seedream-5.0-lite" ||
    evolinkModelName === "doubao-seedream-5.0-pro" ||
    nanoBananaModels.has(evolinkModelName)
  ) {
    const imageUrls = referenceImages
      .map(image => image.url)
      .filter((url): url is string => Boolean(url))
    if (imageUrls.length > 0) payload.image_urls = imageUrls
  }

  return payload
}

async function generateViaEvoLink(
  c: AuthenticatedContext,
  dbTaskId: string,
  apiKey: string,
  input: GenerateInput,
  referenceImages: PreparedReferenceImage[] = []
): Promise<string> {
  const evolinkModelName = EVOLINK_MODEL_MAP[input.model]
  if (!evolinkModelName) {
    throw new Error(`Unknown model: ${input.model}`)
  }

  const payload = buildEvoLinkPayload(
    evolinkModelName,
    input,
    c.env.EVOLINK_CALLBACK_URL,
    referenceImages
  )
  console.log("[EvoLink] Calling with model", evolinkModelName, "payload", JSON.stringify(payload))

  const res = await fetch("https://api.evolink.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`EvoLink API returned HTTP ${res.status}: ${errText}`)
  }

  const json = (await res.json()) as any
  const taskId = json.id
  if (!taskId) {
    throw new Error("EvoLink response did not contain a task ID")
  }

  // Record the provider task ID in the database immediately
  await c.env.DB.prepare(
    "UPDATE generation_tasks SET provider_task_id = ?, updated_at = ? WHERE id = ?"
  )
    .bind(taskId, Math.floor(Date.now() / 1000), dbTaskId)
    .run()

  console.log(`EvoLink task created: ${taskId}. Task submitted successfully.`)
  return taskId
}

async function generateViaBytePlus(apiKey: string, input: GenerateInput): Promise<string[]> {
  const byteplusModelName = BYTEPLUS_MODEL_MAP[input.model]
  if (!byteplusModelName) {
    throw new Error(`BytePlus fallback does not support model: ${input.model}`)
  }
  console.log("Calling BytePlus Ark API (Backup) with model", byteplusModelName)

  const payload: any = {
    model: byteplusModelName,
    prompt: input.prompt,
    response_format: "url",
    size: input.resolution,
    stream: false,
    watermark: false,
  }

  if (byteplusModelName === "seedream-5-0-260128") {
    const format = input.output_format?.toLowerCase()
    const allowedFormats = ["png", "jpeg"]
    const outputFormat = allowedFormats.includes(format || "") ? format : "png"

    payload.output_format = outputFormat
    payload.max_images = getRequestedImageCount(input)
    payload.sequential_image_generation = "auto"
  }
  console.log("BytePlus Ark API request payload", JSON.stringify(payload))

  const res = await fetch("https://ark.ap-southeast.bytepluses.com/api/v3/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`BytePlus API error (${res.status}): ${errorText}`)
  }

  const json = (await res.json()) as any
  console.log("BytePlus Ark API response", JSON.stringify(json))

  const imageUrls = Array.isArray(json.data)
    ? json.data
        .map((item: { url?: unknown }) => item?.url)
        .filter((url: unknown): url is string => typeof url === "string" && url.length > 0)
    : []
  if (imageUrls.length === 0) {
    throw new Error("No image URL returned from BytePlus API")
  }
  return imageUrls
}

async function generateBytedanceImage(
  c: AuthenticatedContext,
  dbTaskId: string,
  input: GenerateInput,
  referenceImages: PreparedReferenceImage[] = []
): Promise<{ imageUrls: string[]; provider: string }> {
  let lastError: any = null

  // 1. Try EvoLink (Primary)
  const evolinkKey = c.env.EVOLINK_API_KEY
  if (evolinkKey) {
    try {
      const providerTaskId = await generateViaEvoLink(
        c,
        dbTaskId,
        evolinkKey,
        input,
        referenceImages
      )
      return { imageUrls: [providerTaskId], provider: PROVIDERS.EVOLINK }
    } catch (err: any) {
      console.error("EvoLink primary channel failed:", err.message)
      lastError = err
    }
  } else {
    console.log("EVOLINK_API_KEY not configured, skipping primary channel")
  }

  // 2. Try BytePlus (Backup)
  const arkKey = c.env.ARK_API_KEY
  if (!arkKey) {
    throw new Error(
      `Primary EvoLink failed: ${lastError?.message || "Not configured"}. Backup BytePlus could not be tried because ARK_API_KEY is not configured.`
    )
  }

  try {
    const imageUrls = await generateViaBytePlus(arkKey, input)
    return { imageUrls, provider: PROVIDERS.BYTEPLUS }
  } catch (err: any) {
    throw new Error(
      `BytePlus backup failed: ${err.message}. (Previous EvoLink error: ${lastError?.message || "none"})`
    )
  }
}

async function markGenerationTaskFailed(
  db: D1Database,
  taskId: string,
  messageId: string | null,
  errorMessage: string,
  now = getCurrentTimestamp()
) {
  const statements = [
    db
      .prepare(
        `
        UPDATE generation_tasks
        SET status = 'failed', error = ?, failed_count = requested_count - completed_count, updated_at = ?
        WHERE id = ?
      `
      )
      .bind(errorMessage, now, taskId),
  ]

  if (messageId) {
    statements.push(
      db
        .prepare(
          `
          UPDATE message_outputs
          SET status = 'failed', error = ?, updated_at = ?
          WHERE message_id = ? AND status = 'pending'
        `
        )
        .bind(errorMessage, now, messageId)
    )
  }

  await db.batch(statements)
}

async function completeGenerationTask(
  env: Env,
  taskId: string,
  userId: string,
  sessionId: string,
  messageId: string,
  input: GenerateInput,
  imageUrls: string[],
  finalProvider: string,
  mimeType: MimeType
) {
  const db = env.DB
  const now = Math.floor(Date.now() / 1000)
  const requestedCount = getRequestedImageCount(input)
  const normalizedImageUrls = imageUrls
    .filter((url): url is string => typeof url === "string" && url.length > 0)
    .slice(0, requestedCount)

  const outputRows = await db
    .prepare(
      "SELECT id, output_index FROM message_outputs WHERE message_id = ? AND status != 'deleted' ORDER BY output_index ASC"
    )
    .bind(messageId)
    .all<{ id: string; output_index: number }>()

  const outputsByIndex = new Map(
    (outputRows.results || []).map(output => [output.output_index, output])
  )
  const completedOutputs: Array<{
    id: string
    index: number
    key: string
    url: string
  }> = []
  let failedCount = 0

  for (let outputIndex = 0; outputIndex < requestedCount; outputIndex++) {
    const output = outputsByIndex.get(outputIndex)
    if (!output) continue

    const originUrl = normalizedImageUrls[outputIndex]
    if (!originUrl) {
      failedCount++
      await db
        .prepare(
          "UPDATE message_outputs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?"
        )
        .bind("The provider did not return this image", now, output.id)
        .run()
      continue
    }

    try {
      const imageResponse = await fetch(originUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const extension = getGeneratedMediaExtension(originUrl, input.output_format, mimeType)
      const key = createGeneratedImageKey(userId, extension)
      const contentType =
        normalizeContentType(imageResponse.headers.get("content-type") || "") ||
        getImageContentTypeFromKey(key) ||
        DEFAULT_MEDIA_CONTENT_TYPE[mimeType]

      await env.R2.put(key, imageBuffer, {
        httpMetadata: { contentType },
      })

      const fullImageUrl = await createPresignedGetUrl(env, key)
      if (!fullImageUrl) {
        throw new Error("Failed to generate pre-signed URL")
      }

      await db
        .prepare(
          `
            UPDATE message_outputs
            SET status = 'completed', image_url = ?, content_type = ?, file_size = ?, error = NULL, updated_at = ?
            WHERE id = ?
          `
        )
        .bind(key, mimeType, imageBuffer.byteLength, now, output.id)
        .run()

      completedOutputs.push({ id: output.id, index: outputIndex, key, url: fullImageUrl })
    } catch (error) {
      failedCount++
      const errorMessage = error instanceof Error ? error.message : String(error)
      await db
        .prepare(
          "UPDATE message_outputs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?"
        )
        .bind(errorMessage, now, output.id)
        .run()
    }
  }

  if (completedOutputs.length === 0) {
    throw new Error("No generated images could be saved")
  }

  const chargedInput: GenerateInput = { ...input, num_images: completedOutputs.length }
  const requiredCredits = calculateRequiredCredits(input.model, chargedInput)
  const deductResult = await deductCredits(db, userId, input.model, requiredCredits)
  if (!deductResult.success) {
    throw new Error(deductResult.error || "Failed to deduct credits")
  }

  // Update Session title (if it was "New Session" or "New Chat" or "新对话")
  const session = await db
    .prepare("SELECT title FROM sessions WHERE id = ? AND user_id = ? AND status = 1")
    .bind(sessionId, userId)
    .first()

  if (session) {
    const sessionTitle = (session as { title: string }).title
    if (
      sessionTitle === "New Session" ||
      sessionTitle === "New Chat" ||
      sessionTitle === "新对话" ||
      sessionTitle === "新会话"
    ) {
      const title = input.prompt.slice(0, 100).trim() || "New Session"
      await db
        .prepare("UPDATE sessions SET title = ?, updated_at = ? WHERE id = ? AND status = 1")
        .bind(title, now, sessionId)
        .run()
    }
  }

  await db
    .prepare(
      `
        UPDATE messages
        SET provider = ?, image_url = ?
        WHERE id = ? AND user_id = ?
      `
    )
    .bind(finalProvider, completedOutputs[0].key, messageId, userId)
    .run()

  // Update session updated_at
  await db
    .prepare("UPDATE sessions SET updated_at = ? WHERE id = ? AND status = 1")
    .bind(now, sessionId)
    .run()

  // Save task status to completed
  const taskResult = JSON.stringify({
    success: true,
    sessionId,
    messageId,
    outputs: completedOutputs,
  })

  await db
    .prepare(
      `
        UPDATE generation_tasks
        SET status = 'completed', result = ?, provider = ?, completed_count = ?, failed_count = ?, updated_at = ?
        WHERE id = ?
      `
    )
    .bind(taskResult, finalProvider, completedOutputs.length, failedCount, now, taskId)
    .run()
}

async function runBackgroundGeneration(
  c: AuthenticatedContext,
  taskId: string,
  userId: string,
  sessionId: string,
  messageId: string,
  input: GenerateInput,
  referenceImages: PreparedReferenceImage[]
) {
  const db = c.env.DB
  const now = Math.floor(Date.now() / 1000)

  try {
    // 1. Update task to processing
    await db
      .prepare("UPDATE generation_tasks SET status = 'processing', updated_at = ? WHERE id = ?")
      .bind(now, taskId)
      .run()

    const aiInput = buildAiInput(input, referenceImages)
    console.log("aiInput model in bg", input.model, JSON.stringify(aiInput))

    const isBytedance = input.model.startsWith("bytedance/")
    const isEvoLinkModel = Boolean(EVOLINK_MODEL_MAP[input.model])
    let result: any
    let finalProvider: string = PROVIDERS.CLOUDFLARE

    if (isBytedance) {
      const resData = await generateBytedanceImage(c, taskId, input, referenceImages)
      finalProvider = resData.provider
      result = {
        state: "Completed",
        result: {
          images: resData.imageUrls,
        },
      }
    } else if (isEvoLinkModel) {
      const evolinkKey = c.env.EVOLINK_API_KEY
      if (!evolinkKey) {
        throw new Error("EVOLINK_API_KEY is not configured for this image model.")
      }
      try {
        const providerTaskId = await generateViaEvoLink(
          c,
          taskId,
          evolinkKey,
          input,
          referenceImages
        )
        finalProvider = PROVIDERS.EVOLINK
        result = {
          state: "Completed",
          result: {
            image: providerTaskId,
          },
        }
      } catch (err: any) {
        throw new Error(`EvoLink image generation failed: ${err.message}`)
      }
    } else {
      // Call Cloudflare AI
      result = (await c.env.AI.run(input.model as any, aiInput, {
        gateway: { id: "image-ai-gateway" },
      })) as any
    }
    input.provider = finalProvider

    console.log("bg generate result", JSON.stringify(result))

    // Early exit for EvoLink tasks (handled via webhook callback)
    if (finalProvider === PROVIDERS.EVOLINK) {
      await db
        .prepare("UPDATE generation_tasks SET provider = ?, updated_at = ? WHERE id = ?")
        .bind(finalProvider, now, taskId)
        .run()
      console.log(
        `[Background] EvoLink task submitted successfully. Exiting, waiting for callback...`
      )
      return
    }

    if (result.state !== "Completed") {
      throw new Error("AI generation failed or not completed")
    }

    const resultPayload = result.result as any
    const imageUrls = Array.isArray(resultPayload?.images)
      ? resultPayload.images
      : resultPayload?.image
        ? [resultPayload.image]
        : []
    if (imageUrls.length === 0) {
      throw new Error("no image returned from AI")
    }

    await completeGenerationTask(
      c.env,
      taskId,
      userId,
      sessionId,
      messageId,
      input,
      imageUrls,
      finalProvider,
      MIME_TYPES.IMAGE
    )
  } catch (error: any) {
    console.error("Background generation task error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Save task status to failed
    await markGenerationTaskFailed(db, taskId, messageId, errorMessage, now)
  }
}

export async function handleEvoLinkCallback(c: Context<{ Bindings: Env }>) {
  const db = c.env.DB
  let payload: any
  try {
    payload = await c.req.json()
  } catch (err) {
    return c.json({ error: "Invalid JSON body" }, 400)
  }

  console.log("[EvoLink Callback] Received payload:", JSON.stringify(payload))

  const mimeType = getEvoLinkTaskMimeType(payload.object)
  if (!mimeType) {
    const supportedObjects = Object.values(EVOLINK_TASK_OBJECTS).join(", ")
    console.log(`[EvoLink Callback] Ignored unsupported task type: ${payload.object}`)
    return c.json({
      success: true,
      message: `Ignored unsupported task type: ${payload.object}. Supported types: ${supportedObjects}`,
    })
  }

  const providerTaskId = payload.id
  if (!providerTaskId) {
    return c.json({ error: "Missing task ID (id)" }, 400)
  }

  // 1. Query the task from generation_tasks by provider_task_id
  const task = await db
    .prepare("SELECT * FROM generation_tasks WHERE provider_task_id = ?")
    .bind(providerTaskId)
    .first()

  if (!task) {
    console.warn(`[EvoLink Callback] No task found in DB for provider_task_id: ${providerTaskId}`)
    return c.json({ error: "Task not found" }, 404)
  }

  const {
    id: taskId,
    user_id: userId,
    session_id: sessionId,
    message_id: messageId,
    model,
    status: dbStatus,
    input: inputStr,
  } = task as {
    id: string
    user_id: string
    session_id: string
    message_id: string | null
    model: string
    status: string
    input: string | null
  }

  if (dbStatus === "completed" || dbStatus === "failed") {
    return c.json({ success: true, message: "Task already processed" })
  }

  const now = Math.floor(Date.now() / 1000)

  if (payload.status === "failed") {
    const errorMsg = payload.error?.message || "EvoLink task failed"
    await markGenerationTaskFailed(db, taskId, messageId, errorMsg, now)

    return c.json({ success: true })
  }

  if (payload.status === "completed") {
    const imageUrls = Array.isArray(payload.results)
      ? payload.results.filter((url: unknown): url is string => typeof url === "string")
      : []
    if (imageUrls.length === 0) {
      const errorMsg = "EvoLink task completed but results array is empty"
      await markGenerationTaskFailed(db, taskId, messageId, errorMsg, now)
      return c.json({ error: errorMsg }, 400)
    }

    if (!inputStr || !messageId) {
      const errorMsg = "Missing task input or message reference in database"
      await markGenerationTaskFailed(db, taskId, messageId, errorMsg, now)
      return c.json({ error: errorMsg }, 500)
    }

    try {
      const input = JSON.parse(inputStr) as GenerateInput
      await completeGenerationTask(
        c.env,
        taskId,
        userId,
        sessionId,
        messageId,
        input,
        imageUrls,
        PROVIDERS.EVOLINK,
        mimeType
      )
      return c.json({ success: true })
    } catch (err: any) {
      console.error("[EvoLink Callback] Failed to complete task:", err)
      const errMsg = err instanceof Error ? err.message : String(err)
      await markGenerationTaskFailed(db, taskId, messageId, errMsg, now)
      return c.json({ error: errMsg }, 500)
    }
  }

  return c.json({ error: `Unhandled task status: ${payload.status}` }, 400)
}

export async function handleGetTaskStatus(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const taskId = c.req.param("id")
  if (!taskId) {
    return c.json({ error: "Task ID is required" }, 400)
  }

  const task = await c.env.DB.prepare("SELECT * FROM generation_tasks WHERE id = ? AND user_id = ?")
    .bind(taskId, user.userId)
    .first()

  if (!task) {
    return c.json({ error: "Task not found" }, 404)
  }

  const taskRecord = task as {
    message_id: string | null
    status: string
    result: string | null
    error: string | null
    created_at: number
  }

  const parsedResult = taskRecord.result ? JSON.parse(taskRecord.result) : null
  const outputRows = taskRecord.message_id
    ? await c.env.DB.prepare(
        `
            SELECT id, message_id, output_index, status, image_url, content_type, width, height,
              file_size, error, created_at, updated_at
            FROM message_outputs
            WHERE message_id = ? AND status != 'deleted'
            ORDER BY output_index ASC
          `
      )
        .bind(taskRecord.message_id)
        .all<{
          id: string
          message_id: string
          output_index: number
          status: string
          image_url: string | null
          content_type: MimeType
          width: number | null
          height: number | null
          file_size: number | null
          error: string | null
          created_at: number
          updated_at: number
        }>()
    : { results: [] }

  const outputs = await Promise.all(
    (outputRows.results || []).map(async output => ({
      ...output,
      url: await toPublicImageUrl(c.env, output.image_url),
    }))
  )

  return c.json({
    success: true,
    status: taskRecord.status,
    result: parsedResult,
    outputs,
    error: taskRecord.error,
  })
}

export function getModels(): ModelConfig[] {
  return getEnabledModels()
}

export async function handleEvoLinkTaskCheck(env: Env) {
  const db = env.DB
  const now = Math.floor(Date.now() / 1000)
  const tenMinutesAgo = now - 600

  // Query pending or processing tasks with a provider_task_id created > 10 minutes ago
  const tasksResult = await db
    .prepare(
      "SELECT id, user_id, session_id, message_id, provider_task_id, input FROM generation_tasks WHERE status IN ('pending', 'processing') AND provider_task_id IS NOT NULL AND created_at <= ?"
    )
    .bind(tenMinutesAgo)
    .all<{
      id: string
      user_id: string
      session_id: string
      message_id: string | null
      provider_task_id: string
      input: string | null
    }>()

  const tasks = tasksResult.results || []
  if (tasks.length === 0) {
    return { checked: 0, completed: 0, failed: 0 }
  }

  console.log(`[EvoLink Cron] Found ${tasks.length} stuck tasks to check`)
  let completedCount = 0
  let failedCount = 0

  for (const task of tasks) {
    const providerTaskId = task.provider_task_id
    const taskId = task.id
    const userId = task.user_id
    const sessionId = task.session_id
    const messageId = task.message_id
    const inputStr = task.input

    if (!inputStr) {
      console.warn(`[EvoLink Cron] Stuck task ${taskId} has no input payload`)
      continue
    }

    try {
      const res = await fetch(`https://api.evolink.ai/v1/tasks/${providerTaskId}`, {
        headers: {
          Authorization: `Bearer ${env.EVOLINK_API_KEY}`,
        },
      })

      if (!res.ok) {
        console.error(
          `[EvoLink Cron] Failed to fetch task status for ${providerTaskId}: HTTP ${res.status}`
        )
        continue
      }

      const payload = (await res.json()) as any
      console.log(`[EvoLink Cron] Task ${providerTaskId} status is ${payload.status}`)

      if (payload.status === "completed") {
        const mimeType = getEvoLinkTaskMimeType(payload.object) ?? MIME_TYPES.IMAGE
        const imageUrls = Array.isArray(payload.results)
          ? payload.results.filter((url: unknown): url is string => typeof url === "string")
          : []
        if (imageUrls.length > 0 && messageId) {
          const input = JSON.parse(inputStr) as GenerateInput
          await completeGenerationTask(
            env,
            taskId,
            userId,
            sessionId,
            messageId,
            input,
            imageUrls,
            PROVIDERS.EVOLINK,
            mimeType
          )
          completedCount++
          console.log(`[EvoLink Cron] Stuck task ${taskId} successfully resolved as completed`)
        } else {
          console.error(
            `[EvoLink Cron] Stuck task ${providerTaskId} completed but results array is empty`
          )
        }
      } else if (payload.status === "failed") {
        const errorMsg = payload.error?.message || "EvoLink task failed"
        await markGenerationTaskFailed(db, taskId, messageId, errorMsg)
        failedCount++
        console.log(`[EvoLink Cron] Stuck task ${taskId} marked as failed: ${errorMsg}`)
      }
    } catch (err) {
      console.error(`[EvoLink Cron] Failed checking stuck task ${providerTaskId}:`, err)
    }
  }

  return { checked: tasks.length, completed: completedCount, failed: failedCount }
}
