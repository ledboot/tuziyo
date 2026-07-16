import { AlertCircle, AlertTriangle } from "lucide-react"
import ImageThumbnailStrip from "~/components/ImageThumbnailStrip"
import {
  getActiveOutput,
  getOutputErrorMessage,
  getVisibleOutputs,
  hasOutputError,
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
  const displayUrl = activeOutput?.display_url ?? null
  const failedOutputs = outputs.filter(hasOutputError)
  const activeHasError = activeOutput ? hasOutputError(activeOutput) : false
  const activeError = activeOutput && activeHasError ? getOutputErrorMessage(activeOutput) : null

  const handleSelectOutput = (outputId: string) => onSelectOutput(message.id, outputId)
  const handleOpen = () => {
    if (activeOutput?.status === "completed" && displayUrl) {
      onOpen(message, activeOutput.id)
    }
  }

  return (
    <article
      className={`group relative flex aspect-square min-h-0 flex-col overflow-hidden rounded-xl border bg-black/40 ring-1 transition-colors duration-300 ${
        activeHasError
          ? "border-red-400/25 ring-red-400/10 hover:border-red-300/40"
          : "border-white/20 ring-white/5 hover:border-white/40"
      }`}
    >
      <button
        type="button"
        onClick={handleOpen}
        disabled={!displayUrl || activeOutput?.status !== "completed"}
        className="relative min-h-0 flex-1 overflow-hidden text-left disabled:cursor-default"
        aria-label="Open image details"
      >
        {activeOutput?.status === "completed" && displayUrl && !activeHasError ? (
          <>
            <img
              src={displayUrl}
              alt={message.prompt}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            />
            {failedOutputs.length > 0 && (
              <span className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-red-300/20 bg-black/75 px-2.5 py-1 text-[11px] font-medium text-red-100 shadow-lg shadow-black/20 backdrop-blur-md">
                <AlertTriangle className="size-3" aria-hidden="true" />
                {failedOutputs.length} failed
              </span>
            )}
          </>
        ) : activeHasError && activeOutput ? (
          <span
            className="relative flex size-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,rgba(127,29,29,0.28),transparent_62%)] px-6 text-center"
            role="alert"
          >
            <span className="absolute inset-0 bg-gradient-to-b from-red-500/[0.04] to-black/20" />
            <span className="relative mb-3 flex size-10 items-center justify-center rounded-full border border-red-300/15 bg-red-300/[0.08] text-red-200 shadow-[0_8px_30px_rgba(127,29,29,0.18)]">
              <AlertCircle className="size-5" aria-hidden="true" />
            </span>
            <span className="relative text-sm font-semibold tracking-tight text-red-50">
              Generation failed
            </span>
            <span
              className="relative mt-1.5 line-clamp-3 max-w-64 text-xs leading-5 text-red-100/55"
              title={activeError ?? undefined}
            >
              {activeError}
            </span>
            {failedOutputs.length > 1 && (
              <span className="relative mt-3 text-[10px] font-medium uppercase tracking-[0.14em] text-red-200/35">
                {failedOutputs.length} outputs affected
              </span>
            )}
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
