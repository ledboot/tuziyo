import { useState, useRef, useEffect, useMemo } from "react"
import { Trash2, Pin, Pencil, Plus, MoreHorizontal } from "lucide-react"
import { Toaster } from "sonner"
import { useNavigate } from "react-router"
import PromptArea from "~/components/PromptArea"
import { useUserStore } from "~/stores/userStore"
import { useModelStore } from "~/stores/modelStore"
import { useGenerateStore } from "~/stores/generateStore"
import { api, type ApiToolkitShowcaseItem } from "~/lib/api"

type ModelId = string

const BASE_FALLBACK_SHOWCASE_ITEMS: ApiToolkitShowcaseItem[] = [
  {
    id: "fallback-lake",
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=720&q=82",
    alt: "Still lake beneath mountain ridges",
    prompt: "Quiet alpine lake at blue hour",
    model: "Seedream 5",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
  {
    id: "fallback-fashion",
    src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=720&q=82",
    alt: "Editorial fashion portrait in a studio",
    prompt: "High fashion studio portrait",
    model: "GPT Image 1.5",
    aspectRatio: "2 / 3",
    width: 720,
    height: 1080,
  },
  {
    id: "fallback-forest",
    src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=720&q=82",
    alt: "Mist in a green forest",
    prompt: "Misty forest path with soft moss",
    model: "Seedream 5",
    aspectRatio: "3 / 4",
    width: 720,
    height: 960,
  },
  {
    id: "fallback-architecture",
    src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=720&q=82",
    alt: "Modern office tower facade",
    prompt: "Modern office facade with strong geometry",
    model: "Nano Banana 2",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
  {
    id: "fallback-product",
    src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=720&q=82",
    alt: "Minimal watch product photo",
    prompt: "Minimal product photo on warm stone",
    model: "Nano Banana 2",
    aspectRatio: "1 / 1",
    width: 720,
    height: 720,
  },
  {
    id: "fallback-coast",
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=720&q=82",
    alt: "Coastal waves and cliffs",
    prompt: "Coastal cliff with white surf",
    model: "WAN 2.6",
    aspectRatio: "4 / 5",
    width: 720,
    height: 900,
  },
]

const FALLBACK_ASPECT_RATIOS = ["4 / 5", "3 / 4", "2 / 3", "3 / 5", "1 / 1", "4 / 5"]

const MASONRY_TILE_HEIGHTS = ["18rem", "26rem", "20rem", "32rem", "22rem", "28rem", "19rem", "24rem", "30rem", "21rem"]

const FALLBACK_SHOWCASE_ITEMS: ApiToolkitShowcaseItem[] = Array.from({ length: 15 }).flatMap(
  (_, repeatIndex) =>
    BASE_FALLBACK_SHOWCASE_ITEMS.map((item, itemIndex) => ({
      ...item,
      id: repeatIndex === 0 ? item.id : `${item.id}-${repeatIndex + 1}`,
      aspectRatio:
        FALLBACK_ASPECT_RATIOS[(itemIndex + repeatIndex) % FALLBACK_ASPECT_RATIOS.length],
    }))
)

function getMasonryColumnCount(width: number) {
  if (width >= 1024) return 5
  if (width >= 768) return 4
  return 2
}

function getMasonryTileHeight(columnIndex: number, itemIndex: number) {
  return MASONRY_TILE_HEIGHTS[(columnIndex * 3 + itemIndex * 2) % MASONRY_TILE_HEIGHTS.length]
}

function distributeMasonryItems(items: ApiToolkitShowcaseItem[], columnCount: number) {
  const columns = Array.from({ length: columnCount }, () => [] as ApiToolkitShowcaseItem[])
  items.forEach((item, index) => {
    columns[index % columnCount].push(item)
  })
  return columns
}

export default function AIToolkitPage() {
  const [selectedModel, setSelectedModel] = useState<ModelId>("google/nano-banana-2")
  const [modelOptions, setModelOptions] = useState<Record<string, string>>({})
  const [showcaseItems, setShowcaseItems] =
    useState<ApiToolkitShowcaseItem[]>(FALLBACK_SHOWCASE_ITEMS)
  const [isShowcaseLoading, setIsShowcaseLoading] = useState(true)
  const [masonryColumnCount, setMasonryColumnCount] = useState(5)
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
  const editInputRef = useRef<HTMLInputElement>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const sessionsFetchedRef = useRef(false)
  const navigate = useNavigate()

  const { user, token } = useUserStore()
  const { regenerateData, clearRegenerateData } = useGenerateStore()
  const { models, fetchModels } = useModelStore()

  useEffect(() => {
    if (!regenerateData) return

    const nextOptions: Record<string, string> = {}
    setSelectedModel(regenerateData.model as ModelId)

    if (regenerateData.size) nextOptions.size = regenerateData.size
    if (regenerateData.quality) nextOptions.quality = regenerateData.quality
    if (regenerateData.style) nextOptions.style = regenerateData.style
    if (regenerateData.aspect_ratio) nextOptions.aspect_ratio = regenerateData.aspect_ratio
    if (regenerateData.resolution) nextOptions.resolution = regenerateData.resolution
    if (regenerateData.output_format) nextOptions.output_format = regenerateData.output_format
    if (regenerateData.num_images) nextOptions.num_images = String(regenerateData.num_images)

    setModelOptions(prev => ({ ...prev, ...nextOptions }))
    clearRegenerateData()
  }, [clearRegenerateData, regenerateData])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  useEffect(() => {
    let ignore = false

    api.aiToolkit
      .showcase()
      .then(data => {
        if (!ignore && data.items?.length) {
          setShowcaseItems(data.items)
        }
      })
      .catch(error => {
        console.error("Failed to load AI toolkit showcase:", error)
      })
      .finally(() => {
        if (!ignore) setIsShowcaseLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    const updateColumnCount = () => {
      setMasonryColumnCount(getMasonryColumnCount(window.innerWidth))
    }

    updateColumnCount()
    window.addEventListener("resize", updateColumnCount)
    return () => window.removeEventListener("resize", updateColumnCount)
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

  const masonryColumns = useMemo(
    () => distributeMasonryItems(showcaseItems, masonryColumnCount),
    [masonryColumnCount, showcaseItems]
  )

  const groupedSessions = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const groups = {
      today: [] as typeof sessionHistory,
      yesterday: [] as typeof sessionHistory,
      earlier: [] as typeof sessionHistory,
    }

    sessionHistory.forEach(s => {
      // Assuming created_at is seconds
      const date = new Date(s.created_at * 1000)
      if (date >= today) {
        groups.today.push(s)
      } else if (date >= yesterday) {
        groups.yesterday.push(s)
      } else {
        groups.earlier.push(s)
      }
    })

    return groups
  }, [sessionHistory])

  const formatSessionTime = (timestamp: number, group: "today" | "yesterday" | "earlier") => {
    const d = new Date(timestamp * 1000)
    if (group === "earlier") {
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`
    }
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  return (
    <div className="ai-toolkit-shell">
      <AIToolkitMasonryBackdrop
        columns={masonryColumns}
        isLoading={isShowcaseLoading}
        hasSidebar={!!user}
      />

      {user && (
        <div
          className={`ai-toolkit-sidebar ${
            showSidebar ? "ai-toolkit-sidebar--expanded" : ""
          }`}
          onMouseEnter={() => setShowSidebar(true)}
          onMouseLeave={() => setShowSidebar(false)}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {!showSidebar ? (
              <div className="p-4 flex justify-center">
                <button
                  onClick={handleCreateSession}
                  className="btn btn-ghost btn-circle btn-sm"
                  aria-label="New session"
                >
                  <Plus className="size-5" />
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 pb-2">
                  <button
                    onClick={handleCreateSession}
                    className="btn btn-outline w-full rounded-lg border-white/15 hover:bg-white/10 hover:border-white/25 text-white font-normal justify-start gap-2 h-10 min-h-0"
                  >
                    <Plus className="size-4" />
                    新建会话
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-hide">
                  {sessionHistory.length === 0 ? (
                    <div className="p-4 text-center text-white/55 text-sm">
                      No conversations yet
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupedSessions.today.length > 0 && (
                        <div>
                          <div className="px-3 py-2 text-xs font-medium text-white/45">今天</div>
                          <div className="space-y-0.5">
                            {groupedSessions.today.map(s => (
                              <SessionItem
                                key={s.id}
                                s={s}
                                group="today"
                                currentSession={currentSession}
                                editingSessionId={editingSessionId}
                                editInputRef={editInputRef}
                                setEditingSessionId={setEditingSessionId}
                                setSessionHistory={setSessionHistory}
                                handleSelectSession={handleSelectSession}
                                setDeleteSessionId={setDeleteSessionId}
                                formatSessionTime={formatSessionTime}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {groupedSessions.yesterday.length > 0 && (
                        <div>
                          <div className="px-3 py-2 text-xs font-medium text-white/45">昨天</div>
                          <div className="space-y-0.5">
                            {groupedSessions.yesterday.map(s => (
                              <SessionItem
                                key={s.id}
                                s={s}
                                group="yesterday"
                                currentSession={currentSession}
                                editingSessionId={editingSessionId}
                                editInputRef={editInputRef}
                                setEditingSessionId={setEditingSessionId}
                                setSessionHistory={setSessionHistory}
                                handleSelectSession={handleSelectSession}
                                setDeleteSessionId={setDeleteSessionId}
                                formatSessionTime={formatSessionTime}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {groupedSessions.earlier.length > 0 && (
                        <div>
                          <div className="px-3 py-2 text-xs font-medium text-white/45">更早</div>
                          <div className="space-y-0.5">
                            {groupedSessions.earlier.map(s => (
                              <SessionItem
                                key={s.id}
                                s={s}
                                group="earlier"
                                currentSession={currentSession}
                                editingSessionId={editingSessionId}
                                editInputRef={editInputRef}
                                setEditingSessionId={setEditingSessionId}
                                setSessionHistory={setSessionHistory}
                                handleSelectSession={handleSelectSession}
                                setDeleteSessionId={setDeleteSessionId}
                                formatSessionTime={formatSessionTime}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <main className={`ai-toolkit-stage ${user ? "ai-toolkit-stage--with-sidebar" : ""}`}>
        <div className={`ai-toolkit-hero-copy ${isNewSession ? "is-visible" : ""}`}>
          <h1>What will you create today?</h1>
          <p>Describe the image you want, then tune the model details below.</p>
        </div>
      </main>

      <div
        className={`ai-toolkit-prompt-dock ${user ? "ai-toolkit-prompt-dock--with-sidebar" : ""}`}
      >
        <div className="ai-toolkit-prompt-dock__inner pointer-events-auto">
          <PromptArea
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            modelOptions={modelOptions}
            onOptionsChange={setModelOptions}
            className="ai-toolkit-prompt-area"
            onGenerateSuccess={() => setIsNewSession(false)}
          />
        </div>
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

function AIToolkitMasonryBackdrop({
  columns,
  isLoading,
  hasSidebar,
}: {
  columns: ApiToolkitShowcaseItem[][]
  isLoading: boolean
  hasSidebar: boolean
}) {
  return (
    <div
      className={`ai-toolkit-backdrop ${isLoading ? "is-loading" : ""} ${
        hasSidebar ? "ai-toolkit-backdrop--with-sidebar" : ""
      }`}
      aria-hidden="true"
    >
      <div className="ai-toolkit-masonry">
        {columns.map((column, columnIndex) => (
          <div className="ai-toolkit-masonry__column" key={columnIndex}>
            {column.map((item, itemIndex) => (
              <figure
                className="ai-toolkit-masonry__tile"
                key={item.id}
                style={{
                  "--tile-height": getMasonryTileHeight(columnIndex, itemIndex),
                  flexShrink: 0,
                } as React.CSSProperties}
              >
                <img src={item.src} alt="" width={item.width} height={item.height} loading="lazy" />
              </figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionItem({
  s,
  group,
  currentSession,
  editingSessionId,
  editInputRef,
  setEditingSessionId,
  setSessionHistory,
  handleSelectSession,
  setDeleteSessionId,
  formatSessionTime,
}: any) {
  return (
    <div
      className={`group relative flex items-center justify-between py-1.5 px-3 rounded-lg cursor-pointer hover:bg-white/10 transition-colors ${
        currentSession?.id === s.id ? "bg-white/10" : ""
      }`}
      onClick={() => handleSelectSession(s.id)}
    >
      <div className="flex-1 min-w-0 truncate pr-4">
        {editingSessionId === s.id ? (
          <input
            ref={editInputRef}
            type="text"
            defaultValue={s.title}
            className="input input-xs input-bordered w-full h-6 border-white/15 bg-white/10 text-white"
            autoFocus
            onBlur={e => {
              const newTitle = e.target.value.trim()
              if (!newTitle) {
                setEditingSessionId(null)
                return
              }
              if (newTitle !== s.title) {
                api.sessions.update(s.id, { title: newTitle }).then(() => {
                  setSessionHistory((prev: any) =>
                    prev.map((session: any) =>
                      session.id === s.id ? { ...session, title: newTitle } : session
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
          <div className="flex items-center gap-1.5">
            {s.is_pinned === 1 && <Pin className="size-3 fill-white/40 text-white/40 shrink-0" />}
            <span className="truncate text-sm text-white/80">{s.title}</span>
          </div>
        )}
      </div>
      <div className="flex items-center shrink-0">
        <span className="text-xs text-white/40 group-hover:hidden">
          {formatSessionTime(s.created_at, group)}
        </span>

        <div className="hidden group-hover:flex items-center gap-1">
          {editingSessionId !== s.id && (
            <button
              onClick={e => {
                e.stopPropagation()
                setEditingSessionId(s.id)
                setTimeout(() => editInputRef.current?.select(), 0)
              }}
              className="p-1 text-white/40 hover:text-white transition-colors"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
          <div className="dropdown dropdown-bottom dropdown-end" onClick={e => e.stopPropagation()}>
            <div
              tabIndex={0}
              role="button"
              className="p-1 text-white/40 hover:text-white transition-colors"
            >
              <MoreHorizontal className="size-3.5" />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-1.5 shadow bg-black/90 rounded-box w-32 border border-white/10 text-white"
            >
              <li>
                <button
                  className="text-xs py-1.5 px-3"
                  onClick={e => {
                    const elem = document.activeElement as HTMLElement
                    if (elem) {
                      elem.blur()
                    }
                    api.sessions.update(s.id, { is_pinned: s.is_pinned === 1 ? 0 : 1 }).then(() => {
                      setSessionHistory((prev: any) =>
                        prev.map((session: any) =>
                          session.id === s.id
                            ? { ...session, is_pinned: s.is_pinned === 1 ? 0 : 1 }
                            : session
                        )
                      )
                    })
                  }}
                >
                  <Pin className="size-3" /> {s.is_pinned === 1 ? "取消固定" : "固定会话"}
                </button>
              </li>
              <li>
                <button
                  className="text-xs py-1.5 px-3 text-error hover:bg-error/10 hover:text-error"
                  onClick={() => {
                    const elem = document.activeElement as HTMLElement
                    if (elem) {
                      elem.blur()
                    }
                    setDeleteSessionId(s.id)
                  }}
                >
                  <Trash2 className="size-3" /> 删除会话
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
