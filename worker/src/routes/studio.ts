import { v4 as uuidv4 } from "uuid"
import type { AuthenticatedContext } from "../types"
import { serializeAsset } from "./library"

const now = () => Math.floor(Date.now() / 1000)

async function getOwnedProject(c: AuthenticatedContext, projectId: string) {
  const user = c.get("user")
  if (!user) return null
  return c.env.DB.prepare(
    "SELECT * FROM studio_projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL"
  )
    .bind(projectId, user.userId)
    .first<Record<string, unknown>>()
}

async function getOwnedAsset(c: AuthenticatedContext, assetId: string) {
  const user = c.get("user")
  if (!user) return null
  return c.env.DB.prepare(
    "SELECT * FROM assets WHERE id = ? AND user_id = ? AND deleted_at IS NULL AND is_hidden = 0"
  )
    .bind(assetId, user.userId)
    .first<any>()
}

export async function handleGetStudioProjects(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) return c.json({ error: "Unauthorized" }, 401)
  const projects = await c.env.DB.prepare(
    `SELECT p.*,
      (SELECT COUNT(*) FROM studio_shots s WHERE s.project_id = p.id) AS shot_count,
      (SELECT COUNT(*) FROM studio_entities e WHERE e.project_id = p.id) AS entity_count
     FROM studio_projects p
     WHERE p.user_id = ? AND p.deleted_at IS NULL
     ORDER BY p.updated_at DESC`
  )
    .bind(user.userId)
    .all()
  return c.json({ projects: projects.results || [] })
}

export async function handleCreateStudioProject(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) return c.json({ error: "Unauthorized" }, 401)
  const body: { name?: string; description?: string; aspect_ratio?: string } = await c.req
    .json()
    .catch(() => ({}))
  const name = body.name?.trim()
  if (!name) return c.json({ error: "Project name is required" }, 400)
  const id = uuidv4()
  const timestamp = now()
  await c.env.DB.prepare(
    "INSERT INTO studio_projects (id, user_id, name, description, aspect_ratio, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      id,
      user.userId,
      name.slice(0, 120),
      body.description?.trim() || null,
      body.aspect_ratio || "16:9",
      timestamp,
      timestamp
    )
    .run()
  return c.json({ projectId: id }, 201)
}

export async function handleGetStudioProject(c: AuthenticatedContext) {
  const projectId = c.req.param("id") || ""
  const project = await getOwnedProject(c, projectId)
  if (!project) return c.json({ error: "Project not found" }, 404)

  const [entities, entityAssets, frames, shots, versions, sequence] = await Promise.all([
    c.env.DB.prepare("SELECT * FROM studio_entities WHERE project_id = ? ORDER BY created_at")
      .bind(projectId)
      .all(),
    c.env.DB.prepare(
      "SELECT ea.*, a.* FROM studio_entity_assets ea INNER JOIN assets a ON a.id = ea.asset_id WHERE ea.entity_id IN (SELECT id FROM studio_entities WHERE project_id = ?) ORDER BY ea.sort_order"
    )
      .bind(projectId)
      .all<any>(),
    c.env.DB.prepare(
      "SELECT f.*, a.kind, a.name AS asset_name, a.storage_key, a.poster_key, a.tags, a.origin, a.content_type, a.width, a.height, a.duration_ms, a.fps, a.has_audio, a.model, a.prompt, a.is_favorite, a.is_hidden, a.updated_at FROM studio_frames f INNER JOIN assets a ON a.id = f.asset_id WHERE f.project_id = ? ORDER BY f.created_at"
    )
      .bind(projectId)
      .all<any>(),
    c.env.DB.prepare("SELECT * FROM studio_shots WHERE project_id = ? ORDER BY created_at")
      .bind(projectId)
      .all(),
    c.env.DB.prepare(
      "SELECT sv.*, a.kind, a.name AS asset_name, a.storage_key, a.poster_key, a.tags, a.origin, a.content_type, a.width, a.height, a.duration_ms, a.fps, a.has_audio, a.model, a.prompt, a.is_favorite, a.is_hidden, a.updated_at FROM studio_shot_versions sv INNER JOIN assets a ON a.id = sv.asset_id WHERE sv.shot_id IN (SELECT id FROM studio_shots WHERE project_id = ?) ORDER BY sv.version_number"
    )
      .bind(projectId)
      .all<any>(),
    c.env.DB.prepare("SELECT * FROM studio_sequence_items WHERE project_id = ? ORDER BY position")
      .bind(projectId)
      .all(),
  ])

  const serializedEntityAssets = await Promise.all(
    (entityAssets.results || []).map(async row => ({
      ...row,
      asset: await serializeAsset(c.env, row),
    }))
  )
  const serializedFrames = await Promise.all(
    (frames.results || []).map(async row => ({
      ...row,
      asset: await serializeAsset(c.env, {
        ...row,
        id: row.asset_id,
        name: row.asset_name,
        source_output_id: null,
        created_at: row.created_at,
      }),
    }))
  )
  const serializedVersions = await Promise.all(
    (versions.results || []).map(async row => ({
      ...row,
      asset: await serializeAsset(c.env, {
        ...row,
        id: row.asset_id,
        name: row.asset_name,
        source_output_id: null,
        created_at: row.created_at,
      }),
    }))
  )

  return c.json({
    project,
    entities: entities.results || [],
    entityAssets: serializedEntityAssets,
    frames: serializedFrames,
    shots: shots.results || [],
    versions: serializedVersions,
    sequence: sequence.results || [],
  })
}

