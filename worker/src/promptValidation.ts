import type { PromptLimitRule, PromptLimits } from "./types"

const CHINESE_CHARACTER_PATTERN = /\p{Script=Han}/u
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu

export interface PromptLimitStatus {
  count: number
  rule: PromptLimitRule
  isChinese: boolean
  isAtLimit: boolean
  isOverLimit: boolean
}

export function getPromptLimitStatus(prompt: string, limits: PromptLimits): PromptLimitStatus {
  const isChinese = CHINESE_CHARACTER_PATTERN.test(prompt)
  const rule = isChinese && limits.chinese ? limits.chinese : limits.default
  const count =
    rule.unit === "words" ? (prompt.match(WORD_PATTERN)?.length ?? 0) : Array.from(prompt).length
  const allowedMaximum = rule.exclusive ? rule.max - 1 : rule.max

  return {
    count,
    rule,
    isChinese,
    isAtLimit: count >= allowedMaximum,
    isOverLimit: rule.exclusive ? count >= rule.max : count > rule.max,
  }
}

export function getPromptLimitError(prompt: string, limits: PromptLimits): string | null {
  const { rule, isOverLimit } = getPromptLimitStatus(prompt, limits)
  if (!isOverLimit) return null
  const formattedMax = rule.max.toLocaleString("en-US")
  return rule.exclusive
    ? `prompt must contain fewer than ${formattedMax} ${rule.unit}`
    : `prompt must not exceed ${formattedMax} ${rule.unit}`
}
