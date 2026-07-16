import type { Context } from "hono"
import { v4 as uuidv4 } from "uuid"
import { sign } from "hono/jwt"
import type { Env } from "../types"
import { addCredits } from "./credits"

export async function handleLogout(c: Context<{ Bindings: Env }>) {
  return c.json({ success: true })
}

interface GoogleCallbackBody {
  code: string
  code_verifier: string
}

interface GoogleTokenErrorResponse {
  error?: string
  error_description?: string
}

export async function handleGoogleCallback(c: Context<{ Bindings: Env }>) {
  const { code, code_verifier } = await c.req.json<GoogleCallbackBody>()

  if (!code || !code_verifier) {
    return c.json({ error: "Authorization code and code_verifier required" }, 400)
  }

  const clientId = c.env.GOOGLE_CLIENT_ID
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET
  const redirectUri = c.env.FRONTEND_URL

  if (!clientId || !clientSecret || !redirectUri) {
    return c.json({ error: "missing_credentials" }, 500)
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${redirectUri}/auth/callback`,
        grant_type: "authorization_code",
        code_verifier,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = (await tokenResponse.json()) as GoogleTokenErrorResponse
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`)
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!profileResponse.ok) {
      throw new Error("Failed to fetch user data")
    }

    const profile = (await profileResponse.json()) as {
      id: string
      email: string
      name: string
      picture: string
    }

    const userId = uuidv4()
    const accountId = uuidv4()
    const timestamp = Math.floor(Date.now() / 1000)

    const existingAccount = await c.env.DB.prepare(
      "SELECT * FROM accounts WHERE provider = ? AND provider_account_id = ?"
    )
      .bind("google", profile.id)
      .first()

    let user
    let isNewUser = false
    if (existingAccount) {
      const userIdFromAccount = (existingAccount as { user_id: string }).user_id
      await c.env.DB.prepare(
        "UPDATE users SET email = ?, name = ?, avatar_url = ?, updated_at = ? WHERE id = ?"
      )
        .bind(profile.email, profile.name, profile.picture, timestamp, userIdFromAccount)
        .run()
      user = (await c.env.DB.prepare("SELECT * FROM users WHERE id = ?")
        .bind(userIdFromAccount)
        .first()) as
        | { id: string; email: string; name: string; avatar_url: string | null; user_type: string }
        | undefined
    } else {
      isNewUser = true
      await c.env.DB.prepare(
        "INSERT INTO users (id, email, name, avatar_url, user_type, created_at, updated_at) VALUES (?, ?, ?, ?, 'free', ?, ?)"
      )
        .bind(userId, profile.email, profile.name, profile.picture, timestamp, timestamp)
        .run()
      await c.env.DB.prepare(
        "INSERT INTO accounts (id, user_id, provider, provider_account_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(accountId, userId, "google", profile.id, timestamp, timestamp)
        .run()

      const NEW_USER_CREDITS = 10
      await addCredits(c.env.DB, userId, NEW_USER_CREDITS, "onboarding", "New user sign-up bonus")

      user = (await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first()) as
        | { id: string; email: string; name: string; avatar_url: string | null; user_type: string }
        | undefined
    }

    if (!user) {
      return c.json({ error: "user_creation_failed" }, 500)
    }

    const userCredits = await c.env.DB.prepare("SELECT balance FROM user_credits WHERE user_id = ?")
      .bind(user.id)
      .first<{ balance: number }>()

    const jwt = await sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url || "",
        userType: (user as { user_type: string }).user_type,
        credits: userCredits?.balance || 0,
      },
      c.env.JWT_SECRET
    )

    return c.json({
      token: jwt,
      isNewUser,
      onboardingCredits: isNewUser ? 10 : 0,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url || "",
        userType: (user as { user_type: string }).user_type,
        credits: userCredits?.balance || 0,
      },
    })
  } catch (err) {
    console.error("OAuth callback error", err)
    return c.json(
      {
        error: "internal_error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      500
    )
  }
}
