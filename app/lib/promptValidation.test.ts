// @ts-expect-error Bun provides this module at test runtime; the app tsconfig intentionally uses Node types.
import { describe, expect, test } from "bun:test"
import { formatPromptLimit, getPromptLimitMessage, getPromptLimitStatus } from "./promptValidation"

describe("prompt limit UI helpers", () => {
  test("switches Seedance to the Chinese rule when Han characters are present", () => {
    const limits = {
      default: { max: 1000, unit: "words" as const },
      chinese: { max: 500, unit: "characters" as const },
    }
    expect(getPromptLimitStatus("one two three", limits)).toMatchObject({
      count: 3,
      isChinese: false,
    })
    expect(getPromptLimitStatus("一个 scene", limits)).toMatchObject({
      count: 8,
      isChinese: true,
    })
  })

  test("displays and rejects exclusive model limits", () => {
    const limits = {
      default: { max: 2500, unit: "characters" as const, exclusive: true },
    }
    expect(formatPromptLimit(limits.default)).toBe("2,499")
    expect(getPromptLimitMessage("a".repeat(2499), limits)).toBeNull()
    expect(getPromptLimitMessage("a".repeat(2500), limits)).toContain("fewer than 2,500")
  })
})
