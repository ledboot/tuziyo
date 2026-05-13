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
}

export interface UserPayload {
  userId: string
  email: string
  name: string
  avatarUrl?: string
  userType: string
  credits: number
}

export type UserType = "free" | "starter" | "professional" | "enterprise"

export const IMAGE_MODEL_IDS = [
  "google/nano-banana-2",
  "alibaba/wan-2.6-image",
  "bytedance/seedream-5-lite",
  "openai/gpt-image-1.5",
  "openai/gpt-image-2",
] as const
export type IMAGE_MODEL_ID = (typeof IMAGE_MODEL_IDS)[number]

export const MODEL_CREDITS: Record<string, number> = {
  "google/nano-banana-2": 2,
  "alibaba/wan-2.6-image": 1,
  "bytedance/seedream-5-lite": 3,
  "openai/gpt-image-1.5": 5,
  "openai/gpt-image-2": 5,
}

export const PLAN_CREDITS: Record<string, number> = {
  "AI Starter": 500,
  "AI Professional": 2000,
  Enterprise: 5000,
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
}

export interface PreparedReferenceImage {
  key: string
  url?: string
  contentType: string
  size: number
  dataUrl?: string
}