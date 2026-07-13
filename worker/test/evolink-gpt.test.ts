import { describe, expect, test } from "bun:test"
import { IMAGE_MODEL_CATALOG } from "../src/imageModels"
import { buildEvoLinkPayload } from "../src/routes/image"
import { calculateRequiredCredits } from "../src/routes/credits"

describe("EvoLink GPT Image 2", () => {
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
