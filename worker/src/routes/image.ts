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
import { deductCredits, getUserCredits } from "./credits"
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
import { REFERENCE_IMAGE_MAX_BYTES, PROVIDERS } from "../const"
const BYTEPLUS_MODEL_MAP: Record<string, string> = {
  "bytedance/seedream-4.0": "seedream-4-0-250828",
  "bytedance/seedream-4.5": "seedream-4-5-251128",
  "bytedance/seedream-5-lite": "seedream-5-0-260128",
}

const EVOLINK_MODEL_MAP: Record<string, string> = {
  "bytedance/seedream-4.0": "doubao-seedream-4.0",
  "bytedance/seedream-4.5": "doubao-seedream-4.5",
  "bytedance/seedream-5-lite": "doubao-seedream-5.0-lite",
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
      INNER JOIN sessions s ON s.id = m.session_id AND s.status = 1
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
      INNER JOIN sessions s ON s.id = m.session_id AND s.status = 1
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
    c.env.DB.prepare(
      "UPDATE sessions SET updated_at = ? WHERE id = ? AND user_id = ? AND status = 1"
    ).bind(now, image.session_id, user.userId),
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

  // Pre-check credits balance
  const creditsPerImage = MODEL_CREDITS[input.model]
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
  await c.env.DB.prepare(
    `INSERT INTO generation_tasks (id, user_id, session_id, model, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, ?)`
  )
    .bind(taskId, user.userId, sessionId, input.model, now, now)
    .run()

  // Run the background generation process
  c.executionCtx.waitUntil(
    runBackgroundGeneration(
      c,
      taskId,
      user.userId,
      sessionId,
      input,
      referenceImageResult.images || []
    )
  )

  return c.json({
    success: true,
    taskId,
    sessionId,
  })
}

