const API_BASE = import.meta.env.DEV ? "http://localhost:8787" : "https://api.tuziyo.com"
export const R2_IMAGE_BASE = "https://images.tuziyo.com"

export const MODEL_CREDITS: Record<string, number> = {
  "google/nano-banana-2": 2,
  "alibaba/wan-2.6-image": 1,
  "bytedance/seedream-5-lite": 3,
  "openai/gpt-image-1.5": 5,
  "openai/gpt-image-2": 5,
}

export interface ApiModelOption {
  name: string
  type: "select" | "checkbox" | "textarea"
  values: string[]
  defaultValue?: string
}

export interface ApiModel {
  id: string
  name: string
  provider: string
  icon: string
  supportsImage?: boolean
  referenceImageCount?: number
  referenceImageFormat?: "url" | "base64"
  isNew?: boolean
  options?: Record<string, ApiModelOption>
}

export interface ApiToolkitShowcaseItem {
  id: string
  src: string
  alt: string
  prompt: string
  model: string
  aspectRatio: string
  width: number
  height: number
}

export interface ReferenceImageUpload {
  key: string
  uploadUrl: string
  publicUrl: string
  expiresIn: number
  headers: Record<string, string>
}

export interface UploadedReferenceImage {
  key: string
  url: string
  contentType: string
  size: number
}

interface ApiErrorResponse {
  error?: string
  message?: string
}

export function getApiErrorMessage(error: unknown, fallback = "Request failed") {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error) return error
  return fallback
}

function getToken(): string | null {
  try {
    const stored = localStorage.getItem("tuziyo-user-storage")
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.state?.token || null
    }
  } catch {}
  return null
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes("/api/auth/me")) {
      localStorage.removeItem("tuziyo-user-storage")
      window.location.href = "/"
      throw new Error("Unauthorized")
    }
    const error = (await response.json().catch(() => ({ error: "Request failed" }))) as
      | ApiErrorResponse
      | string
    throw new Error(
      typeof error === "string" ? error : error.error || error.message || "Request failed"
    )
  }

  return response.json()
}

export const api = {
  auth: {
    me: () =>
      request<{
        user: {
          userId: string
          email: string
          name: string
          avatarUrl?: string
          userType: string
          credits: number
        } | null
      }>("/api/auth/me"),
    logout: () => request("/api/auth/logout", { method: "POST" }),
  },

  models: {
    list: () => request<{ models: ApiModel[] }>("/api/models"),
  },

  aiToolkit: {
    showcase: () => request<{ items: ApiToolkitShowcaseItem[] }>("/api/ai-toolkit/showcase"),
  },

  uploads: {
    createReferenceImageUpload: (params: {
      fileName: string
      contentType: string
      size: number
      model: string
    }) =>
      request<ReferenceImageUpload>("/api/uploads/reference-image/presign", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    referenceImage: async (file: File, model: string): Promise<UploadedReferenceImage> => {
      const upload = await api.uploads.createReferenceImageUpload({
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        model,
      })
      console.log("aaaaa",upload.headers)

      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: upload.headers,
        body: file,
      })

      if (!response.ok) {
        const message = await response.text().catch(() => "")
        throw new Error(message || "Failed to upload reference image")
      }

      return {
        key: upload.key,
        url: upload.publicUrl,
        contentType: upload.headers["Content-Type"] || file.type,
        size: file.size,
      }
    },
  },

  credits: {
    get: () =>
      request<{ credits: { balance: number; total_purchased: number; total_used: number } }>(
        "/api/credits"
      ),
  },

  transactions: {
    list: (limit = 50) =>
      request<{
        transactions: Array<{
          id: string
          amount: number
          type: string
          description: string
          model: string | null
          credits_per_image: number | null
          created_at: number
        }>
        total: number
      }>(`/api/transactions?limit=${limit}`),
  },

  sessions: {
    list: () =>
      request<{
        sessions: Array<{
          id: string
          title: string
          is_pinned: number
          preview_image: string | null
          created_at: number
          updated_at: number
        }>
      }>("/api/sessions"),
    create: (title: string) =>
      request<{
        session: {
          id: string
          title: string
          is_pinned: number
          created_at: number
          updated_at: number
        }
      }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    get: (id: string) =>
      request<{
        session: {
          id: string
          title: string
          is_pinned: number
          created_at: number
          updated_at: number
        }
        messages: Array<{
          id: string
          role: string
          provider: string | null
          model: string
          prompt: string
          image_url: string | null
          aspect_ratio: string | null
          resolution: string | null
          image_size: string | null
          quality: string | null
          style: string | null
          negative_prompt: string | null
          output_format: string | null
          num_images: number | null
          created_at: number
        }>
      }>(`/api/sessions/${id}`),
    delete: (id: string) => request(`/api/sessions/${id}`, { method: "DELETE" }),
    update: (id: string, data: { title?: string; is_pinned?: number }) =>
      request(`/api/sessions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  generate: {
    create: (params: {
      prompt: string
      model: string
      sessionId?: string
      provider?: string
      size?: string
      quality?: string
      style?: string
      aspect_ratio?: string
      resolution?: string
      output_format?: string
      num_images?: number | string
      negative_prompt?: string
      google_search?: string | boolean
      image_search?: string | boolean
      reference_images?: string[]
      [key: string]: unknown
    }) =>
      request<{ success: boolean; key?: string; imageUrl?: string; error?: string }>(
        "/api/generate",
        {
          method: "POST",
          body: JSON.stringify(params),
        }
      ),
  },

  stripe: {
    products: () =>
      request<{
        products: Array<{
          id: string
          product_id: string
          product_name: string
          product_description: string
          unit_amount: number
          currency: string
          interval: string | null
          features: string[]
          credits: number
          images: number
          sort: number
          recommend: boolean
        }>
      }>("/api/stripe/products"),
    checkout: (priceId: string) =>
      request<{ url: string }>("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      }),
    subscription: () => request<{ subscription: unknown }>("/api/stripe/subscription"),
    portal: () => request<{ url: string }>("/api/stripe/portal", { method: "POST" }),
  },
}

export type Api = typeof api
