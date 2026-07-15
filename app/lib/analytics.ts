export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? ""

type AnalyticsPrimitive = string | number | boolean
type AnalyticsItem = Record<string, AnalyticsPrimitive>
type AnalyticsParams = Record<
  string,
  AnalyticsPrimitive | AnalyticsItem[] | null | undefined
>

type GtagCommand = "config" | "event" | "set"

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (
      command: GtagCommand,
      target: string | Record<string, unknown>,
      params?: Record<string, unknown>
    ) => void
  }
}

const TASK_CONTEXT_PREFIX = "tuziyo:analytics:task:"
const COMPLETED_TASKS_KEY = "tuziyo:analytics:completed-tasks"
const PURCHASES_KEY = "tuziyo:analytics:purchases"
const CREDIT_MILESTONES_PREFIX = "tuziyo:analytics:credit-milestones:"
const GENERATION_STARTED_PREFIX = "tuziyo:analytics:generation-started:"
const PRICING_INTENT_KEY = "tuziyo:analytics:pricing-intent"
const MAX_DEDUPLICATION_ENTRIES = 100

export interface GenerationTaskAnalyticsContext {
  model_id: string
  media_type: "image" | "video" | "audio"
  credit_cost: number
  starting_credit_balance: number
  requested_outputs: number
  reference_image_count: number
  is_first_generation: boolean
  started_at_ms: number
  user_type: string
}

function getGtag() {
  if (typeof window === "undefined") return null

  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = function gtag(command, target, params) {
      window.dataLayer?.push(arguments)
    }
  }
  return window.gtag
}

function compactParams(params: AnalyticsParams): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  )
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  const gtag = getGtag()
  if (!gtag) return
  gtag("event", eventName, compactParams(params))
}

export function trackModelOptionSelection(input: {
  modelId: string
  optionId: string
  optionValue: string
  previousOptionValue?: string
}) {
  if (input.optionValue === input.previousOptionValue) return false

  trackEvent("select_model_option", {
    model_id: input.modelId,
    option_id: input.optionId,
    option_value: input.optionValue,
    previous_option_value: input.previousOptionValue ?? "unset",
  })
  return true
}

export function trackSessionSelection(input: {
  sessionId: string
  previousSessionId?: string
  source?: string
}) {
  trackEvent("select_session", {
    session_id: input.sessionId,
    source: input.source ?? "session_list",
    previous_session_id: input.previousSessionId,
  })
}

export function setAnalyticsUser(user: { userId: string; userType: string } | null) {
  const gtag = getGtag()
  if (!gtag || !GA_MEASUREMENT_ID) return

  gtag("config", GA_MEASUREMENT_ID, {
    user_id: user?.userId ?? null,
    send_page_view: false,
  })
  gtag("set", "user_properties", {
    account_type: user?.userType ?? "anonymous",
    signed_in: Boolean(user),
  })
}

export function trackPageView(pathname: string) {
  if (typeof window === "undefined") return
  trackEvent("page_view", {
    page_location: `${window.location.origin}${pathname}`,
    page_path: pathname,
    page_title: document.title,
  })
}

export function classifyAnalyticsError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  if (message.includes("credit")) return "insufficient_credits"
  if (message.includes("unauthorized") || message.includes("401")) return "unauthorized"
  if (message.includes("timeout") || message.includes("timed out")) return "timeout"
  if (message.includes("invalid") || message.includes("required")) return "validation"
  if (message.includes("provider") || message.includes("generation")) return "generation_provider"
  return "unknown"
}

function readStringList(storage: Storage, key: string): string[] {
  try {
    const value = JSON.parse(storage.getItem(key) || "[]")
    return Array.isArray(value) ? value.filter(item => typeof item === "string") : []
  } catch {
    return []
  }
}

function rememberOnce(storage: Storage, key: string, value: string) {
  const entries = readStringList(storage, key)
  if (entries.includes(value)) return false
  storage.setItem(key, JSON.stringify([...entries, value].slice(-MAX_DEDUPLICATION_ENTRIES)))
  return true
}

