import type { Context } from "hono"

export interface Env {
  AI: Ai
  R2: R2Bucket
  DB: D1Database
  JWT_SECRET: string
  R2_ACCOUNT_ID: string
  R2_BUCKET_NAME: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_PUBLIC_BASE_URL?: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  FRONTEND_URL: string
  ARK_API_KEY: string
  EVOLINK_API_KEY: string
}

export interface UserPayload {
  userId: string
  email: string
  name: string
  avatarUrl?: string
  userType: string
  credits: number
}

export interface AppVariables {
  user: UserPayload | null
}

export type AuthenticatedContext = Context<{
  Bindings: Env
  Variables: AppVariables
}>

export type UserType = "free" | "starter" | "professional" | "creator"

export const IMAGE_MODEL_IDS = [
  "bytedance/seedream-4.0",
  "google/nano-banana",
  "openai/gpt-image-1.5",
  "bytedance/seedream-4.5",
  "google/nano-banana-pro",
  "xai/grok-imagine-image",
  "recraft/recraftv4",
  "alibaba/wan-2.6-image",
  "google/nano-banana-2",
  "bytedance/seedream-5-lite",
  "google/imagen-4",
  "openai/gpt-image-2",
  "xai/grok-imagine-image-quality",
  "recraft/recraftv4-pro",
] as const
export type IMAGE_MODEL_ID = (typeof IMAGE_MODEL_IDS)[number]

export const MODEL_CREDITS: Record<string, number> = {
  "bytedance/seedream-4.0": 2,
  "google/nano-banana": 2,
  "openai/gpt-image-1.5": 5,
  "bytedance/seedream-4.5": 3,
  "google/nano-banana-pro": 8,
  "xai/grok-imagine-image": 1,
  "recraft/recraftv4": 3,
  "alibaba/wan-2.6-image": 2,
  "google/nano-banana-2": 4,
  "bytedance/seedream-5-lite": 2,
  "google/imagen-4": 3,
  "openai/gpt-image-2": 5,
  "xai/grok-imagine-image-quality": 4,
  "recraft/recraftv4-pro": 15,
}

export interface ModelOption {
  name: string
  type: ModelOptionType
  values: string[]
  defaultValue?: string
}

export enum ModelOptionType {
  SELECT = "select",
  CHECKBOX = "checkbox",
  TEXTAREA = "textarea",
}

export enum ReferenceImageFormat {
  URL = "url",
  BASE64 = "base64",
}

export interface ModelConfig {
  id: string
  name: string
  provider: string
  icon: string
  supportsImage: boolean
  referenceImageCount?: number
  referenceImageFormat?: ReferenceImageFormat
  isNew: boolean
  options?: Record<string, ModelOption>
  credits: number
}

export interface PreparedReferenceImage {
  key: string
  url?: string
  contentType: string
  size: number
  dataUrl?: string
}

export interface PlanModelItem {
  name: string
  supported: boolean
}

export const PLAN_MODELS_CONFIG: Record<string, PlanModelItem[]> = {
  starter: [
    { name: "seedream-4.0", supported: true },
    { name: "nano-banana", supported: true },
    { name: "gpt-image-1.5", supported: true },
    { name: "seedream-4.5", supported: false },
    { name: "nano-banana-pro", supported: false },
    { name: "grok-imagine-image", supported: false },
    { name: "recraftv4", supported: false },
    { name: "wan-2.6", supported: false },
    { name: "nano-banana-2", supported: false },
    { name: "seedream-5-lite", supported: false },
    { name: "imagen-4", supported: false },
    { name: "gpt-image-2", supported: false },
    { name: "grok-imagine-image-quality", supported: false },
    { name: "recraftv4-pro", supported: false },
  ],
  professional: [
    { name: "seedream-4.0", supported: true },
    { name: "nano-banana", supported: true },
    { name: "gpt-image-1.5", supported: true },
    { name: "seedream-4.5", supported: true },
    { name: "nano-banana-pro", supported: true },
    { name: "grok-imagine-image", supported: true },
    { name: "recraftv4", supported: true },
    { name: "wan-2.6", supported: false },
    { name: "nano-banana-2", supported: false },
    { name: "seedream-5-lite", supported: false },
    { name: "imagen-4", supported: false },
    { name: "gpt-image-2", supported: false },
    { name: "grok-imagine-image-quality", supported: false },
    { name: "recraftv4-pro", supported: false },
  ],
  creator: [
    { name: "seedream-4.0", supported: true },
    { name: "nano-banana", supported: true },
    { name: "gpt-image-1.5", supported: true },
    { name: "seedream-4.5", supported: true },
    { name: "nano-banana-pro", supported: true },
    { name: "grok-imagine-image", supported: true },
    { name: "recraftv4", supported: true },
    { name: "wan-2.6", supported: true },
    { name: "nano-banana-2", supported: true },
    { name: "seedream-5-lite", supported: true },
    { name: "imagen-4", supported: true },
    { name: "gpt-image-2", supported: true },
    { name: "grok-imagine-image-quality", supported: true },
    { name: "recraftv4-pro", supported: true },
  ],
}
