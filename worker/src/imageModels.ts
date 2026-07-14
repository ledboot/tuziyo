import {
  ModelOptionType,
  ReferenceImageFormat,
  type ModelConfig,
  type ModelOption,
  type PlanModelItem,
} from "./types"

type ModelPlan = "starter" | "professional" | "creator"

interface ImageModelDefinition extends Omit<ModelConfig, "id"> {
  enabled: boolean
  plans?: readonly ModelPlan[]
  options: Record<string, ModelOption>
}

const ALL_PLANS: readonly ModelPlan[] = ["starter", "professional", "creator"]

// Single source of truth for every image model. Add, remove, enable, price,
// sort, and configure request options only in this catalog.
export const IMAGE_MODEL_CATALOG: Record<string, ImageModelDefinition> = {
  "bytedance/seedream-4.0": {
    enabled: true,
    sortOrder: 20,
    name: "Seedream 4.0",
    promptMaxLength: 2000,
    provider: "ByteDance",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
    supportsImage: false,
    isNew: false,
    credits: 2,
    options: {
      aspect_ratio: {
        name: "Aspect Ratio",
        type: ModelOptionType.SELECT,
        values: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
        defaultValue: "1:1",
      },
      resolution: {
        name: "Resolution",
        type: ModelOptionType.SELECT,
        values: ["1K", "2K", "4K"],
        defaultValue: "1K",
        valueCredits: {
          "2K": 4,
          "4K": 15,
        },
      },
    },
  },
  "google/nano-banana": {
    enabled: true,
    sortOrder: 30,
    name: "Nano Banana",
    promptMaxLength: 2000,
    provider: "Google",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg",
    supportsImage: true,
    referenceImageCount: 5,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 2,
    options: {
      aspect_ratio: {
        name: "Aspect Ratio",
        type: ModelOptionType.SELECT,
        values: ["auto", "1:1", "2:3", "3:2", "4:3", "3:4", "16:9", "9:16"],
        defaultValue: "auto",
      },
    },
  },
  "openai/gpt-image-1.5": {
    enabled: true,
    sortOrder: 40,
    name: "GPT Image 1.5",
    promptMaxLength: 2000,
    provider: "OpenAI",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg",
    supportsImage: true,
    referenceImageCount: 1,
    referenceImageFormat: ReferenceImageFormat.BASE64,
    isNew: false,
    credits: 5,
    options: {
      size: {
        name: "Size",
        type: ModelOptionType.SELECT,
        values: ["1:1", "2:3", "3:2"],
        defaultValue: "1:1",
      },
      quality: {
        name: "Quality",
        type: ModelOptionType.SELECT,
        values: ["low", "medium", "high"],
        defaultValue: "medium",
        valueCredits: {
          medium: 3,
          high: 10,
        },
      },
    },
  },
  "bytedance/seedream-4.5": {
    enabled: true,
    sortOrder: 20,
    name: "Seedream 4.5",
    promptMaxLength: 2000,
    provider: "ByteDance",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
    supportsImage: false,
    isNew: false,
    credits: 3,
    options: {
      aspect_ratio: {
        name: "Aspect Ratio",
        type: ModelOptionType.SELECT,
        values: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
        defaultValue: "1:1",
      },
      resolution: {
        name: "Resolution",
        type: ModelOptionType.SELECT,
        values: ["2K", "4K"],
        defaultValue: "2K",
        valueCredits: {
          "4K": 15,
        },
      },
    },
  },
  "google/nano-banana-pro": {
    enabled: true,
    sortOrder: 30,
    name: "Nano Banana Pro",
    promptMaxLength: 2000,
    provider: "Google",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg",
    supportsImage: true,
    referenceImageCount: 14,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 8,
    options: {
      aspect_ratio: {
        name: "Aspect Ratio",
        type: ModelOptionType.SELECT,
        values: ["auto", "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
        defaultValue: "auto",
      },
      resolution: {
        name: "Resolution",
        type: ModelOptionType.SELECT,
        values: ["1K", "2K", "4K"],
        defaultValue: "2K",
        valueCredits: {
          "2K": 4,
          "4K": 15,
        },
      },
      google_search: {
        name: "Web Search",
        type: ModelOptionType.CHECKBOX,
        values: ["false", "true"],
        defaultValue: "false",
      },
    },
  },
  "xai/grok-imagine-image": {
    enabled: false,
    sortOrder: 60,
    name: "Grok Imagine",
    promptMaxLength: 80000,
    provider: "xAI",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/xai.svg",
    supportsImage: false,
    isNew: false,
    credits: 1,
    options: {
      aspect_ratio: {
        name: "Aspect Ratio",
        type: ModelOptionType.SELECT,
        values: [
          "1:1",
          "3:4",
          "4:3",
          "9:16",
          "16:9",
          "2:3",
          "3:2",
          "9:19.5",
          "19.5:9",
          "9:20",
          "20:9",
          "1:2",
          "2:1",
          "auto",
        ],
        defaultValue: "auto",
      },
      quality: {
        name: "Quality",
        type: ModelOptionType.SELECT,
        values: ["low", "medium", "high"],
        defaultValue: "medium",
        valueCredits: {
          medium: 3,
          high: 10,
        },
      },
      resolution: {
        name: "Resolution",
        type: ModelOptionType.SELECT,
        values: ["1K", "2K"],
        defaultValue: "1K",
        valueCredits: {
          "2K": 4,
        },
      },
    },
  },
  "recraft/recraftv4": {
    enabled: false,
    sortOrder: 50,
    name: "Recraft V4",
    promptMaxLength: 80000,
    provider: "Recraft",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/recraft.svg",
    supportsImage: false,
    isNew: false,
    credits: 3,
    options: {},
  },
  "alibaba/wan-2.6-image": {
    enabled: false,
    sortOrder: 10,
    name: "WAN 2.6",
    promptMaxLength: 80000,
    provider: "Alibaba",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/alibaba.svg",
    supportsImage: false,
    isNew: false,
    credits: 2,
    options: {
      size: {
        name: "Size",
        type: ModelOptionType.SELECT,
        values: ["512x512", "768x768", "768x1024", "1024x768", "1024x1024"],
        defaultValue: "1024x1024",
      },
      negative_prompt: {
        name: "Negative Prompt",
        type: ModelOptionType.TEXTAREA,
        values: [],
      },
    },
  },
  "google/nano-banana-2": {
    enabled: true,
    sortOrder: 30,
    name: "Nano Banana 2",
    promptMaxLength: 2000,
    provider: "Google",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg",
    supportsImage: true,
    referenceImageCount: 14,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 4,
    options: {
      aspect_ratio: {
        name: "Aspect Ratio",
        type: ModelOptionType.SELECT,
        values: [
          "auto",
          "1:1",
          "1:4",
          "4:1",
          "1:8",
          "8:1",
          "2:3",
          "3:2",
          "3:4",
          "4:3",
          "4:5",
          "5:4",
          "9:16",
          "16:9",
          "21:9",
        ],
        defaultValue: "auto",
      },
      resolution: {
        name: "Resolution",
        type: ModelOptionType.SELECT,
        values: ["0.5K", "1K", "2K", "4K"],
        defaultValue: "2K",
        valueCredits: {
          "2K": 4,
          "4K": 15,
        },
      },
      google_search: {
        name: "Google Search",
        type: ModelOptionType.CHECKBOX,
        values: ["false", "true"],
        defaultValue: "false",
      },
      image_search: {
        name: "Image Search",
        type: ModelOptionType.CHECKBOX,
        values: ["false", "true"],
        defaultValue: "false",
      },
      thinking_level: {
        name: "Thinking Level",
        type: ModelOptionType.SELECT,
        values: ["auto", "min", "high"],
        defaultValue: "auto",
      },
    },
  },
  "google/nano-banana-2-lite": {
    enabled: true,
    sortOrder: 30,
    name: "Nano Banana 2 Lite",
    promptMaxLength: 2000,
    provider: "Google",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg",
    supportsImage: true,
    referenceImageCount: 14,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 2,
    options: {
      aspect_ratio: {
        name: "Aspect Ratio",
        type: ModelOptionType.SELECT,
        values: [
          "auto",
          "1:1",
          "1:4",
          "4:1",
          "1:8",
          "8:1",
          "2:3",
          "3:2",
          "3:4",
          "4:3",
          "4:5",
          "5:4",
          "9:16",
          "16:9",
          "21:9",
        ],
        defaultValue: "auto",
      },
      resolution: {
        name: "Resolution",
        type: ModelOptionType.SELECT,
        values: ["1K"],
        defaultValue: "1K",
      },
      thinking_level: {
        name: "Thinking Level",
        type: ModelOptionType.SELECT,
        values: ["auto", "min", "high"],
        defaultValue: "auto",
      },
    },
  },
  "bytedance/seedream-5-lite": {
    enabled: true,
    sortOrder: 20,
    name: "Seedream 5 Lite",
    promptMaxLength: 2000,
    provider: "ByteDance",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
    supportsImage: true,
    referenceImageCount: 14,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: false,
    credits: 2,
    options: {
      aspect_ratio: {
        name: "Aspect Ratio",
        type: ModelOptionType.SELECT,
        values: ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9"],
        defaultValue: "1:1",
      },
      resolution: {
        name: "Resolution",
        type: ModelOptionType.SELECT,
        values: ["2K", "3K"],
        defaultValue: "2K",
        valueCredits: {
          "3K": 8,
        },
      },
      num_images: {
        name: "Number of Images",
        type: ModelOptionType.SELECT,
        values: ["1", "2", "3", "4", "5"],
        defaultValue: "1",
      },
      output_format: {
        name: "Output Format",
        type: ModelOptionType.SELECT,
        values: ["png", "jpeg"],
        defaultValue: "png",
      },
    },
  },
  "bytedance/seedream-5-pro": {
    enabled: true,
    sortOrder: 20,
    name: "Seedream 5 Pro",
    promptMaxLength: 2000,
    provider: "ByteDance",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/bytedance.svg",
    supportsImage: true,
    referenceImageCount: 10,
    referenceImageFormat: ReferenceImageFormat.URL,
    isNew: true,
    credits: 3,
    options: {
      aspect_ratio: {
        name: "Aspect Ratio",
        type: ModelOptionType.SELECT,
        values: ["auto", "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
        defaultValue: "auto",
      },
      resolution: {
        name: "Resolution",
        type: ModelOptionType.SELECT,
        values: ["1K", "2K"],
        defaultValue: "1K",
        valueCredits: {
          "2K": 4,
        },
      },
      output_format: {
        name: "Output Format",
        type: ModelOptionType.SELECT,
        values: ["png", "jpeg"],
        defaultValue: "png",
      },
    },
  },
  "google/imagen-4": {
    enabled: false,
    sortOrder: 30,
    name: "Imagen 4",
    promptMaxLength: 3000,
    provider: "Google",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg",
    supportsImage: false,
    isNew: false,
    credits: 3,
    options: {
      aspect_ratio: {
        name: "Aspect Ratio",
        type: ModelOptionType.SELECT,
        values: ["1:1", "3:4", "4:3", "9:16", "16:9"],
        defaultValue: "1:1",
      },
    },
  },
  "openai/gpt-image-2": {
    enabled: true,
    sortOrder: 40,
    name: "GPT Image 2",
    promptMaxLength: 32000,
    provider: "OpenAI",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg",
    supportsImage: true,
    referenceImageCount: 16,
    referenceImageFormat: ReferenceImageFormat.BASE64,
    isNew: true,
    credits: 5,
    options: {
      size: {
        name: "Size",
        type: ModelOptionType.SELECT,
        values: [
          "1:1",
          "1:2",
          "2:1",
          "1:3",
          "3:1",
          "2:3",
          "3:2",
          "3:4",
          "4:3",
          "4:5",
          "5:4",
          "9:16",
          "16:9",
          "9:21",
          "21:9",
        ],
        defaultValue: "1:1",
      },
      quality: {
        name: "Quality",
        type: ModelOptionType.SELECT,
        values: ["low", "medium", "high"],
        defaultValue: "medium",
        valueCredits: {
          medium: 3,
          high: 10,
        },
      },
      resolution: {
        name: "Resolution",
        type: ModelOptionType.SELECT,
        values: ["1K", "2K", "4K"],
        defaultValue: "2K",
        valueCredits: {
          "2K": 4,
          "4K": 15,
        },
      },
      num_images: {
        name: "Number of Images",
        type: ModelOptionType.SELECT,
        values: ["1", "2", "3", "4", "5"],
        defaultValue: "1",
      },
    },
  },
  "xai/grok-imagine-image-quality": {
    enabled: false,
    sortOrder: 60,
    name: "Grok Imagine Quality",
    promptMaxLength: 80000,
    provider: "xAI",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/xai.svg",
    supportsImage: false,
    isNew: false,
    credits: 4,
    options: {
      aspect_ratio: {
        name: "Aspect Ratio",
        type: ModelOptionType.SELECT,
        values: [
          "1:1",
          "3:4",
          "4:3",
          "9:16",
          "16:9",
          "2:3",
          "3:2",
          "9:19.5",
          "19.5:9",
          "9:20",
          "20:9",
          "1:2",
          "2:1",
          "auto",
        ],
        defaultValue: "auto",
      },
      quality: {
        name: "Quality",
        type: ModelOptionType.SELECT,
        values: ["low", "medium", "high"],
        defaultValue: "medium",
        valueCredits: {
          medium: 3,
          high: 10,
        },
      },
      resolution: {
        name: "Resolution",
        type: ModelOptionType.SELECT,
        values: ["1K", "2K"],
        defaultValue: "1K",
        valueCredits: {
          "2K": 4,
        },
      },
    },
  },
  "recraft/recraftv4-pro": {
    enabled: false,
    sortOrder: 50,
    name: "Recraft V4 Pro",
    promptMaxLength: 80000,
    provider: "Recraft",
    icon: "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/recraft.svg",
    supportsImage: false,
    isNew: true,
    credits: 15,
    options: {},
  },
}

export const MODEL_OPTIONS_CONFIG = Object.fromEntries(
  Object.entries(IMAGE_MODEL_CATALOG).map(([id, model]) => [id, model.options])
) as Record<string, Record<string, ModelOption>>

export const IMAGE_MODEL_IDS = Object.keys(IMAGE_MODEL_CATALOG)
export const ENABLED_IMAGE_MODEL_IDS = IMAGE_MODEL_IDS.filter(id => IMAGE_MODEL_CATALOG[id].enabled)
export const MODEL_CREDITS = Object.fromEntries(
  Object.entries(IMAGE_MODEL_CATALOG).map(([id, model]) => [id, model.credits])
) as Record<string, number>

export const PLAN_MODELS_CONFIG: Record<ModelPlan, PlanModelItem[]> = Object.fromEntries(
  ALL_PLANS.map(plan => [
    plan,
    Object.entries(IMAGE_MODEL_CATALOG)
      .filter(([, model]) => model.enabled && (model.plans ?? ALL_PLANS).includes(plan))
      .map(([id]) => ({ name: id.split("/").pop() || id, supported: true })),
  ])
) as Record<ModelPlan, PlanModelItem[]>

export function isImageModelEnabled(modelId: string): boolean {
  return IMAGE_MODEL_CATALOG[modelId]?.enabled === true
}

export function getImageModelPromptMaxLength(modelId: string): number | null {
  return IMAGE_MODEL_CATALOG[modelId]?.promptMaxLength ?? null
}

export function getPromptCharacterLength(prompt: string): number {
  return Array.from(prompt).length
}

export function getEnabledModels(): ModelConfig[] {
  return Object.entries(IMAGE_MODEL_CATALOG)
    .filter(([, model]) => model.enabled)
    .map(([id, modelDefinition]) => {
      const { enabled: _enabled, plans: _plans, ...model } = modelDefinition
      return { id, ...model }
    })
    .sort((left, right) => {
      const orderDifference = left.sortOrder - right.sortOrder
      if (orderDifference !== 0) return orderDifference

      const providerDifference = left.provider.localeCompare(right.provider, "en", {
        numeric: true,
        sensitivity: "base",
      })
      if (providerDifference !== 0) return providerDifference

      return left.name.localeCompare(right.name, "en", {
        numeric: true,
        sensitivity: "base",
      })
    })
}

export function validateModelOptions(
  modelId: string,
  options: Record<string, string | number | boolean>
): { valid: boolean; invalidKey?: string; invalidValue?: string } {
  const modelOptions = IMAGE_MODEL_CATALOG[modelId]?.options
  if (!modelOptions) return { valid: true }

  for (const [key, value] of Object.entries(options)) {
    const optionConfig = modelOptions[key]
    if (!optionConfig) continue

    if (optionConfig.type === ModelOptionType.CHECKBOX) {
      if (value !== "true" && value !== "false" && value !== true && value !== false) {
        return { valid: false, invalidKey: key, invalidValue: String(value) }
      }
      continue
    }

    if (
      optionConfig.type === ModelOptionType.SELECT &&
      !optionConfig.values.includes(String(value))
    ) {
      return { valid: false, invalidKey: key, invalidValue: String(value) }
    }
  }

  return { valid: true }
}
