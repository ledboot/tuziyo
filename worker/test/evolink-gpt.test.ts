import { describe, expect, test } from "bun:test"
import { IMAGE_MODEL_CATALOG } from "../src/imageModels"
import { buildEvoLinkPayload, getStoredImageDimensions } from "../src/routes/image"
import { calculateRequiredCredits } from "../src/routes/credits"

describe("EvoLink GPT Image 2", () => {
  test("stores ratio-like provider sizes as aspect ratios", () => {
    expect(IMAGE_MODEL_CATALOG["openai/gpt-image-2"].options.size).toMatchObject({
      name: "Size",
      defaultValue: "1:1",
    })
    expect(IMAGE_MODEL_CATALOG["openai/gpt-image-2"].options.aspect_ratio).toBeUndefined()

    expect(
      buildEvoLinkPayload("gpt-image-2", {
        model: "openai/gpt-image-2",
        prompt: "A cinematic rabbit",
        size: "16:9",
      }).size
    ).toBe("16:9")
    expect(getStoredImageDimensions({ size: "16:9" })).toEqual({
      aspectRatio: "16:9",
      imageSize: null,
    })
    expect(getStoredImageDimensions({ size: "1024x768" })).toEqual({
      aspectRatio: null,
      imageSize: "1024x768",
    })
  })

  test("catalog models expose only their actual size or aspect-ratio option", () => {
    const sizeModels = Object.entries(IMAGE_MODEL_CATALOG)
      .filter(([, model]) => model.options.size)
      .map(([id]) => id)

    expect(sizeModels).toEqual([
      "openai/gpt-image-1.5",
      "alibaba/wan-2.6-image",
      "openai/gpt-image-2",
    ])
    for (const modelId of sizeModels) {
      expect(IMAGE_MODEL_CATALOG[modelId].options.aspect_ratio).toBeUndefined()
    }
  })

  test("exposes a one-to-five image selector", () => {
    expect(IMAGE_MODEL_CATALOG["openai/gpt-image-2"].options.num_images).toMatchObject({
      values: ["1", "2", "3", "4", "5"],
      defaultValue: "1",
    })
  })

  test("sends the selected count and caps direct payloads at five", () => {
    expect(
      buildEvoLinkPayload("gpt-image-2", {
        model: "openai/gpt-image-2",
        prompt: "Five rabbit illustrations",
        num_images: 5,
      }).n
    ).toBe(5)

    expect(
      buildEvoLinkPayload("gpt-image-2", {
        model: "openai/gpt-image-2",
        prompt: "Too many rabbit illustrations",
        num_images: 99,
      }).n
    ).toBe(5)
  })

  test("calculates credits for every requested image", () => {
    expect(
      calculateRequiredCredits("openai/gpt-image-2", {
        num_images: 5,
        quality: "low",
        resolution: "1K",
      })
    ).toBe(25)
  })
})
