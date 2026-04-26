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
      SELECT id, title, created_at, updated_at
      FROM sessions
      WHERE user_id = ?
      ORDER BY updated_at DESC
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
      INSERT INTO sessions (id, user_id, title, is_persistent, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?)
    `
    )
    .bind(sessionId, user.userId, title || "New Chat", now, now)
    .run();

  return c.json({ session: { id: sessionId, title: title || "New Chat", created_at: now, updated_at: now } });
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
      WHERE session_id = ?
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

export async function handleUpdateSessionTitle(c: Context<{ Bindings: Env }>) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("id");
  const { title } = await c.req.json<{ title: string }>();
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB
    .prepare("UPDATE sessions SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?")
    .bind(title, now, sessionId, user.userId)
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
      INSERT INTO messages (id, session_id, role, provider, model, prompt, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(messageId, sessionId, role, role === "user" ? "user" : "assistant", model, prompt, image_url || null, now)
    .run();

  await c.env.DB
    .prepare("UPDATE sessions SET updated_at = ? WHERE id = ?")
    .bind(now, sessionId)
    .run();

  return c.json({ message: { id: messageId, role, prompt, model, image_url, created_at: now } });
}