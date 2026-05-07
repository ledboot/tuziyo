import { useState, useRef, useEffect } from "react"
import {
  Sparkles,
  X,
  Square,
  Maximize,
  Smartphone,
  RectangleHorizontal,
  Images,
  MessageSquare,
  Trash2,
  SquarePen,
  Pin,
  Pencil,
} from "lucide-react"
import { toast, Toaster } from "sonner"
import { useNavigate } from "react-router"
import { useI18n } from "~/lib/i18n"
import { CustomSelect, type SelectOption } from "~/components/CustomSelect"
import PromptArea from "~/components/PromptArea"
import { useUserStore } from "~/stores/userStore"
import { useModelStore } from "~/stores/modelStore"
import { useGenerateStore } from "~/stores/generateStore"
import { api, getApiErrorMessage, R2_IMAGE_BASE, MODEL_CREDITS } from "~/lib/api"

type ModelId = string

interface ModelInfo {
  id: string
  name: string
  provider: string
  icon: string
  supportsImage?: boolean
}

const QUALITY_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

const SIZE_OPTIONS_GPT = [
  { value: "1024x1024", label: "1024 × 1024" },
  { value: "1792x1024", label: "1792 × 1024" },
  { value: "1024x1792", label: "1024 × 1792" },
  { value: "512x512", label: "512 × 512" },
  { value: "256x256", label: "256 × 256" },
]

const STYLE_OPTIONS = [
  { value: "vivid", label: "Vivid" },
  { value: "natural", label: "Natural" },
]

const SIZE_OPTIONS_WAN = [
  { value: "1024x1024", label: "1024 × 1024" },
  { value: "1792x1024", label: "1792 × 1024" },
  { value: "1024x1792", label: "1024 × 1792" },
  { value: "512x512", label: "512 × 512" },
  { value: "256x256", label: "256 × 256" },
]

const SIZE_OPTIONS_SEEDREAM = [
  { value: "512x512", label: "512 × 512" },
  { value: "768x768", label: "768 × 768" },
  { value: "1024x1024", label: "1024 × 1024" },
]

const ASPECT_RATIO_OPTIONS: SelectOption[] = [
  { value: "1:1", label: "1:1", icon: <Square className="size-4" /> },
  { value: "4:3", label: "4:3", icon: <RectangleHorizontal className="size-4" /> },
  { value: "3:4", label: "3:4", icon: <Smartphone className="size-4" /> },
  { value: "16:9", label: "16:9", icon: <Maximize className="size-4" /> },
  { value: "9:16", label: "9:16", icon: <Maximize className="size-4" /> },
]

const RESOLUTION_OPTIONS = [
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K" },
]

const OUTPUT_FORMAT_OPTIONS = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
]

const MAX_IMAGES_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "4", label: "4" },
]

const SEQUENTIAL_OPTIONS = [
  { value: "disabled", label: "Off" },
  { value: "auto", label: "Auto" },
]

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=450&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=550&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=450&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=550&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=400&h=350&fit=crop",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=400&h=600&fit=crop",
]

