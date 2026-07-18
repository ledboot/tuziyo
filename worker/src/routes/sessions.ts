import { v4 as uuidv4 } from "uuid"
import type { AuthenticatedContext } from "../types"
import { MIME_TYPES, type MimeType } from "../const"
import { createPresignedGetUrl, getGeneratedImagePrefix } from "../utils"
import { createSignedImageVariantUrl } from "./media"

interface SessionListRecord {
  id: string
  title: string
  is_pinned: number
  preview_image: string | null
  created_at: number
  updated_at: number
}

interface SessionMessageRecord {
  id: string
  role: string
  provider: string | null
  model: string
  prompt: string | null
  aspect_ratio: string | null
  resolution: string | null
  image_size: string | null
  quality: string | null
  style: string | null
  negative_prompt: string | null
  output_format: string | null
  num_images: number | null
  media_type: MimeType
  generation_mode: string | null
  duration: number | null
  generate_audio: number | null
  google_search: number | null
  image_search: number | null
  created_at: number
  is_favorite?: number
}

interface SessionMessageOutputRecord {
  id: string
  message_id: string
  output_index: number
  status: "pending" | "completed" | "failed" | "deleted"
  image_url: string | null
  storage_key: string | null
  content_type: MimeType
  width: number | null
  height: number | null
  file_size: number | null
  duration_ms: number | null
  fps: number | null
  has_audio: number | null
  error: string | null
  created_at: number
  updated_at: number
  is_favorite: number
}

export async function handleGetSessions(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const sessions = await c.env.DB.prepare(
    `
      SELECT s.id, s.title, s.is_pinned, s.created_at, s.updated_at,
        (
          SELECT mo.image_url
          FROM message_outputs mo
          INNER JOIN messages m ON m.id = mo.message_id
          WHERE m.session_id = s.id AND m.status = 1 AND mo.status = 'completed'
            AND mo.content_type = 'image' AND mo.image_url IS NOT NULL
          ORDER BY m.created_at ASC, mo.output_index ASC
          LIMIT 1
        ) AS preview_image
      FROM sessions s
      WHERE s.user_id = ? AND s.status = 1
      ORDER BY s.is_pinned DESC, s.updated_at DESC
      LIMIT 50
    `
  )
    .bind(user.userId)
    .all()

  const results = await Promise.all(
    (sessions.results as unknown as SessionListRecord[]).map(async session => ({
      ...session,
      preview_image: await createSignedImageVariantUrl(c.env, session.preview_image, "small"),
    }))
  )

  return c.json({ sessions: results })
}

export async function handleGetSession(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const sessionId = c.req.param("id")

  const session = await c.env.DB.prepare(
    "SELECT * FROM sessions WHERE id = ? AND user_id = ? AND status = 1"
  )
    .bind(sessionId, user.userId)
    .first()

  if (!session) {
    return c.json({ error: "Session not found" }, 404)
  }

  const messages = await c.env.DB.prepare(
    `
      SELECT m.id, m.role, m.provider, m.model, m.prompt, m.aspect_ratio,
        m.resolution, m.image_size, m.quality, m.style, m.negative_prompt, m.output_format, m.num_images,
        m.google_search, m.image_search, m.media_type, m.generation_mode, m.duration,
        m.generate_audio, m.created_at,
        (CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END) AS is_favorite
      FROM messages m
      LEFT JOIN content_favorites f ON f.message_id = m.id AND f.output_id IS NULL AND f.user_id = ? AND f.content_type = 'image'
      WHERE m.session_id = ? AND m.status = 1
      ORDER BY m.created_at ASC
    `
  )
    .bind(user.userId, sessionId)
    .all()

  const messageResults = messages.results as unknown as SessionMessageRecord[]

  const outputs = await c.env.DB.prepare(
    `
      SELECT mo.id, mo.message_id, mo.output_index, mo.status, mo.image_url, mo.storage_key,
        mo.content_type, mo.width, mo.height, mo.file_size, mo.duration_ms, mo.fps,
        mo.has_audio, mo.error, mo.created_at, mo.updated_at,
        (CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END) AS is_favorite
      FROM message_outputs mo
      INNER JOIN messages m ON m.id = mo.message_id AND m.status = 1
      LEFT JOIN content_favorites f ON f.output_id = mo.id AND f.user_id = ? AND f.content_type = 'image'
      WHERE m.session_id = ? AND mo.status != 'deleted'
      ORDER BY m.created_at ASC, mo.output_index ASC
      `
  )
    .bind(user.userId, sessionId)
    .all()

  const outputResults = await Promise.all(
    (outputs.results as unknown as SessionMessageOutputRecord[]).map(async output => {
      const { image_url: imageUrl, storage_key: storageKey, ...publicOutput } = output
      const objectKey = storageKey || imageUrl
      return {
        ...publicOutput,
        thumbnail_url:
          output.content_type === MIME_TYPES.IMAGE
            ? await createSignedImageVariantUrl(c.env, objectKey, "small")
            : null,
        display_url:
          output.content_type === MIME_TYPES.IMAGE
            ? await createSignedImageVariantUrl(c.env, objectKey, "large")
            : objectKey
              ? await createPresignedGetUrl(c.env, objectKey)
              : null,
      }
    })
  )

  const outputsByMessage = new Map<string, typeof outputResults>()
  for (const output of outputResults) {
    const messageOutputs = outputsByMessage.get(output.message_id) ?? []
    messageOutputs.push(output)
    outputsByMessage.set(output.message_id, messageOutputs)
  }

  const results = messageResults.map(message => ({
    ...message,
    outputs: outputsByMessage.get(message.id) ?? [],
  }))

  const pendingTasksResult = await c.env.DB.prepare(
    `
      SELECT id, message_id, status, requested_count, completed_count, failed_count
      FROM generation_tasks
      WHERE user_id = ? AND session_id = ? AND status IN ('pending', 'processing')
      `
  )
    .bind(user.userId, sessionId)
    .all()

  return c.json({
    session,
    messages: results,
    pendingTasks: pendingTasksResult.results || [],
  })
}

