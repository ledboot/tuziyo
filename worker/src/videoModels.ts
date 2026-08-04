import {
  ModelOptionType,
  ReferenceImageFormat,
  type ModelConfig,
  type ModelCreditOverride,
  type ModelOption,
  type VideoGenerationMode,
  type VideoInputModeConfig,
} from "./types"

type ModelPlan = "starter" | "professional" | "creator"
export type { VideoGenerationMode } from "./types"

interface VideoProviderConfig {
  models: Record<"text_to_video" | "image_to_video", string> &
    Partial<Record<"reference_to_video", string>>
  duration?: boolean
  quality?: boolean
  aspectRatio?: boolean
  imageToVideoAspectRatio?: boolean
  imageInputFields?: "image_urls" | "start_end"
  audioField?: "generate_audio" | "sound"
  mode?: boolean
  generationType?: boolean
}

interface VideoModelDefinition extends Omit<ModelConfig, "id"> {
  enabled: boolean
  plans?: readonly ModelPlan[]
  options: Record<string, ModelOption>
  mediaType: "video"
  generationModes: VideoGenerationMode[]
  pricingMode: "per_second"
  creditsPerSecond: number
  creditOverrides?: ModelCreditOverride[]
  pollTimeoutSeconds: number
  providerConfig: VideoProviderConfig
}

const ALL_PLANS: readonly ModelPlan[] = ["starter", "professional", "creator"]
const VIDEO_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"]
const integerRange = (min: number, max: number) =>
  Array.from({ length: max - min + 1 }, (_, index) => String(index + min))
const SEEDANCE_REFERENCE_MEDIA_CONSTRAINTS = {
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
    mimeTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav"],
    maxBytes: 15_000_000,
    minDurationSeconds: 2,
    maxDurationSeconds: 15,
    maxTotalDurationSeconds: 15,
  },
}
const KLING_V3_TURBO_IMAGE_CONSTRAINTS = {
  mimeTypes: ["image/jpeg", "image/png"],
  maxBytes: 50_000_000,
  minWidth: 300,
  minHeight: 300,
  minAspectRatio: 0.4,
  maxAspectRatio: 2.5,
}
const KLING_V3_IMAGE_CONSTRAINTS = {
  ...KLING_V3_TURBO_IMAGE_CONSTRAINTS,
  maxBytes: 10_000_000,
}
const SEEDANCE_PROMPT_LIMITS = {
  default: { max: 1000, unit: "words" as const },
  chinese: { max: 500, unit: "characters" as const },
}
const KLING_V3_PROMPT_LIMITS = {
  default: { max: 2500, unit: "characters" as const, exclusive: true },
}
const VEO_3_1_PROMPT_LIMITS = {
  default: { max: 2000, unit: "characters" as const, exclusive: true },
}
const HAPPYHORSE_PROMPT_LIMITS = {
  default: { max: 5000, unit: "characters" as const },
  chinese: { max: 2500, unit: "characters" as const },
}
const IMAGE_REFERENCE_CREDITS = { imagePerItem: 1 }
const START_END_FRAME_MODE = (imageCount = 2): VideoInputModeConfig => ({
  id: "start_end_frame",
  label: imageCount > 1 ? "Start & End Frame" : "Start Frame",
  generationMode: "image_to_video",
  imageCount,
})
const IMAGE_REFERENCE_MODE = (
  imageCount: number,
  audioCount = 0,
  referenceTagStyle?: "at" | "character"
): VideoInputModeConfig => ({
  id: "image_reference",
  label: "Image Reference",
  generationMode: "reference_to_video",
  imageCount,
  ...(audioCount > 0 ? { audioCount, requiresImageOrVideo: true } : {}),
  ...(referenceTagStyle ? { referenceTagStyle } : {}),
})
const VIDEO_REFERENCE_MODE = (
  imageCount: number,
  videoCount: number,
  audioCount: number
): VideoInputModeConfig => ({
  id: "video_reference",
  label: "Video Reference",
  generationMode: "reference_to_video",
  imageCount,
  videoCount,
  audioCount,
  requiresImageOrVideo: true,
  referenceTagStyle: "at",
})

