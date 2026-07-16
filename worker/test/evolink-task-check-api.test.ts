import { describe, expect, test } from "bun:test"
import { sign } from "hono/jwt"
import { app } from "../src/index"
import type { Env } from "../src/types"

const JWT_SECRET = "evolink-task-check-test-secret"

function createEnv(options: { failTaskQuery?: boolean } = {}): Env {
  const db = {
    prepare(query: string) {
      return {
        bind() {
          return {
            async first<T>() {
              if (query.includes("FROM users")) {
                return { id: "user-1", user_type: "free" } as T
              }

              if (query.includes("FROM user_credits")) {
                return { balance: 10 } as T
              }

              return null
            },
            async all<T>() {
              if (options.failTaskQuery && query.includes("FROM generation_tasks")) {
                throw new Error("task query failed")
              }

              return { results: [] as T[] }
            },
          }
        },
      }
    },
  }

  return {
    DB: db as unknown as D1Database,
    JWT_SECRET,
    EVOLINK_API_KEY: "test-evolink-key",
  } as Env
}

async function createAuthorizationHeader() {
  const token = await sign(
    {
      userId: "user-1",
      email: "test@example.com",
      name: "Test User",
      userType: "free",
      credits: 10,
      exp: Math.floor(Date.now() / 1000) + 60,
    },
    JWT_SECRET,
    "HS256"
  )

  return `Bearer ${token}`
}

describe("POST /api/evolink/tasks/check", () => {
  test("rejects anonymous requests", async () => {
    const response = await app.request(
      "/api/evolink/tasks/check",
      { method: "POST" },
      createEnv()
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Unauthorized" })
  })

  test("runs the task check and returns its result", async () => {
    const response = await app.request(
      "/api/evolink/tasks/check",
      {
        method: "POST",
        headers: { Authorization: await createAuthorizationHeader() },
      },
      createEnv()
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      result: { checked: 0, completed: 0, failed: 0 },
    })
  })

  test("returns a server error when the check cannot start", async () => {
    const response = await app.request(
      "/api/evolink/tasks/check",
      {
        method: "POST",
        headers: { Authorization: await createAuthorizationHeader() },
      },
      createEnv({ failTaskQuery: true })
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      success: false,
      error: "task query failed",
    })
  })
})
