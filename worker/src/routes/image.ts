import type { Context } from "hono"
import { v4 as uuidv4 } from "uuid"
import {
  IMAGE_MODEL_IDS,
  type Env,
  type IMAGE_MODEL_ID,
  type ModelConfig,
  type UserPayload,
  ReferenceImageFormat,
  type PreparedReferenceImage,
  MODEL_CREDITS,
  PLAN_MODELS_CONFIG,
} from "../types"
import { deductCredits } from "./credits"
import { MODEL_OPTIONS_CONFIG, validateModelOptions } from "../modelOptions"
import {
  arrayBufferToDataUrl,
  createGeneratedImageKey,
  getGeneratedImagePrefix,
  getImageContentTypeFromKey,
  getR2PublicUrl,
  getReferenceImagePrefix,
  isAllowedReferenceImageContentType,
  normalizeContentType,
} from "../utils"
import { REFERENCE_IMAGE_MAX_BYTES } from "../const"

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
  background?: string
  reference_images?: string[]
}

type AuthenticatedContext = Context<{
  Bindings: Env
  Variables: { user: UserPayload | null }
}>

interface ImageRecord {
  id: string
  session_id: string
  image_url: string
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

function getBoundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(Math.trunc(parsed), min), max)
}

function getRequestedFavorite(body: FavoriteRequestBody) {
  return body.favorited ?? body.favorite ?? body.is_favorite
}

