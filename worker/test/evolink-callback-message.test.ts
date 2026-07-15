import { Database } from "bun:sqlite"
import { afterEach, describe, expect, test } from "bun:test"
import { sign } from "hono/jwt"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { app } from "../src/index"
import { EVOLINK_TASK_OBJECTS } from "../src/const"
import { createSignedImageVariantUrl } from "../src/routes/media"
import type { Env } from "../src/types"

const JWT_SECRET = "task-status-test-secret"
const MEDIA_SIGNING_SECRET = "media-signing-test-secret"

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
  const inspectedImages: ArrayBuffer[] = []
  const env = {
    DB: new FakeD1Database(sqlite) as unknown as D1Database,
    IMAGES: {
      async info(stream: ReadableStream<Uint8Array>) {
        const imageBuffer = await new Response(stream).arrayBuffer()
        inspectedImages.push(imageBuffer)
        return {
          format: "image/png",
          fileSize: imageBuffer.byteLength,
          width: 1536,
          height: 1024,
        }
      },
    } as unknown as ImagesBinding,
    R2: {
      async put(key: string) {
        storedKeys.push(key)
      },
    } as unknown as R2Bucket,
    R2_ACCOUNT_ID: "test-account-id",
    R2_BUCKET_NAME: "tuziyo-test",
    R2_ACCESS_KEY_ID: "test-access-key-id",
    R2_SECRET_ACCESS_KEY: "test-secret-access-key",
    JWT_SECRET,
    MEDIA_SIGNING_SECRET,
    MEDIA_BASE_URL: "http://localhost:8787",
  } as Env

  return { sqlite, env, storedKeys, inspectedImages }
}

