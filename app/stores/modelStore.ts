import { create } from "zustand"
import { persist } from "zustand/middleware"
import { z } from "zod"
import { api } from "~/lib/api"

export const ModelOptionTypeSchema = z.enum(["select", "checkbox", "textarea"])

export const ModelOptionSchema = z.object({
  name: z.string(),
  type: ModelOptionTypeSchema,
  values: z.array(z.string()).default([]),
  defaultValue: z.string().optional(),
  valueCredits: z.record(z.number()).optional(),
  uiControl: z.enum(["slider"]).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
})

export const ModelCreditOverrideSchema = z.object({
  when: z.record(z.string()),
  creditsPerSecond: z.number().nonnegative(),
})

const ReferenceCreditPricingSchema = z.object({
  imagePerItem: z.number().nonnegative().optional(),
  videoPerSecond: z.number().nonnegative().optional(),
  videoPerSecondByResolution: z.record(z.number().nonnegative()).optional(),
  audioPerSecond: z.number().nonnegative().optional(),
})

const PromptLimitRuleSchema = z.object({
  max: z.number().int().positive(),
  unit: z.enum(["characters", "words"]),
  exclusive: z.boolean().optional(),
})

export const VideoInputModeSchema = z.object({
  id: z.enum(["start_end_frame", "image_reference", "video_reference"]),
  label: z.string(),
  generationMode: z.enum(["image_to_video", "reference_to_video"]),
  imageCount: z.number().int().nonnegative().optional(),
  videoCount: z.number().int().nonnegative().optional(),
  audioCount: z.number().int().nonnegative().optional(),
  requiresImageOrVideo: z.boolean().optional(),
  referenceTagStyle: z.enum(["at", "character"]).optional(),
})

const ReferenceImageConstraintsSchema = z.object({
  mimeTypes: z.array(z.string()),
  maxBytes: z.number().positive(),
  minWidth: z.number().positive(),
  maxWidth: z.number().positive().optional(),
  minHeight: z.number().positive(),
  maxHeight: z.number().positive().optional(),
  minAspectRatio: z.number().positive(),
  maxAspectRatio: z.number().positive(),
})

const ReferenceVideoConstraintsSchema = ReferenceImageConstraintsSchema.extend({
  minDurationSeconds: z.number().positive(),
  maxDurationSeconds: z.number().positive(),
  maxTotalDurationSeconds: z.number().positive(),
  minFramePixels: z.number().positive(),
  maxFramePixels: z.number().positive(),
  minFps: z.number().positive(),
  maxFps: z.number().positive(),
})

const ReferenceAudioConstraintsSchema = z.object({
  mimeTypes: z.array(z.string()),
  maxBytes: z.number().positive(),
  minDurationSeconds: z.number().positive(),
  maxDurationSeconds: z.number().positive(),
  maxTotalDurationSeconds: z.number().positive(),
})

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  promptMaxLength: z.number().int().positive(),
  promptLimits: z
    .object({
      default: PromptLimitRuleSchema,
      chinese: PromptLimitRuleSchema.optional(),
    })
    .optional(),
  sortOrder: z.number(),
  icon: z.string(),
  supportsImage: z.boolean().optional(),
  referenceImageCount: z.number().optional(),
  referenceImageFormat: z.enum(["url", "base64"]).optional(),
  isNew: z.boolean().optional(),
  options: z.record(ModelOptionSchema).optional(),
  credits: z.number().default(0),
  mediaType: z.enum(["image", "video"]).default("image"),
  generationModes: z
    .array(
      z.enum([
        "text_to_image",
        "image_to_image",
        "text_to_video",
        "image_to_video",
        "reference_to_video",
      ])
    )
    .optional(),
  videoInputModes: z.array(VideoInputModeSchema).optional(),
  supportsStartFrame: z.boolean().optional(),
  supportsEndFrame: z.boolean().optional(),
  supportsAudio: z.boolean().optional(),
  pricingMode: z.enum(["fixed", "per_second"]).default("fixed"),
  creditsPerSecond: z.number().optional(),
  creditOverrides: z.array(ModelCreditOverrideSchema).optional(),
  referenceCredits: ReferenceCreditPricingSchema.optional(),
  pollTimeoutSeconds: z.number().optional(),
  referenceImageConstraints: ReferenceImageConstraintsSchema.optional(),
  referenceMediaConstraints: z
    .object({
      totalMaxBytes: z.number().positive(),
      image: ReferenceImageConstraintsSchema,
      video: ReferenceVideoConstraintsSchema,
      audio: ReferenceAudioConstraintsSchema,
    })
    .optional(),
})