export async function handleDeleteSession(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const sessionId = c.req.param("id")

  const now = Math.floor(Date.now() / 1000)
  await c.env.DB.prepare(
    "UPDATE sessions SET status = 2, deleted_at = ? WHERE id = ? AND user_id = ?"
  )
    .bind(now, sessionId, user.userId)
    .run()

  return c.json({ success: true })
}

export async function handleUpdateSession(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const sessionId = c.req.param("id")
  if (!sessionId) {
    return c.json({ error: "Session ID is required" }, 400)
  }
  const { title, is_pinned } = await c.req.json<{ title?: string; is_pinned?: number }>()

  const session = await c.env.DB.prepare(
    "SELECT * FROM sessions WHERE id = ? AND user_id = ? AND status = 1"
  )
    .bind(sessionId, user.userId)
    .first()

  if (!session) {
    return c.json({ error: "Session not found" }, 404)
  }

  const now = Math.floor(Date.now() / 1000)
  const updates: string[] = []
  const values: (string | number)[] = []

  if (title !== undefined) {
    updates.push("title = ?")
    values.push(title)
  }

  if (is_pinned !== undefined) {
    updates.push("is_pinned = ?")
    values.push(is_pinned)
  }

  updates.push("updated_at = ?")
  values.push(now)
  values.push(sessionId, user.userId)

  await c.env.DB.prepare(`UPDATE sessions SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`)
    .bind(...values)
    .run()

  return c.json({ success: true })
}

export async function handleCreateMessage(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const sessionId = c.req.param("id")
  const { role, prompt, model, image_url } = await c.req.json<{
    role: string
    prompt: string
    model: string
    image_url?: string
  }>()

  const normalizedImageKey = image_url?.replace(/^\/+/, "")
  if (normalizedImageKey && !normalizedImageKey.startsWith(getGeneratedImagePrefix(user.userId))) {
    return c.json({ error: "Invalid image key" }, 400)
  }

  const session = await c.env.DB.prepare(
    "SELECT * FROM sessions WHERE id = ? AND user_id = ? AND status = 1"
  )
    .bind(sessionId, user.userId)
    .first()

  if (!session) {
    return c.json({ error: "Session not found" }, 404)
  }

  const now = Math.floor(Date.now() / 1000)
  const messageId = uuidv4()
  const outputId = normalizedImageKey ? uuidv4() : null
  const extension = normalizedImageKey?.split("?")[0].split(".").pop()?.toLowerCase()
  const outputFormat =
    extension && ["png", "jpg", "jpeg", "webp"].includes(extension) ? extension : null

  await c.env.DB.batch([
    c.env.DB.prepare(
      `
          INSERT INTO messages (
            id, session_id, user_id, role, provider, model, prompt, output_format, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
    ).bind(
      messageId,
      sessionId,
      user.userId,
      role,
      role === "user" ? "user" : "assistant",
      model,
      prompt,
      outputFormat,
      now
    ),
    ...(outputId
      ? [
          c.env.DB.prepare(
            `
                INSERT INTO message_outputs (
                  id, message_id, output_index, status, image_url, content_type, created_at, updated_at
                )
                VALUES (?, ?, 0, 'completed', ?, ?, ?, ?)
              `
          ).bind(outputId, messageId, normalizedImageKey, MIME_TYPES.IMAGE, now, now),
        ]
      : []),
  ])

  await c.env.DB.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?")
    .bind(now, sessionId)
    .run()

  return c.json({
    message: {
      id: messageId,
      role,
      prompt,
      model,
      created_at: now,
    },
  })
}
