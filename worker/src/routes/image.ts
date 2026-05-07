import type { Context } from "hono"
import { v4 as uuidv4 } from "uuid"
import {
  IMAGE_MODEL_IDS,
  type Env,
  type IMAGE_MODEL_ID,
  type ModelConfig,
  ReferenceImageFormat,
} from "../types"
import { deductCredits } from "./credits"
import { MODEL_OPTIONS_CONFIG, validateModelOptions } from "../modelOptions"

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
}

export function buildAiInput(input: GenerateInput) {
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

  switch (model) {
    case "google/nano-banana-2": {
      const aiInput: Record<string, unknown> = { prompt }
      if (aspect_ratio) aiInput.aspect_ratio = aspect_ratio
      if (output_format) aiInput.output_format = output_format
      if (resolution) aiInput.resolution = resolution
      if (google_search) aiInput.google_search = google_search === "true"
      if (image_search) aiInput.image_search = image_search === "true"
      return aiInput
    }

    case "alibaba/wan-2.6-image": {
      const aiInput: Record<string, unknown> = { prompt }
      if (size) aiInput.size = size
      if (negative_prompt) aiInput.negative_prompt = negative_prompt
      return aiInput
    }

    case "bytedance/seedream-5-lite": {
      const aiInput: Record<string, unknown> = { prompt }
      if (aspect_ratio) aiInput.aspect_ratio = aspect_ratio
      if (resolution) aiInput.size = resolution
      if (output_format) aiInput.output_format = output_format
      if (num_images) aiInput.max_images = Math.min(num_images, 15)
      if (negative_prompt) aiInput.negative_prompt = negative_prompt
      aiInput.sequential_image_generation = "auto"
      return aiInput
    }

    case "openai/gpt-image-1.5": {
      const aiInput: Record<string, unknown> = { prompt }
      if (size) aiInput.size = size
      if (quality) aiInput.quality = quality
      if (style) aiInput.style = style
      return aiInput
    }

    case "openai/gpt-image-2": {
      const aiInput: Record<string, unknown> = { prompt }
      if (size) aiInput.size = size
      if (quality) aiInput.quality = quality
      if (style) aiInput.style = style
      if (background) aiInput.background = background
      if (output_format) aiInput.output_format = output_format
      return aiInput
    }

    default:
      return { prompt }
  }
}

export function generateR2Key(extension?: string) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const timestamp = now.getTime()
  return `${year}/${month}${day}/${timestamp}.${extension || "png"}`
}

export async function handleGenerate(c: Context<{ Bindings: Env }>) {
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

  const aiInput = buildAiInput(input)
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

  const extension = input.output_format || "png"
  const key = generateR2Key(extension)
  await c.env.IMAGES.put(key, imageBuffer)

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
        INSERT INTO messages (id, session_id, role, provider, model, prompt, aspect_ratio, resolution, google_search, image_search, image_size, quality, style, negative_prompt, output_format, num_images, image_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        messageId,
        sessionId,
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

    const fullImageUrl = `https://s3.tuziyo.com/${key}`
    return c.json({ success: true, key, imageUrl: fullImageUrl })
  }

  return c.json({ success: false, error: "Session not found" }, 500)
}

export function getModels(): ModelConfig[] {
  return [
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
      id: "alibaba/wan-2.6-image",
      name: "WAN 2.6",
      provider: "Alibaba",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/alibaba.svg",
      supportsImage: false,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["alibaba/wan-2.6-image"],
    },
    {
      id: "bytedance/seedream-5-lite",
      name: "Seedream 5",
      provider: "ByteDance",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
      supportsImage: true,
      referenceImageCount: 14,
      referenceImageFormat: ReferenceImageFormat.URL,
      isNew: false,
      options: MODEL_OPTIONS_CONFIG["bytedance/seedream-5-lite"],
    },
    {
      id: "openai/gpt-image-1.5",
      name: "GPT Image 1.5",
      provider: "OpenAI",
      icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg",
      supportsImage: true,
      referenceImageCount: 1,
      referenceImageFormat: ReferenceImageFormat.BASE64,
      isNew: true,
      options: MODEL_OPTIONS_CONFIG["openai/gpt-image-1.5"],
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
  ]
}
