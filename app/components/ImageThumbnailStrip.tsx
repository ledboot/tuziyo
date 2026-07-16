import { AlertTriangle } from "lucide-react"
import {
  getOutputErrorMessage,
  hasOutputError,
  type GeneratedImageOutput,
} from "~/types/generatedImage"

interface ImageThumbnailStripProps {
  outputs: GeneratedImageOutput[]
  activeOutputId: string | null
  onSelect: (outputId: string) => void
  compact?: boolean
  hoverShadow?: boolean
  className?: string
}

interface ImageThumbnailProps {
  output: GeneratedImageOutput
  active: boolean
  compact: boolean
  hoverShadow: boolean
  onSelect: (outputId: string) => void
}

function ImageThumbnail({ output, active, compact, hoverShadow, onSelect }: ImageThumbnailProps) {
  const handleClick = () => onSelect(output.id)
  const sizeClass = compact ? "size-12" : "size-14 md:size-16"
  const hoverShadowClass = hoverShadow ? "hover:shadow-lg hover:shadow-black/30" : ""
  const thumbnailUrl = output.thumbnail_url
  const outputHasError = hasOutputError(output)
  const errorMessage = outputHasError ? getOutputErrorMessage(output) : null

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${sizeClass} ${hoverShadowClass} relative shrink-0 cursor-pointer overflow-hidden rounded-lg border hover:-translate-y-0.5 hover:scale-105 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
        active
          ? "border-white opacity-100 ring-1 ring-white/30 hover:border-white"
          : "border-white/15 opacity-60 hover:border-white/45 hover:opacity-100"
      }`}
      aria-label={
        outputHasError
          ? `Generated image ${output.output_index + 1} failed: ${errorMessage}`
          : `Show generated image ${output.output_index + 1}`
      }
      aria-pressed={active}
      title={errorMessage ?? undefined}
    >
      {output.status === "completed" && thumbnailUrl && !outputHasError ? (
        <img src={thumbnailUrl} alt="" className="size-full object-cover" loading="lazy" />
      ) : outputHasError ? (
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
  hoverShadow = true,
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
          hoverShadow={hoverShadow}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
