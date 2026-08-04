import { describe, expect, test } from "bun:test"
import { shouldGrantNewUserCredits } from "../src/routes/auth"

describe("new-user credit grant flag", () => {
  test("disables the grant by default", () => {
    expect(shouldGrantNewUserCredits(undefined)).toBe(false)
    expect(shouldGrantNewUserCredits("false")).toBe(false)
    expect(shouldGrantNewUserCredits("anything-else")).toBe(false)
  })

  test("enables the grant when explicitly set to true", () => {
    expect(shouldGrantNewUserCredits("true")).toBe(true)
    expect(shouldGrantNewUserCredits(" TRUE ")).toBe(true)
  })
})
