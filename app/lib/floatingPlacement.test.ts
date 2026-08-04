// @ts-expect-error Bun provides this module at test runtime; the app tsconfig intentionally uses Node types.
import { describe, expect, test } from "bun:test"
import { getFloatingMenuPlacement } from "./floatingPlacement"

describe("floating menu placement", () => {
  test("opens down when the trigger is near the top", () => {
    expect(
      getFloatingMenuPlacement({
        triggerTop: 80,
        triggerBottom: 128,
        menuHeight: 180,
        viewportHeight: 900,
      })
    ).toBe("down")
  })

  test("opens up when there is not enough room below", () => {
    expect(
      getFloatingMenuPlacement({
        triggerTop: 720,
        triggerBottom: 768,
        menuHeight: 180,
        viewportHeight: 800,
      })
    ).toBe("up")
  })
})
