import { Database } from "bun:sqlite"
import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { MIME_TYPES } from "../src/const"
import { calculateRequiredCredits } from "../src/routes/credits"
import {
  buildEvoLinkPayload,
  getModels,
  getReferenceMediaTotalDurationError,
  getReferenceMediaTotalSizeError,
} from "../src/routes/image"
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
      creditsPerSecond: 4,
      pollTimeoutSeconds: 1200,
    })
    expect(model?.generationModes).toEqual([
      "text_to_video",
      "image_to_video",
      "reference_to_video",
    ])
    expect(model?.videoInputModes).toEqual([
      {
        id: "start_end_frame",
        label: "Start & End Frame",
        generationMode: "image_to_video",
        imageCount: 2,
      },
      {
        id: "image_reference",
        label: "Image Reference",
        generationMode: "reference_to_video",
        imageCount: 9,
        audioCount: 3,
        requiresImageOrVideo: true,
        referenceTagStyle: "at",
      },
      {
        id: "video_reference",
        label: "Video Reference",
        generationMode: "reference_to_video",
        imageCount: 9,
        videoCount: 3,
        audioCount: 3,
        requiresImageOrVideo: true,
        referenceTagStyle: "at",
      },
    ])
  })

  test("exposes Seedance 2.0 Fast with all three documented generation modes", () => {
    const model = getModels().find(item => item.id === "bytedance/seedance-2.0-fast")
    expect(model).toMatchObject({
      name: "Seedance 2.0 Fast",
      mediaType: "video",
      supportsImage: true,
      supportsStartFrame: true,
      supportsEndFrame: true,
      supportsAudio: true,
      pricingMode: "per_second",
      creditsPerSecond: 4,
      pollTimeoutSeconds: 1200,
      options: {
        resolution: {
          values: ["480p", "720p"],
          defaultValue: "480p",
          valueCredits: { "720p": 3 },
        },
      },
    })
    expect(model?.generationModes).toEqual([
      "text_to_video",
      "image_to_video",
      "reference_to_video",
    ])
    expect(model?.videoInputModes).toEqual([
      {
        id: "start_end_frame",
        label: "Start & End Frame",
        generationMode: "image_to_video",
        imageCount: 2,
      },
      {
        id: "image_reference",
        label: "Image Reference",
        generationMode: "reference_to_video",
        imageCount: 9,
        audioCount: 3,
        requiresImageOrVideo: true,
        referenceTagStyle: "at",
      },
      {
        id: "video_reference",
        label: "Video Reference",
        generationMode: "reference_to_video",
        imageCount: 9,
        videoCount: 3,
        audioCount: 3,
        requiresImageOrVideo: true,
        referenceTagStyle: "at",
      },
    ])
  })

  test("requires an image or video when every Seedance 2.0 variant uses reference audio", () => {
    for (const modelId of [
      "bytedance/seedance-2.0",
      "bytedance/seedance-2.0-fast",
      "bytedance/seedance-2.0-mini",
    ]) {
      const model = getModels().find(item => item.id === modelId)
      const referenceModes = model?.videoInputModes?.filter(
        mode => mode.generationMode === "reference_to_video" && (mode.audioCount ?? 0) > 0
      )

      expect(referenceModes?.length).toBeGreaterThan(0)
      for (const mode of referenceModes ?? []) {
        expect(mode.requiresImageOrVideo).toBe(true)
      }
    }
  })

  test("publishes and enforces Seedance reference media limits", () => {
    for (const modelId of [
      "bytedance/seedance-2.0",
      "bytedance/seedance-2.0-fast",
      "bytedance/seedance-2.0-mini",
    ]) {
      const model = getModels().find(item => item.id === modelId)
      expect(model?.referenceMediaConstraints).toMatchObject({
        totalMaxBytes: 64_000_000,
        image: {
          maxBytes: 30_000_000,
          minWidth: 300,
          maxWidth: 6000,
          minAspectRatio: 0.4,
          maxAspectRatio: 2.5,
        },
        video: {
          maxBytes: 50_000_000,
          minDurationSeconds: 2,
          maxDurationSeconds: 15,
          maxTotalDurationSeconds: 15,
          minFramePixels: 409_600,
          maxFramePixels: 2_086_876,
          minFps: 24,
          maxFps: 60,
        },
        audio: {
          maxBytes: 15_000_000,
          minDurationSeconds: 2,
          maxDurationSeconds: 15,
          maxTotalDurationSeconds: 15,
        },
      })
      expect(
        getReferenceMediaTotalSizeError(model!, [
          { key: "image", contentType: "image/png", size: 30_000_000 },
          { key: "video", contentType: "video/mp4", size: 34_000_000 },
        ])
      ).toBeNull()
      expect(
        getReferenceMediaTotalSizeError(model!, [
          { key: "image", contentType: "image/png", size: 30_000_000 },
          { key: "video", contentType: "video/mp4", size: 34_000_001 },
        ])
      ).toBe("Reference materials must not exceed 64MB in total")
      expect(
        getReferenceMediaTotalDurationError(
          model!,
          [
            { key: "video-1", contentType: "video/mp4", size: 1, durationSeconds: 8 },
            { key: "video-2", contentType: "video/mp4", size: 1, durationSeconds: 7 },
          ],
          []
        )
      ).toBeNull()
      expect(
        getReferenceMediaTotalDurationError(
          model!,
          [
            { key: "video-1", contentType: "video/mp4", size: 1, durationSeconds: 8 },
            { key: "video-2", contentType: "video/mp4", size: 1, durationSeconds: 7.01 },
          ],
          []
        )
      ).toBe("Total reference video duration must not exceed 15 seconds")
    }

    const standard = getModels().find(item => item.id === "bytedance/seedance-2.0")
    expect(standard?.options?.resolution?.values).toEqual(["480p", "720p", "1080p", "4k"])
    for (const modelId of [
      "bytedance/seedance-2.0",
      "bytedance/seedance-2.0-fast",
      "bytedance/seedance-2.0-mini",
    ]) {
      expect(getModels().find(item => item.id === modelId)?.options?.duration).toMatchObject({
        values: ["4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"],
        defaultValue: "5",
        uiControl: "slider",
        min: 4,
        max: 15,
        step: 1,
      })
    }
  })

  test("exposes every requested EvoLink video model through the models API", () => {
    const videoModels = getModels().filter(model => model.mediaType === "video")
    expect(videoModels.map(model => model.id)).toEqual([
      "bytedance/seedance-2.0",
      "bytedance/seedance-2.0-fast",
      "bytedance/seedance-2.0-mini",
      "google/gemini-omni-flash",
      "kling/kling-3.0-turbo",
      "kling/kling-3.0",
      "google/veo-3.1-pro",
      "google/veo-3.1-fast",
      "xai/grok-imagine-video",
      "happyhorse/happyhorse-1.1",
    ])
    for (const model of videoModels) {
      expect(model.isNew).toBe(false)
      expect(model.generationModes).toContain("text_to_video")
      expect(model.generationModes).toContain("image_to_video")
      expect(model.options?.duration?.values.length).toBeGreaterThan(0)
      expect(model).not.toHaveProperty("providerConfig")
    }
    expect(
      videoModels
        .filter(model => model.generationModes?.includes("reference_to_video"))
        .map(model => model.id)
    ).toEqual([
      "bytedance/seedance-2.0",
      "bytedance/seedance-2.0-fast",
      "bytedance/seedance-2.0-mini",
      "google/gemini-omni-flash",
      "happyhorse/happyhorse-1.1",
    ])
  })

  test("publishes Kling V3 duration and image-to-video constraints", () => {
    const expectedDuration = {
      values: ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"],
      defaultValue: "5",
      uiControl: "slider",
      min: 3,
      max: 15,
      step: 1,
    }
    const turbo = getModels().find(item => item.id === "kling/kling-3.0-turbo")
    const standard = getModels().find(item => item.id === "kling/kling-3.0")

    expect(turbo?.options?.duration).toMatchObject(expectedDuration)
    expect(turbo?.videoInputModes).toEqual([
      {
        id: "start_end_frame",
        label: "Start Frame",
        generationMode: "image_to_video",
        imageCount: 1,
      },
    ])
    expect(turbo?.referenceImageConstraints).toEqual({
      mimeTypes: ["image/jpeg", "image/png"],
      maxBytes: 50_000_000,
      minWidth: 300,
      minHeight: 300,
      minAspectRatio: 0.4,
      maxAspectRatio: 2.5,
    })

    expect(standard?.options?.duration).toMatchObject(expectedDuration)
    expect(standard?.videoInputModes?.[0]).toMatchObject({
      id: "start_end_frame",
      imageCount: 2,
    })
    expect(standard?.referenceImageConstraints).toEqual({
      mimeTypes: ["image/jpeg", "image/png"],
      maxBytes: 10_000_000,
      minWidth: 300,
      minHeight: 300,
      minAspectRatio: 0.4,
      maxAspectRatio: 2.5,
    })
  })

  test("publishes every integer Grok video duration through a slider", () => {
    expect(
      getModels().find(model => model.id === "xai/grok-imagine-video")?.options?.duration
    ).toMatchObject({
      values: Array.from({ length: 25 }, (_, index) => String(index + 6)),
      defaultValue: "6",
      uiControl: "slider",
      min: 6,
      max: 30,
      step: 1,
    })
  })

  test("publishes language-aware prompt limits for video models", () => {
    const models = getModels()
    for (const modelId of [
      "bytedance/seedance-2.0",
      "bytedance/seedance-2.0-fast",
      "bytedance/seedance-2.0-mini",
    ]) {
      expect(models.find(model => model.id === modelId)?.promptLimits).toEqual({
        default: { max: 1000, unit: "words" },
        chinese: { max: 500, unit: "characters" },
      })
    }
    for (const modelId of ["kling/kling-3.0-turbo", "kling/kling-3.0"]) {
      expect(models.find(model => model.id === modelId)?.promptLimits).toEqual({
        default: { max: 2500, unit: "characters", exclusive: true },
      })
    }
    for (const modelId of ["google/veo-3.1-pro", "google/veo-3.1-fast"]) {
      expect(models.find(model => model.id === modelId)?.promptLimits).toEqual({
        default: { max: 2000, unit: "characters", exclusive: true },
      })
    }
    expect(models.find(model => model.id === "happyhorse/happyhorse-1.1")?.promptLimits).toEqual({
      default: { max: 5000, unit: "characters" },
      chinese: { max: 2500, unit: "characters" },
    })
  })

  test("publishes video option credit metadata to the frontend", () => {
    const models = getModels()
    expect(models.find(model => model.id === "google/gemini-omni-flash")).toMatchObject({
      options: {
        duration: {
          values: ["3", "4", "5", "6", "7", "8", "9", "10", "auto"],
          defaultValue: "10",
        },
      },
    })
    expect(models.find(model => model.id === "google/veo-3.1-pro")).toMatchObject({
      name: "Veo 3.1 Pro",
      creditsPerSecond: 8,
      options: {
        resolution: {
          defaultValue: "720p",
          valueCredits: { "4k": 7 },
        },
        generate_audio: {
          defaultValue: "true",
          valueCredits: { true: 7 },
        },
      },
    })
    expect(models.find(model => model.id === "google/veo-3.1-fast")).toMatchObject({
      name: "Veo 3.1 Fast",
      creditsPerSecond: 4,
      options: {
        resolution: {
          defaultValue: "720p",
          valueCredits: { "4k": 7 },
        },
        generate_audio: {
          defaultValue: "true",
          valueCredits: { true: 2 },
        },
      },
    })
    expect(models.find(model => model.id === "kling/kling-3.0")).toMatchObject({
      creditOverrides: [
        {
          when: { resolution: "4k", generate_audio: "true" },
          creditsPerSecond: 17,
        },
      ],
    })
  })

  test("maps public model IDs and generation modes to EvoLink model IDs", () => {
    expect(getVideoProviderModel("bytedance/seedance-2.0-fast", "text_to_video")).toBe(
      "seedance-2.0-fast-text-to-video"
    )
    expect(getVideoProviderModel("bytedance/seedance-2.0-fast", "image_to_video")).toBe(
      "seedance-2.0-fast-image-to-video"
    )
    expect(getVideoProviderModel("bytedance/seedance-2.0-fast", "reference_to_video")).toBe(
      "seedance-2.0-fast-reference-to-video"
    )
    expect(getVideoProviderModel("bytedance/seedance-2.0-mini", "image_to_video")).toBe(
      "seedance-2.0-mini-image-to-video"
    )
    expect(getVideoProviderModel("bytedance/seedance-2.0", "reference_to_video")).toBe(
      "seedance-2.0-reference-to-video"
    )
    expect(getVideoProviderModel("google/gemini-omni-flash", "text_to_video")).toBe(
      "gemini-omni-flash-text-to-video"
    )
    expect(getVideoProviderModel("google/gemini-omni-flash", "reference_to_video")).toBe(
      "gemini-omni-flash-reference-to-video"
    )
    expect(getVideoProviderModel("kling/kling-3.0-turbo", "image_to_video")).toBe(
      "kling-v3-turbo-image-to-video"
    )
    expect(getVideoProviderModel("kling/kling-3.0", "text_to_video")).toBe("kling-v3-text-to-video")
    expect(getVideoProviderModel("google/veo-3.1-pro", "image_to_video")).toBe(
      "veo-3.1-generate-preview"
    )
    expect(getVideoProviderModel("google/veo-3.1-fast", "text_to_video")).toBe(
      "veo-3.1-fast-generate-preview"
    )
    expect(getVideoProviderModel("xai/grok-imagine-video", "text_to_video")).toBe(
      "grok-imagine-text-to-video-beta"
    )
    expect(getVideoProviderModel("happyhorse/happyhorse-1.1", "image_to_video")).toBe(
      "happyhorse-1.1-image-to-video"
    )
    expect(getVideoProviderModel("happyhorse/happyhorse-1.1", "reference_to_video")).toBe(
      "happyhorse-1.1-reference-to-video"
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

    expect(
      buildEvoLinkPayload(
        "seedance-2.0-reference-to-video",
        {
          ...baseInput,
          prompt: "Use @image1, movement from @video1, and music from @audio1",
          generation_mode: "reference_to_video",
        },
        undefined,
        [
          {
            key: "image.png",
            url: "https://example.com/image.png",
            contentType: "image/png",
            size: 1,
          },
        ],
        [
          {
            key: "video.mp4",
            url: "https://example.com/video.mp4",
            contentType: "video/mp4",
            size: 1,
          },
        ],
        [
          {
            key: "audio.mp3",
            url: "https://example.com/audio.mp3",
            contentType: "audio/mpeg",
            size: 1,
          },
        ]
      )
    ).toMatchObject({
      model: "seedance-2.0-reference-to-video",
      image_urls: ["https://example.com/image.png"],
      video_urls: ["https://example.com/video.mp4"],
      audio_urls: ["https://example.com/audio.mp3"],
    })

    expect(
      buildEvoLinkPayload(
        "seedance-2.0-fast-reference-to-video",
        {
          ...baseInput,
          model: "bytedance/seedance-2.0-fast",
          prompt: "Keep @image1 while following @video1 with @audio1",
          generation_mode: "reference_to_video",
          resolution: "720p",
        },
        undefined,
        [
          {
            key: "fast-image.png",
            url: "https://example.com/fast-image.png",
            contentType: "image/png",
            size: 1,
          },
        ],
        [
          {
            key: "fast-video.mp4",
            url: "https://example.com/fast-video.mp4",
            contentType: "video/mp4",
            size: 1,
          },
        ],
        [
          {
            key: "fast-audio.mp3",
            url: "https://example.com/fast-audio.mp3",
            contentType: "audio/mpeg",
            size: 1,
          },
        ]
      )
    ).toMatchObject({
      model: "seedance-2.0-fast-reference-to-video",
      duration: 8,
      quality: "720p",
      aspect_ratio: "9:16",
      generate_audio: true,
      image_urls: ["https://example.com/fast-image.png"],
      video_urls: ["https://example.com/fast-video.mp4"],
      audio_urls: ["https://example.com/fast-audio.mp3"],
    })
  })

  test("calculates configured video credits for model and option combinations", () => {
    expect(
      calculateRequiredCredits("bytedance/seedance-2.0", { duration: 5, resolution: "720p" })
    ).toBe(45)
    expect(
      calculateRequiredCredits("bytedance/seedance-2.0", { duration: "5", resolution: "1080p" })
    ).toBe(110)
    expect(
      calculateRequiredCredits("bytedance/seedance-2.0-mini", {
        duration: 5,
        resolution: "480p",
      })
    ).toBe(10)
    expect(
      calculateRequiredCredits("bytedance/seedance-2.0-fast", {
        duration: 5,
        resolution: "480p",
      })
    ).toBe(20)
    expect(
      calculateRequiredCredits("bytedance/seedance-2.0-fast", {
        duration: 5,
        resolution: "720p",
      })
    ).toBe(35)
    expect(
      calculateRequiredCredits("google/gemini-omni-flash", {
        duration: "auto",
      })
    ).toBe(50)
    expect(
      calculateRequiredCredits("kling/kling-3.0", {
        duration: 5,
        resolution: "1080p",
        generate_audio: "true",
      })
    ).toBe(35)
    expect(
      calculateRequiredCredits("kling/kling-3.0", {
        duration: 5,
        resolution: "4k",
        generate_audio: "true",
      })
    ).toBe(85)
    expect(
      calculateRequiredCredits("google/veo-3.1-pro", {
        duration: 4,
        resolution: "720p",
        generate_audio: "true",
      })
    ).toBe(60)
    expect(
      calculateRequiredCredits("google/veo-3.1-pro", {
        duration: 4,
        resolution: "4k",
        generate_audio: "true",
      })
    ).toBe(88)
    expect(
      calculateRequiredCredits("google/veo-3.1-fast", {
        duration: 4,
        resolution: "720p",
        generate_audio: "false",
      })
    ).toBe(16)
    expect(
      calculateRequiredCredits("google/veo-3.1-fast", {
        duration: 4,
        resolution: "4k",
        generate_audio: "true",
      })
    ).toBe(52)
    expect(
      calculateRequiredCredits("xai/grok-imagine-video", {
        duration: 6,
        resolution: "720p",
      })
    ).toBe(12)
    expect(
      calculateRequiredCredits("happyhorse/happyhorse-1.1", {
        duration: 5,
        resolution: "1080p",
      })
    ).toBe(40)
  })

  test("adds model-configured image, video, and audio reference credits", () => {
    expect(
      calculateRequiredCredits("bytedance/seedance-2.0", {
        duration: 5,
        resolution: "720p",
        billing_reference_image_count: 2,
        billing_reference_video_durations: [2.1],
        billing_reference_audio_durations: [3.2],
      })
    ).toBe(69)
    expect(
      calculateRequiredCredits("bytedance/seedance-2.0-mini", {
        duration: 5,
        resolution: "720p",
        billing_reference_image_count: 1,
        billing_reference_video_durations: [2.1],
        billing_reference_audio_durations: [4.2],
      })
    ).toBe(40)
    expect(
      calculateRequiredCredits("kling/kling-3.0", {
        duration: 5,
        resolution: "1080p",
        generate_audio: "true",
        billing_reference_image_count: 2,
      })
    ).toBe(37)
    expect(
      calculateRequiredCredits("google/veo-3.1-pro", {
        duration: 4,
        resolution: "720p",
        generate_audio: "true",
        billing_reference_image_count: 2,
      })
    ).toBe(62)
    expect(
      calculateRequiredCredits("xai/grok-imagine-video", {
        duration: 6,
        resolution: "720p",
        billing_reference_image_count: 1,
      })
    ).toBe(13)
    expect(
      calculateRequiredCredits("happyhorse/happyhorse-1.1", {
        duration: 5,
        resolution: "1080p",
        billing_reference_image_count: 3,
      })
    ).toBe(43)
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
      buildEvoLinkPayload(
        "kling-v3-image-to-video",
        { ...commonInput, generation_mode: "image_to_video" },
        undefined,
        [
          {
            key: "start.png",
            url: "https://example.com/start.png",
            contentType: "image/png",
            size: 1,
          },
          {
            key: "end.png",
            url: "https://example.com/end.png",
            contentType: "image/png",
            size: 1,
          },
        ]
      )
    ).toMatchObject({
      image_start: "https://example.com/start.png",
      image_end: "https://example.com/end.png",
    })
    expect(
      buildEvoLinkPayload("veo-3.1-generate-preview", {
        ...commonInput,
        model: "google/veo-3.1-pro",
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
      buildEvoLinkPayload("veo-3.1-fast-generate-preview", {
        ...commonInput,
        model: "google/veo-3.1-fast",
        generation_mode: "text_to_video",
        duration: "4",
      })
    ).toMatchObject({
      model: "veo-3.1-fast-generate-preview",
      generation_type: "TEXT",
      duration: 4,
      quality: "1080p",
      generate_audio: true,
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
