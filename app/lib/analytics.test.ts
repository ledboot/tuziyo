// @ts-expect-error Bun provides this module at test runtime; the app tsconfig intentionally uses Node types.
import { beforeEach, describe, expect, test } from "bun:test"
import {
  GA_MEASUREMENT_ID,
  trackEvent,
  trackFreeCreditProgress,
  trackGenerationOutcomeOnce,
  trackModelOptionSelection,
  trackPurchaseOnce,
  trackSessionSelection,
  setAnalyticsUser,
  markPricingIntent,
  consumePricingIntent,
} from "./analytics"

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function installBrowserGlobals() {
  const local = new MemoryStorage()
  const session = new MemoryStorage()
  const fakeWindow = {
    dataLayer: [] as unknown[],
    location: { origin: "https://tuziyo.com" },
  }

  Object.assign(globalThis, {
    window: fakeWindow,
    localStorage: local,
    sessionStorage: session,
    document: { title: "tuziyo" },
  })

  return fakeWindow
}

function recordedEvents(dataLayer: unknown[]) {
  return dataLayer.map(entry => Array.from(entry as ArrayLike<unknown>))
}

describe("analytics event collection", () => {
  let fakeWindow: ReturnType<typeof installBrowserGlobals>

  beforeEach(() => {
    fakeWindow = installBrowserGlobals()
  })

  test("removes undefined values from event parameters", () => {
    trackEvent("generate_start", { model_id: "model-1", credit_cost: undefined })

    expect(recordedEvents(fakeWindow.dataLayer)).toEqual([
      ["event", "generate_start", { model_id: "model-1" }],
    ])
  })

  test("records model option selections only when the value changes", () => {
    expect(
      trackModelOptionSelection({
        modelId: "model-1",
        optionId: "aspect_ratio",
        optionValue: "16:9",
        previousOptionValue: "1:1",
      })
    ).toBe(true)
    expect(
      trackModelOptionSelection({
        modelId: "model-1",
        optionId: "aspect_ratio",
        optionValue: "16:9",
        previousOptionValue: "16:9",
      })
    ).toBe(false)

    expect(recordedEvents(fakeWindow.dataLayer)).toEqual([
      [
        "event",
        "select_model_option",
        {
          model_id: "model-1",
          option_id: "aspect_ratio",
          option_value: "16:9",
          previous_option_value: "1:1",
        },
      ],
    ])
  })

  test("records session selections from the session list", () => {
    trackSessionSelection({
      sessionId: "session-2",
      previousSessionId: "session-1",
    })

    expect(recordedEvents(fakeWindow.dataLayer)).toEqual([
      [
        "event",
        "select_session",
        {
          session_id: "session-2",
          source: "session_list",
          previous_session_id: "session-1",
        },
      ],
    ])
  })

  test("sets the user ID before login events and clears it after logout events", () => {
    setAnalyticsUser({ userId: "user-1", userType: "starter" })
    trackEvent("login", { method: "google" })
    trackEvent("logout", { user_type: "starter" })
    setAnalyticsUser(null)

    const userEvents = GA_MEASUREMENT_ID
      ? [
          [
            "config",
            GA_MEASUREMENT_ID,
            { user_id: "user-1", send_page_view: false },
          ],
          ["set", "user_properties", { account_type: "starter", signed_in: true }],
        ]
      : []
    const anonymousEvents = GA_MEASUREMENT_ID
      ? [
          ["config", GA_MEASUREMENT_ID, { user_id: null, send_page_view: false }],
          ["set", "user_properties", { account_type: "anonymous", signed_in: false }],
        ]
      : []

    expect(recordedEvents(fakeWindow.dataLayer)).toEqual([
      ...userEvents,
      ["event", "login", { method: "google" }],
      ["event", "logout", { user_type: "starter" }],
      ...anonymousEvents,
    ])
  })

  test("deduplicates task outcomes and purchases", () => {
    const successParams = {
      task_id: "task-1",
      model_id: "model-1",
      provider: "evolink",
    }
    expect(trackGenerationOutcomeOnce("task-1", "completed", successParams)).toBe(true)
    expect(trackGenerationOutcomeOnce("task-1", "completed", successParams)).toBe(false)
    expect(trackPurchaseOnce("checkout-1", { value: 10, currency: "USD" })).toBe(true)
    expect(trackPurchaseOnce("checkout-1", { value: 10, currency: "USD" })).toBe(false)

    expect(recordedEvents(fakeWindow.dataLayer).map(event => event[1])).toEqual([
      "generate_success",
      "purchase",
    ])
    expect(recordedEvents(fakeWindow.dataLayer)[0]).toEqual([
      "event",
      "generate_success",
      successParams,
    ])
  })

  test("emits only the highest newly reached credit milestone and exhaustion once", () => {
    trackFreeCreditProgress({ userId: "user-1", totalGranted: 10, totalUsed: 8, balance: 2 })
    trackFreeCreditProgress({ userId: "user-1", totalGranted: 10, totalUsed: 10, balance: 0 })
    trackFreeCreditProgress({ userId: "user-1", totalGranted: 10, totalUsed: 10, balance: 0 })

    const events = recordedEvents(fakeWindow.dataLayer)
    expect(events.map(event => event[1])).toEqual([
      "credit_milestone",
      "credit_milestone",
      "credit_exhausted",
    ])
    expect(events.filter(event => event[1] === "credit_milestone").map(event => event[2])).toEqual([
      {
        milestone: 80,
        grant_type: "onboarding",
        remaining_credit_bucket: "1_10",
      },
      {
        milestone: 100,
        grant_type: "onboarding",
        remaining_credit_bucket: "empty",
      },
    ])
    expect(events.filter(event => event[1] === "credit_exhausted")).toHaveLength(1)
  })

  test("preserves credit exhaustion intent when the user opens pricing from navigation", () => {
    markPricingIntent("credit_insufficient")
    markPricingIntent("navigation")

    expect(consumePricingIntent()).toBe("credit_insufficient")
    expect(consumePricingIntent()).toBe("direct")
  })
})
