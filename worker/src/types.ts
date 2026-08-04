import type { Context } from "hono"

export interface Env {
  AI: Ai
  IMAGES: ImagesBinding
  R2: R2Bucket
  DB: D1Database
  JWT_SECRET: string
  MEDIA_SIGNING_SECRET: string
  MEDIA_BASE_URL: string
  R2_ACCOUNT_ID: string
  R2_BUCKET_NAME: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  FRONTEND_URL: string
  ARK_API_KEY: string
  EVOLINK_API_KEY: string
  EVOLINK_CALLBACK_URL: string
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

export interface ModelOption {
  name: string
  type: ModelOptionType
  values: string[]
  defaultValue?: string
  valueCredits?: Record<string, number>
  uiControl?: "slider"
  min?: number
  max?: number
  step?: number
}

export interface ModelCreditOverride {
  when: Record<string, string>
  creditsPerSecond: number
}

export interface ReferenceCreditPricing {
  imagePerItem?: number
  videoPerSecond?: number
  videoPerSecondByResolution?: Record<string, number>
  audioPerSecond?: number
}

export interface PromptLimitRule {
  max: number
  unit: "characters" | "words"
  exclusive?: boolean
}

export interface PromptLimits {
  default: PromptLimitRule
  chinese?: PromptLimitRule
}

export type VideoGenerationMode = "text_to_video" | "image_to_video" | "reference_to_video"
export type VideoInputMode = "start_end_frame" | "image_reference" | "video_reference"

export interface VideoInputModeConfig {
  id: VideoInputMode
  label: string
  generationMode: Exclude<VideoGenerationMode, "text_to_video">
  imageCount?: number
  videoCount?: number
  audioCount?: number
  requiresImageOrVideo?: boolean
  referenceTagStyle?: "at" | "character"
}

export interface ReferenceImageConstraints {
  mimeTypes: string[]
  maxBytes: number
  minWidth: number
  maxWidth?: number
  minHeight: number
  maxHeight?: number
  minAspectRatio: number
  maxAspectRatio: number
}

export interface ReferenceVideoConstraints extends ReferenceImageConstraints {
  minDurationSeconds: number
  maxDurationSeconds: number
  maxTotalDurationSeconds: number
  minFramePixels: number
  maxFramePixels: number
  minFps: number
  maxFps: number
}

export interface ReferenceAudioConstraints {
  mimeTypes: string[]
  maxBytes: number
  minDurationSeconds: number
  maxDurationSeconds: number
  maxTotalDurationSeconds: number
}

export interface ReferenceMediaConstraints {
  totalMaxBytes: number
  image: ReferenceImageConstraints
  video: ReferenceVideoConstraints
  audio: ReferenceAudioConstraints
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
  promptMaxLength: number
  promptLimits?: PromptLimits
  sortOrder: number
  icon: string
  supportsImage: boolean
  referenceImageCount?: number
  referenceImageFormat?: ReferenceImageFormat
  isNew: boolean
  options?: Record<string, ModelOption>
  credits: number
  mediaType?: "image" | "video"
  generationModes?: Array<
    "text_to_image" | "image_to_image" | "text_to_video" | "image_to_video" | "reference_to_video"
  >
  videoInputModes?: VideoInputModeConfig[]
  supportsStartFrame?: boolean
  supportsEndFrame?: boolean
  supportsAudio?: boolean
  pricingMode?: "fixed" | "per_second"
  creditsPerSecond?: number
  creditOverrides?: ModelCreditOverride[]
  referenceCredits?: ReferenceCreditPricing
  pollTimeoutSeconds?: number
  referenceImageConstraints?: ReferenceImageConstraints
  referenceMediaConstraints?: ReferenceMediaConstraints
}

export interface PreparedReferenceImage {
  key: string
  url?: string
  contentType: string
  size: number
  dataUrl?: string
  width?: number
  height?: number
  durationSeconds?: number
  fps?: number
}

export interface PlanModelItem {
  name: string
  supported: boolean
}
