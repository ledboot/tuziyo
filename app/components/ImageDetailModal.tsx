import { X, RotateCcw, Download, Star, Folder, Trash2, Video, Pencil, Maximize } from "lucide-react"
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
  google_search?: number | null
  image_search?: number | null
  created_at: number
}

interface ImageDetailModalProps {
  image: Message | null
  sessionTitle: string
  onClose: () => void
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
    "openai/gpt-image-1.5": "GPT Image 1.5",
  }
  return modelNames[modelId] || modelId
}

function resolveImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  return `${R2_IMAGE_BASE}/${imageUrl.replace(/^\/+/, "")}`
}

export default function ImageDetailModal({ image, sessionTitle, onClose }: ImageDetailModalProps) {
  const navigate = useNavigate()
  const setRegenerateData = useGenerateStore((state) => state.setRegenerateData)

  if (!image) return null

  const imageUrl = resolveImageUrl(image.image_url)

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

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-[95vw] w-[1400px] h-[90vh] flex flex-col md:flex-row p-0 overflow-hidden bg-[#0c0c0c] liquid-glass border border-white/10 rounded-2xl shadow-2xl">
        
        {/* Left Image Area */}
        <div className="flex-1 flex items-center justify-center bg-black/40 relative p-4 md:p-6">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={image.prompt}
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          ) : (
            <div className="text-base-content/60">No image available</div>
          )}
        </div>

        {/* Right Sidebar Area */}
        <div className="w-full md:w-[420px] flex flex-col p-6 bg-black/60 border-l border-white/10 z-10 relative">
          
          {/* Top Actions */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={handleDownload} 
              disabled={!imageUrl} 
              className="btn btn-sm h-9 btn-ghost border border-white/20 rounded-full text-white hover:bg-white/10 px-4 font-normal"
            >
              <Download className="size-4 mr-1.5" />
              Download
            </button>
            <div className="flex items-center gap-2">
              <button className="btn btn-sm btn-circle btn-ghost border border-white/20 text-white hover:bg-white/10">
                <Star className="size-4" />
              </button>
              <button className="btn btn-sm btn-circle btn-ghost border border-white/20 text-white hover:bg-white/10">
                <Folder className="size-4" />
              </button>
              <button className="btn btn-sm btn-circle btn-ghost border border-white/20 text-white hover:bg-white/10">
                <Trash2 className="size-4" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/10">
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
            
            {/* Prompt */}
            <div className="mb-10">
              <h3 className="text-white font-bold mb-3 text-sm">Prompt</h3>
              <div className="pl-3 border-l-2 border-white/20">
                <p className="text-sm text-base-content/80 leading-relaxed break-words">
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
                <div>
                  <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">Model</div>
                  <div className="text-sm text-white">{getModelName(image.model)}</div>
                </div>
                
                {image.aspect_ratio && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">Aspect ratio</div>
                    <div className="text-sm text-white flex items-center gap-1.5">
                      <div className="w-4 h-3 border border-white/40 rounded-[2px]"></div>
                      {image.aspect_ratio}
                    </div>
                  </div>
                )}
                
                {image.quality && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">Quality</div>
                    <div className="text-sm text-white">{image.quality}</div>
                  </div>
                )}
                
                {image.output_format && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">File type</div>
                    <div className="text-sm text-white uppercase">{image.output_format}</div>
                  </div>
                )}
                
                <div className="col-span-2">
                  <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">Date created</div>
                  <div className="text-sm text-white">
                    {formatTimestamp(image.created_at)}
                  </div>
                </div>
                
                {image.image_size && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">Size</div>
                    <div className="text-sm text-white">{image.image_size}</div>
                  </div>
                )}
                
                {image.style && (
                  <div>
                    <div className="text-[11px] text-base-content/50 mb-1.5 font-medium">Style</div>
                    <div className="text-sm text-white">{image.style}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 grid grid-cols-2 gap-3 mt-auto border-t border-white/5">
            <button className="btn btn-sm h-10 btn-ghost border border-white/20 rounded-full text-white hover:bg-white/10 font-normal">
              <Video className="size-4 mr-1.5" />
              Video
            </button>
            <button className="btn btn-sm h-10 btn-ghost border border-white/20 rounded-full text-white hover:bg-white/10 font-normal">
              <Pencil className="size-4 mr-1.5" />
              Edit
            </button>
            <button onClick={handleRegenerate} className="btn btn-sm h-10 btn-ghost border border-white/20 rounded-full text-white hover:bg-white/10 font-normal">
              <RotateCcw className="size-4 mr-1.5" />
              Recreate
            </button>
            <button className="btn btn-sm h-10 btn-ghost border border-white/20 rounded-full text-white hover:bg-white/10 font-normal">
              <Maximize className="size-4 mr-1.5" />
              Upscale
            </button>
          </div>
          
        </div>
      </div>
      <div className="modal-backdrop bg-black/80 backdrop-blur-md" onClick={onClose} />
    </div>
  )
}