export async function handleUpdateStudioProject(c: AuthenticatedContext) {
  const projectId = c.req.param("id") || ""
  if (!(await getOwnedProject(c, projectId))) return c.json({ error: "Project not found" }, 404)
  const body: { name?: string; description?: string; aspect_ratio?: string; status?: string } =
    await c.req.json().catch(() => ({}))
  const updates: string[] = []
  const values: Array<string | number | null> = []
  for (const key of ["name", "description", "aspect_ratio", "status"] as const) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`)
      values.push(body[key]?.trim() || null)
    }
  }
  if (!updates.length) return c.json({ error: "No fields to update" }, 400)
  updates.push("updated_at = ?")
  values.push(now(), projectId)
  await c.env.DB.prepare(`UPDATE studio_projects SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run()
  return c.json({ success: true })
}

export async function handleDeleteStudioProject(c: AuthenticatedContext) {
  const projectId = c.req.param("id") || ""
  if (!(await getOwnedProject(c, projectId))) return c.json({ error: "Project not found" }, 404)
  const timestamp = now()
  await c.env.DB.prepare("UPDATE studio_projects SET deleted_at = ?, updated_at = ? WHERE id = ?")
    .bind(timestamp, timestamp, projectId)
    .run()
  return c.json({ success: true })
}

export async function handleCreateStudioEntity(c: AuthenticatedContext) {
  const projectId = c.req.param("id") || ""
  if (!(await getOwnedProject(c, projectId))) return c.json({ error: "Project not found" }, 404)
  const body: { name?: string; description?: string; type?: string; asset_ids?: string[] } =
    await c.req.json().catch(() => ({}))
  if (!body.name?.trim()) return c.json({ error: "Entity name is required" }, 400)
  const id = uuidv4()
  const timestamp = now()
  const statements = [
    c.env.DB.prepare(
      "INSERT INTO studio_entities (id, project_id, name, description, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id,
      projectId,
      body.name.trim().slice(0, 120),
      body.description?.trim() || null,
      body.type || "character",
      timestamp,
      timestamp
    ),
  ]
  for (const [index, assetId] of (body.asset_ids || []).entries()) {
    if (await getOwnedAsset(c, assetId))
      statements.push(
        c.env.DB.prepare(
          "INSERT OR IGNORE INTO studio_entity_assets (entity_id, asset_id, sort_order, created_at) VALUES (?, ?, ?, ?)"
        ).bind(id, assetId, index, timestamp)
      )
  }
  await c.env.DB.batch(statements)
  return c.json({ entityId: id }, 201)
}

export async function handleCreateStudioFrame(c: AuthenticatedContext) {
  const projectId = c.req.param("id") || ""
  if (!(await getOwnedProject(c, projectId))) return c.json({ error: "Project not found" }, 404)
  const body: { asset_id?: string; label?: string; frame_type?: string } = await c.req
    .json()
    .catch(() => ({}))
  if (!body.asset_id || !(await getOwnedAsset(c, body.asset_id)))
    return c.json({ error: "Asset not found" }, 404)
  const id = uuidv4()
  await c.env.DB.prepare(
    "INSERT INTO studio_frames (id, project_id, asset_id, label, frame_type, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(
      id,
      projectId,
      body.asset_id,
      body.label?.trim() || null,
      body.frame_type || "storyboard",
      now()
    )
    .run()
  return c.json({ frameId: id }, 201)
}

