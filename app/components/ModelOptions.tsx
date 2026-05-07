import { useState, useRef, useEffect } from "react"
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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
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

  return (
    <div ref={ref} className={`relative inline-block w-max shrink-0 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-max items-center gap-2 whitespace-nowrap px-3 py-2 bg-base-100 rounded-lg border border-base-200 cursor-pointer hover:border-primary transition-colors"
      >
        <SlidersHorizontal size={16} className="shrink-0" />
        <span className="text-sm whitespace-nowrap">{displayText || "Select options"}</span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 z-[100] w-max min-w-full shadow-2xl bg-base-100 rounded-box border border-base-200">
          <div className="p-2">
            {selectGroups.map((group, groupIdx) => (
              <div key={group.id} className="mb-2 last:mb-0">
                {groupIdx > 0 && <div className="border-t border-base-200 my-2" />}
                <div className="px-3 py-2">
                  <div className="text-xs text-base-content/50 font-medium mb-2 whitespace-nowrap">
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
                            ? "bg-primary text-primary-content font-medium"
                            : "bg-transparent text-base-content hover:bg-base-200"
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
                        className="flex items-center justify-between gap-2 cursor-pointer px-2 py-2 hover:bg-base-200 rounded-lg transition-colors"
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
      )}
    </div>
  )
}
