import { describe, expect, test } from "bun:test"
import { getPromptLimitError, getPromptLimitStatus } from "../src/promptValidation"

describe("language-aware video prompt limits", () => {
  test("enforces Seedance Chinese characters and English words", () => {
    const limits = {
      default: { max: 1000, unit: "words" as const },
      chinese: { max: 500, unit: "characters" as const },
    }
    expect(getPromptLimitError("中".repeat(500), limits)).toBeNull()
    expect(getPromptLimitError("中".repeat(501), limits)).toContain("500 characters")
    expect(getPromptLimitError(Array(1000).fill("word").join(" "), limits)).toBeNull()
    expect(getPromptLimitError(Array(1001).fill("word").join(" "), limits)).toContain("1,000 words")
    expect(getPromptLimitStatus(`中${"a".repeat(500)}`, limits).isChinese).toBe(true)
  })

  test("treats Kling and Veo limits as exclusive", () => {
    const kling = { default: { max: 2500, unit: "characters" as const, exclusive: true } }
    const veo = { default: { max: 2000, unit: "characters" as const, exclusive: true } }
    expect(getPromptLimitError("a".repeat(2499), kling)).toBeNull()
    expect(getPromptLimitError("a".repeat(2500), kling)).toContain("fewer than 2,500")
    expect(getPromptLimitError("a".repeat(1999), veo)).toBeNull()
    expect(getPromptLimitError("a".repeat(2000), veo)).toContain("fewer than 2,000")
  })

  test("enforces HappyHorse Chinese and non-Chinese character limits", () => {
    const limits = {
      default: { max: 5000, unit: "characters" as const },
      chinese: { max: 2500, unit: "characters" as const },
    }
    expect(getPromptLimitError("中".repeat(2500), limits)).toBeNull()
    expect(getPromptLimitError("中".repeat(2501), limits)).toContain("2,500 characters")
    expect(getPromptLimitError("a".repeat(5000), limits)).toBeNull()
    expect(getPromptLimitError("a".repeat(5001), limits)).toContain("5,000 characters")
  })
})
