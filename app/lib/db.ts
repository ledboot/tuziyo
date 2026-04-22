import type { D1Database } from "@cloudflare/workers-types";

export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: number;
  updated_at: number;
}

export interface Session {
  id: string;
  user_id: string;
  title: string;
  is_persistent: number;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string | null;
  image_url: string | null;
  aspect_ratio: string | null;
  resolution: string | null;
  enable_search: number;
  created_at: number;
}

export async function getUserById(
  db: D1Database,
  id: string,
): Promise<User | null> {
  const result = await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first<User>();
  return result;
}

export async function upsertUser(
  db: D1Database,
  user: Omit<User, "created_at" | "updated_at">,
): Promise<User> {
  const existingUser = await db
    .prepare("SELECT * FROM users WHERE google_id = ?")
    .bind(user.google_id)
    .first<User>();

  if (existingUser) {
    await db
      .prepare(
        "UPDATE users SET email = ?, name = ?, avatar_url = ?, updated_at = ? WHERE id = ?",
      )
      .bind(
        user.email,
        user.name,
        user.avatar_url,
        Math.floor(Date.now() / 1000),
        existingUser.id,
      )
      .run();
    return {
      ...existingUser,
      ...user,
      id: existingUser.id,
      updated_at: Math.floor(Date.now() / 1000),
    };
  } else {
    const timestamp = Math.floor(Date.now() / 1000);
    await db
      .prepare(
        "INSERT INTO users (id, google_id, email, name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        user.id,
        user.google_id,
        user.email,
        user.name,
        user.avatar_url,
        timestamp,
        timestamp,
      )
      .run();
    return { ...user, created_at: timestamp, updated_at: timestamp };
  }
}

export async function getSessionsForUser(
  db: D1Database,
  userId: string,
): Promise<Session[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC",
    )
    .bind(userId)
    .all<Session>();
  return results;
}

export async function createSession(
  db: D1Database,
  id: string,
  userId: string,
  title: string = "新对话",
  isPersistent: number = 1,
): Promise<Session> {
  const timestamp = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      "INSERT INTO sessions (id, user_id, title, is_persistent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(id, userId, title, isPersistent, timestamp, timestamp)
    .run();

  return {
    id,
    user_id: userId,
    title,
    is_persistent: isPersistent,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export async function getMessagesForSession(
  db: D1Database,
  sessionId: string,
): Promise<Message[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC",
    )
    .bind(sessionId)
    .all<Message>();
  return results;
}

export async function addMessage(
  db: D1Database,
  message: Omit<Message, "created_at">,
): Promise<Message> {
  const timestamp = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO messages 
      (id, session_id, role, content, image_url, aspect_ratio, resolution, enable_search, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      message.id,
      message.session_id,
      message.role,
      message.content,
      message.image_url,
      message.aspect_ratio,
      message.resolution,
      message.enable_search,
      timestamp,
    )
    .run();
  return { ...message, created_at: timestamp };
}

export async function updateSessionPersistent(
  db: D1Database,
  sessionId: string,
  isPersistent: number,
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      "UPDATE sessions SET is_persistent = ?, updated_at = ? WHERE id = ?",
    )
    .bind(isPersistent, timestamp, sessionId)
    .run();
}

export async function updateSessionTitle(
  db: D1Database,
  sessionId: string,
  title: string,
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      "UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?",
    )
    .bind(title, timestamp, sessionId)
    .run();
}

export async function deleteSession(
  db: D1Database,
  sessionId: string,
): Promise<void> {
  await db.prepare("DELETE FROM messages WHERE session_id = ?").bind(sessionId).run();
  await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
}
