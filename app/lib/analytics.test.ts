// @ts-expect-error Bun provides this module at test runtime; the app tsconfig intentionally uses Node types.
import { beforeEach, describe, expect, test } from "bun:test"
import {
  trackEvent,
  trackFreeCreditProgress,
  trackGenerationOutcomeOnce,
  trackPurchaseOnce,
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

  test("deduplicates task outcomes and purchases", () => {
    expect(trackGenerationOutcomeOnce("task-1", "completed", { model_id: "model-1" })).toBe(
      true
    )
    expect(trackGenerationOutcomeOnce("task-1", "completed", { model_id: "model-1" })).toBe(
      false
    )
    expect(trackPurchaseOnce("checkout-1", { value: 10, currency: "USD" })).toBe(true)
    expect(trackPurchaseOnce("checkout-1", { value: 10, currency: "USD" })).toBe(false)

    expect(recordedEvents(fakeWindow.dataLayer).map(event => event[1])).toEqual([
      "generate_success",
      "purchase",
    ])
  })

  test("emits free-credit milestones and exhaustion only once", () => {
    trackFreeCreditProgress({ userId: "user-1", totalGranted: 10, totalUsed: 8, balance: 2 })
    trackFreeCreditProgress({ userId: "user-1", totalGranted: 10, totalUsed: 10, balance: 0 })
    trackFreeCreditProgress({ userId: "user-1", totalGranted: 10, totalUsed: 10, balance: 0 })

    const events = recordedEvents(fakeWindow.dataLayer)
    expect(events.map(event => event[1])).toEqual([
      "credit_milestone",
      "credit_milestone",
      "credit_milestone",
      "credit_exhausted",
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