function toPublicImageUrl(env: Env, imageUrl: string | null) {
  if (!imageUrl) return null
  return getR2PublicUrl(env, imageUrl) ?? null
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

    case "openai/gpt-image-1.5": {
      aiInput = { prompt }
      if (size) aiInput.size = size
      if (quality) aiInput.quality = quality
      if (style) aiInput.style = style
      break
    }

    case "openai/gpt-image-2": {
      aiInput = { prompt }
      if (size) aiInput.size = size
      if (quality) aiInput.quality = quality
      if (style) aiInput.style = style
      if (background) aiInput.background = background
      if (output_format) aiInput.output_format = output_format
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
    case "google/nano-banana-2":
    case "bytedance/seedream-5-lite":
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
  return c.env.DB.prepare(
    `
      SELECT m.id, m.session_id, m.image_url
      FROM messages m
      INNER JOIN sessions s ON s.id = m.session_id
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

    const url = getR2PublicUrl(c.env, key)
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
        m.id,
        m.session_id,
        s.title AS session_title,
        m.role,
        m.provider,
        m.model,
        m.prompt,
        m.image_url,
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
      INNER JOIN sessions s ON s.id = m.session_id
      WHERE f.user_id = ? AND f.content_type = 'image' AND s.user_id = ? AND m.status = 1 AND m.image_url IS NOT NULL
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
      INNER JOIN sessions s ON s.id = m.session_id
      WHERE f.user_id = ? AND f.content_type = 'image' AND s.user_id = ? AND m.status = 1 AND m.image_url IS NOT NULL
    `
  )
    .bind(user.userId, user.userId)
    .first<{ total: number }>()

  const results = (favorites.results as unknown as FavoriteImageRecord[]).map(favorite => ({
    ...favorite,
    url: toPublicImageUrl(c.env, favorite.image_url),
  }))

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
    await c.env.DB.prepare(
      `
        INSERT OR IGNORE INTO content_favorites (id, user_id, content_type, message_id, created_at)
        VALUES (?, ?, 'image', ?, ?)
      `
    )
      .bind(uuidv4(), user.userId, image.id, getCurrentTimestamp())
      .run()
  } else {
    await c.env.DB.prepare(
      "DELETE FROM content_favorites WHERE user_id = ? AND content_type = 'image' AND message_id = ?"
    )
      .bind(user.userId, image.id)
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
  await c.env.DB.batch([
    c.env.DB.prepare(
      "DELETE FROM content_favorites WHERE user_id = ? AND content_type = 'image' AND message_id = ?"
    ).bind(user.userId, image.id),
    c.env.DB.prepare("UPDATE messages SET status = 2 WHERE id = ?").bind(image.id),
    c.env.DB.prepare("UPDATE sessions SET updated_at = ? WHERE id = ? AND user_id = ?").bind(
      now,
      image.session_id,
      user.userId
    ),
  ])

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

  if (!input.model || !IMAGE_MODEL_IDS.includes(input.model as IMAGE_MODEL_ID)) {
    return c.json({ error: `model must be one of: ${IMAGE_MODEL_IDS.join(", ")}` }, 400)
  }

  // Validate model permissions based on user's subscription plan
  const userType = user.userType || "free"
  let planKey: "starter" | "professional" | "creator" = "starter"
  if (userType === "professional") {
    planKey = "professional"
  } else if (userType === "creator" || userType === "enterprise") {
    planKey = "creator"
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

  const referenceImageResult = await prepareReferenceImages(c, input, user)
  if (referenceImageResult.error) {
    return c.json({ error: referenceImageResult.error }, 400)
  }

  const aiInput = buildAiInput(input, referenceImageResult.images)
  console.log("aiInput model", input.model, JSON.stringify(input), JSON.stringify(aiInput))
  // TODO: 测试先注释，使用写死的url
  // const result = await c.env.AI.run(input.model, aiInput, {
  //   gateway: { id: "image-ai-gateway" },
  // })

  // if (result.state !== "Completed") {
  //   return c.json({ error: "AI generation failed" }, 500)
  // }

  // const imageUrl = result.result.image || result.result.images?.[0]
  // if (!imageUrl) {
  //   return c.json({ error: "no image returned from AI" }, 500)
  // }
  const imageUrl =
    "https://pub-04a6d208d361438ea01b797e6973bd19.r2.dev/catalog/openai__gpt-image-2/simple-generation.png"

  const deductResult = await deductCredits(c.env.DB, user.userId, 0, input.model)
  if (!deductResult.success) {
    return c.json({ error: deductResult.error }, 402)
  }

  const imageResponse = await fetch(imageUrl)
  const imageBuffer = await imageResponse.arrayBuffer()

  const extension = imageUrl.split(".").pop()?.toLowerCase() || input.output_format || "png"
  const key = createGeneratedImageKey(user.userId, extension)
  const fullImageUrl = getR2PublicUrl(c.env, key)
  if (!fullImageUrl) {
    return c.json({ success: false, error: "R2_PUBLIC_BASE_URL is required" }, 500)
  }
  await c.env.R2.put(key, imageBuffer, {
    httpMetadata: { contentType: getImageContentTypeFromKey(key) || "image/png" },
  })

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
  }

  const session = await c.env.DB.prepare("SELECT * FROM sessions WHERE id = ? AND user_id = ?")
    .bind(sessionId, user.userId)
    .first()

  if (session) {
    const sessionTitle = (session as { title: string }).title
    if (sessionTitle === "New Session") {
      const title = input.prompt.slice(0, 100).trim() || "New Session"
      await c.env.DB.prepare("UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?")
        .bind(title, now, sessionId)
        .run()
    }

    const messageId = uuidv4()
    const toDbValue = (v: unknown) => (v === undefined ? null : v)
    const googleSearchVal = input.google_search === "true" || input.google_search === true ? 1 : 0
    const imageSearchVal = input.image_search === "true" || input.image_search === true ? 1 : 0
    await c.env.DB.prepare(
      `
        INSERT INTO messages (id, session_id, user_id, role, provider, model, prompt, aspect_ratio, resolution, google_search, image_search, image_size, quality, style, negative_prompt, output_format, num_images, image_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        messageId,
        sessionId,
        user.userId,
        "user",
        input.provider || null,
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
        toDbValue(input.num_images),
        key,
        now
      )
      .run()

    await c.env.DB.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?")
      .bind(now, sessionId)
      .run()

    return c.json({ success: true, key, url: fullImageUrl, imageUrl: fullImageUrl })
  }

  return c.json({ success: false, error: "Session not found" }, 500)
}

export function getModels(): ModelConfig[] {
  const list = [
    {
      id: "bytedance/seedream-4.0",
      name: "Seedream 4.0",
      provider: "ByteDance",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
      supportsImage: false,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["bytedance/seedream-4.0"],
    },
    {
      id: "google/nano-banana",
      name: "Nano Banana",
      provider: "Google",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg",
      supportsImage: false,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["google/nano-banana"],
    },
    {
      id: "openai/gpt-image-1.5",
      name: "GPT Image 1.5",
      provider: "OpenAI",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg",
      supportsImage: true,
      referenceImageCount: 1,
      referenceImageFormat: ReferenceImageFormat.BASE64,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["openai/gpt-image-1.5"],
    },
    {
      id: "bytedance/seedream-4.5",
      name: "Seedream 4.5",
      provider: "ByteDance",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
      supportsImage: false,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["bytedance/seedream-4.5"],
    },
    {
      id: "google/nano-banana-pro",
      name: "Nano Banana Pro",
      provider: "Google",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg",
      supportsImage: false,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["google/nano-banana-pro"],
    },
    {
      id: "xai/grok-imagine-image",
      name: "Grok Imagine",
      provider: "xAI",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/xai.svg",
      supportsImage: false,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["xai/grok-imagine-image"],
    },
    {
      id: "recraft/recraftv4",
      name: "Recraft V4",
      provider: "Recraft",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/recraft.svg",
      supportsImage: false,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["recraft/recraftv4"],
    },
    {
      id: "alibaba/wan-2.6-image",
      name: "WAN 2.6",
      provider: "Alibaba",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/alibaba.svg",
      supportsImage: false,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["alibaba/wan-2.6-image"],
    },
    {
      id: "google/nano-banana-2",
      name: "Nano Banana 2",
      provider: "Google",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg",
      supportsImage: true,
      referenceImageCount: 3,
      referenceImageFormat: ReferenceImageFormat.URL,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["google/nano-banana-2"],
    },
    {
      id: "bytedance/seedream-5-lite",
      name: "Seedream 5 Lite",
      provider: "ByteDance",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
      supportsImage: true,
      referenceImageCount: 14,
      referenceImageFormat: ReferenceImageFormat.URL,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["bytedance/seedream-5-lite"],
    },
    {
      id: "google/imagen-4",
      name: "Imagen 4",
      provider: "Google",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg",
      supportsImage: false,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["google/imagen-4"],
    },
    {
      id: "openai/gpt-image-2",
      name: "GPT Image 2",
      provider: "OpenAI",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg",
      supportsImage: true,
      referenceImageCount: 16,
      referenceImageFormat: ReferenceImageFormat.BASE64,
      isNew: true,
      options: MODEL_OPTIONS_CONFIG["openai/gpt-image-2"],
    },
    {
      id: "xai/grok-imagine-image-quality",
      name: "Grok Imagine Quality",
      provider: "xAI",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/xai.svg",
      supportsImage: false,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["xai/grok-imagine-image-quality"],
    },
    {
      id: "recraft/recraftv4-pro",
      name: "Recraft V4 Pro",
      provider: "Recraft",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/recraft.svg",
      supportsImage: false,
      isNew: true,
      options: MODEL_OPTIONS_CONFIG["recraft/recraftv4-pro"],
    },
  ]

  return list.map(model => ({
    ...model,
    credits: MODEL_CREDITS[model.id] || 0,
  }))
}
