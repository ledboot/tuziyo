import { ModelOptionType, ReferenceImageFormat, type ModelConfig, type ModelOption } from "./types"

type ModelPlan = "starter" | "professional" | "creator"
export type VideoGenerationMode = "text_to_video" | "image_to_video"

interface VideoProviderConfig {
  models: Record<VideoGenerationMode, string>
  duration?: boolean
  quality?: boolean
  aspectRatio?: boolean
  imageToVideoAspectRatio?: boolean
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
  pollTimeoutSeconds: number
  providerConfig: VideoProviderConfig
}

const ALL_PLANS: readonly ModelPlan[] = ["starter", "professional", "creator"]
const VIDEO_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"]
const SHORT_VIDEO_DURATIONS = ["4", "5", "6", "8", "10", "12", "15"]

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

const audioOption = (): ModelOption => ({
  name: "Generate Audio",
  type: ModelOptionType.CHECKBOX,
  values: ["false", "true"],
  defaultValue: "true",
})

export const VIDEO_MODEL_CATALOG: Record<string, VideoModelDefinition> = {
  "bytedance/seedance-2.0": {
    enabled: true,
    sortOrder: 20,
    name: "Seedance 2.0",
    promptMaxLength: 4000,
    provider: "ByteDance",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: true,
    supportsAudio: true,
    referenceImageCount: 2,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: true,
    credits: 0,
    creditsPerSecond: 8,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
    providerConfig: {
      models: {
        text_to_video: "seedance-2.0-text-to-video",
        image_to_video: "seedance-2.0-image-to-video",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      audioField: "generate_audio",
    },
    options: {
      aspect_ratio: select("Aspect Ratio", VIDEO_RATIOS, "16:9"),
      duration: select("Duration", SHORT_VIDEO_DURATIONS, "5"),
      resolution: select("Resolution", ["480p", "720p", "1080p", "4k"], "720p", {
        "1080p": 4,
        "4k": 12,
      }),
      generate_audio: audioOption(),
    },
  },
  "bytedance/seedance-2.0-mini": {
    enabled: true,
    sortOrder: 21,
    name: "Seedance 2.0 Mini",
    promptMaxLength: 4000,
    provider: "ByteDance",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: true,
    supportsAudio: true,
    referenceImageCount: 2,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: true,
    credits: 0,
    creditsPerSecond: 5,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
    providerConfig: {
      models: {
        text_to_video: "seedance-2.0-mini-text-to-video",
        image_to_video: "seedance-2.0-mini-image-to-video",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      audioField: "generate_audio",
    },
    options: {
      aspect_ratio: select("Aspect Ratio", VIDEO_RATIOS, "16:9"),
      duration: select("Duration", SHORT_VIDEO_DURATIONS, "5"),
      resolution: select("Resolution", ["480p", "720p"], "720p"),
      generate_audio: audioOption(),
    },
  },
  "google/gemini-omni-flash": {
    enabled: true,
    sortOrder: 22,
    name: "Gemini Omni Flash",
    promptMaxLength: 4000,
    provider: "Google",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: false,
    supportsAudio: true,
    referenceImageCount: 1,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: true,
    credits: 0,
    creditsPerSecond: 11,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
    providerConfig: {
      models: {
        text_to_video: "gemini-omni-flash-text-to-video",
        image_to_video: "gemini-omni-flash-image-to-video",
      },
      duration: true,
      aspectRatio: true,
    },
    options: {
      aspect_ratio: select("Aspect Ratio", ["16:9", "9:16", "auto"], "16:9"),
      duration: select("Duration", ["3", "4", "5", "6", "8", "10", "auto"], "10"),
    },
  },
  "kling/kling-3.0-turbo": {
    enabled: true,
    sortOrder: 23,
    name: "Kling 3.0 Turbo",
    promptMaxLength: 2500,
    provider: "Kling AI",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/kling.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: false,
    supportsAudio: false,
    referenceImageCount: 1,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: true,
    credits: 0,
    creditsPerSecond: 7,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
    providerConfig: {
      models: {
        text_to_video: "kling-v3-turbo-text-to-video",
        image_to_video: "kling-v3-turbo-image-to-video",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      imageToVideoAspectRatio: false,
    },
    options: {
      aspect_ratio: select("Aspect Ratio", ["16:9", "9:16", "1:1"], "16:9"),
      duration: select("Duration", ["3", "5", "8", "10", "15"], "5"),
      resolution: select("Resolution", ["720p", "1080p"], "720p", { "1080p": 4 }),
    },
  },
  "kling/kling-3.0": {
    enabled: true,
    sortOrder: 24,
    name: "Kling 3.0",
    promptMaxLength: 2500,
    provider: "Kling AI",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/kling.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: true,
    supportsAudio: true,
    referenceImageCount: 2,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: true,
    credits: 0,
    creditsPerSecond: 10,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
    providerConfig: {
      models: {
        text_to_video: "kling-v3-text-to-video",
        image_to_video: "kling-v3-image-to-video",
      },
      duration: true,
      quality: true,
      aspectRatio: true,
      imageToVideoAspectRatio: false,
      audioField: "sound",
    },
    options: {
      aspect_ratio: select("Aspect Ratio", ["16:9", "9:16", "1:1"], "16:9"),
      duration: select("Duration", ["3", "5", "8", "10", "15"], "5"),
      resolution: select("Resolution", ["720p", "1080p", "4k"], "720p", {
        "1080p": 5,
        "4k": 14,
      }),
      generate_audio: audioOption(),
    },
  },
  "google/veo-3.1": {
    enabled: true,
    sortOrder: 25,
    name: "Veo 3.1",
    promptMaxLength: 8000,
    provider: "Google",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: true,
    supportsAudio: true,
    referenceImageCount: 2,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: true,
    credits: 0,
    creditsPerSecond: 18,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
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
        "1080p": 8,
        "4k": 20,
      }),
      generate_audio: audioOption(),
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
    sortOrder: 26,
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
    isNew: true,
    credits: 0,
    creditsPerSecond: 6,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
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
      duration: select("Duration", ["6", "10", "15", "20", "30"], "6"),
      resolution: select("Resolution", ["480p", "720p"], "480p", { "720p": 3 }),
      mode: select("Style", ["normal", "fun", "spicy"], "normal"),
    },
  },
  "happyhorse/happyhorse-1.1": {
    enabled: true,
    sortOrder: 27,
    name: "HappyHorse 1.1",
    promptMaxLength: 5000,
    provider: "HappyHorse",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@1.94.0/icons/happyhorse.svg",
    supportsImage: true,
    supportsStartFrame: true,
    supportsEndFrame: false,
    supportsAudio: false,
    referenceImageCount: 1,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: true,
    credits: 0,
    creditsPerSecond: 10,
    pricingMode: "per_second",
    pollTimeoutSeconds: 20 * 60,
    mediaType: "video",
    generationModes: ["text_to_video", "image_to_video"],
    providerConfig: {
      models: {
        text_to_video: "happyhorse-1.1-text-to-video",
        image_to_video: "happyhorse-1.1-image-to-video",
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
      resolution: select("Resolution", ["720p", "1080p"], "720p", { "1080p": 3 }),
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
