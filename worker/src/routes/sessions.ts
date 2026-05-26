import { v4 as uuidv4 } from "uuid";
import type { AuthenticatedContext, Env } from "../types";
import { getR2PublicUrl } from "../utils";

interface SessionListRecord {
  id: string;
  title: string;
  is_pinned: number;
  preview_image: string | null;
  created_at: number;
  updated_at: number;
}

interface SessionMessageRecord {
  id: string;
  role: string;
  provider: string | null;
  model: string;
  prompt: string | null;
  image_url: string | null;
  aspect_ratio: string | null;
  resolution: string | null;
  image_size: string | null;
  quality: string | null;
  style: string | null;
  negative_prompt: string | null;
  output_format: string | null;
  num_images: number | null;
  google_search: number | null;
  image_search: number | null;
  created_at: number;
  is_favorite?: number;
}

function toPublicImageUrl(env: Env, imageUrl: string | null) {
  if (!imageUrl) return null;
  return getR2PublicUrl(env, imageUrl) ?? null;
}

export async function handleGetSessions(c: AuthenticatedContext) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessions = await c.env.DB
    .prepare(
      `
      SELECT s.id, s.title, s.is_pinned, s.created_at, s.updated_at,
        (SELECT m.image_url FROM messages m WHERE m.session_id = s.id AND m.status = 1 AND m.image_url IS NOT NULL ORDER BY m.created_at ASC LIMIT 1) as preview_image
      FROM sessions s
      WHERE s.user_id = ?
      ORDER BY s.is_pinned DESC, s.updated_at DESC
      LIMIT 50
    `
    )
    .bind(user.userId)
    .all();

  const results = (sessions.results as unknown as SessionListRecord[]).map(session => ({
    ...session,
    preview_image: toPublicImageUrl(c.env, session.preview_image),
  }));

  return c.json({ sessions: results });
}

export async function handleCreateSession(c: AuthenticatedContext) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { title } = await c.req.json<{ title?: string }>();
  const now = Math.floor(Date.now() / 1000);
  const sessionId = uuidv4();

  await c.env.DB
    .prepare(
      `
      INSERT INTO sessions (id, user_id, title, is_pinned, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `
    )
    .bind(sessionId, user.userId, title || "New Chat", now, now)
    .run();

  return c.json({ session: { id: sessionId, title: title || "New Chat", is_pinned: 0, created_at: now, updated_at: now } });
}

export async function handleGetSession(c: AuthenticatedContext) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("id");

  const session = await c.env.DB
    .prepare("SELECT * FROM sessions WHERE id = ? AND user_id = ?")
    .bind(sessionId, user.userId)
    .first();

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  const messages = await c.env.DB
    .prepare(
      `
      SELECT m.id, m.role, m.provider, m.model, m.prompt, m.image_url, m.aspect_ratio, m.resolution,
        m.image_size, m.quality, m.style, m.negative_prompt, m.output_format, m.num_images,
        m.google_search, m.image_search, m.created_at,
        (CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END) AS is_favorite
      FROM messages m
      LEFT JOIN content_favorites f ON f.message_id = m.id AND f.user_id = ? AND f.content_type = 'image'
      WHERE m.session_id = ? AND m.status = 1
      ORDER BY m.created_at ASC
    `
    )
    .bind(user.userId, sessionId)
    .all();

  const results = (messages.results as unknown as SessionMessageRecord[]).map(message => ({
    ...message,
    url: toPublicImageUrl(c.env, message.image_url),
  }));

  return c.json({ session, messages: results });
}

export async function handleDeleteSession(c: AuthenticatedContext) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("id");

  await c.env.DB
    .prepare("DELETE FROM sessions WHERE id = ? AND user_id = ?")
    .bind(sessionId, user.userId)
    .run();

  return c.json({ success: true });
}

export async function handleUpdateSession(c: AuthenticatedContext) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("id");
  if (!sessionId) {
    return c.json({ error: "Session ID is required" }, 400);
  }
  const { title, is_pinned } = await c.req.json<{ title?: string; is_pinned?: number }>();

  const session = await c.env.DB
    .prepare("SELECT * FROM sessions WHERE id = ? AND user_id = ?")
    .bind(sessionId, user.userId)
    .first();

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  const now = Math.floor(Date.now() / 1000);
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (title !== undefined) {
    updates.push("title = ?");
    values.push(title);
  }

  if (is_pinned !== undefined) {
    updates.push("is_pinned = ?");
    values.push(is_pinned);
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(sessionId, user.userId);

  await c.env.DB
    .prepare(`UPDATE sessions SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`)
    .bind(...values)
    .run();

  return c.json({ success: true });
}

export async function handleCreateMessage(c: AuthenticatedContext) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("id");
  const { role, prompt, model, image_url } = await c.req.json<{
    role: string;
    prompt: string;
    model: string;
    image_url?: string;
  }>();

  const session = await c.env.DB
    .prepare("SELECT * FROM sessions WHERE id = ? AND user_id = ?")
    .bind(sessionId, user.userId)
    .first();

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  const now = Math.floor(Date.now() / 1000);
  const messageId = uuidv4();

  await c.env.DB
    .prepare(
      `
      INSERT INTO messages (id, session_id, user_id, role, provider, model, prompt, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(messageId, sessionId, user.userId, role, role === "user" ? "user" : "assistant", model, prompt, image_url || null, now)
    .run();

  await c.env.DB
    .prepare("UPDATE sessions SET updated_at = ? WHERE id = ?")
    .bind(now, sessionId)
    .run();

  return c.json({
    message: {
      id: messageId,
      role,
      prompt,
      model,
      image_url,
      url: toPublicImageUrl(c.env, image_url || null),
      created_at: now,
    },
  });
}
