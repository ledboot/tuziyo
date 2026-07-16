import { describe, expect, test } from "bun:test"
import {
  IMAGE_MODEL_CATALOG,
  getImageModelPromptMaxLength,
  getPromptCharacterLength,
} from "../src/imageModels"
import { buildEvoLinkPayload, getModels, handleGenerate } from "../src/routes/image"

const referenceImages = [
  {
    key: "references/one.png",
    url: "https://cdn.example.com/one.png",
    contentType: "image/png",
    size: 123,
  },
]

describe("EvoLink Nano Banana models", () => {
  test("registers all documented models and reference-image limits", () => {
    expect(IMAGE_MODEL_CATALOG["google/nano-banana"].referenceImageCount).toBe(5)
    expect(IMAGE_MODEL_CATALOG["google/nano-banana-pro"].referenceImageCount).toBe(14)
    expect(IMAGE_MODEL_CATALOG["google/nano-banana-2"].referenceImageCount).toBe(14)
    expect(IMAGE_MODEL_CATALOG["google/nano-banana-2-lite"].referenceImageCount).toBe(14)
    expect(getModels().some(model => model.id === "google/nano-banana-2-lite")).toBe(true)
  })

  test("defines prompt limits for every model", () => {
    expect(
      Object.values(IMAGE_MODEL_CATALOG).every(
        model => Number.isInteger(model.promptMaxLength) && model.promptMaxLength > 0
      )
    ).toBe(true)
    expect(getImageModelPromptMaxLength("google/nano-banana-2-lite")).toBe(2000)
    expect(getImageModelPromptMaxLength("openai/gpt-image-1.5")).toBe(2000)
    expect(getImageModelPromptMaxLength("openai/gpt-image-2")).toBe(32000)
    expect(getImageModelPromptMaxLength("missing/model")).toBeNull()
    expect(getPromptCharacterLength("兔子🐰")).toBe(3)
  })

  test("matches EvoLink prompt maxLength values", () => {
    const expectedLimits: Record<string, number> = {
      "google/nano-banana-2-lite": 2000,
      "google/nano-banana-2": 2000,
      "google/nano-banana-pro": 2000,
      "google/nano-banana": 2000,
      "bytedance/seedream-4.0": 2000,
      "bytedance/seedream-4.5": 2000,
      "bytedance/seedream-5-lite": 2000,
      "bytedance/seedream-5-pro": 2000,
      "openai/gpt-image-1.5": 2000,
      "openai/gpt-image-2": 32000,
    }

    for (const [modelId, maxLength] of Object.entries(expectedLimits)) {
      expect(getImageModelPromptMaxLength(modelId)).toBe(maxLength)
    }
  })

  test("rejects an over-limit prompt before accessing Worker bindings", async () => {
    const response = await handleGenerate({
      get: () => ({
        userId: "user-1",
        email: "user@example.com",
        name: "User",
        userType: "starter",
        credits: 100,
      }),
      req: {
        json: async () => ({
          model: "google/nano-banana-2-lite",
          prompt: "x".repeat(2001),
        }),
      },
      json: (body: unknown, status = 200) => Response.json(body, { status }),
    } as never)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "prompt must not exceed 2,000 characters" })
  })

  test("builds Nano Banana 2 Lite payload", () => {
    expect(
      buildEvoLinkPayload(
        "gemini-3.1-flash-lite-image",
        {
          model: "google/nano-banana-2-lite",
          prompt: "A cat",
          aspect_ratio: "16:9",
          resolution: "1K",
          thinking_level: "min",
          num_images: 4,
        },
        "https://api.tuziyo.com/api/evolink/callback",
        referenceImages
      )
    ).toEqual({
      model: "gemini-3.1-flash-lite-image",
      prompt: "A cat",
      callback_url: "https://api.tuziyo.com/api/evolink/callback",
      size: "16:9",
      quality: "1K",
      model_params: { thinking_level: "min" },
      image_urls: ["https://cdn.example.com/one.png"],
    })
  })

  test("builds Nano Banana 2 payload with documented search options", () => {
    expect(
      buildEvoLinkPayload("gemini-3.1-flash-image-preview", {
        model: "google/nano-banana-2",
        prompt: "A current city poster",
        aspect_ratio: "1:4",
        resolution: "4K",
        google_search: "true",
        image_search: true,
        thinking_level: "high",
      })
    ).toEqual({
      model: "gemini-3.1-flash-image-preview",
      prompt: "A current city poster",
      size: "1:4",
      quality: "4K",
      model_params: { web_search: true, image_search: true, thinking_level: "high" },
    })
  })

  test("builds Nano Banana Pro payload without unsupported fields", () => {
    expect(
      buildEvoLinkPayload("gemini-3-pro-image-preview", {
        model: "google/nano-banana-pro",
        prompt: "A product photo",
        aspect_ratio: "4:5",
        resolution: "2K",
        google_search: false,
        image_search: true,
        thinking_level: "high",
      })
    ).toEqual({
      model: "gemini-3-pro-image-preview",
      prompt: "A product photo",
      size: "4:5",
      quality: "2K",
      model_params: { web_search: false },
    })
  })

  test("builds original Nano Banana payload", () => {
    expect(
      buildEvoLinkPayload(
        "nano-banana-beta",
        {
          model: "google/nano-banana",
          prompt: "Edit this image",
          aspect_ratio: "3:4",
        },
        undefined,
        referenceImages
      )
    ).toEqual({
      model: "nano-banana-beta",
      prompt: "Edit this image",
      size: "3:4",
      image_urls: ["https://cdn.example.com/one.png"],
    })
  })
})
