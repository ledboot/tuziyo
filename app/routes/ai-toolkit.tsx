import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router"
import PromptArea from "~/components/PromptArea"
import { useUserStore } from "~/stores/userStore"
import { useModelStore } from "~/stores/modelStore"
import { useGenerateStore } from "~/stores/generateStore"
import { api } from "~/lib/api"
import { AIToolkitSidebar } from "~/components/AIToolkitSidebar"
import { createSeoMeta, createWebApplicationSchema } from "~/lib/seo"

export function meta() {
  const title = "AI Image & Video Generator | tuziyo"
  const description =
    "Create AI images and videos with leading models in one workspace. Use prompts and reference media, compare model controls, and keep every generation organized."

  return createSeoMeta({
    title,
    description,
    path: "/ai-toolkit",
    keywords:
      "ai image generator, ai video generator, text to image, text to video, image to video, multi-model ai studio, reference image, reference video, tuziyo",
    schema: createWebApplicationSchema({
      name: "tuziyo AI Image & Video Toolkit",
      description,
      path: "/ai-toolkit",
      free: false,
    }),
  })
}

type ModelId = string

export default function AIToolkitPage() {
  const [currentSession, setCurrentSession] = useState<{ id: string; title: string } | null>(null)
  const [sessionHistory, setSessionHistory] = useState<
    {
      id: string
      title: string
      is_pinned: number
      preview_image: string | null
      preview_video: string | null
      preview_content_type: "image" | "video" | null
      created_at: number
      updated_at: number
    }[]
  >([])
  const [showSidebar, setShowSidebar] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const [regeneratePrompt, setRegeneratePrompt] = useState("")
  const [regenerateNegativePrompt, setRegenerateNegativePrompt] = useState<string | undefined>()
  const sessionsFetchedRef = useRef(false)
  const navigate = useNavigate()

  const { user, token } = useUserStore()
  const { regenerateData, clearRegenerateData } = useGenerateStore()
  const {
    models,
    fetchModels,
    userSelectedModel,
    userModelOptions,
    setUserSelectedModel,
    setUserModelOptions,
    setUserPrompt,
    setUserMediaType,
  } = useModelStore()

  const selectedModel =
    userSelectedModel || (models.length > 0 ? models[0].id : "google/nano-banana-2")
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

  useEffect(() => {
    if (!regenerateData) return

    const nextOptions: Record<string, string> = {}
    setUserSelectedModel(regenerateData.model as ModelId)
    setUserPrompt(regenerateData.prompt)
    setRegeneratePrompt(regenerateData.prompt)
    setRegenerateNegativePrompt(regenerateData.negative_prompt ?? "")

    if (regenerateData.size) nextOptions.size = regenerateData.size
    if (regenerateData.quality) nextOptions.quality = regenerateData.quality
    if (regenerateData.style) nextOptions.style = regenerateData.style
    if (regenerateData.aspect_ratio) nextOptions.aspect_ratio = regenerateData.aspect_ratio
    if (regenerateData.resolution) nextOptions.resolution = regenerateData.resolution
    if (regenerateData.output_format) nextOptions.output_format = regenerateData.output_format
    if (regenerateData.num_images) nextOptions.num_images = String(regenerateData.num_images)
    if (regenerateData.google_search) nextOptions.google_search = regenerateData.google_search
    if (regenerateData.image_search) nextOptions.image_search = regenerateData.image_search
    if (regenerateData.background) nextOptions.background = regenerateData.background
    if (regenerateData.duration) nextOptions.duration = String(regenerateData.duration)
    if (regenerateData.generate_audio) nextOptions.generate_audio = regenerateData.generate_audio
    if (regenerateData.media_type) setUserMediaType(regenerateData.media_type)

    handleSetModelOptions(prev => ({ ...prev, ...nextOptions }))
    clearRegenerateData()
  }, [clearRegenerateData, regenerateData, setUserMediaType, setUserPrompt, setUserSelectedModel])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

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
    setCurrentSession(null)
  }

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
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  return (
    <div className="ai-toolkit-shell">
      {user && (
        <AIToolkitSidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          sessionHistory={sessionHistory}
          currentSession={currentSession}
          editingSessionId={editingSessionId}
          setEditingSessionId={setEditingSessionId}
          setSessionHistory={setSessionHistory}
          setDeleteSessionId={setDeleteSessionId}
          handleCreateSession={handleCreateSession}
          handleSelectSession={handleSelectSession}
          editInputRef={editInputRef}
        />
      )}

      <main
        className={`ai-toolkit-stage ${user ? "ai-toolkit-stage--with-sidebar" : ""}`}
        aria-labelledby="ai-toolkit-title"
      >
        <div className="ai-toolkit-hero-copy">
          <h1 id="ai-toolkit-title">Create AI images and videos</h1>
          <p>
            Turn prompts and reference media into images or videos with leading AI models. Keep
            every brief, setting, and result connected as the idea develops.
          </p>
        </div>
        <div className="ai-toolkit-composer">
          <PromptArea
            models={models}
            selectedModel={selectedModel}
            onModelChange={setUserSelectedModel}
            modelOptions={modelOptions}
            onOptionsChange={handleSetModelOptions}
            className="ai-toolkit-prompt-area"
            initialPrompt={regeneratePrompt}
            initialNegativePrompt={regenerateNegativePrompt}
            onGenerateStart={() => {
              // Now we just wait on this page while generating, UI handles spinner
            }}
            onGenerateSuccess={sessionId => {
              navigate(`/session/${sessionId}`)
            }}
            onGeneratePending={(sessionId, taskId, prompt) => {
              navigate(`/session/${sessionId}?taskId=${taskId}`, {
                state: { prompt },
              })
            }}
          />
        </div>
      </main>

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
