import React from "react"
import { SquarePen, Trash2, Pencil, Pin } from "lucide-react"
import { api } from "~/lib/api"
import { toast } from "sonner"
import { useI18n } from "~/lib/i18n"
import { trackSessionSelection } from "~/lib/analytics"

interface Session {
  id: string
  title: string
  lastModified?: number
  is_pinned?: number
  created_at?: number
  updated_at?: number
  pinned?: boolean
  preview_image?: string | null
}

interface AIToolkitSidebarProps {
  showSidebar: boolean
  setShowSidebar: (show: boolean) => void
  sessionHistory: Session[]
  currentSession: Session | null
  editingSessionId: string | null
  setEditingSessionId: (id: string | null) => void
  setSessionHistory: React.Dispatch<React.SetStateAction<any[]>>
  setDeleteSessionId: (id: string | null) => void
  handleCreateSession: () => void
  handleSelectSession: (id: string) => void
  editInputRef: React.RefObject<HTMLInputElement | null>
}

export function AIToolkitSidebar({
  showSidebar,
  setShowSidebar,
  sessionHistory,
  currentSession,
  editingSessionId,
  setEditingSessionId,
  setSessionHistory,
  setDeleteSessionId,
  handleCreateSession,
  handleSelectSession,
  editInputRef,
}: AIToolkitSidebarProps) {
  const { t } = useI18n()
  const handleSessionSelect = (sessionId: string) => {
    trackSessionSelection({
      sessionId,
      previousSessionId: currentSession?.id,
    })
    setShowSidebar(false)
    handleSelectSession(sessionId)
  }

  return (
    <div
      className={`ai-toolkit-sidebar ${showSidebar ? "ai-toolkit-sidebar--expanded" : ""}`}
      onMouseEnter={() => setShowSidebar(true)}
      onMouseLeave={() => setShowSidebar(false)}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div
          className={`transition-all duration-300 flex justify-center ${showSidebar ? "p-4 pb-2" : "pt-4 pb-2 px-2"}`}
        >
          <button
            onClick={handleCreateSession}
            className={`btn text-white font-normal h-10 min-h-0 flex items-center transition-all duration-300 ${
              showSidebar
                ? "btn-outline w-full hover:bg-white/10 border-white/15 px-3 justify-center gap-2 rounded-lg"
                : "btn-ghost w-12 border-transparent px-0 justify-center"
            }`}
            aria-label="New session"
          >
            <SquarePen className={`shrink-0 transition-transform duration-300 size-5`} />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                showSidebar ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"
              }`}
            >
              {t.aiToolkit.newSession}
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-hide transition-all duration-300">
          {sessionHistory.length === 0 ? (
            showSidebar && (
              <div className="p-4 text-center text-white/55 text-sm">No conversations yet</div>
            )
          ) : (
            <div className="space-y-0.5">
              {sessionHistory.map(s => (
                <SessionItem
                  key={s.id}
                  s={s}
                  currentSession={currentSession}
                  editingSessionId={editingSessionId}
                  editInputRef={editInputRef}
                  setEditingSessionId={setEditingSessionId}
                  setSessionHistory={setSessionHistory}
                  handleSelectSession={handleSessionSelect}
                  setDeleteSessionId={setDeleteSessionId}
                  showSidebar={showSidebar}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SessionItem({
  s,
  currentSession,
  editingSessionId,
  editInputRef,
  setEditingSessionId,
  setSessionHistory,
  handleSelectSession,
  setDeleteSessionId,
  showSidebar,
}: any) {
  const [imgError, setImgError] = React.useState(false)
  const [isPinning, setIsPinning] = React.useState(false)
  const isPinned = s.pinned ?? Boolean(s.is_pinned)

  React.useEffect(() => {
    setImgError(false)
  }, [s.preview_image])

  const handleTogglePin = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (isPinning) return

    const nextPinned = !isPinned
    const updatePinnedState = (pinned: boolean) => {
      setSessionHistory((previous: any) =>
        previous.map((item: any) =>
          item.id === s.id ? { ...item, pinned, is_pinned: pinned ? 1 : 0 } : item
        )
      )
    }

    setIsPinning(true)
    updatePinnedState(nextPinned)
    try {
      await api.sessions.update(s.id, { is_pinned: nextPinned ? 1 : 0 })
    } catch {
      updatePinnedState(isPinned)
      toast.error("Pin update failed, please try again.")
    } finally {
      setIsPinning(false)
    }
  }

  return (
    <div
      className={`group relative flex items-center py-2 px-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors ${
        currentSession?.id === s.id ? "bg-white/10" : ""
      } ${showSidebar ? "justify-between" : "justify-center"}`}
      onClick={() => handleSelectSession(s.id)}
    >
      <div className={`flex items-center min-w-0 ${showSidebar ? "flex-1" : ""}`}>
        <div
          className={`w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden transition-all duration-300 ${showSidebar ? "mr-3" : "mr-0"}`}
        >
          {s.preview_image && !imgError ? (
            <img
              src={s.preview_image}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="skeleton w-full h-full flex items-center justify-center"></div>
          )}
        </div>

        {showSidebar && (
          <div className="flex-1 min-w-0">
            {editingSessionId === s.id ? (
              <input
                ref={editInputRef}
                className="w-full bg-transparent border-none outline-none text-sm text-white p-0 focus:ring-0"
                defaultValue={s.title}
                autoFocus
                onBlur={e => {
                  const newTitle = e.target.value.trim()
                  if (newTitle && newTitle !== s.title) {
                    setSessionHistory((prev: any) =>
                      prev.map((item: any) =>
                        item.id === s.id ? { ...item, title: newTitle } : item
                      )
                    )
                    api.sessions.update(s.id, { title: newTitle }).catch(() => {
                      // rollback on failure
                      setSessionHistory((prev: any) =>
                        prev.map((item: any) =>
                          item.id === s.id ? { ...item, title: s.title } : item
                        )
                      )
                      toast.error("Rename failed, please try again.")
                    })
                  }
                  setEditingSessionId(null)
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") e.currentTarget.blur()
                  if (e.key === "Escape") setEditingSessionId(null)
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm text-white/90 truncate leading-relaxed">
                {s.title || "Untitled Session"}
              </p>
            )}
          </div>
        )}
      </div>

      {showSidebar && editingSessionId !== s.id && (
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 w-0 group-hover:w-auto overflow-hidden">
          <button
            onClick={e => {
              e.stopPropagation()
              setEditingSessionId(s.id)
            }}
            className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors cursor-pointer"
            title="Rename"
          >
            <Pencil className="size-3" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              setDeleteSessionId(s.id)
            }}
            className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-red-400 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="size-3" />
          </button>
          <button
            onClick={handleTogglePin}
            disabled={isPinning}
            className={`p-1 hover:bg-white/10 rounded transition-colors cursor-pointer ${
              isPinned ? "text-blue-400" : "text-white/30 hover:text-white"
            }`}
            title={isPinned ? "Unpin" : "Pin"}
          >
            <Pin className={`size-3 ${isPinned ? "fill-current" : ""}`} />
          </button>
        </div>
      )}
    </div>
  )
}
