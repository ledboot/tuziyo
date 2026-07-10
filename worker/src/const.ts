export const REFERENCE_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const REFERENCE_IMAGE_UPLOAD_EXPIRES_SECONDS = 5 * 60

export const UserTypeMap: Record<string, string> = {
  free: "free",
  starter: "starter",
  professional: "professional",
  creator: "creator",
}

export const PROVIDERS = {
  CLOUDFLARE: "cloudflare",
  EVOLINK: "evolink",
  BYTEPLUS: "byteplus",
} as const

export type Provider = (typeof PROVIDERS)[keyof typeof PROVIDERS]

export const MIME_TYPES = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
} as const

export type MimeType = (typeof MIME_TYPES)[keyof typeof MIME_TYPES]

export const EVOLINK_TASK_OBJECTS = {
  IMAGE: "image.generation.task",
  VIDEO: "video.generation.task",
  AUDIO: "audio.generation.task",
} as const

export type EvoLinkTaskObject = (typeof EVOLINK_TASK_OBJECTS)[keyof typeof EVOLINK_TASK_OBJECTS]

export const EVOLINK_TASK_MIME_TYPES: Record<EvoLinkTaskObject, MimeType> = {
  [EVOLINK_TASK_OBJECTS.IMAGE]: MIME_TYPES.IMAGE,
  [EVOLINK_TASK_OBJECTS.VIDEO]: MIME_TYPES.VIDEO,
  [EVOLINK_TASK_OBJECTS.AUDIO]: MIME_TYPES.AUDIO,
}

export function getEvoLinkTaskMimeType(objectType: unknown): MimeType | null {
  if (typeof objectType !== "string") return null
  return EVOLINK_TASK_MIME_TYPES[objectType as EvoLinkTaskObject] ?? null
}
