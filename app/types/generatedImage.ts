export type OutputMimeType = "image" | "video" | "audio"

export interface GeneratedImageOutput {
  id: string
  message_id: string
  output_index: number
  status: "pending" | "completed" | "failed" | "deleted"
  thumbnail_url: string | null
  display_url: string | null
  content_type: OutputMimeType
  width: number | null
  height: number | null
  file_size: number | null
  error: string | null
  created_at: number
  updated_at: number
  is_favorite?: number | boolean
  legacy?: boolean
}

export interface GeneratedImageMessage {
  id: string
  role: string
  provider: string | null
  model: string
  prompt: string
  aspect_ratio: string | null
  resolution: string | null
  image_size: string | null
  quality: string | null
  style: string | null
  negative_prompt: string | null
  output_format: string | null
  num_images: number | null
  google_search?: number | null
  image_search?: number | null
  created_at: number
  is_favorite?: number | boolean
  outputs: GeneratedImageOutput[]
}

export function getVisibleOutputs(message: GeneratedImageMessage) {
  return message.outputs.filter(output => output.status !== "deleted")
}

export function getDefaultOutput(message: GeneratedImageMessage) {
  const outputs = getVisibleOutputs(message)
  return (
    outputs.find(
      output => output.status === "completed" && (output.display_url || output.thumbnail_url)
    ) ??
    outputs[0] ??
    null
  )
}

export function getActiveOutput(message: GeneratedImageMessage, outputId?: string | null) {
  const outputs = getVisibleOutputs(message)
  return outputs.find(output => output.id === outputId) ?? getDefaultOutput(message)
}