describe("EvoLink callback message association", () => {
  test("fills the message referenced by generation_tasks without inserting another message", async () => {
    const { sqlite, env, storedKeys, inspectedImages } = setup()
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
    expect(inspectedImages).toHaveLength(1)
    expect(inspectedImages[0]?.byteLength).toBe(3)

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
      .query(
        "SELECT message_id, status, image_url, width, height FROM message_outputs WHERE id = 'output-1'"
      )
      .get()
    expect(output).toEqual({
      message_id: "original-message",
      status: "completed",
      image_url: storedKeys[0],
      width: 1536,
      height: 1024,
    })

    const task = sqlite
      .query("SELECT message_id, status, result FROM generation_tasks WHERE id = 'task-1'")
      .get() as { message_id: string; status: string; result: string }
    expect(task.message_id).toBe("original-message")
    expect(task.status).toBe("completed")
    const taskResult = JSON.parse(task.result)
    expect(taskResult.messageId).toBe("original-message")
    expect(taskResult.outputs[0]).toMatchObject({ width: 1536, height: 1024 })
  })

  test("does not write to R2 when image dimensions cannot be inspected", async () => {
    const { sqlite, env, storedKeys } = setup()
    env.IMAGES.info = async () => {
      throw new Error("Invalid generated image")
    }
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

    expect(response.status).toBe(500)
    expect(storedKeys).toHaveLength(0)
    expect(
      sqlite.query("SELECT status, width, height FROM message_outputs WHERE id = 'output-1'").get()
    ).toEqual({ status: "failed", width: null, height: null })
    expect(sqlite.query("SELECT status FROM generation_tasks WHERE id = 'task-1'").get()).toEqual({
      status: "failed",
    })
  })

  test("task status exposes signed variants without leaking the original URL", async () => {
    const { sqlite, env } = setup()
    sqlite.exec(`
      UPDATE message_outputs
      SET status = 'completed', image_url = 'generated-images/user-1/output.png'
      WHERE id = 'output-1';
      UPDATE generation_tasks
      SET status = 'completed', completed_count = 1, failed_count = 0,
        created_at = 100, updated_at = 112,
        result = '{"success":true,"messageId":"original-message"}'
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
      analytics: Record<string, unknown>
    }
    const thumbnailUrl = new URL(String(body.outputs[0]?.thumbnail_url))
    const displayUrl = new URL(String(body.outputs[0]?.display_url))
    expect(thumbnailUrl.origin).toBe("http://localhost:8787")
    expect(displayUrl.origin).toBe("http://localhost:8787")
    expect(thumbnailUrl.pathname).toBe("/api/media/image/small/generated-images/user-1/output.png")
    expect(displayUrl.pathname).toBe("/api/media/image/large/generated-images/user-1/output.png")
    expect(thumbnailUrl.searchParams.get("expires")).toMatch(/^\d+$/)
    expect(thumbnailUrl.searchParams.get("signature")).toMatch(/^[0-9a-f]{64}$/)
    expect(body.outputs[0]?.width).toBeNull()
    expect(body.outputs[0]?.height).toBeNull()
    expect(body.outputs[0]).not.toHaveProperty("url")
    expect(body.outputs[0]).not.toHaveProperty("image_url")
    expect(body.analytics).toEqual({
      task_id: "task-1",
      model: "openai/gpt-image-2",
      provider: "evolink",
      requested_count: 1,
      completed_count: 1,
      failed_count: 0,
      duration_seconds: 12,
    })
  })

  test("failed task status exposes the task ID and final provider", async () => {
    const { sqlite, env } = setup()
    sqlite.exec(`
      UPDATE generation_tasks
      SET status = 'failed', provider = 'byteplus', error = 'Provider request failed',
        failed_count = 1, created_at = 100, updated_at = 109
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
      status: string
      error: string | null
      analytics: Record<string, unknown>
    }
    expect(body.status).toBe("failed")
    expect(body.error).toBe("Provider request failed")
    expect(body.analytics).toEqual({
      task_id: "task-1",
      model: "openai/gpt-image-2",
      provider: "byteplus",
      requested_count: 1,
      completed_count: 0,
      failed_count: 1,
      duration_seconds: 9,
    })
  })

  test("session outputs expose signed variants without leaking the original URL", async () => {
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
    const thumbnailUrl = new URL(String(body.messages[0]?.outputs[0]?.thumbnail_url))
    const displayUrl = new URL(String(body.messages[0]?.outputs[0]?.display_url))
    expect(thumbnailUrl.origin).toBe("http://localhost:8787")
    expect(displayUrl.origin).toBe("http://localhost:8787")
    expect(thumbnailUrl.pathname).toBe(
      "/api/media/image/small/generated-images/user-1/session-output.png"
    )
    expect(displayUrl.pathname).toBe(
      "/api/media/image/large/generated-images/user-1/session-output.png"
    )
    expect(body.messages[0]?.outputs[0]?.width).toBeNull()
    expect(body.messages[0]?.outputs[0]?.height).toBeNull()
    expect(body.messages[0]).not.toHaveProperty("url")
    expect(body.messages[0]).not.toHaveProperty("image_url")
    expect(body.messages[0]?.outputs[0]).not.toHaveProperty("url")
    expect(body.messages[0]?.outputs[0]).not.toHaveProperty("image_url")

    const sessionsResponse = await app.request(
      "/api/sessions",
      { headers: { Authorization: `Bearer ${token}` } },
      env
    )
    expect(sessionsResponse.status).toBe(200)
    const sessionsBody = (await sessionsResponse.json()) as {
      sessions: Array<{ preview_image: string | null }>
    }
    const previewUrl = new URL(String(sessionsBody.sessions[0]?.preview_image))
    expect(previewUrl.origin).toBe("http://localhost:8787")
    expect(previewUrl.pathname).toBe(
      "/api/media/image/small/generated-images/user-1/session-output.png"
    )
  })

  test("download URL endpoint returns a fresh original R2 presigned URL", async () => {
    const { sqlite, env } = setup()
    sqlite.exec(`
      UPDATE message_outputs
      SET status = 'completed', image_url = 'generated-images/user-1/download.png'
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
      "/api/images/output-1/download-url",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
      env
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    const body = (await response.json()) as { url: string; expiresIn: number }
    const downloadUrl = new URL(body.url)
    expect(downloadUrl.hostname).toBe("test-account-id.r2.cloudflarestorage.com")
    expect(downloadUrl.pathname).toBe("/tuziyo-test/generated-images/user-1/download.png")
    expect(downloadUrl.searchParams.get("X-Amz-Signature")).toBeTruthy()
    expect(body.expiresIn).toBe(3600)
  })

  test("download URL endpoint fails closed when R2 signing config is missing", async () => {
    const { sqlite, env } = setup()
    sqlite.exec(`
      UPDATE message_outputs
      SET status = 'completed', image_url = 'generated-images/user-1/download.png'
      WHERE id = 'output-1';
    `)
    env.R2_SECRET_ACCESS_KEY = ""
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
      "/api/images/output-1/download-url",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
      env
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: "Failed to create image download URL" })
  })

  test("favorites expose only signed variants and no original URL", async () => {
    const { sqlite, env } = setup()
    sqlite.exec(`
      UPDATE message_outputs
      SET status = 'completed', image_url = 'generated-images/user-1/favorite.png'
      WHERE id = 'output-1';
      INSERT INTO content_favorites (
        id, user_id, content_type, message_id, output_id
      ) VALUES (
        'favorite-1', 'user-1', 'image', 'original-message', 'output-1'
      );
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
      "/api/favorites",
      { headers: { Authorization: `Bearer ${token}` } },
      env
    )

    expect(response.status).toBe(200)
    const body = (await response.json()) as { favorites: Array<Record<string, unknown>> }
    expect(body.favorites).toHaveLength(1)
    expect(body.favorites[0]).not.toHaveProperty("url")
    expect(body.favorites[0]).not.toHaveProperty("image_url")
    expect(new URL(String(body.favorites[0]?.thumbnail_url)).pathname).toBe(
      "/api/media/image/small/generated-images/user-1/favorite.png"
    )
    expect(new URL(String(body.favorites[0]?.display_url)).pathname).toBe(
      "/api/media/image/large/generated-images/user-1/favorite.png"
    )
  })

  test("message creation rejects another user's generated image key", async () => {
    const { env } = setup()
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
      "/api/sessions/session-1/messages",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "assistant",
          prompt: "Unauthorized image",
          model: "openai/gpt-image-2",
          image_url: "generated-images/user-2/private.png",
        }),
      },
      env
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Invalid image key" })
  })
})

