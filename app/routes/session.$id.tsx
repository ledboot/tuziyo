import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { ArrowLeft, Search } from "lucide-react"
import { toast } from "sonner"
import { api, R2_IMAGE_BASE, MODEL_CREDITS } from "~/lib/api"
import { useUserStore } from "~/stores/userStore"
import { useModelStore } from "~/stores/modelStore"
import ImageDetailModal from "~/components/ImageDetailModal"
import PromptArea from "~/components/PromptArea"

type ModelId = string

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
  created_at: number
}

interface Session {
  id: string
  title: string
  is_pinned: number
  created_at: number
  updated_at: number
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, token } = useUserStore()

  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<Message | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelId>("google/nano-banana-2")
  const [modelOptions, setModelOptions] = useState<Record<string, string>>({})

  const { models, fetchModels } = useModelStore()

  useEffect(() => {
    if (!id || !user || !token) {
      setLoading(false)
      return
    }

    api.sessions
      .get(id)
      .then(data => {
        setSession(data.session)
        setMessages(data.messages as Message[])
      })
      .catch(error => {
        console.error("Failed to load session:", error)
        toast.error("Failed to load session")
      })
      .finally(() => setLoading(false))

    fetchModels()
  }, [id, user, token])

  const images = messages.filter(m => m.image_url)

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (!user || !session) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Session not found</h1>
          <button onClick={() => navigate("/ai-toolkit")} className="btn btn-primary">
            Go to AI Toolkit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate("/ai-toolkit")} className="btn btn-ghost btn-circle">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-2xl font-bold truncate">{session.title}</h1>
        </div>

        {images.length === 0 ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center text-base-content/60">
              <p className="text-lg">No images generated yet</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map(image => {
              const imageUrl = image.image_url ? `${R2_IMAGE_BASE}/${image.image_url}` : null

              return (
                <div
                  key={image.id}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-base-200"
                  onClick={() => setSelectedImage(image)}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={image.prompt}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center">
                      <span className="text-base-content/40">No image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
                      <Search className="size-6 text-white" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ImageDetailModal
        image={selectedImage}
        sessionTitle={session.title}
        onClose={() => setSelectedImage(null)}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4">
        <PromptArea
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          modelOptions={modelOptions}
          onOptionsChange={setModelOptions}
          currentSessionId={id}
        />
      </div>
    </div>
  )
}