const select = (
  name: string,
  values: string[],
  defaultValue: string,
  valueCredits?: Record<string, number>
): ModelOption => ({
  name,
  type: ModelOptionType.SELECT,
  values,
  defaultValue,
  ...(valueCredits ? { valueCredits } : {}),
})

const audioOption = (valueCredits?: Record<string, number>): ModelOption => ({
  name: "Generate Audio",
  type: ModelOptionType.CHECKBOX,
  values: ["false", "true"],
  defaultValue: "true",
  ...(valueCredits ? { valueCredits } : {}),
})

const durationSlider = (min = 4, max = 15, defaultValue = "5"): ModelOption => ({
  name: "Duration",
  type: ModelOptionType.SELECT,
  values: integerRange(min, max),
  defaultValue,
  uiControl: "slider",
  min,
  max,
  step: 1,
})

export const VIDEO_MODEL_CATALOG: Record<string, VideoModelDefinition> = {
  "bytedance/seedance-2.0": {
    enabled: true,
    sortOrder: 20,
    name: "Seedance 2.0",
    promptMaxLength: 4000,
    promptLimits: SEEDANCE_PROMPT_LIMITS,
    provider: "ByteDance",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: true,
    supportsAudio: true,
    referenceImageCount: 9,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 0,
    creditsPerSecond: 4,
    referenceCredits: {
      imagePerItem: 1,
      videoPerSecondByResolution: { "480p": 3, "720p": 6, "1080p": 13, "4k": 27 },
      audioPerSecond: 1,
    },
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video", "reference_to_video"],
    videoInputModes: [
      START_END_FRAME_MODE(),
      IMAGE_REFERENCE_MODE(9, 3, "at"),
      VIDEO_REFERENCE_MODE(9, 3, 3),
    ],
    referenceMediaConstraints: SEEDANCE_REFERENCE_MEDIA_CONSTRAINTS,
    providerConfig: {
      models: {
        text_to_video: "seedance-2.0-text-to-video",
        image_to_video: "seedance-2.0-image-to-video",
        reference_to_video: "seedance-2.0-reference-to-video",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      audioField: "generate_audio",
    },
    options: {
      aspect_ratio: select("Aspect Ratio", VIDEO_RATIOS, "16:9"),
      duration: durationSlider(),
      resolution: select("Resolution", ["480p", "720p", "1080p", "4k"], "480p", {
        "720p": 5,
        "1080p": 18,
        "4k": 40,
      }),
      generate_audio: audioOption(),
    },
  },
  "bytedance/seedance-2.0-fast": {
    enabled: true,
    sortOrder: 21,
    name: "Seedance 2.0 Fast",
    promptMaxLength: 4000,
    promptLimits: SEEDANCE_PROMPT_LIMITS,
    provider: "ByteDance",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: true,
    supportsAudio: true,
    referenceImageCount: 9,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 0,
    creditsPerSecond: 4,
    referenceCredits: {
      imagePerItem: 1,
      videoPerSecondByResolution: { "480p": 2, "720p": 5 },
      audioPerSecond: 1,
    },
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video", "reference_to_video"],
    videoInputModes: [
      START_END_FRAME_MODE(),
      IMAGE_REFERENCE_MODE(9, 3, "at"),
      VIDEO_REFERENCE_MODE(9, 3, 3),
    ],
    referenceMediaConstraints: SEEDANCE_REFERENCE_MEDIA_CONSTRAINTS,
    providerConfig: {
      models: {
        text_to_video: "seedance-2.0-fast-text-to-video",
        image_to_video: "seedance-2.0-fast-image-to-video",
        reference_to_video: "seedance-2.0-fast-reference-to-video",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      audioField: "generate_audio",
    },
    options: {
      aspect_ratio: select("Aspect Ratio", VIDEO_RATIOS, "16:9"),
      duration: durationSlider(),
      resolution: select("Resolution", ["480p", "720p"], "480p", { "720p": 3 }),
      generate_audio: audioOption(),
    },
  },
  "bytedance/seedance-2.0-mini": {
    enabled: true,
    sortOrder: 22,
    name: "Seedance 2.0 Mini",
    promptMaxLength: 4000,
    promptLimits: SEEDANCE_PROMPT_LIMITS,
    provider: "ByteDance",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: true,
    supportsAudio: true,
    referenceImageCount: 9,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 0,
    creditsPerSecond: 2,
    referenceCredits: {
      imagePerItem: 1,
      videoPerSecondByResolution: { "480p": 2, "720p": 3 },
      audioPerSecond: 1,
    },
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video", "reference_to_video"],
    videoInputModes: [
      START_END_FRAME_MODE(),
      IMAGE_REFERENCE_MODE(9, 3, "at"),
      VIDEO_REFERENCE_MODE(9, 3, 3),
    ],
    referenceMediaConstraints: SEEDANCE_REFERENCE_MEDIA_CONSTRAINTS,
    providerConfig: {
      models: {
        text_to_video: "seedance-2.0-mini-text-to-video",
        image_to_video: "seedance-2.0-mini-image-to-video",
        reference_to_video: "seedance-2.0-mini-reference-to-video",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      audioField: "generate_audio",
    },
    options: {
      aspect_ratio: select("Aspect Ratio", VIDEO_RATIOS, "16:9"),
      duration: durationSlider(),
      resolution: select("Resolution", ["480p", "720p"], "480p", { "720p": 3 }),
      generate_audio: audioOption(),
    },
  },
  "google/gemini-omni-flash": {
    enabled: true,
    sortOrder: 23,
    name: "Gemini Omni Flash",
    promptMaxLength: 4000,
    provider: "Google",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: false,
    supportsAudio: true,
    referenceImageCount: 6,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 0,
    creditsPerSecond: 5,
    referenceCredits: IMAGE_REFERENCE_CREDITS,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video", "reference_to_video"],
    videoInputModes: [START_END_FRAME_MODE(1), IMAGE_REFERENCE_MODE(6)],
    providerConfig: {
      models: {
        text_to_video: "gemini-omni-flash-text-to-video",
        image_to_video: "gemini-omni-flash-image-to-video",
        reference_to_video: "gemini-omni-flash-reference-to-video",
      },
      duration: true,
      aspectRatio: true,
    },
    options: {
      aspect_ratio: select("Aspect Ratio", ["16:9", "9:16", "auto"], "16:9"),
      duration: select("Duration", ["3", "4", "5", "6", "7", "8", "9", "10", "auto"], "10"),
    },
  },
  "kling/kling-3.0-turbo": {
    enabled: true,
    sortOrder: 24,
    name: "Kling 3.0 Turbo",
    promptMaxLength: 2500,
    promptLimits: KLING_V3_PROMPT_LIMITS,
    provider: "Kling AI",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/kling.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: false,
    supportsAudio: false,
    referenceImageCount: 1,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 0,
    creditsPerSecond: 5,
    referenceCredits: IMAGE_REFERENCE_CREDITS,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
    videoInputModes: [START_END_FRAME_MODE(1)],
    referenceImageConstraints: KLING_V3_TURBO_IMAGE_CONSTRAINTS,
    providerConfig: {
      models: {
        text_to_video: "kling-v3-turbo-text-to-video",
        image_to_video: "kling-v3-turbo-image-to-video",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      imageToVideoAspectRatio: false,
      imageInputFields: "start_end",
    },
    options: {
      aspect_ratio: select("Aspect Ratio", ["16:9", "9:16", "1:1"], "16:9"),
      duration: durationSlider(3, 15),
      resolution: select("Resolution", ["720p", "1080p"], "720p", { "1080p": 1 }),
    },
  },
  "kling/kling-3.0": {
    enabled: true,
    sortOrder: 25,
    name: "Kling 3.0",
    promptMaxLength: 2500,
    promptLimits: KLING_V3_PROMPT_LIMITS,
    provider: "Kling AI",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/kling.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: true,
    supportsAudio: true,
    referenceImageCount: 2,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 0,
    creditsPerSecond: 4,
    referenceCredits: IMAGE_REFERENCE_CREDITS,
    creditOverrides: [
      {
        when: { resolution: "4k", generate_audio: "true" },
        creditsPerSecond: 17,
      },
    ],
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
    videoInputModes: [START_END_FRAME_MODE()],
    referenceImageConstraints: KLING_V3_IMAGE_CONSTRAINTS,
    providerConfig: {
      models: {
        text_to_video: "kling-v3-text-to-video",
        image_to_video: "kling-v3-image-to-video",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      imageToVideoAspectRatio: false,
      imageInputFields: "start_end",
      audioField: "sound",
    },
    options: {
      aspect_ratio: select("Aspect Ratio", ["16:9", "9:16", "1:1"], "16:9"),
      duration: durationSlider(3, 15),
      resolution: select("Resolution", ["720p", "1080p", "4k"], "720p", {
        "1080p": 1,
        "4k": 13,
      }),
      generate_audio: audioOption({ true: 2 }),
    },
  },
  "google/veo-3.1-pro": {
    enabled: true,
    sortOrder: 26,
    name: "Veo 3.1 Pro",
    promptMaxLength: 8000,
    promptLimits: VEO_3_1_PROMPT_LIMITS,
    provider: "Google",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: true,
    supportsAudio: true,
    referenceImageCount: 2,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 0,
    creditsPerSecond: 8,
    referenceCredits: IMAGE_REFERENCE_CREDITS,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
    videoInputModes: [START_END_FRAME_MODE()],
    providerConfig: {
      models: {
        text_to_video: "veo-3.1-generate-preview",
        image_to_video: "veo-3.1-generate-preview",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      audioField: "generate_audio",
      generationType: true,
    },
    options: {
      aspect_ratio: select("Aspect Ratio", ["auto", "16:9", "9:16"], "auto"),
      duration: select("Duration", ["4", "6", "8"], "4"),
      resolution: select("Resolution", ["720p", "1080p", "4k"], "720p", {
        "4k": 7,
      }),
      generate_audio: audioOption({ true: 7 }),
      negative_prompt: {
        name: "Negative Prompt",
        type: ModelOptionType.TEXTAREA,
        values: [],
        defaultValue: "",
      },
    },
  },
  "google/veo-3.1-fast": {
    enabled: true,
    sortOrder: 27,
    name: "Veo 3.1 Fast",
    promptMaxLength: 8000,
    promptLimits: VEO_3_1_PROMPT_LIMITS,
    provider: "Google",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: true,
    supportsAudio: true,
    referenceImageCount: 2,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 0,
    creditsPerSecond: 4,
    referenceCredits: IMAGE_REFERENCE_CREDITS,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
    videoInputModes: [START_END_FRAME_MODE()],
    providerConfig: {
      models: {
        text_to_video: "veo-3.1-fast-generate-preview",
        image_to_video: "veo-3.1-fast-generate-preview",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      audioField: "generate_audio",
      generationType: true,
    },
    options: {
      aspect_ratio: select("Aspect Ratio", ["auto", "16:9", "9:16"], "auto"),
      duration: select("Duration", ["4", "6", "8"], "4"),
      resolution: select("Resolution", ["720p", "1080p", "4k"], "720p", {
        "4k": 7,
      }),
      generate_audio: audioOption({ true: 2 }),
      negative_prompt: {
        name: "Negative Prompt",
        type: ModelOptionType.TEXTAREA,
        values: [],
        defaultValue: "",
      },
    },
  },
  "xai/grok-imagine-video": {
    enabled: true,
    sortOrder: 28,
    name: "Grok Imagine Video",
    promptMaxLength: 4000,
    provider: "xAI",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/grok.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: false,
    supportsAudio: false,
    referenceImageCount: 1,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 0,
    creditsPerSecond: 1,
    referenceCredits: IMAGE_REFERENCE_CREDITS,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
    videoInputModes: [START_END_FRAME_MODE(1)],
    providerConfig: {
      models: {
        text_to_video: "grok-imagine-text-to-video-beta",
        image_to_video: "grok-imagine-image-to-video-beta",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      mode: true,
    },
    options: {
      aspect_ratio: select("Aspect Ratio", ["16:9", "9:16", "1:1", "3:2", "2:3"], "16:9"),
      duration: durationSlider(6, 30, "6"),
      resolution: select("Resolution", ["480p", "720p"], "480p", { "720p": 1 }),
      mode: select("Style", ["normal", "fun", "spicy"], "normal"),
    },
  },
  "happyhorse/happyhorse-1.1": {
    enabled: true,
    sortOrder: 29,
    name: "HappyHorse 1.1",
    promptMaxLength: 5000,
    promptLimits: HAPPYHORSE_PROMPT_LIMITS,
    provider: "HappyHorse",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@1.94.0/icons/happyhorse.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: false,
    supportsAudio: false,
    referenceImageCount: 9,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 0,
    creditsPerSecond: 6,
    referenceCredits: IMAGE_REFERENCE_CREDITS,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video", "reference_to_video"],
    videoInputModes: [START_END_FRAME_MODE(1), IMAGE_REFERENCE_MODE(9, 0, "character")],
    providerConfig: {
      models: {
        text_to_video: "happyhorse-1.1-text-to-video",
        image_to_video: "happyhorse-1.1-image-to-video",
        reference_to_video: "happyhorse-1.1-reference-to-video",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
    },
    options: {
      aspect_ratio: select(
        "Aspect Ratio",
        ["16:9", "9:16", "1:1", "4:3", "3:4", "4:5", "5:4", "9:21", "21:9"],
        "16:9"
      ),
      duration: select("Duration", ["3", "5", "8", "10", "15"], "5"),
      resolution: select("Resolution", ["720p", "1080p"], "720p", { "1080p": 2 }),
    },
  },
}

export const VIDEO_MODEL_IDS = Object.keys(VIDEO_MODEL_CATALOG)
export const ENABLED_VIDEO_MODEL_IDS = VIDEO_MODEL_IDS.filter(id => VIDEO_MODEL_CATALOG[id].enabled)

export function isVideoModelEnabled(modelId: string) {
  return VIDEO_MODEL_CATALOG[modelId]?.enabled === true
}

export function getVideoProviderConfig(modelId: string): VideoProviderConfig | undefined {
  return VIDEO_MODEL_CATALOG[modelId]?.providerConfig
}

export function getVideoProviderModel(
  modelId: string,
  generationMode: VideoGenerationMode = "text_to_video"
): string | undefined {
  return getVideoProviderConfig(modelId)?.models[generationMode]
}

export function findVideoProviderConfig(providerModel: string): VideoProviderConfig | undefined {
  return Object.values(VIDEO_MODEL_CATALOG).find(model =>
    Object.values(model.providerConfig.models).includes(providerModel)
  )?.providerConfig
}

export function getEnabledVideoModels(): ModelConfig[] {
  return Object.entries(VIDEO_MODEL_CATALOG)
    .filter(([, model]) => model.enabled)
    .map(([id, modelDefinition]) => {
      const {
        enabled: _enabled,
        plans: _plans,
        providerConfig: _providerConfig,
        ...model
      } = modelDefinition
      return { id, ...model }
    })
}

export function getVideoPlanModels(): Record<
  ModelPlan,
  Array<{ name: string; supported: boolean }>
> {
  return Object.fromEntries(
    ALL_PLANS.map(plan => [
      plan,
      Object.entries(VIDEO_MODEL_CATALOG)
        .filter(([, model]) => model.enabled && (model.plans ?? ALL_PLANS).includes(plan))
        .map(([id]) => ({ name: id.split("/").pop() || id, supported: true })),
    ])
  ) as Record<ModelPlan, Array<{ name: string; supported: boolean }>>
}
