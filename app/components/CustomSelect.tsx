import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  // Recalculate position whenever dropdown opens
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const GAP = 8

    if (direction === "up") {
      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        bottom: window.innerHeight - rect.top + GAP,
        minWidth: rect.width,
        zIndex: 9999,
      })
    } else {
      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        top: rect.bottom + GAP,
        minWidth: rect.width,
        zIndex: 9999,
      })
    }
  }, [isOpen, direction])

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

  const dropdown = isOpen ? (
    <div
      ref={dropdownRef}
      className="liquid-glass-dropdown rounded-box border-none"
      style={{ ...dropdownStyle, minWidth: "max-content" }}
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
  ) : null

  return (
    <div className={`relative ${className}`}>
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

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  )
}
