import type { Context } from "hono";
import { v4 as uuidv4 } from "uuid";
import type { Env } from "../types";

export async function handleGetSessions(c: Context<{ Bindings: Env }>) {
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

  return c.json({ sessions: sessions.results });
}

export async function handleCreateSession(c: Context<{ Bindings: Env }>) {
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

export async function handleGetSession(c: Context<{ Bindings: Env }>) {
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
      SELECT id, role, provider, model, prompt, image_url, aspect_ratio, resolution, created_at
      FROM messages
      WHERE session_id = ? AND status = 1
      ORDER BY created_at ASC
    `
    )
    .bind(sessionId)
    .all();

  return c.json({ session, messages: messages.results });
}

export async function handleDeleteSession(c: Context<{ Bindings: Env }>) {
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

export async function handleUpdateSession(c: Context<{ Bindings: Env }>) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("id");
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

export async function handleCreateMessage(c: Context<{ Bindings: Env }>) {
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

  return c.json({ message: { id: messageId, role, prompt, model, image_url, created_at: now } });
}
