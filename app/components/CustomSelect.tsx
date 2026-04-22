import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  direction?: "up" | "down";
  className?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  label,
  placeholder = "Select...",
  direction = "up",
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-sm w-full flex items-center justify-between gap-2 border border-base-200 hover:border-primary hover:bg-base-100 whitespace-nowrap"
      >
        {selectedOption ? (
          <span className="flex items-center gap-2">
            {selectedOption.icon}
            <span>{selectedOption.label}</span>
          </span>
        ) : (
          <span className="text-base-content/50">{placeholder}</span>
        )}
        <ChevronDown
          className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 shadow-2xl bg-base-100 rounded-box border border-base-200 ${
            direction === "up"
              ? "bottom-full mb-1 left-0"
              : "top-full mt-1 left-0"
          }`}
        >
          {label && (
            <div className="px-3 py-2 border-b border-base-200 whitespace-nowrap">
              <span className="font-bold text-xs tracking-wider text-base-content/50">
                {label}
              </span>
            </div>
          )}
          <ul className="p-2">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2 py-2 whitespace-nowrap ${
                    value === opt.value
                      ? "text-primary font-semibold"
                      : "hover:bg-base-200"
                  }`}
                >
                  {opt.icon}
                  <span className="flex-1 text-left">{opt.label}</span>
                  {value === opt.value && <Check className="size-4" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
