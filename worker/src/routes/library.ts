import type { AuthenticatedContext } from "../types"
import { MIME_TYPES, type MimeType } from "../const"
import { createPresignedGetUrl } from "../utils"
import { createSignedImageVariantUrl } from "./media"

interface AssetRecord {
  id: string
  source_output_id: string | null
  kind: MimeType
  origin: "generated" | "uploaded" | "stock"
  name: string
  storage_key: string
  poster_key: string | null
  content_type: string | null
  width: number | null
  height: number | null
  duration_ms: number | null
  fps: number | null
  has_audio: number | null
  model: string | null
  prompt: string | null
  tags: string
  is_favorite: number
  is_hidden: number
  created_at: number
  updated_at: number
}

function boundedInt(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed)
    ? Math.min(maximum, Math.max(minimum, Math.trunc(parsed)))
    : fallback
}

export async function serializeAsset(env: AuthenticatedContext["env"], asset: AssetRecord) {
  const { storage_key: storageKey, poster_key: posterKey, tags, ...publicAsset } = asset
  const displayUrl =
    asset.kind === MIME_TYPES.IMAGE
      ? await createSignedImageVariantUrl(env, storageKey, "large")
      : await createPresignedGetUrl(env, storageKey)
  const thumbnailUrl =
    asset.kind === MIME_TYPES.IMAGE
      ? await createSignedImageVariantUrl(env, storageKey, "small")
      : posterKey
        ? await createSignedImageVariantUrl(env, posterKey, "small")
        : displayUrl

  return {
    ...publicAsset,
    tags: JSON.parse(tags || "[]"),
    thumbnail_url: thumbnailUrl,
    display_url: displayUrl,
  }
}

export async function handleGetAssets(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) return c.json({ error: "Unauthorized" }, 401)

  const kind = c.req.query("kind")
  const origin = c.req.query("origin")
  const search = c.req.query("search")?.trim()
  const favorite = c.req.query("favorite")
  const hidden = c.req.query("hidden") === "true"
  const limit = boundedInt(c.req.query("limit"), 50, 1, 100)
  const offset = boundedInt(c.req.query("offset"), 0, 0, 100000)
  const conditions = ["user_id = ?", "deleted_at IS NULL", "is_hidden = ?"]
  const values: Array<string | number> = [user.userId, hidden ? 1 : 0]

  if (kind && ["image", "video", "audio"].includes(kind)) {
    conditions.push("kind = ?")
    values.push(kind)
  }
  if (origin && ["generated", "uploaded", "stock"].includes(origin)) {
    conditions.push("origin = ?")
    values.push(origin)
  }
  if (favorite === "true") {
    conditions.push("is_favorite = 1")
  }
  if (search) {
    conditions.push("(name LIKE ? OR prompt LIKE ? OR model LIKE ?)")
    const pattern = `%${search}%`
    values.push(pattern, pattern, pattern)
  }

  const where = conditions.join(" AND ")
  const [itemsResult, countResult] = await Promise.all([
    c.env.DB.prepare(
      `SELECT * FROM assets WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
      .bind(...values, limit, offset)
      .all<AssetRecord>(),
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM assets WHERE ${where}`)
      .bind(...values)
      .first<{ total: number }>(),
  ])

  return c.json({
    assets: await Promise.all(
      (itemsResult.results || []).map(asset => serializeAsset(c.env, asset))
    ),
    total: countResult?.total ?? 0,
    limit,
    offset,
  })
}

export async function handleGetAsset(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) return c.json({ error: "Unauthorized" }, 401)
  const asset = await c.env.DB.prepare(
    "SELECT * FROM assets WHERE id = ? AND user_id = ? AND deleted_at IS NULL"
  )
    .bind(c.req.param("id"), user.userId)
    .first<AssetRecord>()
  if (!asset) return c.json({ error: "Asset not found" }, 404)
  return c.json({ asset: await serializeAsset(c.env, asset) })
}

export async function handleUpdateAsset(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) return c.json({ error: "Unauthorized" }, 401)
  const body: { name?: string; tags?: string[]; is_favorite?: boolean; is_hidden?: boolean } =
    await c.req.json().catch(() => ({}))
  const updates: string[] = []
  const values: Array<string | number> = []

  if (typeof body.name === "string" && body.name.trim()) {
    updates.push("name = ?")
    values.push(body.name.trim().slice(0, 160))
  }
  if (Array.isArray(body.tags)) {
    updates.push("tags = ?")
    values.push(
      JSON.stringify(
        body.tags
          .map(tag => String(tag).trim())
          .filter(Boolean)
          .slice(0, 20)
      )
    )
  }
  if (typeof body.is_favorite === "boolean") {
    updates.push("is_favorite = ?")
    values.push(body.is_favorite ? 1 : 0)
  }
  if (typeof body.is_hidden === "boolean") {
    updates.push("is_hidden = ?")
    values.push(body.is_hidden ? 1 : 0)
  }
  if (updates.length === 0) return c.json({ error: "No supported fields to update" }, 400)

  updates.push("updated_at = ?")
  values.push(Math.floor(Date.now() / 1000), c.req.param("id") || "", user.userId)
  const result = await c.env.DB.prepare(
    `UPDATE assets SET ${updates.join(", ")} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
  )
    .bind(...values)
    .run()
  if (!result.meta.changes) return c.json({ error: "Asset not found" }, 404)
  return handleGetAsset(c)
}

export async function handleDeleteAsset(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) return c.json({ error: "Unauthorized" }, 401)
  const now = Math.floor(Date.now() / 1000)
  const result = await c.env.DB.prepare(
    "UPDATE assets SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL"
  )
    .bind(now, now, c.req.param("id"), user.userId)
    .run()
  if (!result.meta.changes) return c.json({ error: "Asset not found" }, 404)
  return c.json({ success: true })
}

export async function handleGetAssetDownloadUrl(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) return c.json({ error: "Unauthorized" }, 401)
  const asset = await c.env.DB.prepare(
    "SELECT storage_key FROM assets WHERE id = ? AND user_id = ? AND deleted_at IS NULL"
  )
    .bind(c.req.param("id"), user.userId)
    .first<{ storage_key: string }>()
  if (!asset) return c.json({ error: "Asset not found" }, 404)
  const url = await createPresignedGetUrl(c.env, asset.storage_key)
  c.header("Cache-Control", "no-store")
  return c.json({ url, expiresIn: 3600 })
}
