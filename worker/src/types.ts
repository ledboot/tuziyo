export interface Env {
  AI: Ai;
  IMAGES: R2Bucket;
  DB: D1Database;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  FRONTEND_URL: string;
}

export interface UserPayload {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  userType: string;
  credits: number;
}

export type UserType = "free" | "starter" | "professional" | "enterprise";

export const IMAGE_MODEL_IDS = ['google/nano-banana-2', 'alibaba/wan-2.6-image', 'bytedance/seedream-5-lite', 'openai/gpt-image-1.5'] as const;
export type IMAGE_MODEL_ID = typeof IMAGE_MODEL_IDS[number];

export const MODEL_CREDITS: Record<string, number> = {
  'google/nano-banana-2': 2,
  'alibaba/wan-2.6-image': 1,
  'bytedance/seedream-5-lite': 3,
  'openai/gpt-image-1.5': 5,
};

export const PLAN_CREDITS: Record<string, number> = {
  'AI Starter': 500,
  'AI Professional': 2000,
  'Enterprise': 5000,
};