export async function handleCreateStudioShot(c: AuthenticatedContext) {
  const projectId = c.req.param("id") || ""
  if (!(await getOwnedProject(c, projectId))) return c.json({ error: "Project not found" }, 404)
  const body: {
    name?: string
    prompt?: string
    asset_id?: string
    first_frame_asset_id?: string
    last_frame_asset_id?: string
  } = await c.req.json().catch(() => ({}))
  if (!body.name?.trim()) return c.json({ error: "Shot name is required" }, 400)
  const asset = body.asset_id ? await getOwnedAsset(c, body.asset_id) : null
  if (body.asset_id && (!asset || asset.kind !== "video"))
    return c.json({ error: "Shot asset must be a video" }, 400)
  const id = uuidv4()
  const versionId = asset ? uuidv4() : null
  const sequenceId = uuidv4()
  const timestamp = now()
  const position = await c.env.DB.prepare(
    "SELECT COALESCE(MAX(position), -1) + 1 AS position FROM studio_sequence_items WHERE project_id = ?"
  )
    .bind(projectId)
    .first<{ position: number }>()
  const statements = [
    c.env.DB.prepare(
      "INSERT INTO studio_shots (id, project_id, name, prompt, duration_ms, first_frame_asset_id, last_frame_asset_id, active_version_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id,
      projectId,
      body.name.trim().slice(0, 120),
      body.prompt?.trim() || null,
      asset?.duration_ms || null,
      body.first_frame_asset_id || null,
      body.last_frame_asset_id || null,
      versionId,
      asset ? "ready" : "draft",
      timestamp,
      timestamp
    ),
    c.env.DB.prepare(
      "INSERT INTO studio_sequence_items (id, project_id, shot_id, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(sequenceId, projectId, id, position?.position ?? 0, timestamp, timestamp),
    c.env.DB.prepare("UPDATE studio_projects SET updated_at = ? WHERE id = ?").bind(
      timestamp,
      projectId
    ),
  ]
  if (asset && versionId)
    statements.push(
      c.env.DB.prepare(
        "INSERT INTO studio_shot_versions (id, shot_id, asset_id, version_number, created_at) VALUES (?, ?, ?, 1, ?)"
      ).bind(versionId, id, asset.id, timestamp)
    )
  await c.env.DB.batch(statements)
  return c.json({ shotId: id }, 201)
}

export async function handleAddStudioShotVersion(c: AuthenticatedContext) {
  const shotId = c.req.param("shotId") || ""
  const user = c.get("user")
  const shot = user
    ? await c.env.DB.prepare(
        "SELECT s.* FROM studio_shots s INNER JOIN studio_projects p ON p.id = s.project_id WHERE s.id = ? AND p.user_id = ? AND p.deleted_at IS NULL"
      )
        .bind(shotId, user.userId)
        .first<any>()
    : null
  if (!shot) return c.json({ error: "Shot not found" }, 404)
  const body: { asset_id?: string } = await c.req.json().catch(() => ({}))
  const asset = body.asset_id ? await getOwnedAsset(c, body.asset_id) : null
  if (!asset || asset.kind !== "video") return c.json({ error: "Video asset not found" }, 404)
  const version = await c.env.DB.prepare(
    "SELECT COALESCE(MAX(version_number), 0) + 1 AS value FROM studio_shot_versions WHERE shot_id = ?"
  )
    .bind(shotId)
    .first<{ value: number }>()
  const id = uuidv4()
  const timestamp = now()
  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO studio_shot_versions (id, shot_id, asset_id, version_number, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, shotId, asset.id, version?.value ?? 1, timestamp),
    c.env.DB.prepare(
      "UPDATE studio_shots SET active_version_id = ?, duration_ms = ?, status = 'ready', updated_at = ? WHERE id = ?"
    ).bind(id, asset.duration_ms || null, timestamp, shotId),
  ])
  return c.json({ versionId: id }, 201)
}

export async function handleReorderStudioSequence(c: AuthenticatedContext) {
  const projectId = c.req.param("id") || ""
  if (!(await getOwnedProject(c, projectId))) return c.json({ error: "Project not found" }, 404)
  const body: { shot_ids?: string[] } = await c.req.json().catch(() => ({}))
  if (!Array.isArray(body.shot_ids)) return c.json({ error: "shot_ids is required" }, 400)
  const timestamp = now()
  const statements = [
    c.env.DB.prepare(
      "UPDATE studio_sequence_items SET position = -position - 1 WHERE project_id = ?"
    ).bind(projectId),
  ]
  body.shot_ids.forEach((shotId, position) =>
    statements.push(
      c.env.DB.prepare(
        "UPDATE studio_sequence_items SET position = ?, updated_at = ? WHERE project_id = ? AND shot_id = ?"
      ).bind(position, timestamp, projectId, shotId)
    )
  )
  await c.env.DB.batch(statements)
  return c.json({ success: true })
}
