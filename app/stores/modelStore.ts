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
})

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  icon: z.string(),
  supportsImage: z.boolean().optional(),
  referenceImageCount: z.number().optional(),
  referenceImageFormat: z.enum(["url", "base64"]).optional(),
  isNew: z.boolean().optional(),
  options: z.record(ModelOptionSchema).optional(),
})

export type ModelOptionType = z.infer<typeof ModelOptionTypeSchema>
export type ModelOption = z.infer<typeof ModelOptionSchema>
export type ModelOptionsConfig = Record<string, ModelOption>
export type Model = z.infer<typeof ModelSchema>

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
  setUserSelectedModel: (modelId: string) => void
  setUserModelOptions: (options: Record<string, string>) => void
  setUserPrompt: (prompt: string) => void
}

function getConfigurableDefault(option: ModelOption): string | null {
  if (option.type === "textarea") return null
  return option.defaultValue ?? option.values[0] ?? (option.type === "checkbox" ? "false" : null)
}

export const useModelStore = create<ModelState>()(persist((set, get) => ({
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
  setUserSelectedModel: modelId => set({ userSelectedModel: modelId }),
  setUserModelOptions: options => set({ userModelOptions: options }),
  setUserPrompt: prompt => set({ userPrompt: prompt }),
}), {
  name: "tuziyo-model-storage",
  partialize: (state) => ({
    userSelectedModel: state.userSelectedModel,
    userModelOptions: state.userModelOptions,
    userPrompt: state.userPrompt,
  }),
}))
