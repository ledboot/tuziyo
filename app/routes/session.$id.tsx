import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { ArrowLeft, Search, PanelLeftClose, PanelLeftOpen } from "lucide-react"
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
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const { models, fetchModels } = useModelStore()

  const [allSessions, setAllSessions] = useState<Session[]>([])

  useEffect(() => {
    if (!id || !user || !token) {
      setLoading(false)
      return
    }

    Promise.all([
      api.sessions.get(id),
      api.sessions.list()
    ])
      .then(([sessionData, listData]) => {
        setSession(sessionData.session)
        setMessages(sessionData.messages as Message[])
        // Type assertion for the list data
        setAllSessions(listData.sessions as unknown as Session[])
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
      <div className="min-h-[calc(100vh-4.5rem)] bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (!user || !session) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] bg-base-100 flex items-center justify-center">
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
    <div className="flex h-[calc(100vh-4.5rem)] bg-base-100 overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? "w-64 lg:w-72 border-r" : "w-0 border-r-0"
        } border-white/5 flex flex-col bg-black/20 overflow-hidden shrink-0 transition-all duration-300 ease-in-out`}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/ai-toolkit")} className="btn btn-sm btn-ghost btn-circle border border-white/10 hover:bg-white/10">
              <ArrowLeft className="size-4" />
            </button>
            <h2 className="font-semibold text-lg text-white">History</h2>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-white hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {allSessions.map(s => (
            <div
              key={s.id}
              onClick={() => navigate(`/session/${s.id}`)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                s.id === id ? "bg-white/10 border border-white/10" : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${s.id === id ? "font-medium text-white" : "text-base-content/80"}`}>
                  {s.title}
                </div>
                <div className="text-xs text-base-content/40 mt-1">
                  {new Date(s.created_at * 1000).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-base-100">
        <div className="flex items-center gap-4 px-6 pt-6 pb-4">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="btn btn-sm btn-ghost btn-circle border border-white/10 hover:bg-white/10"
              aria-label="Open sidebar"
            >
              <PanelLeftOpen className="size-4 text-white" />
            </button>
          )}
          <h1 className="text-2xl font-bold truncate text-white">{session.title}</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-32 custom-scrollbar">
          {images.length === 0 ? (
            <div className="flex items-center justify-center h-full">
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
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-black/40 border border-white/5"
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
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-md rounded-full p-3 border border-white/20">
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

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-base-100 via-base-100/90 to-transparent">
          <div className="max-w-4xl mx-auto">
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
      </div>
    </div>
  )
}