export default function AIToolkitPage() {
  const { t } = useI18n()
  const [selectedModel, setSelectedModel] = useState<ModelId>("google/nano-banana-2")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [quality, setQuality] = useState("auto")
  const [sizeGpt, setSizeGpt] = useState("1024x1024")
  const [style, setStyle] = useState("vivid")
  const [sizeWan, setSizeWan] = useState("1024x1024")
  const [sizeSeedream, setSizeSeedream] = useState("1024x1024")
  const [resolution, setResolution] = useState("2K")
  const [outputFormat, setOutputFormat] = useState("png")
  const [maxImages, setMaxImages] = useState("1")
  const [modelOptions, setModelOptions] = useState<Record<string, string>>({})
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [showNegativePrompt, setShowNegativePrompt] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [images] = useState<string[]>(SAMPLE_IMAGES)
  const [uploadedImages, setUploadedImages] = useState<{ id: string; url: string }[]>([])
  const [currentSession, setCurrentSession] = useState<{ id: string; title: string } | null>(null)
  const [sessionHistory, setSessionHistory] = useState<
    {
      id: string
      title: string
      is_pinned: number
      preview_image: string | null
      created_at: number
      updated_at: number
    }[]
  >([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [isNewSession, setIsNewSession] = useState(false)
  const [messages, setMessages] = useState<
    {
      id: string
      role: string
      prompt: string
      imageUrl?: string
      model: string
      timestamp: number
    }[]
  >([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const sessionsFetchedRef = useRef(false)
  const navigate = useNavigate()

  const { user, token } = useUserStore()
  const { regenerateData, clearRegenerateData } = useGenerateStore()
  const { models, fetchModels } = useModelStore()

  useEffect(() => {
    if (regenerateData) {
      setPrompt(regenerateData.prompt)
      setSelectedModel(regenerateData.model as ModelId)
      if (regenerateData.size) setSizeGpt(regenerateData.size)
      if (regenerateData.quality) setQuality(regenerateData.quality)
      if (regenerateData.style) setStyle(regenerateData.style)
      if (regenerateData.aspect_ratio) setAspectRatio(regenerateData.aspect_ratio)
      if (regenerateData.resolution) setResolution(regenerateData.resolution)
      if (regenerateData.output_format) setOutputFormat(regenerateData.output_format)
      if (regenerateData.num_images) setMaxImages(String(regenerateData.num_images))
      if (regenerateData.negative_prompt) setNegativePrompt(regenerateData.negative_prompt)
      clearRegenerateData()
    }
  }, [regenerateData])

  useEffect(() => {
    fetchModels()
  }, [])

  useEffect(() => {
    if (user && token && !sessionsFetchedRef.current) {
      sessionsFetchedRef.current = true
      api.sessions
        .list()
        .then(data => {
          if (data.sessions) {
            setSessionHistory(data.sessions)
          }
        })
        .catch(console.error)
    }
  }, [user, token])

  const handleCreateSession = () => {
    setIsNewSession(true)
    setCurrentSession(null)
  }

  const requiredCredits = MODEL_CREDITS[selectedModel] || 0
  const hasInsufficientCredits = user && (user.credits || 0) < requiredCredits

  const handleSelectSession = async (sessionId: string) => {
    navigate(`/session/${sessionId}`)
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!user || !token) return
    try {
      await api.sessions.delete(sessionId)
      setSessionHistory(prev => prev.filter(s => s.id !== sessionId))
      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
        setIsNewSession(false)
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  const selectedModelInfo = models.find(m => m.id === selectedModel)

  const MODEL_OPTIONS: SelectOption[] = models.map(m => ({
    value: m.id,
    label: m.name,
    icon: <img src={m.icon} alt={m.provider} className="size-5 rounded" />,
    badge: m.isNew ? (
      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-content rounded-full flex items-center gap-0.5">
        <Sparkles className="size-2.5" />
        NEW
      </span>
    ) : undefined,
  }))

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return
    if (!user) {
      window.dispatchEvent(new CustomEvent("openLoginModal"))
      return
    }

    if (uploadedImages.length > 0 && !selectedModelInfo?.supportsImage) {
      toast.error(
        `[Image 1] ERROR: Model ${selectedModel} does not support image input. Remove uploaded images or select a different model.`
      )
      return
    }

    setIsGenerating(true)
    try {
      let sessionId = currentSession?.id

      if (isNewSession && token) {
        const title = prompt.slice(0, 20).trim() || "New Chat"
        const sessionData = await api.sessions.create(title)
        if (sessionData.session) {
          setSessionHistory(prev => [sessionData.session, ...prev])
          setCurrentSession(sessionData.session)
          setIsNewSession(false)
          sessionId = sessionData.session.id
        }
      }

      const requestBody: Record<string, unknown> = {
        prompt,
        model: selectedModel,
        provider: selectedModelInfo?.provider,
        sessionId,
      }

      if (selectedModel === "openai/gpt-image-1.5") {
        requestBody.size = sizeGpt
        requestBody.quality = quality
        requestBody.style = style
      } else if (selectedModel === "alibaba/wan-2.6-image") {
        requestBody.size = sizeWan
        requestBody.num_images = parseInt(maxImages)
        if (negativePrompt) requestBody.negative_prompt = negativePrompt
      } else if (selectedModel === "bytedance/seedream-5-lite") {
        requestBody.size = sizeSeedream
        requestBody.num_images = parseInt(maxImages)
        if (negativePrompt) requestBody.negative_prompt = negativePrompt
      } else if (selectedModel === "google/nano-banana-2") {
        requestBody.aspect_ratio = aspectRatio
        requestBody.resolution = resolution
        requestBody.output_format = outputFormat
        requestBody.num_images = parseInt(maxImages)
      }

      const data = await api.generate.create(
        requestBody as Parameters<typeof api.generate.create>[0]
      )
      if (data.error) {
        toast.error(`[Image 1] ERROR: ${data.error}`)
        return
      }

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          prompt,
          model: selectedModel,
          timestamp: Date.now(),
        },
      ])

      setPrompt("")
    } catch (error) {
      console.error("Generate error:", error)
      toast.error(
        `[Image 1] ERROR: ${getApiErrorMessage(error, "Failed to generate image. Please try again.")}`
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file)
      setUploadedImages(prev => [...prev, { id: crypto.randomUUID(), url }])
    })
  }

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id))
  }

  return (
    <div className="bg-base-100 pb-48">
      <style>{`
        .masonry-grid {
          column-count: 2;
          column-gap: 1rem;
        }
        @media (min-width: 768px) {
          .masonry-grid {
            column-count: 3;
          }
        }
        @media (min-width: 1024px) {
          .masonry-grid {
            column-count: 4;
          }
        }
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 1rem;
        }
      `}</style>

      {user && (
        <div
          className={`fixed left-0 top-16 z-30 transition-all duration-300 ${
            showSidebar ? "w-65" : "w-15"
          }`}
          style={{ width: showSidebar ? "4500px" : "60px" }}
          onMouseEnter={() => setShowSidebar(true)}
          onMouseLeave={() => setShowSidebar(false)}
        >
          <div className="relative h-screen">
            <div
              className={`absolute left-0 top-0 bottom-0 flex flex-col bg-base-100 border-r border-base-200 transition-all duration-300 ${
                showSidebar ? "w-[260px] opacity-100" : "w-16 opacity-100"
              }`}
            >
              {!showSidebar && (
                <div className="p-4 transition-all duration-100">
                  <button className="h-12 w-full flex items-center justify-center cursor-pointer bg-base-100/80">
                    <SquarePen className="w-5 h-5 text-base-content/60" />
                  </button>
                </div>
              )}

              <div
                className={`flex-1 flex flex-col transition-all duration-100 overflow-hidden ${
                  showSidebar ? "opacity-100" : "opacity-0 pointer-events-none w-0"
                }`}
              >
                <div className="p-4 border-b border-base-200">
                  <button
                    onClick={handleCreateSession}
                    className="h-12 w-full flex items-center justify-start gap-4 text-nowrap cursor-pointer bg-base-100/80 backdrop-blur-sm border border-base-200 rounded-lg px-4 hover:bg-base-200/50 transition-colors"
                  >
                    <SquarePen className="w-5 h-5 text-base-content/60" />
                    <span>New Session</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {sessionHistory.length === 0 ? (
                    <div className="p-4 text-center text-base-content/60 text-sm">
                      No conversations yet
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {sessionHistory.map(s => (
                        <div
                          key={s.id}
                          className={`group relative flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-base-200/50 transition-colors ${currentSession?.id === s.id ? "bg-primary/10" : ""}`}
                          onClick={() => handleSelectSession(s.id)}
                        >
                          <div className="size-10 rounded-lg overflow-hidden bg-base-200 shrink-0">
                            {s.preview_image ? (
                              <img
                                src={s.preview_image}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="size-full flex items-center justify-center">
                                <MessageSquare className="size-4 text-base-content/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 truncate pr-4 group-hover:pr-20 transition-all duration-200">
                            {editingSessionId === s.id ? (
                              <input
                                ref={editInputRef}
                                type="text"
                                defaultValue={s.title}
                                className="input input-sm input-bordered w-full"
                                autoFocus
                                onBlur={e => {
                                  const newTitle = e.target.value.trim()
                                  if (!newTitle) {
                                    setEditingSessionId(null)
                                    return
                                  }
                                  if (newTitle !== s.title) {
                                    api.sessions.update(s.id, { title: newTitle }).then(() => {
                                      setSessionHistory(prev =>
                                        prev.map(session =>
                                          session.id === s.id
                                            ? { ...session, title: newTitle }
                                            : session
                                        )
                                      )
                                    })
                                  }
                                  setEditingSessionId(null)
                                }}
                                onKeyDown={e => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur()
                                  } else if (e.key === "Escape") {
                                    setEditingSessionId(null)
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex items-center gap-1">
                                {s.is_pinned === 1 && (
                                  <Pin className="size-3 text-primary shrink-0" />
                                )}
                                <span className="truncate text-sm font-medium">{s.title}</span>
                              </div>
                            )}
                          </div>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingSessionId !== s.id && (
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  setEditingSessionId(s.id)
                                  setTimeout(() => editInputRef.current?.select(), 0)
                                }}
                                className="btn btn-ghost btn-xs btn-circle"
                              >
                                <Pencil className="size-3" />
                              </button>
                            )}
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                api.sessions
                                  .update(s.id, { is_pinned: s.is_pinned === 1 ? 0 : 1 })
                                  .then(() => {
                                    setSessionHistory(prev =>
                                      prev.map(session =>
                                        session.id === s.id
                                          ? { ...session, is_pinned: s.is_pinned === 1 ? 0 : 1 }
                                          : session
                                      )
                                    )
                                  })
                              }}
                              className="btn btn-ghost btn-xs btn-circle"
                            >
                              <Pin
                                className={`size-3 ${s.is_pinned === 1 ? "fill-primary text-primary" : ""}`}
                              />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                setDeleteSessionId(s.id)
                              }}
                              className="btn btn-ghost btn-xs btn-circle hover:text-error"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className={`p-4 ${user ? "pl-16" : ""}`}>
        {isNewSession ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">What will you create today?</h2>
              <p className="text-base-content/60">Describe your image in the prompt below</p>
            </div>
          </div>
        ) : (
          <div className="masonry-grid">
            {images.map((src, i) => (
              <div
                key={i}
                className="masonry-item break-inside-avoid group relative overflow-hidden rounded-2xl"
              >
                <img
                  src={src}
                  alt={`Generated ${i + 1}`}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        )}
      </main>

      <div className={`fixed bottom-0 right-0 p-4 overflow-visible ${user ? "left-16" : "left-0"}`}>
        <PromptArea
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          modelOptions={modelOptions}
          onOptionsChange={setModelOptions}
        />
      </div>
      <Toaster position="top-center" />

      {deleteSessionId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Session</h3>
            <p className="py-4">
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteSessionId(null)}>
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={() => {
                  handleDeleteSession(deleteSessionId)
                  setDeleteSessionId(null)
                }}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteSessionId(null)} />
        </div>
      )}
    </div>
  )
}
