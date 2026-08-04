// @ts-expect-error Bun provides this module at test runtime; the app tsconfig intentionally uses Node types.
import { describe, expect, test } from "bun:test"
import type { ReferenceMediaConstraints } from "./api"
import {
  validateReferenceFile,
  validateReferenceImage,
  validateReferenceSelection,
} from "./referenceMediaValidation"

const constraints: ReferenceMediaConstraints = {
  totalMaxBytes: 64_000_000,
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 30_000_000,
    minWidth: 300,
    maxWidth: 6000,
    minHeight: 300,
    maxHeight: 6000,
    minAspectRatio: 0.4,
    maxAspectRatio: 2.5,
  },
  video: {
    mimeTypes: ["video/mp4", "video/quicktime"],
    maxBytes: 50_000_000,
    minWidth: 300,
    maxWidth: 6000,
    minHeight: 300,
    maxHeight: 6000,
    minAspectRatio: 0.4,
    maxAspectRatio: 2.5,
    minDurationSeconds: 2,
    maxDurationSeconds: 15,
    maxTotalDurationSeconds: 15,
    minFramePixels: 409_600,
    maxFramePixels: 2_086_876,
    minFps: 24,
    maxFps: 60,
  },
  audio: {
    mimeTypes: ["audio/mpeg", "audio/wav"],
    maxBytes: 15_000_000,
    minDurationSeconds: 2,
    maxDurationSeconds: 15,
    maxTotalDurationSeconds: 15,
  },
}

function file(type: string, size: number) {
  return { type, size } as File
}

describe("Seedance reference media validation", () => {
  test("accepts documented image and video boundaries", () => {
    expect(
      validateReferenceFile(
        file("image/png", 30_000_000),
        "image",
        { width: 300, height: 300 },
        constraints
      )
    ).toBeNull()
    expect(
      validateReferenceFile(
        file("video/mp4", 50_000_000),
        "video",
        { width: 640, height: 640, durationSeconds: 15, fps: 60 },
        constraints
      )
    ).toBeNull()
  })

  test("rejects invalid pixels, duration, fps, and aggregate limits", () => {
    expect(
      validateReferenceFile(
        file("video/mp4", 1),
        "video",
        { width: 600, height: 600, durationSeconds: 1.9, fps: 30 },
        constraints
      )
    ).toContain("2–15 seconds")
    expect(
      validateReferenceFile(
        file("video/mp4", 1),
        "video",
        { width: 640, height: 640, durationSeconds: 5, fps: 23.9 },
        constraints
      )
    ).toContain("24–60 FPS")
    expect(
      validateReferenceSelection(
        [
          { kind: "video", size: 50_000_000, durationSeconds: 10, status: "uploaded" },
          { kind: "audio", size: 15_000_000, durationSeconds: 6, status: "uploaded" },
        ],
        constraints
      )
    ).toContain("64MB")
    expect(
      validateReferenceSelection(
        [
          { kind: "video", size: 1, durationSeconds: 8, status: "uploaded" },
          { kind: "video", size: 1, durationSeconds: 8, status: "uploaded" },
        ],
        constraints
      )
    ).toContain("15 seconds")
  })
})

describe("Kling reference image validation", () => {
  const klingConstraints = {
    mimeTypes: ["image/jpeg", "image/png"],
    maxBytes: 10_000_000,
    minWidth: 300,
    minHeight: 300,
    minAspectRatio: 0.4,
    maxAspectRatio: 2.5,
  }

  test("accepts documented boundaries", () => {
    expect(
      validateReferenceImage(
        file("image/jpeg", 10_000_000),
        { width: 300, height: 750 },
        klingConstraints
      )
    ).toBeNull()
  })

  test("rejects WEBP, oversized, undersized, and invalid-ratio images", () => {
    expect(
      validateReferenceImage(file("image/webp", 1), { width: 300, height: 300 }, klingConstraints)
    ).toContain("format")
    expect(
      validateReferenceImage(
        file("image/png", 10_000_001),
        { width: 300, height: 300 },
        klingConstraints
      )
    ).toContain("10MB")
    expect(
      validateReferenceImage(file("image/png", 1), { width: 299, height: 300 }, klingConstraints)
    ).toContain("at least 300px")
    expect(
      validateReferenceImage(file("image/png", 1), { width: 300, height: 751 }, klingConstraints)
    ).toContain("0.4–2.5")
  })
})
