import { v4 as uuidv4 } from "uuid"
import type { AuthenticatedContext } from "../types"
import { MIME_TYPES, type MimeType } from "../const"
import { getGeneratedImagePrefix } from "../utils"
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
  image_url: string | null
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
  is_favorite?: number
}

interface SessionMessageOutputRecord {
  id: string
  message_id: string
  output_index: number
  status: "pending" | "completed" | "failed" | "deleted"
  image_url: string | null
  content_type: MimeType
  width: number | null
  height: number | null
  file_size: number | null
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
        COALESCE(
          (
            SELECT mo.image_url
            FROM message_outputs mo
            INNER JOIN messages m ON m.id = mo.message_id
            WHERE m.session_id = s.id AND m.status = 1 AND mo.status = 'completed' AND mo.image_url IS NOT NULL
            ORDER BY m.created_at ASC, mo.output_index ASC
            LIMIT 1
          ),
          (
            SELECT m.image_url
            FROM messages m
            WHERE m.session_id = s.id AND m.status = 1 AND m.image_url IS NOT NULL
            ORDER BY m.created_at ASC
            LIMIT 1
          )
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
      SELECT m.id, m.role, m.provider, m.model, m.prompt, m.image_url, m.aspect_ratio, m.resolution,
        m.image_size, m.quality, m.style, m.negative_prompt, m.output_format, m.num_images,
        m.google_search, m.image_search, m.created_at,
        (CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END) AS is_favorite
      FROM messages m
      LEFT JOIN content_favorites f ON f.message_id = m.id AND f.output_id IS NULL AND f.user_id = ? AND f.content_type = 'image'
      WHERE m.session_id = ? AND m.status = 1
      ORDER BY m.created_at ASC
    `
  )
    .bind(user.userId, sessionId)
    .all()

  const messageRecords = messages.results as unknown as SessionMessageRecord[]
  const legacyImageUrls = new Map(messageRecords.map(message => [message.id, message.image_url]))
  const messageResults = messageRecords.map(message => {
    const { image_url: _imageUrl, ...publicMessage } = message
    return publicMessage
  })

  const outputs = await c.env.DB.prepare(
    `
      SELECT mo.id, mo.message_id, mo.output_index, mo.status, mo.image_url, mo.content_type,
        mo.width, mo.height, mo.file_size, mo.error, mo.created_at, mo.updated_at,
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
      const { image_url: imageUrl, ...publicOutput } = output
      return {
        ...publicOutput,
        thumbnail_url:
          output.content_type === MIME_TYPES.IMAGE
            ? await createSignedImageVariantUrl(c.env, imageUrl, "small")
            : null,
        display_url:
          output.content_type === MIME_TYPES.IMAGE
            ? await createSignedImageVariantUrl(c.env, imageUrl, "large")
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

  const results = await Promise.all(
    messageResults.map(async message => {
      const messageOutputs = outputsByMessage.get(message.id)
      if (messageOutputs && messageOutputs.length > 0) {
        return { ...message, outputs: messageOutputs }
      }

      const legacyImageKey = legacyImageUrls.get(message.id) ?? null
      if (legacyImageKey) {
        return {
          ...message,
          outputs: [
            {
              id: message.id,
              message_id: message.id,
              output_index: 0,
              status: "completed" as const,
              content_type: MIME_TYPES.IMAGE,
              width: null,
              height: null,
              file_size: null,
              error: null,
              created_at: message.created_at,
              updated_at: message.created_at,
              is_favorite: message.is_favorite ?? 0,
              thumbnail_url: await createSignedImageVariantUrl(c.env, legacyImageKey, "small"),
              display_url: await createSignedImageVariantUrl(c.env, legacyImageKey, "large"),
              legacy: true,
            },
          ],
        }
      }

      return { ...message, outputs: [] }
    })
  )

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

  await c.env.DB.prepare(
    `
      INSERT INTO messages (id, session_id, user_id, role, provider, model, prompt, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  )
    .bind(
      messageId,
      sessionId,
      user.userId,
      role,
      role === "user" ? "user" : "assistant",
      model,
      prompt,
      normalizedImageKey || null,
      now
    )
    .run()

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