describe("Cloudflare Images variants", () => {
  test("uses the configured production media origin", async () => {
    const signedUrl = await createSignedImageVariantUrl(
      {
        MEDIA_SIGNING_SECRET,
        MEDIA_BASE_URL: "https://api.tuziyo.com",
      } as Env,
      "generated-images/user-1/output.png",
      "small"
    )

    expect(new URL(signedUrl!).origin).toBe("https://api.tuziyo.com")
  })

  test.each([
    ["small", { width: 128, height: 128, fit: "cover" }],
    ["large", { width: 1280, height: 1280, fit: "scale-down" }],
  ])("transforms the %s variant from its R2 object", async (variant, expectedTransform) => {
    const transforms: ImageTransform[] = []
    const outputOptions: ImageOutputOptions[] = []
    const requestedKeys: string[] = []

    const transformer = {
      transform(options: ImageTransform) {
        transforms.push(options)
        return transformer
      },
      async output(options: ImageOutputOptions) {
        outputOptions.push(options)
        return {
          response: () =>
            new Response(new Uint8Array([4, 5, 6]), {
              headers: { "Content-Type": "image/webp" },
            }),
          contentType: () => "image/webp",
          image: () => new Response(new Uint8Array([4, 5, 6])).body,
        }
      },
    }
    const env = {
      MEDIA_SIGNING_SECRET,
      MEDIA_BASE_URL: "http://localhost:8787",
      IMAGES: {
        input() {
          return transformer
        },
      } as unknown as ImagesBinding,
      R2: {
        async get(key: string) {
          requestedKeys.push(key)
          return {
            body: new Response(new Uint8Array([1, 2, 3])).body,
            httpMetadata: { contentType: "image/png" },
          }
        },
      } as unknown as R2Bucket,
    } as Env

    const signedUrl = await createSignedImageVariantUrl(
      env,
      "generated-images/user-1/output.png",
      variant as "small" | "large"
    )
    expect(signedUrl).not.toBeNull()

    const response = await app.request(signedUrl!, {}, env)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("image/webp")
    expect(response.headers.get("Cache-Control")).toMatch(/^private, max-age=3\d{3}$/)
    expect(requestedKeys).toEqual(["generated-images/user-1/output.png"])
    expect(transforms).toEqual([expectedTransform])
    expect(outputOptions).toEqual([{ format: "image/webp", quality: 85 }])
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([4, 5, 6]))
  })

  test("rejects objects outside the generated image prefix", async () => {
    const response = await app.request("/api/media/image/small/private/output.png", {}, {} as Env)
    expect(response.status).toBe(400)
  })

  test("rejects a tampered signature before reading R2", async () => {
    let r2Reads = 0
    const env = {
      MEDIA_SIGNING_SECRET,
      MEDIA_BASE_URL: "http://localhost:8787",
      R2: {
        async get() {
          r2Reads++
          return null
        },
      } as unknown as R2Bucket,
    } as Env
    const signedUrl = await createSignedImageVariantUrl(
      env,
      "generated-images/user-1/output.png",
      "small"
    )
    const tamperedUrl = new URL(signedUrl!)
    tamperedUrl.pathname = tamperedUrl.pathname.replace("/small/", "/large/")

    const response = await app.request(tamperedUrl.toString(), {}, env)
    expect(response.status).toBe(403)
    expect(r2Reads).toBe(0)
  })

  test("rejects an expired signed URL before reading R2", async () => {
    let r2Reads = 0
    const env = {
      MEDIA_SIGNING_SECRET,
      MEDIA_BASE_URL: "http://localhost:8787",
      R2: {
        async get() {
          r2Reads++
          return null
        },
      } as unknown as R2Bucket,
    } as Env
    const signedUrl = await createSignedImageVariantUrl(
      env,
      "generated-images/user-1/output.png",
      "small",
      Math.floor(Date.now() / 1000) - 1
    )

    const response = await app.request(signedUrl!, {}, env)
    expect(response.status).toBe(403)
    expect(r2Reads).toBe(0)
  })
})
