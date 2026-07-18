import { describe, expect, test } from "bun:test"
import { buildAiInput, buildEvoLinkPayload, getModels } from "../src/routes/image"
import { IMAGE_MODEL_CATALOG, isImageModelEnabled } from "../src/imageModels"

describe("Seedream 5 Pro EvoLink integration", () => {
  test("exposes the model with the supported reference-image limit", () => {
    const model = getModels().find(item => item.id === "bytedance/seedream-5-pro")

    expect(model).toBeDefined()
    expect(model?.supportsImage).toBe(true)
    expect(model?.referenceImageCount).toBe(10)
    expect(model?.credits).toBe(3)
  })

  test("uses the same enabled switch for model discovery and request validation", () => {
    const model = IMAGE_MODEL_CATALOG["bytedance/seedream-5-pro"]
    const originalEnabled = model.enabled

    try {
      model.enabled = false
      expect(isImageModelEnabled("bytedance/seedream-5-pro")).toBe(false)
      expect(getModels().some(item => item.id === "bytedance/seedream-5-pro")).toBe(false)
    } finally {
      model.enabled = originalEnabled
    }
  })

  test("groups providers by sort order and sorts model names naturally", () => {
    const models = getModels().filter(model => model.mediaType !== "video")
    const providers = models.map(model => model.provider)
    const providerGroups = providers.filter(
      (provider, index) => index === 0 || provider !== providers[index - 1]
    )

    expect(providerGroups).toEqual(["ByteDance", "Google", "OpenAI"])

    for (const provider of providerGroups) {
      const providerModels = models.filter(model => model.provider === provider)
      const names = providerModels.map(model => model.name)
      const sortedNames = [...names].sort((left, right) =>
        left.localeCompare(right, "en", { numeric: true, sensitivity: "base" })
      )

      expect(names).toEqual(sortedNames)
      expect(new Set(providerModels.map(model => model.sortOrder)).size).toBe(1)
    }
  })

  test("builds the documented EvoLink request shape", () => {
    const payload = buildEvoLinkPayload(
      "doubao-seedream-5.0-pro",
      {
        model: "bytedance/seedream-5-pro",
        prompt: "Create a product poster",
        aspect_ratio: "16:9",
        resolution: "2K",
        output_format: "png",
        num_images: 4,
      },
      "https://api.tuziyo.com/api/evolink/callback",
      [
        {
          key: "references/one.png",
          url: "https://cdn.example.com/one.png",
          contentType: "image/png",
          size: 123,
        },
      ]
    )

    expect(payload).toEqual({
      model: "doubao-seedream-5.0-pro",
      prompt: "Create a product poster",
      n: 1,
      callback_url: "https://api.tuziyo.com/api/evolink/callback",
      size: "16:9",
      quality: "2K",
      model_params: { output_format: "png" },
      image_urls: ["https://cdn.example.com/one.png"],
    })
  })

  test("uses safe API defaults and maps UI options", () => {
    expect(
      buildEvoLinkPayload("doubao-seedream-5.0-pro", {
        model: "bytedance/seedream-5-pro",
        prompt: "A rabbit",
      })
    ).toMatchObject({
      n: 1,
      size: "auto",
      quality: "1K",
      model_params: { output_format: "jpeg" },
    })

    expect(
      buildAiInput({
        model: "bytedance/seedream-5-pro",
        prompt: "A rabbit",
        aspect_ratio: "4:3",
        resolution: "2K",
        output_format: "jpeg",
      })
    ).toEqual({
      prompt: "A rabbit",
      size: "4:3",
      quality: "2K",
      model_params: { output_format: "jpeg" },
    })
  })
})
