import { describe, expect, test } from "bun:test"
import {
  createGeneratedAudioKey,
  createGeneratedVideoKey,
  createReferenceMediaKey,
  getGeneratedAudioPrefix,
  getGeneratedVideoPrefix,
  getReferenceMediaPrefix,
} from "../src/utils"

describe("R2 media directories", () => {
  test("uses separate reference directories for video and audio", () => {
    expect(getReferenceMediaPrefix("user/1", "video")).toBe("reference-video/user_1/")
    expect(getReferenceMediaPrefix("user/1", "audio")).toBe("reference-audio/user_1/")
    expect(createReferenceMediaKey("user/1", "video", "video/mp4")).toMatch(
      /^reference-video\/user_1\/\d{4}\/\d{4}\/[^/]+\.mp4$/
    )
    expect(createReferenceMediaKey("user/1", "audio", "audio/mpeg")).toMatch(
      /^reference-audio\/user_1\/\d{4}\/\d{4}\/[^/]+\.mp3$/
    )
  })

  test("uses separate generated directories for video and audio", () => {
    expect(getGeneratedVideoPrefix("user/1")).toBe("generated-video/user_1/")
    expect(getGeneratedAudioPrefix("user/1")).toBe("generated-audio/user_1/")
    expect(createGeneratedVideoKey("user/1", "mp4")).toMatch(
      /^generated-video\/user_1\/\d{4}\/\d{4}\/[^/]+\.mp4$/
    )
    expect(createGeneratedAudioKey("user/1", "mp3")).toMatch(
      /^generated-audio\/user_1\/\d{4}\/\d{4}\/[^/]+\.mp3$/
    )
  })
})
