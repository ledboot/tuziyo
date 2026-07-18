import type { ModelConfig, ModelOption, PlanModelItem } from "./types"
import {
  IMAGE_MODEL_CATALOG,
  PLAN_MODELS_CONFIG as IMAGE_PLAN_MODELS_CONFIG,
  getEnabledModels as getEnabledImageModels,
} from "./imageModels"
import { VIDEO_MODEL_CATALOG, getEnabledVideoModels, getVideoPlanModels } from "./videoModels"

type ModelPlan = "starter" | "professional" | "creator"

export const MEDIA_MODEL_CATALOG = {
  ...IMAGE_MODEL_CATALOG,
  ...VIDEO_MODEL_CATALOG,
}

export const MEDIA_MODEL_IDS = Object.keys(MEDIA_MODEL_CATALOG)
export const ENABLED_MEDIA_MODEL_IDS = MEDIA_MODEL_IDS.filter(
  id => MEDIA_MODEL_CATALOG[id]?.enabled === true
)

export const MODEL_OPTIONS_CONFIG = Object.fromEntries(
  Object.entries(MEDIA_MODEL_CATALOG).map(([id, model]) => [id, model.options])
) as Record<string, Record<string, ModelOption>>

export const MODEL_CREDITS = Object.fromEntries(
  Object.entries(MEDIA_MODEL_CATALOG).map(([id, model]) => [id, model.credits])
) as Record<string, number>

const videoPlanModels = getVideoPlanModels()
export const PLAN_MODELS_CONFIG: Record<ModelPlan, PlanModelItem[]> = Object.fromEntries(
  (Object.keys(IMAGE_PLAN_MODELS_CONFIG) as ModelPlan[]).map(plan => [
    plan,
    [...IMAGE_PLAN_MODELS_CONFIG[plan], ...videoPlanModels[plan]],
  ])
) as Record<ModelPlan, PlanModelItem[]>

export function getEnabledMediaModels(): ModelConfig[] {
  return [
    ...getEnabledImageModels().map(model => ({ ...model, mediaType: "image" as const })),
    ...getEnabledVideoModels(),
  ].sort((left, right) => {
    const orderDifference = left.sortOrder - right.sortOrder
    if (orderDifference !== 0) return orderDifference
    return left.name.localeCompare(right.name, "en", { numeric: true, sensitivity: "base" })
  })
}

export function isMediaModelEnabled(modelId: string) {
  return MEDIA_MODEL_CATALOG[modelId]?.enabled === true
}

export function getMediaModel(modelId: string) {
  return MEDIA_MODEL_CATALOG[modelId]
}

export function getMediaModelPromptMaxLength(modelId: string): number | null {
  return MEDIA_MODEL_CATALOG[modelId]?.promptMaxLength ?? null
}

export function validateMediaModelOptions(
  modelId: string,
  options: Record<string, string | number | boolean>
): { valid: boolean; invalidKey?: string; invalidValue?: string } {
  const modelOptions = MEDIA_MODEL_CATALOG[modelId]?.options
  if (!modelOptions) return { valid: true }

  for (const [key, value] of Object.entries(options)) {
    const optionConfig = modelOptions[key]
    if (!optionConfig) continue
    if (optionConfig.type === "checkbox") {
      if (value !== "true" && value !== "false" && value !== true && value !== false) {
        return { valid: false, invalidKey: key, invalidValue: String(value) }
      }
      continue
    }
    if (optionConfig.type === "select" && !optionConfig.values.includes(String(value))) {
      return { valid: false, invalidKey: key, invalidValue: String(value) }
    }
  }
  return { valid: true }
}
