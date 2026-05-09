import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  direction?: "up" | "down"
  suffixIcon?: React.ReactNode
  className?: string
}

export function CustomSelect({
  options,
  value,
  onChange,
  label,
  placeholder = "Select...",
  direction = "up",
  suffixIcon,
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

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

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(prev => !prev)
  }

  const handleOptionClick = (optValue: string) => {
    onChange(optValue)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        className="flex items-center gap-2 px-3 py-2 liquid-glass rounded-lg border-none cursor-pointer hover:ring-1 hover:ring-primary transition-all"
      >
        {selectedOption ? (
          <span className="flex items-center gap-2 min-w-0 flex-1 text-white">
            {selectedOption.icon || suffixIcon}
            <span className="whitespace-nowrap">{selectedOption.label}</span>
          </span>
        ) : (
          <span className="text-base-content/50">{placeholder}</span>
        )}
        <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute z-[100] liquid-glass bg-black/88 rounded-box border-none ${
            direction === "up" ? "bottom-full mb-2 left-0" : "top-full mt-2 left-0"
          }`}
          style={{ minWidth: "max-content" }}
        >
          {label && (
            <div className="px-3 py-2 border-b border-base-200 whitespace-nowrap">
              <span className="font-bold text-xs tracking-wider text-base-content">{label}</span>
            </div>
          )}
          <div className="p-2 flex flex-col gap-1">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleOptionClick(opt.value)}
                className={`flex items-center gap-2 rounded-lg px-2 py-2 whitespace-nowrap w-full text-left cursor-pointer transition-colors ${
                  value === opt.value ? "text-primary font-semibold underline underline-offset-4 decoration-2" : "hover:bg-white/20"
                }`}
              >
                {opt.icon}
                <span className="flex-1 whitespace-nowrap">{opt.label}</span>
                <span className="flex items-center gap-2 shrink-0">
                  {opt.badge}
                  {value === opt.value && <Check className="size-4" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
