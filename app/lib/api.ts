import { API_BASE } from "./config"

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
  promptMaxLength: number
  sortOrder: number
  icon: string
  supportsImage?: boolean
  referenceImageCount?: number
  referenceImageFormat?: "url" | "base64"
  isNew?: boolean
  options?: Record<string, ApiModelOption>
  mediaType?: "image" | "video"
  generationModes?: Array<"text_to_image" | "image_to_image" | "text_to_video" | "image_to_video">
  supportsStartFrame?: boolean
  supportsEndFrame?: boolean
  supportsAudio?: boolean
  pricingMode?: "fixed" | "per_second"
  creditsPerSecond?: number
  pollTimeoutSeconds?: number
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
    list: () =>
      request<{
        models: ApiModel[]
        plan_models_config: Record<
          string,
          Array<{ name: string; supported: boolean; label?: string }>
        >
      }>("/api/models"),
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
      console.log("aaaaa", upload.headers)

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
      request<{
        credits: {
          balance: number
          subscription_balance: number
          purchased_balance: number
          subscription_period_start: number | null
          subscription_period_end: number | null
          total_purchased: number
          total_used: number
        }
      }>("/api/credits"),
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
          invoice_id: string | null
          credit_period_start: number | null
          credit_period_end: number | null
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
    get: (id: string) =>
      request<{
        session: {
          id: string
          title: string
          is_pinned: number
          preview_image: string | null
          created_at: number
          updated_at: number
        }
        messages: Array<{
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
          media_type: "image" | "video" | "audio"
          generation_mode: string | null
          duration: number | null
          generate_audio: number | null
          google_search: number | null
          image_search: number | null
          created_at: number
          outputs: Array<{
            id: string
            message_id: string
            output_index: number
            status: "pending" | "completed" | "failed" | "deleted"
            thumbnail_url: string | null
            display_url: string | null
            content_type: "image" | "video" | "audio"
            width: number | null
            height: number | null
            file_size: number | null
            duration_ms: number | null
            fps: number | null
            has_audio: number | null
            error: string | null
            created_at: number
            updated_at: number
            is_favorite?: number
            legacy?: boolean
          }>
        }>
        pendingTasks?: Array<{
          id: string
          message_id: string | null
          status: string
          requested_count: number
          completed_count: number
          failed_count: number
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
      thinking_level?: string
      reference_images?: string[]
      media_type?: "image" | "video"
      generation_mode?: "text_to_image" | "image_to_image" | "text_to_video" | "image_to_video"
      duration?: number | string
      generate_audio?: string | boolean
      [key: string]: unknown
    }) =>
      request<{
        success: boolean
        taskId?: string
        sessionId?: string
        messageId?: string
        requestedCount?: number
        mediaType?: "image" | "video"
        generationMode?: string
        pollTimeoutSeconds?: number
        error?: string
      }>("/api/generate", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    getTaskStatus: (taskId: string) =>
      request<{
        success: boolean
        status: "pending" | "processing" | "completed" | "failed"
        result?: {
          success: boolean
          key?: string
          sessionId?: string
          messageId?: string
          outputs?: Array<{
            id: string
            index: number
            key: string
          }>
        }
        outputs?: Array<{
          id: string
          message_id: string
          output_index: number
          status: "pending" | "completed" | "failed" | "deleted"
          thumbnail_url: string | null
          display_url: string | null
          content_type: "image" | "video" | "audio"
          width: number | null
          height: number | null
          file_size: number | null
          duration_ms: number | null
          fps: number | null
          has_audio: number | null
          error: string | null
          created_at: number
          updated_at: number
        }>
        error?: string
        analytics?: {
          task_id: string
          model: string | null
          provider: string | null
          requested_count: number
          completed_count: number
          failed_count: number
          duration_seconds: number
        }
      }>(`/api/generate/task/${taskId}`),
  },

  stripe: {
    products: () =>
      request<{
        products: Array<{
          product_id: string
          product_name: string
          product_description: string
          features: string[]
          credits: number
          images: number
          sort: number
          recommend: boolean
          prices: {
            monthly: {
              id: string
              unit_amount: number
              currency: string
            } | null
            yearly: {
              id: string
              unit_amount: number
              currency: string
            } | null
          }
        }>
      }>("/api/stripe/products"),
    checkout: (priceId: string) =>
      request<{ url: string; sessionId: string }>("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      }),
    checkoutStatus: (sessionId: string) =>
      request<{
        checkout: {
          completed: boolean
          status: string | null
          payment_status: string
          transaction_id: string
          plan_id: string | null
          plan_name: string
          billing_period: "monthly" | "yearly" | "unknown"
          value: number
          currency: string
        }
      }>(`/api/stripe/checkout/${encodeURIComponent(sessionId)}`),
    subscription: () => request<{ subscription: unknown }>("/api/stripe/subscription"),
    portal: () => request<{ url: string }>("/api/stripe/portal", { method: "POST" }),
  },

  images: {
    favorite: (id: string, favorited: boolean) =>
      request<{ success: boolean; favorited: boolean }>(`/api/images/${id}/favorite`, {
        method: "PATCH",
        body: JSON.stringify({ favorited }),
      }),
    getDownloadUrl: (id: string) =>
      request<{ url: string; expiresIn: number }>(`/api/images/${id}/download-url`, {
        method: "POST",
      }),
    getFavorites: () =>
      request<{
        favorites: Array<{
          favorite_id: string
          favorite_created_at: number
          id: string
          message_id: string
          output_id: string | null
          role: string
          provider: string | null
          model: string
          prompt: string
          thumbnail_url: string | null
          display_url: string | null
          aspect_ratio: string | null
          resolution: string | null
          image_size: string | null
          quality: string | null
          style: string | null
          negative_prompt: string | null
          output_format: string | null
          num_images: number | null
          google_search: number | null
          image_search: number | null
          created_at: number
        }>
        total: number
      }>("/api/favorites"),
  },

  assets: {
    list: (
      params: {
        kind?: "image" | "video" | "audio"
        origin?: "generated" | "uploaded" | "stock"
        search?: string
        favorite?: boolean
        hidden?: boolean
        limit?: number
        offset?: number
      } = {}
    ) => {
      const search = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") search.set(key, String(value))
      })
      const query = search.toString()
      return request<{
        assets: LibraryAsset[]
        total: number
        limit: number
        offset: number
      }>(`/api/assets${query ? `?${query}` : ""}`)
    },
    get: (id: string) => request<{ asset: LibraryAsset }>(`/api/assets/${id}`),
    update: (
      id: string,
      data: { name?: string; tags?: string[]; is_favorite?: boolean; is_hidden?: boolean }
    ) =>
      request<{ asset: LibraryAsset }>(`/api/assets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/assets/${id}`, { method: "DELETE" }),
    getDownloadUrl: (id: string) =>
      request<{ url: string; expiresIn: number }>(`/api/assets/${id}/download-url`, {
        method: "POST",
      }),
  },

  studio: {
    listProjects: () => request<{ projects: StudioProject[] }>("/api/studio/projects"),
    createProject: (data: { name: string; description?: string; aspect_ratio?: string }) =>
      request<{ projectId: string }>("/api/studio/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getProject: (id: string) => request<StudioProjectDetail>(`/api/studio/projects/${id}`),
    updateProject: (
      id: string,
      data: Partial<Pick<StudioProject, "name" | "description" | "aspect_ratio" | "status">>
    ) =>
      request<{ success: boolean }>(`/api/studio/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteProject: (id: string) =>
      request<{ success: boolean }>(`/api/studio/projects/${id}`, { method: "DELETE" }),
    createEntity: (
      projectId: string,
      data: { name: string; description?: string; type?: string; asset_ids?: string[] }
    ) =>
      request<{ entityId: string }>(`/api/studio/projects/${projectId}/entities`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    createFrame: (
      projectId: string,
      data: { asset_id: string; label?: string; frame_type?: string }
    ) =>
      request<{ frameId: string }>(`/api/studio/projects/${projectId}/frames`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    createShot: (
      projectId: string,
      data: {
        name: string
        prompt?: string
        asset_id?: string
        first_frame_asset_id?: string
        last_frame_asset_id?: string
      }
    ) =>
      request<{ shotId: string }>(`/api/studio/projects/${projectId}/shots`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    addShotVersion: (shotId: string, assetId: string) =>
      request<{ versionId: string }>(`/api/studio/shots/${shotId}/versions`, {
        method: "POST",
        body: JSON.stringify({ asset_id: assetId }),
      }),
    reorderSequence: (projectId: string, shotIds: string[]) =>
      request<{ success: boolean }>(`/api/studio/projects/${projectId}/sequence`, {
        method: "PATCH",
        body: JSON.stringify({ shot_ids: shotIds }),
      }),
  },
}

export interface LibraryAsset {
  id: string
  source_output_id: string | null
  kind: "image" | "video" | "audio"
  origin: "generated" | "uploaded" | "stock"
  name: string
  content_type: string | null
  width: number | null
  height: number | null
  duration_ms: number | null
  fps: number | null
  has_audio: number | null
  model: string | null
  prompt: string | null
  tags: string[]
  is_favorite: number
  is_hidden: number
  created_at: number
  updated_at: number
  thumbnail_url: string | null
  display_url: string | null
}

export interface StudioProject {
  id: string
  name: string
  description: string | null
  aspect_ratio: string
  status: "active" | "archived"
  shot_count?: number
  entity_count?: number
  created_at: number
  updated_at: number
}

export interface StudioEntity {
  id: string
  project_id: string
  name: string
  description: string | null
  type: "character" | "location" | "object" | "style"
}

export interface StudioShot {
  id: string
  project_id: string
  name: string
  prompt: string | null
  duration_ms: number | null
  active_version_id: string | null
  status: "draft" | "generating" | "ready" | "failed"
}

export interface StudioSequenceItem {
  id: string
  project_id: string
  shot_id: string
  position: number
  transition: "cut" | "fade"
}

export interface StudioAssetLink {
  id: string
  shot_id?: string
  asset_id: string
  entity_id?: string
  version_number?: number
  asset: LibraryAsset
}

export interface StudioProjectDetail {
  project: StudioProject
  entities: StudioEntity[]
  entityAssets: StudioAssetLink[]
  frames: Array<{
    id: string
    asset_id: string
    label: string | null
    frame_type: string
    asset: LibraryAsset
  }>
  shots: StudioShot[]
  versions: StudioAssetLink[]
  sequence: StudioSequenceItem[]
}

export type Api = typeof api
