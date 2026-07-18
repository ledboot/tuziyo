import { useState, useEffect } from "react"
import { X, RotateCcw, Download, Star, Folder, Trash2 } from "lucide-react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { useGenerateStore } from "~/stores/generateStore"
import { api } from "~/lib/api"
import ImageThumbnailStrip from "~/components/ImageThumbnailStrip"
import { trackEvent } from "~/lib/analytics"
import {
  getActiveOutput,
  getVisibleOutputs,
  type GeneratedImageMessage,
} from "~/types/generatedImage"

interface ImageDetailModalProps {
  image: GeneratedImageMessage | null
  initialOutputId?: string | null
  sessionTitle: string
  onClose: () => void
  onRecreate?: (image: GeneratedImageMessage) => void
  onFavoriteToggle?: (imageId: string, isFavorited: boolean) => void
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function getModelName(modelId: string): string {
  const modelNames: Record<string, string> = {
    "google/nano-banana-2": "Nano Banana 2",
    "alibaba/wan-2.6-image": "WAN 2.6",
    "bytedance/seedream-5-lite": "Seedream 5",
    "bytedance/seedream-5-pro": "Seedream 5 Pro",
    "bytedance/seedance-2.0": "Seedance 2.0",
    "openai/gpt-image-1.5": "GPT Image 1.5",
  }
  return modelNames[modelId] || modelId
}

function getModalSizeClass(aspectRatio: string | null): string {
  const [width, height] = aspectRatio?.split(":").map(Number) ?? []
  if (Number.isFinite(width) && Number.isFinite(height) && height > 0) {
    if (width > height) return "h-[90vh] w-[1800px] max-w-[98vw]"
    if (width < height) return "h-[90vh] w-[1200px] max-w-[94vw]"
    return "h-[94vh] w-[1400px] max-w-[96vw]"
  }
  return "h-[90vh] w-[1240px] max-w-[94vw]"
}

export default function ImageDetailModal({
  image,
  initialOutputId,
  sessionTitle,
  onClose,
  onRecreate,
  onFavoriteToggle,
}: ImageDetailModalProps) {
  const navigate = useNavigate()
  const setRegenerateData = useGenerateStore(state => state.setRegenerateData)

  const [isFavorited, setIsFavorited] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [activeOutputId, setActiveOutputId] = useState<string | null>(initialOutputId ?? null)

  const outputs = image ? getVisibleOutputs(image) : []
  const activeOutput = image ? getActiveOutput(image, activeOutputId) : null

  useEffect(() => {
    setActiveOutputId(initialOutputId ?? null)
  }, [image?.id, initialOutputId])

  useEffect(() => {
    setIsFavorited(Boolean(activeOutput?.is_favorite))
  }, [activeOutput?.id, activeOutput?.is_favorite])

  useEffect(() => {
    if (!image || !activeOutput) return
    trackEvent("view_generation_result", {
      model_id: image.model,
      media_type: activeOutput.content_type,
      output_status: activeOutput.status,
      is_favorited: Boolean(activeOutput.is_favorite),
    })
  }, [activeOutput?.id, image?.id])

  if (!image) return null

  const displayImageUrl = activeOutput?.display_url ?? null
  const isVideo = activeOutput?.content_type === "video"
  const modalSizeClass = getModalSizeClass(image.aspect_ratio || image.image_size)

  const handleSelectOutput = (outputId: string) => setActiveOutputId(outputId)

  const handleRegenerate = () => {
    trackEvent("regenerate", {
      model_id: image.model,
      media_type: activeOutput?.content_type ?? "image",
    })
    if (onRecreate) {
      onRecreate(image)
      onClose()
      return
    }

    setRegenerateData({
      prompt: image.prompt,
      model: image.model,
      size: image.image_size || undefined,
      quality: image.quality || undefined,
      style: image.style || undefined,
      aspect_ratio: image.aspect_ratio || undefined,
      resolution: image.resolution || undefined,
      output_format: image.output_format || undefined,
      num_images: image.num_images || undefined,
      negative_prompt: image.negative_prompt || undefined,
      google_search: image.google_search ? "true" : undefined,
      image_search: image.image_search ? "true" : undefined,
      media_type: image.media_type === "video" ? "video" : "image",
      generation_mode: image.generation_mode || undefined,
      duration: image.duration || undefined,
      generate_audio: image.generate_audio ? "true" : "false",
    })
    navigate("/ai-toolkit")
    onClose()
  }

  const handleDownload = async () => {
    if (!activeOutput) return
    try {
      const { url: downloadUrl } = await api.images.getDownloadUrl(activeOutput.id)
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const timestamp = new Date(image.created_at * 1000).toISOString().slice(0, 10)
      const extension = isVideo ? "mp4" : image.output_format || "png"
      a.download = `${sessionTitle}_${timestamp}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      trackEvent("result_download", {
        model_id: image.model,
        media_type: activeOutput.content_type,
        file_format: extension,
      })
    } catch (error) {
      console.error("Download failed:", error)
      toast.error(error instanceof Error ? error.message : "Download failed")
    }
  }

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(image.prompt)
    toast.success("copied")
  }

  const handleToggleFavorite = async () => {
    if (isTogglingFavorite || !activeOutput) return
    setIsTogglingFavorite(true)

    const nextFavorited = !isFavorited
    setIsFavorited(nextFavorited)

    try {
      await api.images.favorite(activeOutput.id, nextFavorited)
      trackEvent(nextFavorited ? "favorite_result" : "unfavorite_result", {
        model_id: image.model,
        media_type: activeOutput.content_type,
      })
      toast.success(nextFavorited ? "Added to favorites" : "Removed from favorites")
      onFavoriteToggle?.(activeOutput.id, nextFavorited)
    } catch (error) {
      setIsFavorited(!nextFavorited)
      toast.error(error instanceof Error ? error.message : "Failed to update favorite")
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  return (
    <div className="modal modal-open">
      <div
        className={`modal-box ${modalSizeClass} flex flex-col md:flex-row p-0 overflow-hidden bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl`}
      >
        {/* Left Image Area */}
        <div className="flex min-h-0 flex-1 flex-col bg-black/40 p-4 md:p-6">
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            {displayImageUrl && isVideo ? (
              <video
                src={displayImageUrl}
                controls
                autoPlay
                playsInline
                className="size-full object-contain drop-shadow-2xl"
              />
            ) : displayImageUrl ? (
              <img
                src={displayImageUrl}
                alt="Generated image"
                className="size-full object-contain drop-shadow-2xl"
              />
            ) : activeOutput?.status === "failed" ? (
              <div className="text-sm text-red-300/70">This media could not be generated.</div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-base-content/60">
                <span className="loading loading-spinner loading-md text-white/40" />
                <span className="text-sm">Generating media…</span>
              </div>
            )}
          </div>

          <ImageThumbnailStrip
            outputs={outputs}
            activeOutputId={activeOutput?.id ?? null}
            onSelect={handleSelectOutput}
            hoverShadow={false}
            className="mt-4 shrink-0 justify-start border-t border-white/10 pt-4 md:justify-center"
          />
        </div>

        {/* Right Sidebar Area */}
        <div className="w-full md:w-[420px] flex flex-col p-6 bg-black/60 border-l border-white/10 z-10 relative">
          {/* Top Actions */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleDownload}
              disabled={!activeOutput || activeOutput.status !== "completed"}
              className="btn btn-sm h-9 btn-ghost border border-white/20 rounded-full text-white hover:bg-white/10 px-4 font-normal"
            >
              <Download className="size-4 mr-1.5" />
              Download
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                className={`btn btn-sm btn-circle border text-white ${
                  isFavorited
                    ? "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                    : "btn-ghost border-white/20 hover:bg-white/10"
                }`}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className={`size-4 ${isFavorited ? "fill-yellow-400" : ""}`} />
              </button>
              <button className="btn btn-sm btn-circle btn-ghost border border-white/20 text-white hover:bg-white/10">
                <Folder className="size-4" />
              </button>
              <button className="btn btn-sm btn-circle btn-ghost border border-white/20 text-white hover:bg-white/10">
                <Trash2 className="size-4" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button
                onClick={onClose}
                className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Detail Content */}
          <div className="flex-1 min-h-0 overflow-hidden pr-2">
            {/* Prompt */}
            <div className="mb-10">
              <h3 className="text-white font-bold mb-3 text-sm">Prompt</h3>
              <div
                onClick={handleCopyPrompt}
                className="group block w-full max-h-[min(18rem,32vh)] overflow-y-auto pr-2 text-left cursor-pointer [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleCopyPrompt()
                  }
                }}
                aria-label="Copy prompt"
              >
                <p className="text-sm text-base-content/80 leading-relaxed break-words transition-colors group-hover:text-white">
                  {image.prompt}
                </p>
              </div>

              {image.negative_prompt && (
                <div className="mt-6">
                  <h3 className="text-white font-bold mb-3 text-sm">Negative Prompt</h3>
                  <div className="pl-3 border-l-2 border-error/40">
                    <p className="text-sm text-base-content/60 leading-relaxed break-words">
                      {image.negative_prompt}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="mb-6">
              <h3 className="text-white font-bold mb-5 text-sm">Settings</h3>
              <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                <div className="col-span-2">
                  <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">Model</div>
                  <div className="text-sm text-white break-all">{getModelName(image.model)}</div>
                </div>

                {image.aspect_ratio && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">
                      Aspect ratio
                    </div>
                    <div className="text-sm text-white flex items-center gap-1.5">
                      <div className="w-4 h-3 border border-white/40 rounded-[2px] shrink-0"></div>
                      {image.aspect_ratio}
                    </div>
                  </div>
                )}

                {image.quality && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">
                      Quality
                    </div>
                    <div className="text-sm text-white">{image.quality}</div>
                  </div>
                )}

                {image.output_format && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">
                      File type
                    </div>
                    <div className="text-sm text-white uppercase">{image.output_format}</div>
                  </div>
                )}

                {image.resolution && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">
                      Resolution
                    </div>
                    <div className="text-sm text-white">{image.resolution}</div>
                  </div>
                )}

                {image.duration && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">
                      Duration
                    </div>
                    <div className="text-sm text-white">{image.duration}s</div>
                  </div>
                )}

                {image.media_type === "video" && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">Audio</div>
                    <div className="text-sm text-white">
                      {image.generate_audio ? "Generated" : "Muted"}
                    </div>
                  </div>
                )}

                {image.image_size && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">Size</div>
                    <div className="text-sm text-white">{image.image_size}</div>
                  </div>
                )}

                <div className="col-span-2">
                  <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">
                    Date created
                  </div>
                  <div className="text-sm text-white">{formatTimestamp(image.created_at)}</div>
                </div>

                {image.style && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">Style</div>
                    <div className="text-sm text-white">{image.style}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 mt-auto border-t border-white/5">
            <button
              onClick={handleRegenerate}
              className="btn btn-sm h-10 w-full btn-ghost border border-white/20 rounded-full text-white hover:bg-white/10 font-normal"
            >
              <RotateCcw className="size-4 mr-1.5" />
              Recreate
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop bg-black/80" onClick={onClose} />
    </div>
  )
}