export function markGenerationStarted(userId: string) {
  if (typeof window === "undefined") return false
  const key = `${GENERATION_STARTED_PREFIX}${userId}`
  const isFirstGeneration = localStorage.getItem(key) !== "true"
  localStorage.setItem(key, "true")
  return isFirstGeneration
}

export function rememberGenerationTask(
  taskId: string,
  context: GenerationTaskAnalyticsContext
) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(`${TASK_CONTEXT_PREFIX}${taskId}`, JSON.stringify(context))
}

export function getGenerationTaskContext(taskId: string) {
  if (typeof window === "undefined") return null
  try {
    const value = sessionStorage.getItem(`${TASK_CONTEXT_PREFIX}${taskId}`)
    return value ? (JSON.parse(value) as GenerationTaskAnalyticsContext) : null
  } catch {
    return null
  }
}

export function trackGenerationOutcomeOnce(
  taskId: string,
  outcome: "completed" | "failed",
  params: AnalyticsParams
) {
  if (typeof window === "undefined") return false
  if (!rememberOnce(localStorage, COMPLETED_TASKS_KEY, `${taskId}:${outcome}`)) return false

  trackEvent(outcome === "completed" ? "generate_success" : "generate_failed", params)
  sessionStorage.removeItem(`${TASK_CONTEXT_PREFIX}${taskId}`)
  return true
}

export function trackPurchaseOnce(transactionId: string, params: AnalyticsParams) {
  if (typeof window === "undefined") return false
  if (!rememberOnce(localStorage, PURCHASES_KEY, transactionId)) return false
  trackEvent("purchase", { transaction_id: transactionId, ...params })
  return true
}

export function trackFreeCreditProgress(input: {
  userId: string
  totalGranted: number
  totalUsed: number
  balance: number
}) {
  if (typeof window === "undefined" || input.totalGranted <= 0) return

  const usedPercent = Math.min(100, Math.floor((input.totalUsed / input.totalGranted) * 100))
  const storageKey = `${CREDIT_MILESTONES_PREFIX}${input.userId}`
  const reached = new Set(readStringList(localStorage, storageKey))

  for (const milestone of [50, 80, 100]) {
    const milestoneKey = String(milestone)
    if (usedPercent < milestone || reached.has(milestoneKey)) continue

    trackEvent("credit_milestone", {
      milestone,
      grant_type: "onboarding",
      remaining_credit_bucket: getCreditBalanceBucket(input.balance),
    })
    reached.add(milestoneKey)
  }

  if (input.balance === 0 && !reached.has("exhausted")) {
    trackEvent("credit_exhausted", {
      grant_type: "onboarding",
      total_credits_used: input.totalUsed,
    })
    reached.add("exhausted")
  }

  localStorage.setItem(storageKey, JSON.stringify([...reached]))
}

export function getCreditBalanceBucket(balance: number) {
  if (balance <= 0) return "empty"
  if (balance <= 10) return "1_10"
  if (balance <= 50) return "11_50"
  if (balance <= 200) return "51_200"
  return "201_plus"
}

export function markPricingIntent(source: string) {
  if (typeof window === "undefined") return
  try {
    const current = JSON.parse(sessionStorage.getItem(PRICING_INTENT_KEY) || "null") as {
      source?: string
      createdAt?: number
    } | null
    if (
      source === "navigation" &&
      current?.source === "credit_insufficient" &&
      current.createdAt &&
      Date.now() - current.createdAt <= 30 * 60 * 1000
    ) {
      return
    }
  } catch {
    // Replace malformed intent state below.
  }
  sessionStorage.setItem(
    PRICING_INTENT_KEY,
    JSON.stringify({ source, createdAt: Date.now() })
  )
}

export function consumePricingIntent() {
  if (typeof window === "undefined") return "direct"
  try {
    const raw = sessionStorage.getItem(PRICING_INTENT_KEY)
    sessionStorage.removeItem(PRICING_INTENT_KEY)
    if (!raw) return "direct"
    const value = JSON.parse(raw) as { source?: string; createdAt?: number }
    if (!value.source || !value.createdAt || Date.now() - value.createdAt > 30 * 60 * 1000) {
      return "direct"
    }
    return value.source
  } catch {
    return "direct"
  }
}
