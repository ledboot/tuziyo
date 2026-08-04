import type { PromptLimits } from "./api"

const CHINESE_CHARACTER_PATTERN = /\p{Script=Han}/u
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu

export function getPromptLimitStatus(prompt: string, limits: PromptLimits) {
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

export function formatPromptLimit(rule: PromptLimits["default"]) {
  const displayMaximum = rule.exclusive ? rule.max - 1 : rule.max
  return displayMaximum.toLocaleString("en-US")
}

export function getPromptLimitMessage(prompt: string, limits: PromptLimits) {
  const status = getPromptLimitStatus(prompt, limits)
  if (!status.isOverLimit) return null
  const max = status.rule.max.toLocaleString("en-US")
  return status.rule.exclusive
    ? `Prompt must contain fewer than ${max} ${status.rule.unit}.`
    : `Prompt must not exceed ${max} ${status.rule.unit}.`
}
