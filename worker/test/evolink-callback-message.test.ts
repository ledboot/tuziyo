import { Database } from "bun:sqlite"
import { afterEach, describe, expect, test } from "bun:test"
import { sign } from "hono/jwt"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { app } from "../src/index"
import { EVOLINK_TASK_OBJECTS } from "../src/const"
import type { Env } from "../src/types"

const JWT_SECRET = "task-status-test-secret"

class FakeD1PreparedStatement {
  private values: unknown[] = []

  constructor(
    private readonly db: Database,
    private readonly sql: string
  ) {}

  bind(...values: unknown[]) {
    this.values = values
    return this
  }

  async run() {
    const result = this.db.query(this.sql).run(...this.values)
    return { success: true, meta: { changes: result.changes ?? 0 } }
  }

  async first<T>() {
    return (this.db.query(this.sql).get(...this.values) ?? null) as T | null
  }

  async all<T>() {
    return { results: this.db.query(this.sql).all(...this.values) as T[] }
  }
}

class FakeD1Database {
  constructor(private readonly db: Database) {}

  prepare(sql: string) {
    return new FakeD1PreparedStatement(this.db, sql)
  }

  async batch(statements: FakeD1PreparedStatement[]) {
    this.db.run("BEGIN")
    try {
      const results = []
      for (const statement of statements) results.push(await statement.run())
      this.db.run("COMMIT")
      return results
    } catch (error) {
      this.db.run("ROLLBACK")
      throw error
    }
  }
}

const databases: Database[] = []
const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  for (const database of databases.splice(0)) database.close()
})

function setup() {
  const sqlite = new Database(":memory:")
  databases.push(sqlite)
  sqlite.run("PRAGMA foreign_keys = ON")
  sqlite.exec(readFileSync(join(import.meta.dir, "../../db/schema.sql"), "utf8"))
  sqlite.exec(`
    INSERT INTO users (id, email, name) VALUES ('user-1', 'user@example.com', 'User');
    INSERT INTO sessions (id, user_id, title) VALUES ('session-1', 'user-1', 'Session');
    INSERT INTO user_credits (
      id, user_id, balance, subscription_balance, purchased_balance, total_purchased, total_used
    ) VALUES ('credits-1', 'user-1', 1000, 0, 1000, 1000, 0);
    INSERT INTO messages (
      id, session_id, user_id, role, provider, model, prompt, num_images
    ) VALUES (
      'original-message', 'session-1', 'user-1', 'user', 'pending',
      'openai/gpt-image-2', 'A rabbit', 1
    );
    INSERT INTO message_outputs (
      id, message_id, output_index, status, content_type
    ) VALUES ('output-1', 'original-message', 0, 'pending', 'image');
    INSERT INTO generation_tasks (
      id, user_id, session_id, message_id, model, provider, provider_task_id, status,
      requested_count, input
    ) VALUES (
      'task-1', 'user-1', 'session-1', 'original-message', 'openai/gpt-image-2',
      'evolink', 'provider-task-1', 'processing', 1,
      '{"model":"openai/gpt-image-2","prompt":"A rabbit","num_images":1,"quality":"low","resolution":"1K"}'
    );
  `)

  const storedKeys: string[] = []
  const env = {
    DB: new FakeD1Database(sqlite) as unknown as D1Database,
    R2: {
      async put(key: string) {
        storedKeys.push(key)
      },
    } as unknown as R2Bucket,
    R2_PUBLIC_BASE_URL: "https://images.example.com",
    JWT_SECRET,
  } as Env

  return { sqlite, env, storedKeys }
}

describe("EvoLink callback message association", () => {
  test("fills the message referenced by generation_tasks without inserting another message", async () => {
    const { sqlite, env, storedKeys } = setup()
    globalThis.fetch = async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "Content-Type": "image/png" },
      })

    const response = await app.request(
      "/api/evolink/callback",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object: EVOLINK_TASK_OBJECTS.IMAGE,
          id: "provider-task-1",
          status: "completed",
          results: ["https://provider.example.com/generated.png"],
        }),
      },
      env
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(storedKeys).toHaveLength(1)

    const messages = sqlite
      .query("SELECT id, provider, image_url FROM messages ORDER BY created_at")
      .all()
    expect(messages).toHaveLength(1)
    expect(messages[0]).toEqual({
      id: "original-message",
      provider: "evolink",
      image_url: storedKeys[0],
    })

    const output = sqlite
      .query("SELECT message_id, status, image_url FROM message_outputs WHERE id = 'output-1'")
      .get()
    expect(output).toEqual({
      message_id: "original-message",
      status: "completed",
      image_url: storedKeys[0],
    })

    const task = sqlite
      .query("SELECT message_id, status, result FROM generation_tasks WHERE id = 'task-1'")
      .get() as { message_id: string; status: string; result: string }
    expect(task.message_id).toBe("original-message")
    expect(task.status).toBe("completed")
    expect(JSON.parse(task.result).messageId).toBe("original-message")
  })

  test("task status exposes the public url without leaking image_url", async () => {
    const { sqlite, env } = setup()
    sqlite.exec(`
      UPDATE message_outputs
      SET status = 'completed', image_url = 'generated-images/user-1/output.png'
      WHERE id = 'output-1';
      UPDATE generation_tasks
      SET status = 'completed', result = '{"success":true,"messageId":"original-message"}'
      WHERE id = 'task-1';
    `)

    const token = await sign(
      {
        userId: "user-1",
        email: "user@example.com",
        name: "User",
        userType: "free",
        credits: 1000,
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      JWT_SECRET,
      "HS256"
    )
    const response = await app.request(
      "/api/generate/task/task-1",
      { headers: { Authorization: `Bearer ${token}` } },
      env
    )

    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      outputs: Array<Record<string, unknown>>
    }
    expect(body.outputs[0]?.url).toBe(
      "https://images.example.com/generated-images/user-1/output.png"
    )
    expect(body.outputs[0]).not.toHaveProperty("image_url")
  })

  test("session outputs expose the public url without leaking image_url", async () => {
    const { sqlite, env } = setup()
    sqlite.exec(`
      UPDATE message_outputs
      SET status = 'completed', image_url = 'generated-images/user-1/session-output.png'
      WHERE id = 'output-1';
    `)

    const token = await sign(
      {
        userId: "user-1",
        email: "user@example.com",
        name: "User",
        userType: "free",
        credits: 1000,
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      JWT_SECRET,
      "HS256"
    )
    const response = await app.request(
      "/api/sessions/session-1",
      { headers: { Authorization: `Bearer ${token}` } },
      env
    )

    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      messages: Array<{ outputs: Array<Record<string, unknown>> }>
    }
    expect(body.messages[0]?.outputs[0]?.url).toBe(
      "https://images.example.com/generated-images/user-1/session-output.png"
    )
    expect(body.messages[0]).not.toHaveProperty("image_url")
    expect(body.messages[0]?.outputs[0]).not.toHaveProperty("image_url")
  })
})