async function generateViaEvoLink(
  c: AuthenticatedContext,
  dbTaskId: string,
  apiKey: string,
  input: GenerateInput
): Promise<string> {
  const evolinkModelName = EVOLINK_MODEL_MAP[input.model] || "doubao-seedream-4.0"
  console.log("Calling EvoLink (Primary) for model", evolinkModelName)

  const payload: any = {
    model: evolinkModelName,
    prompt: input.prompt,
    size: input.aspect_ratio,
    quality: input.resolution,
    n: 1,
  }

  if (evolinkModelName === "doubao-seedream-5.0-lite") {
    const format = input.output_format?.toLowerCase()
    const allowedFormats = ["png", "jpeg"]
    const outputFormat = allowedFormats.includes(format || "") ? format : "png"

    const modelParams: any = {
      output_format: outputFormat,
    }

    payload.model_params = modelParams
  }

  console.log("generateViaEvoLink payload", JSON.stringify(payload))

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

  console.log(`EvoLink task created: ${taskId}. Starting status polling...`)

  let status = "pending"
  let attempts = 0
  const maxAttempts = 20 // 40 seconds max

  while (status !== "completed" && status !== "failed" && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++

    console.log(`Polling EvoLink task ${taskId}, attempt ${attempts}...`)
    const statusRes = await fetch(`https://api.evolink.ai/v1/tasks/${taskId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!statusRes.ok) {
      if (statusRes.status === 400) {
        const errJson = (await statusRes.json()) as any
        throw new Error(
          `EvoLink task invalid (400): ${errJson.error?.message || "Invalid task ID"}`
        )
      }
      const errTxt = await statusRes.text()
      console.warn(`EvoLink task polling warning (HTTP ${statusRes.status}): ${errTxt}`)
      continue
    }

    const statusJson = (await statusRes.json()) as any
    status = statusJson.status
    console.log(`EvoLink task ${taskId} status: ${status}`)

    if (status === "completed") {
      const imageUrl = statusJson.results?.[0]
      if (!imageUrl) {
        throw new Error("EvoLink task completed but results array is empty")
      }
      return imageUrl
    }

    if (status === "failed") {
      throw new Error(`EvoLink task failed: ${statusJson.error?.message || "unknown task failure"}`)
    }
  }

  throw new Error("EvoLink task polling timed out")
}

async function generateViaBytePlus(apiKey: string, input: GenerateInput): Promise<string> {
  const byteplusModelName = BYTEPLUS_MODEL_MAP[input.model] || "seedream-4-0-250828"
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

  const imageUrl = json.data?.[0]?.url
  if (!imageUrl) {
    throw new Error("No image URL returned from BytePlus API")
  }
  return imageUrl
}

async function generateBytedanceImage(
  c: AuthenticatedContext,
  dbTaskId: string,
  input: GenerateInput
): Promise<{ imageUrl: string; provider: string }> {
  let lastError: any = null

  // 1. Try EvoLink (Primary)
  const evolinkKey = c.env.EVOLINK_API_KEY
  if (evolinkKey) {
    try {
      const imageUrl = await generateViaEvoLink(c, dbTaskId, evolinkKey, input)
      return { imageUrl, provider: PROVIDERS.EVOLINK }
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
    const imageUrl = await generateViaBytePlus(arkKey, input)
    return { imageUrl, provider: PROVIDERS.BYTEPLUS }
  } catch (err: any) {
    throw new Error(
      `BytePlus backup failed: ${err.message}. (Previous EvoLink error: ${lastError?.message || "none"})`
    )
  }
}

async function runBackgroundGeneration(
  c: AuthenticatedContext,
  taskId: string,
  userId: string,
  sessionId: string,
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
    let result: any
    let finalProvider: string = PROVIDERS.CLOUDFLARE

    if (isBytedance) {
      const resData = await generateBytedanceImage(c, taskId, input)
      finalProvider = resData.provider
      result = {
        state: "Completed",
        result: {
          image: resData.imageUrl,
        },
      }
    } else {
      // Call Cloudflare AI
      result = (await c.env.AI.run(input.model as any, aiInput, {
        gateway: { id: "image-ai-gateway" },
      })) as any
    }
    input.provider = finalProvider

    console.log("bg generate result", JSON.stringify(result))

    if (result.state !== "Completed") {
      throw new Error("AI generation failed or not completed")
    }

    const imageUrl = (result.result as any).image || (result.result as any).images?.[0]
    if (!imageUrl) {
      throw new Error("no image returned from AI")
    }

    // Deduct credits
    const deductResult = await deductCredits(db, userId, input.model)
    if (!deductResult.success) {
      throw new Error(deductResult.error || "Failed to deduct credits")
    }

    // Download the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`)
    }
    const imageBuffer = await imageResponse.arrayBuffer()

    // Upload to R2
    const extension =
      imageUrl.split("?")[0].split(".").pop()?.toLowerCase() || input.output_format || "png"
    const key = createGeneratedImageKey(userId, extension)
    const fullImageUrl = getR2PublicUrl(c.env, key)
    if (!fullImageUrl) {
      throw new Error("R2_PUBLIC_BASE_URL is required")
    }

    await c.env.R2.put(key, imageBuffer, {
      httpMetadata: { contentType: getImageContentTypeFromKey(key) || "image/png" },
    })

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

    // Insert Message
    const messageId = uuidv4()
    const toDbValue = (v: unknown) => (v === undefined ? null : v)
    const googleSearchVal = input.google_search === "true" || input.google_search === true ? 1 : 0
    const imageSearchVal = input.image_search === "true" || input.image_search === true ? 1 : 0

    await db
      .prepare(
        `
        INSERT INTO messages (id, session_id, user_id, role, provider, model, prompt, aspect_ratio, resolution, google_search, image_search, image_size, quality, style, negative_prompt, output_format, num_images, image_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .bind(
        messageId,
        sessionId,
        userId,
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

    // Update session updated_at
    await db
      .prepare("UPDATE sessions SET updated_at = ? WHERE id = ? AND status = 1")
      .bind(now, sessionId)
      .run()

    // Save task status to completed
    const taskResult = JSON.stringify({
      success: true,
      key,
      originUrl: imageUrl,
      r2Url: fullImageUrl,
      sessionId,
      messageId,
    })

    await db
      .prepare(
        "UPDATE generation_tasks SET status = 'completed', result = ?, provider = ?, updated_at = ? WHERE id = ?"
      )
      .bind(taskResult, finalProvider, now, taskId)
      .run()
  } catch (error: any) {
    console.error("Background generation task error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Save task status to failed
    await db
      .prepare(
        "UPDATE generation_tasks SET status = 'failed', error = ?, updated_at = ? WHERE id = ?"
      )
      .bind(errorMessage, now, taskId)
      .run()
  }
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
    status: string
    result: string | null
    error: string | null
    created_at: number
  }

  // Self-healing timeout check: If the task has been stuck in 'pending' or 'processing' for more than 90 seconds,
  // it likely crashed, timed out, or was terminated by Cloudflare Workers.
  const now = Math.floor(Date.now() / 1000)
  if (
    (taskRecord.status === "pending" || taskRecord.status === "processing") &&
    now - taskRecord.created_at > 90
  ) {
    const timeoutMsg = "Generation timed out (backend process terminated)"
    await c.env.DB.prepare(
      "UPDATE generation_tasks SET status = 'failed', error = ?, updated_at = ? WHERE id = ?"
    )
      .bind(timeoutMsg, now, taskId)
      .run()

    return c.json({
      success: true,
      status: "failed",
      result: null,
      error: timeoutMsg,
    })
  }

  const parsedResult = taskRecord.result ? JSON.parse(taskRecord.result) : null

  return c.json({
    success: true,
    status: taskRecord.status,
    result: parsedResult,
    error: taskRecord.error,
  })
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
