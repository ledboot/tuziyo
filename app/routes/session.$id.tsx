import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { api } from "~/lib/api"
import { useUserStore } from "~/stores/userStore"
import { useModelStore } from "~/stores/modelStore"
import ImageDetailModal from "~/components/ImageDetailModal"
import PromptArea, { type UploadedImage } from "~/components/PromptArea"
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
  url: string | null
  google_search?: number | null
  image_search?: number | null
  created_at: number
}

interface Session {
  id: string
  title: string
  is_pinned: number
  preview_image: string | null
  created_at: number
  updated_at: number
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const generationState = location.state as any
  const { user, token, isLoading: isUserLoading, isFetching: isUserFetching } = useUserStore()

  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<Message | null>(null)
  const [recreatePrompt, setRecreatePrompt] = useState(generationState?.prompt ?? "")
  const [recreateNegativePrompt, setRecreateNegativePrompt] = useState<string | undefined>()
  const [recreateVersion, setRecreateVersion] = useState(0)
  const [editImages, setEditImages] = useState<UploadedImage[]>(generationState?.images ?? [])
  const [editImagesVersion, setEditImagesVersion] = useState(0)

  // Sidebar state — required by AIToolkitSidebar
  const [showSidebar, setShowSidebar] = useState(false)
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const {
    models,
    fetchModels,
    userSelectedModel,
    userModelOptions,
    setUserSelectedModel,
    setUserModelOptions,
  } = useModelStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)

  const selectedModel = userSelectedModel || (models.length > 0 ? models[0].id : "google/nano-banana-2")
  const modelOptions = userModelOptions || {}

  const handleSetModelOptions = (
    options: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => {
    if (typeof options === "function") {
      setUserModelOptions(options(modelOptions))
    } else {
      setUserModelOptions(options)
    }
  }

  const fetchSessionData = async () => {
    if (!id || !user || !token) return
    try {
      const [sessionData, listData] = await Promise.all([
        api.sessions.get(id),
        api.sessions.list(),
      ])
      setSession(sessionData.session)
      setMessages(sessionData.messages as Message[])
      setAllSessions(listData.sessions as unknown as Session[])
    } catch (error) {
      console.error("Failed to load session:", error)
      toast.error("Failed to load session")
    }
  }

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    if (isUserLoading || isUserFetching) {
      setLoading(true)
      return
    }

    if (!user || !token) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetchSessionData().finally(() => setLoading(false))
    fetchModels()
  }, [id, user, token, isUserLoading, isUserFetching])

  const handleRecreate = (image: Message) => {
    const nextOptions: Record<string, string> = {}

    if (image.image_size) nextOptions.size = image.image_size
    if (image.quality) nextOptions.quality = image.quality
    if (image.style) nextOptions.style = image.style
    if (image.aspect_ratio) nextOptions.aspect_ratio = image.aspect_ratio
    if (image.resolution) nextOptions.resolution = image.resolution
    if (image.output_format) nextOptions.output_format = image.output_format
    if (image.num_images) nextOptions.num_images = String(image.num_images)
    if (image.google_search) nextOptions.google_search = "true"
    if (image.image_search) nextOptions.image_search = "true"

    setUserSelectedModel(image.model)
    setUserModelOptions({ ...modelOptions, ...nextOptions })
    setRecreatePrompt(image.prompt)
    setRecreateNegativePrompt(image.negative_prompt ?? "")
    setRecreateVersion(version => version + 1)
  }

  const handleEdit = (image: Message) => {
    if (!image.image_url || !image.url) {
      toast.error("Image is not available for editing")
      return
    }

    const imageModel = models.find(model => model.id === image.model && model.supportsImage)
    const fallbackImageModel = models.find(model => model.supportsImage)
    const nextModel = imageModel?.id ?? fallbackImageModel?.id

    if (nextModel) {
      setUserSelectedModel(nextModel)
    }

    setEditImages([
      {
        id: image.id,
        previewUrl: image.url,
        key: image.image_url,
        status: "uploaded",
      },
    ])
    setEditImagesVersion(version => version + 1)
    setRecreatePrompt("")
    setRecreateNegativePrompt("")
    setRecreateVersion(version => version + 1)
  }

  // Adapt allSessions → the shape AIToolkitSidebar expects
  const sidebarSessions = allSessions.map(s => ({
    id: s.id,
    title: s.title,
    lastModified: s.updated_at,
    pinned: Boolean(s.is_pinned),
    preview_image: s.preview_image ?? undefined,
  }))

  const currentSidebarSession = session
    ? {
        id: session.id,
        title: session.title,
        lastModified: session.updated_at,
        preview_image: session.preview_image ?? undefined,
      }
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
                const imageUrl = image.url

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

              {/* Skeleton for pending generation */}
              {isGenerating && (
                <div className="relative aspect-square rounded-xl bg-black/40 border border-white/20 overflow-hidden">
                  <div className="skeleton size-full opacity-20" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <div className="loading loading-spinner loading-md text-white/40" />
                    {pendingPrompt && (
                      <p className="text-xs text-white/40 line-clamp-2 px-2 italic">
                        "{pendingPrompt}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <ImageDetailModal
          image={selectedImage}
          sessionTitle={session.title}
          onClose={() => setSelectedImage(null)}
          onRecreate={handleRecreate}
          onEdit={handleEdit}
        />

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-base-100 via-base-100/90 to-transparent">
          <div className="max-w-4xl mx-auto">
            <PromptArea
              models={models}
              selectedModel={selectedModel}
              onModelChange={setUserSelectedModel}
              modelOptions={modelOptions}
              onOptionsChange={handleSetModelOptions}
              currentSessionId={id}
              initialPrompt={recreatePrompt}
              initialNegativePrompt={recreateNegativePrompt}
              initialPromptVersion={recreateVersion}
              initialImages={editImages}
              initialImagesVersion={editImagesVersion}
              autoGenerate={generationState?.autoGenerate}
              onGenerateStart={(sid, prompt) => {
                if (sid === id) {
                  setIsGenerating(true)
                  setPendingPrompt(prompt)
                }
              } }
              onGenerateSuccess={async (sid, data) => {
                if (sid === id) {
                  setIsGenerating(false)
                  setPendingPrompt(null)
                  await fetchSessionData()
                }
              } }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
