import { AlertTriangle } from "lucide-react"
import ImageThumbnailStrip from "~/components/ImageThumbnailStrip"
import {
  getActiveOutput,
  getVisibleOutputs,
  type GeneratedImageMessage,
} from "~/types/generatedImage"

interface MessageImageCardProps {
  message: GeneratedImageMessage
  activeOutputId?: string | null
  onSelectOutput: (messageId: string, outputId: string) => void
  onOpen: (message: GeneratedImageMessage, outputId: string) => void
}

export default function MessageImageCard({
  message,
  activeOutputId,
  onSelectOutput,
  onOpen,
}: MessageImageCardProps) {
  const outputs = getVisibleOutputs(message)
  const activeOutput = getActiveOutput(message, activeOutputId)

  const handleSelectOutput = (outputId: string) => onSelectOutput(message.id, outputId)
  const handleOpen = () => {
    if (activeOutput?.status === "completed" && activeOutput.url) {
      onOpen(message, activeOutput.id)
    }
  }

  return (
    <article className="group relative flex aspect-square min-h-0 flex-col overflow-hidden rounded-xl border border-white/20 bg-black/40 ring-1 ring-white/5 transition-colors duration-300 hover:border-white/40">
      <button
        type="button"
        onClick={handleOpen}
        disabled={!activeOutput?.url || activeOutput.status !== "completed"}
        className="relative min-h-0 flex-1 overflow-hidden text-left disabled:cursor-default"
        aria-label="Open image details"
      >
        {activeOutput?.status === "completed" && activeOutput.url ? (
          <img
            src={activeOutput.url}
            alt={message.prompt}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          />
        ) : activeOutput?.status === "failed" ? (
          <span className="flex size-full flex-col items-center justify-center gap-2 bg-red-950/20 px-5 text-center text-red-200/70">
            <AlertTriangle className="size-6" aria-hidden="true" />
            <span className="text-xs">Image generation failed</span>
          </span>
        ) : (
          <span className="relative flex size-full items-center justify-center bg-white/[0.025]">
            <span className="absolute inset-0 skeleton opacity-10" />
            <span className="loading loading-spinner loading-md text-white/35" />
          </span>
        )}
      </button>

      <ImageThumbnailStrip
        outputs={outputs}
        activeOutputId={activeOutput?.id ?? null}
        onSelect={handleSelectOutput}
        compact
        className="shrink-0 border-t border-white/10 bg-black/75 p-2"
      />
    </article>
  )
}
