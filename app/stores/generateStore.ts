import { create } from "zustand"

interface RegenerateData {
  prompt: string
  model: string
  size?: string
  quality?: string
  style?: string
  aspect_ratio?: string
  resolution?: string
  output_format?: string
  num_images?: number
  negative_prompt?: string
  google_search?: string
  image_search?: string
  background?: string
}

interface GenerateState {
  regenerateData: RegenerateData | null
  setRegenerateData: (data: RegenerateData) => void
  clearRegenerateData: () => void
}

export const useGenerateStore = create<GenerateState>((set) => ({
  regenerateData: null,
  setRegenerateData: (data) => set({ regenerateData: data }),
  clearRegenerateData: () => set({ regenerateData: null }),
}))
