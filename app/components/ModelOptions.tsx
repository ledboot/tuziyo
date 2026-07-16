import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { SlidersHorizontal, ChevronDown } from "lucide-react"

export interface OptionItem {
  label: string
  value: string
}

export interface OptionGroup {
  id: string
  label: string
  options: OptionItem[]
  value: string
  onChange: (value: string) => void
  type?: "select" | "checkbox"
}

interface ModelOptionsProps {
  groups: OptionGroup[]
  className?: string
}

export function ModelOptions({ groups, className = "" }: ModelOptionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Recalculate position whenever dropdown opens
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const GAP = 8

    setDropdownStyle({
      position: "fixed",
      left: rect.left,
      bottom: window.innerHeight - rect.top + GAP,
      minWidth: rect.width,
      zIndex: 9999,
    })
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  if (groups.length === 0) return null

  const selectGroups = groups.filter(g => g.type !== "checkbox")
  const toggleGroups = groups.filter(g => g.type === "checkbox")

  const summaryText = selectGroups
    .map(g => {
      const selected = g.options.find(o => o.value === g.value)
      return selected?.label || g.value
    })
    .join(" / ")

  const toggleSummaryText = toggleGroups
    .filter(g => g.value === "true")
    .map(g => g.label)
    .join(", ")

  const displayText = summaryText + (toggleSummaryText ? ` • ${toggleSummaryText}` : "")

  const dropdown = isOpen ? (
    <div
      ref={dropdownRef}
      className="liquid-glass-dropdown rounded-box border-none"
      style={{ ...dropdownStyle, width: "max-content" }}
    >
      <div className="p-2">
        {selectGroups.map((group, groupIdx) => (
          <div key={group.id} className="mb-2 last:mb-0">
            {groupIdx > 0 && <div className="border-t border-base-200 my-2" />}
            <div className="px-3 py-2">
              <div className="text-xs text-base-content font-medium mb-2 whitespace-nowrap">
                {group.label}
              </div>
              <div className="flex w-max gap-2">
                {group.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      group.onChange(opt.value)
                      setIsOpen(false)
                    }}
                    className={`w-max whitespace-nowrap px-2 py-1.5 text-sm rounded-lg transition-colors cursor-pointer text-center ${
                      group.value === opt.value
                        ? "text-primary font-semibold underline underline-offset-4 decoration-2"
                        : "bg-transparent text-base-content hover:bg-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {toggleGroups.length > 0 && (
          <div className="border-t border-base-200 my-2 pt-2">
            <div className="px-3 py-2">
              <div className="flex flex-col gap-2">
                {toggleGroups.map(group => (
                  <label
                    key={group.id}
                    className="flex items-center justify-between gap-2 cursor-pointer px-2 py-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-sm whitespace-nowrap">{group.label}</span>
                    <input
                      type="checkbox"
                      checked={group.value === "true"}
                      onChange={e => group.onChange(String(e.target.checked))}
                      className="toggle toggle-sm toggle-primary"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null

  return (
    <div className={`relative inline-block w-max shrink-0 ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-max items-center gap-2 whitespace-nowrap px-3 py-2 liquid-glass rounded-lg border-none cursor-pointer hover:ring-1 hover:ring-primary transition-all"
      >
        <SlidersHorizontal size={16} className="shrink-0 text-white" />
        <span className="text-sm whitespace-nowrap">{displayText || "Select options"}</span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform text-white ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  )
}
