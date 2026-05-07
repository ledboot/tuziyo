import { X, RotateCcw, Download } from "lucide-react"
import { useNavigate } from "react-router"
import { useGenerateStore } from "~/stores/generateStore"
import { R2_IMAGE_BASE } from "~/lib/api"

interface Message {
  id: string
  role: string
  provider: string | null
  model: string
  prompt: string
  image_url: string | null
  aspect_ratio: string | null
  resolution: string | null
  image_size: string | null
  quality: string | null
  style: string | null
  negative_prompt: string | null
  output_format: string | null
  num_images: number | null
  google_search: number | null
  image_search: number | null
  created_at: number
}

interface ImageDetailModalProps {
  image: Message | null
  sessionTitle: string
  onClose: () => void
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getModelName(modelId: string): string {
  const modelNames: Record<string, string> = {
    "google/nano-banana-2": "Nano Banana 2",
    "alibaba/wan-2.6-image": "WAN 2.6",
    "bytedance/seedream-5-lite": "Seedream 5",
    "openai/gpt-image-1.5": "GPT Image 1.5",
  }
  return modelNames[modelId] || modelId
}

export default function ImageDetailModal({ image, sessionTitle, onClose }: ImageDetailModalProps) {
  const navigate = useNavigate()
  const setRegenerateData = useGenerateStore((state) => state.setRegenerateData)

  if (!image) return null

  const imageUrl = image.image_url ? `${R2_IMAGE_BASE}/${image.image_url}` : null

  const handleRegenerate = () => {
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
    })
    navigate("/ai-toolkit")
    onClose()
  }

  const handleDownload = async () => {
    if (!imageUrl) return
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const timestamp = new Date(image.created_at * 1000).toISOString().slice(0, 10)
      const extension = image.output_format || "png"
      a.download = `${sessionTitle}_${timestamp}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const optionItems = [
    image.image_size && { label: "Size", value: image.image_size },
    image.aspect_ratio && { label: "Aspect Ratio", value: image.aspect_ratio },
    image.resolution && { label: "Resolution", value: image.resolution },
    image.output_format && { label: "Output Format", value: image.output_format },
    image.num_images && { label: "Num Images", value: String(image.num_images) },
    image.quality && { label: "Quality", value: image.quality },
    image.style && { label: "Style", value: image.style },
    image.google_search === 1 && { label: "Google Search", value: "On" },
    image.image_search === 1 && { label: "Image Search", value: "On" },
    image.negative_prompt && { label: "Negative Prompt", value: image.negative_prompt },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-7xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-base-200">
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex items-center justify-center bg-base-200 p-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={image.prompt}
                className="max-h-[70vh] max-w-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-base-content/60">No image available</div>
            )}
          </div>

          <div className="w-[320px] border-l border-base-200 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-base-content/60 mb-1">Model</div>
                <div className="font-semibold">{getModelName(image.model)}</div>
              </div>

              <div>
                <div className="text-sm text-base-content/60 mb-1">Prompt</div>
                <div className="text-sm break-words">{image.prompt}</div>
              </div>

              {optionItems.map((item, idx) => (
                  <div key={idx}>
                    <div className="text-sm text-base-content/60 mb-1">{item.label}</div>
                    <div className="text-sm">{item.value}</div>
                  </div>
                ))}

              <div>
                <div className="text-sm text-base-content/60 mb-1">Created</div>
                <div className="text-sm">{formatTimestamp(image.created_at)}</div>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  onClick={handleRegenerate}
                  className="btn btn-primary btn-block gap-2"
                >
                  <RotateCcw className="size-4" />
                  Regenerate
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!imageUrl}
                  className="btn btn-outline btn-block gap-2"
                >
                  <Download className="size-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  )
}
