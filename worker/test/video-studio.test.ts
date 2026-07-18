import { Database } from "bun:sqlite"
import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { MIME_TYPES } from "../src/const"
import { calculateRequiredCredits } from "../src/routes/credits"
import { buildEvoLinkPayload, getModels } from "../src/routes/image"
import { getVideoProviderModel } from "../src/videoModels"

describe("video generation catalog", () => {
  test("exposes Seedance 2.0 as a video model", () => {
    const model = getModels().find(item => item.id === "bytedance/seedance-2.0")
    expect(model).toMatchObject({
      mediaType: "video",
      supportsImage: true,
      supportsStartFrame: true,
      supportsEndFrame: true,
      supportsAudio: true,
      pricingMode: "per_second",
      creditsPerSecond: 8,
      pollTimeoutSeconds: 1200,
    })
    expect(model?.generationModes).toEqual(["text_to_video", "image_to_video"])
  })

  test("exposes every requested EvoLink video model through the models API", () => {
    const videoModels = getModels().filter(model => model.mediaType === "video")
    expect(videoModels.map(model => model.id)).toEqual([
      "bytedance/seedance-2.0",
      "bytedance/seedance-2.0-mini",
      "google/gemini-omni-flash",
      "kling/kling-3.0-turbo",
      "kling/kling-3.0",
      "google/veo-3.1",
      "xai/grok-imagine-video",
      "happyhorse/happyhorse-1.1",
    ])
    for (const model of videoModels) {
      expect(model.generationModes).toEqual(["text_to_video", "image_to_video"])
      expect(model.options?.duration?.values.length).toBeGreaterThan(0)
      expect(model).not.toHaveProperty("providerConfig")
    }
  })

  test("maps public model IDs and generation modes to EvoLink model IDs", () => {
    expect(getVideoProviderModel("bytedance/seedance-2.0-mini", "image_to_video")).toBe(
      "seedance-2.0-mini-image-to-video"
    )
    expect(getVideoProviderModel("google/gemini-omni-flash", "text_to_video")).toBe(
      "gemini-omni-flash-text-to-video"
    )
    expect(getVideoProviderModel("kling/kling-3.0-turbo", "image_to_video")).toBe(
      "kling-v3-turbo-image-to-video"
    )
    expect(getVideoProviderModel("kling/kling-3.0", "text_to_video")).toBe("kling-v3-text-to-video")
    expect(getVideoProviderModel("google/veo-3.1", "image_to_video")).toBe(
      "veo-3.1-generate-preview"
    )
    expect(getVideoProviderModel("xai/grok-imagine-video", "text_to_video")).toBe(
      "grok-imagine-text-to-video-beta"
    )
    expect(getVideoProviderModel("happyhorse/happyhorse-1.1", "image_to_video")).toBe(
      "happyhorse-1.1-image-to-video"
    )
  })

  test("builds documented text-to-video and image-to-video payloads", () => {
    const baseInput = {
      model: "bytedance/seedance-2.0",
      prompt: "A rabbit runs through a neon city",
      media_type: MIME_TYPES.VIDEO,
      duration: "8",
      resolution: "1080p",
      aspect_ratio: "9:16",
      generate_audio: "true",
    } as const
    expect(
      buildEvoLinkPayload("seedance-2.0-text-to-video", baseInput, "https://example.com/callback")
    ).toEqual({
      model: "seedance-2.0-text-to-video",
      prompt: baseInput.prompt,
      duration: 8,
      quality: "1080p",
      aspect_ratio: "9:16",
      generate_audio: true,
      callback_url: "https://example.com/callback",
    })
    expect(
      buildEvoLinkPayload(
        "seedance-2.0-image-to-video",
        { ...baseInput, generation_mode: "image_to_video" },
        undefined,
        [
          {
            key: "reference.png",
            url: "https://example.com/reference.png",
            contentType: "image/png",
            size: 1,
          },
        ]
      ).image_urls
    ).toEqual(["https://example.com/reference.png"])
  })

  test("calculates video credits per second and resolution premium", () => {
    expect(
      calculateRequiredCredits("bytedance/seedance-2.0", { duration: 5, resolution: "720p" })
    ).toBe(40)
    expect(
      calculateRequiredCredits("bytedance/seedance-2.0", { duration: "5", resolution: "1080p" })
    ).toBe(60)
  })

  test("converts unified controls to model-specific EvoLink video fields", () => {
    const commonInput = {
      model: "kling/kling-3.0",
      prompt: "A cinematic horse running through shallow water",
      media_type: MIME_TYPES.VIDEO,
      generation_mode: "text_to_video" as const,
      duration: "5",
      resolution: "1080p",
      aspect_ratio: "16:9",
      generate_audio: "true",
    }
    expect(buildEvoLinkPayload("kling-v3-text-to-video", commonInput)).toMatchObject({
      duration: 5,
      quality: "1080p",
      aspect_ratio: "16:9",
      sound: "on",
    })
    expect(
      buildEvoLinkPayload("veo-3.1-generate-preview", {
        ...commonInput,
        model: "google/veo-3.1",
        generation_mode: "image_to_video",
        duration: "8",
        negative_prompt: "blurry",
      })
    ).toMatchObject({
      generation_type: "FIRST&LAST",
      duration: 8,
      quality: "1080p",
      generate_audio: true,
      negative_prompt: "blurry",
    })
    expect(
      buildEvoLinkPayload("grok-imagine-text-to-video-beta", {
        ...commonInput,
        model: "xai/grok-imagine-video",
        duration: "30",
        resolution: "480p",
        mode: "fun",
      })
    ).toMatchObject({ duration: 30, quality: "480p", mode: "fun" })
    expect(
      buildEvoLinkPayload("gemini-omni-flash-text-to-video", {
        ...commonInput,
        model: "google/gemini-omni-flash",
        duration: "auto",
        aspect_ratio: "auto",
      })
    ).toEqual({
      model: "gemini-omni-flash-text-to-video",
      prompt: commonInput.prompt,
      duration: "auto",
      aspect_ratio: "auto",
    })
  })
})

