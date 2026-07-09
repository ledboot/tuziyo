import { ModelOptionType, type ModelOption } from "./types"

export const MODEL_OPTIONS_CONFIG: Record<string, Record<string, ModelOption>> = {
  "google/nano-banana": {
    aspect_ratio: {
      name: "Aspect Ratio",
      type: ModelOptionType.SELECT,
      values: ["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
      defaultValue: "1:1",
    },
    resolution: {
      name: "Resolution",
      type: ModelOptionType.SELECT,
      values: ["1K", "2K", "4K"],
      defaultValue: "2K",
    },
    output_format: {
      name: "Output Format",
      type: ModelOptionType.SELECT,
      values: ["png", "jpeg", "webp"],
      defaultValue: "webp",
    },
  },
  "google/nano-banana-pro": {
    aspect_ratio: {
      name: "Aspect Ratio",
      type: ModelOptionType.SELECT,
      values: ["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
      defaultValue: "1:1",
    },
    resolution: {
      name: "Resolution",
      type: ModelOptionType.SELECT,
      values: ["1K", "2K", "4K"],
      defaultValue: "2K",
    },
    output_format: {
      name: "Output Format",
      type: ModelOptionType.SELECT,
      values: ["png", "jpeg", "webp"],
      defaultValue: "webp",
    },
  },
  "google/nano-banana-2": {
    aspect_ratio: {
      name: "Aspect Ratio",
      type: ModelOptionType.SELECT,
      values: ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
      defaultValue: "1:1",
    },
    resolution: {
      name: "Resolution",
      type: ModelOptionType.SELECT,
      values: ["1K", "2K", "4K"],
      defaultValue: "2K",
    },
    output_format: {
      name: "Output Format",
      type: ModelOptionType.SELECT,
      values: ["png", "jpeg"],
      defaultValue: "png",
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
  },
  "google/imagen-4": {
    aspect_ratio: {
      name: "Aspect Ratio",
      type: ModelOptionType.SELECT,
      values: ["1:1", "3:4", "4:3", "9:16", "16:9"],
      defaultValue: "1:1",
    },
  },
  "alibaba/wan-2.6-image": {
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
  "bytedance/seedream-4.0": {
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
    },
  },
  "bytedance/seedream-4.5": {
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
    },
  },
  "bytedance/seedream-5-lite": {
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
  "openai/gpt-image-1.5": {
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
    },
  },
  "openai/gpt-image-2": {
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
    },
    resolution: {
      name: "Resolution",
      type: ModelOptionType.SELECT,
      values: ["1K", "2K", "4K"],
      defaultValue: "2K",
    },
  },
  "xai/grok-imagine-image-quality": {
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
    },
    resolution: {
      name: "Resolution",
      type: ModelOptionType.SELECT,
      values: ["1K", "2K"],
      defaultValue: "1K",
    },
  },
  "xai/grok-imagine-image": {
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
    },
    resolution: {
      name: "Resolution",
      type: ModelOptionType.SELECT,
      values: ["1K", "2K"],
      defaultValue: "1K",
    },
  },
  "recraft/recraftv4": {},
  "recraft/recraftv4-pro": {},
}

export function validateModelOptions(
  modelId: string,
  options: Record<string, string | number | boolean>
): { valid: boolean; invalidKey?: string; invalidValue?: string } {
  const modelOptions = MODEL_OPTIONS_CONFIG[modelId]
  if (!modelOptions) {
    return { valid: true }
  }

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
