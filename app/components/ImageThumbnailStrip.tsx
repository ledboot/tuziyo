import { AlertTriangle } from "lucide-react"
import type { GeneratedImageOutput } from "~/types/generatedImage"

interface ImageThumbnailStripProps {
  outputs: GeneratedImageOutput[]
  activeOutputId: string | null
  onSelect: (outputId: string) => void
  compact?: boolean
  className?: string
}

interface ImageThumbnailProps {
  output: GeneratedImageOutput
  active: boolean
  compact: boolean
  onSelect: (outputId: string) => void
}

function ImageThumbnail({ output, active, compact, onSelect }: ImageThumbnailProps) {
  const handleClick = () => onSelect(output.id)
  const sizeClass = compact ? "size-12" : "size-14 md:size-16"

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${sizeClass} relative shrink-0 cursor-pointer overflow-hidden rounded-lg border transition-[border-color,opacity,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-black/30 active:translate-y-0 active:scale-95 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
        active
          ? "border-white opacity-100 ring-1 ring-white/30 hover:border-white"
          : "border-white/15 opacity-60 hover:border-white/45 hover:opacity-100"
      }`}
      aria-label={`Show generated image ${output.output_index + 1}`}
      aria-pressed={active}
    >
      {output.status === "completed" && output.url ? (
        <img src={output.url} alt="" className="size-full object-cover" loading="lazy" />
      ) : output.status === "failed" ? (
        <span className="flex size-full items-center justify-center bg-red-950/40 text-red-300">
          <AlertTriangle className="size-4" aria-hidden="true" />
        </span>
      ) : (
        <span className="flex size-full items-center justify-center bg-white/[0.04]">
          <span className="loading loading-spinner loading-xs text-white/45" />
        </span>
      )}
    </button>
  )
}

export default function ImageThumbnailStrip({
  outputs,
  activeOutputId,
  onSelect,
  compact = false,
  className = "",
}: ImageThumbnailStripProps) {
  if (outputs.length <= 1) return null

  return (
    <div
      className={`flex max-w-full gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      role="group"
      aria-label="Generated images"
    >
      {outputs.map(output => (
        <ImageThumbnail
          key={output.id}
          output={output}
          active={output.id === activeOutputId}
          compact={compact}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