describe("media, library, and Studio migrations", () => {
  test("upgrades a legacy message output and backfills an asset", () => {
    const db = new Database(":memory:")
    db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE users (id TEXT PRIMARY KEY);
      CREATE TABLE messages (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, model TEXT NOT NULL, prompt TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      CREATE TABLE message_outputs (
        id TEXT PRIMARY KEY, message_id TEXT NOT NULL, status TEXT NOT NULL,
        image_url TEXT, content_type TEXT NOT NULL, width INTEGER, height INTEGER,
        file_size INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
        FOREIGN KEY(message_id) REFERENCES messages(id)
      );
      INSERT INTO users VALUES ('user-1');
      INSERT INTO messages VALUES ('message-1', 'user-1', 'image-model', 'A rabbit');
      INSERT INTO message_outputs VALUES (
        'output-1', 'message-1', 'completed', 'generated-images/user-1/rabbit.png',
        'image', 1024, 1024, 100, 1, 1
      );
    `)
    for (const file of [
      "0008_media_generation.sql",
      "0009_assets_library.sql",
      "0010_studio_lite.sql",
    ]) {
      db.exec(readFileSync(join(import.meta.dir, `../../db/migrations/${file}`), "utf8"))
    }
    expect(db.query("SELECT media_type FROM messages WHERE id = 'message-1'").get()).toEqual({
      media_type: "image",
    })
    expect(
      db.query("SELECT id, kind, storage_key FROM assets WHERE source_output_id = 'output-1'").get()
    ).toEqual({
      id: "asset-output-1",
      kind: "image",
      storage_key: "generated-images/user-1/rabbit.png",
    })
    expect(db.query("SELECT asset_id FROM message_outputs WHERE id = 'output-1'").get()).toEqual({
      asset_id: "asset-output-1",
    })
    expect(
      db
        .query(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'studio_sequence_items'"
        )
        .get()
    ).toEqual({ name: "studio_sequence_items" })
    db.close()
  })

  test("fresh schema includes assets and Studio tables", () => {
    const db = new Database(":memory:")
    db.exec(readFileSync(join(import.meta.dir, "../../db/schema.sql"), "utf8"))
    const tables = db.query("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{
      name: string
    }>
    const names = new Set(tables.map(table => table.name))
    expect(names.has("assets")).toBe(true)
    expect(names.has("studio_projects")).toBe(true)
    expect(names.has("studio_shot_versions")).toBe(true)
    expect(names.has("studio_render_jobs")).toBe(true)
    db.close()
  })
})
