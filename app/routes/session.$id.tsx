import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { api, R2_IMAGE_BASE } from "~/lib/api"
import { useUserStore } from "~/stores/userStore"
import { useModelStore } from "~/stores/modelStore"
import ImageDetailModal from "~/components/ImageDetailModal"
import PromptArea from "~/components/PromptArea"
import { AIToolkitSidebar } from "~/components/AIToolkitSidebar"

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

  // Sidebar state — required by AIToolkitSidebar
  const [showSidebar, setShowSidebar] = useState(false)
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const { models, fetchModels } = useModelStore()

  useEffect(() => {
    if (!id || !user || !token) {
      setLoading(false)
      return
    }

    Promise.all([
      api.sessions.get(id),
      api.sessions.list(),
    ])
      .then(([sessionData, listData]) => {
        setSession(sessionData.session)
        setMessages(sessionData.messages as Message[])
        setAllSessions(listData.sessions as unknown as Session[])
      })
      .catch(error => {
        console.error("Failed to load session:", error)
        toast.error("Failed to load session")
      })
      .finally(() => setLoading(false))

    fetchModels()
  }, [id, user, token])

  // Adapt allSessions → the shape AIToolkitSidebar expects
  const sidebarSessions = allSessions.map(s => ({
    id: s.id,
    title: s.title,
    lastModified: s.updated_at,
    pinned: Boolean(s.is_pinned),
  }))

  const currentSidebarSession = session
    ? { id: session.id, title: session.title, lastModified: session.updated_at }
    : null

  const handleCreateSession = () => navigate("/ai-toolkit")
  const handleSelectSession = (sid: string) => navigate(`/session/${sid}`)

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
    <div className="flex h-screen bg-base-100 overflow-hidden">
      {/* Sidebar — reuse AIToolkitSidebar component */}
      <AIToolkitSidebar
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        sessionHistory={sidebarSessions}
        currentSession={currentSidebarSession}
        editingSessionId={editingSessionId}
        setEditingSessionId={setEditingSessionId}
        setSessionHistory={() => {}}
        setDeleteSessionId={setDeleteSessionId}
        handleCreateSession={handleCreateSession}
        handleSelectSession={handleSelectSession}
        editInputRef={editInputRef}
      />

      {/* Main Content — offset for fixed header (4.5rem) and fixed sidebar (6rem) */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-base-100 pl-24 pt-[4.5rem]">
        <div className="flex items-center gap-4 px-6 pt-6 pb-4">
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
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-black/40 border border-white/20 hover:border-white/40 transition-colors duration-300 ring-1 ring-white/5"
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
