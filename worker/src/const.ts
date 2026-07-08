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

export type Provider = typeof PROVIDERS[keyof typeof PROVIDERS]