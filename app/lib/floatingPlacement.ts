export type VerticalPlacement = "up" | "down"

export function getFloatingMenuPlacement({
  triggerTop,
  triggerBottom,
  menuHeight,
  viewportHeight,
  gap = 8,
}: {
  triggerTop: number
  triggerBottom: number
  menuHeight: number
  viewportHeight: number
  gap?: number
}): VerticalPlacement {
  const spaceAbove = Math.max(0, triggerTop - gap)
  const spaceBelow = Math.max(0, viewportHeight - triggerBottom - gap)
  if (spaceBelow >= menuHeight) return "down"
  if (spaceAbove >= menuHeight) return "up"
  return spaceBelow >= spaceAbove ? "down" : "up"
}