export type ModelOptionType = z.infer<typeof ModelOptionTypeSchema>
export type ModelOption = z.infer<typeof ModelOptionSchema>
export type ModelOptionsConfig = Record<string, ModelOption>
export type Model = z.infer<typeof ModelSchema>

export interface PersistedReferenceMedia {
  id: string
  ownerUserId: string
  key: string
  url: string
  contentType?: string
  size?: number
  kind: "image" | "video" | "audio"
  role: "start_frame" | "end_frame" | "reference"
  fileName?: string
  width?: number
  height?: number
  durationSeconds?: number
  fps?: number
}

interface ModelState {
  models: Model[]
  modelOptionsConfig: Record<string, ModelOptionsConfig>
  isLoading: boolean
  error: string | null
  fetchModels: () => Promise<void>
  getModelOptionsConfig: (modelId: string) => ModelOptionsConfig
  getDefaultModelOptions: (modelId: string) => Record<string, string>
  normalizeModelOptions: (
    modelId: string,
    options: Record<string, string>
  ) => Record<string, string>
  userSelectedModel: string | null
  userModelOptions: Record<string, string> | null
  userPrompt: string | null
  userMediaType: "image" | "video"
  referenceMedia: PersistedReferenceMedia[]
  setUserSelectedModel: (modelId: string) => void
  setUserModelOptions: (options: Record<string, string>) => void
  setUserPrompt: (prompt: string) => void
  setUserMediaType: (mediaType: "image" | "video") => void
  setReferenceMedia: (media: PersistedReferenceMedia[]) => void
}

function getConfigurableDefault(option: ModelOption): string | null {
  if (option.type === "textarea") return null
  return option.defaultValue ?? option.values[0] ?? (option.type === "checkbox" ? "false" : null)
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      models: [],
      modelOptionsConfig: {},
      isLoading: false,
      error: null,

      fetchModels: async () => {
        const state = get()
        if (
          state.isLoading ||
          (state.models.length > 0 && Object.keys(state.modelOptionsConfig).length > 0)
        ) {
          return
        }

        set({ isLoading: true, error: null })
        try {
          const data = await api.models.list()
          const modelsResult = z.array(ModelSchema).safeParse(data.models)

          if (modelsResult.success) {
            const models = modelsResult.data
            const modelOptionsConfig = Object.fromEntries(
              models.map(model => [model.id, model.options ?? {}])
            )
            set({ models, modelOptionsConfig, isLoading: false })
          } else {
            set({ error: "Invalid model data", isLoading: false })
          }
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Failed to fetch models",
            isLoading: false,
          })
        }
      },

      getModelOptionsConfig: modelId => {
        return get().modelOptionsConfig[modelId] ?? {}
      },

      getDefaultModelOptions: modelId => {
        const config = get().getModelOptionsConfig(modelId)
        return Object.fromEntries(
          Object.entries(config).flatMap(([key, option]) => {
            const defaultValue = getConfigurableDefault(option)
            return defaultValue === null ? [] : [[key, defaultValue]]
          })
        )
      },

      normalizeModelOptions: (modelId, options) => {
        const config = get().getModelOptionsConfig(modelId)
        const defaults = get().getDefaultModelOptions(modelId)

        return Object.fromEntries(
          Object.entries(config).flatMap(([key, option]) => {
            const defaultValue = defaults[key]
            if (defaultValue === undefined) return []

            const nextValue = options[key] ?? defaultValue
            if (option.type === "checkbox") {
              return [[key, nextValue === "true" ? "true" : "false"]]
            }

            if (option.values.length > 0 && !option.values.includes(nextValue)) {
              return [[key, defaultValue]]
            }

            return [[key, nextValue]]
          })
        )
      },

      userSelectedModel: null,
      userModelOptions: null,
      userPrompt: null,
      userMediaType: "image",
      referenceMedia: [],
      setUserSelectedModel: modelId => set({ userSelectedModel: modelId }),
      setUserModelOptions: options => set({ userModelOptions: options }),
      setUserPrompt: prompt => set({ userPrompt: prompt }),
      setUserMediaType: mediaType => set({ userMediaType: mediaType }),
      setReferenceMedia: media => set({ referenceMedia: media }),
    }),
    {
      name: "tuziyo-model-storage",
      partialize: state => ({
        userSelectedModel: state.userSelectedModel,
        userModelOptions: state.userModelOptions,
        userPrompt: state.userPrompt,
        userMediaType: state.userMediaType,
        referenceMedia: state.referenceMedia,
      }),
    }
  )
)
