import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  Clapperboard,
  Film,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import { api, type StudioProject } from "~/lib/api"
import { createNoIndexMeta } from "~/lib/seo"
import { useUserStore } from "~/stores/userStore"

export function meta() {
  return createNoIndexMeta("My Studio Projects | tuziyo")
}

type ProjectAction = "create" | "rename" | "delete" | null

const projectArt = [
  "studio-project-card--teal",
  "studio-project-card--ember",
  "studio-project-card--slate",
  "studio-project-card--violet",
]

function formatUpdatedAt(timestamp: number) {
  const date = new Date(timestamp * 1000)
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  }).format(date)
}

export default function StudioProjectsPage() {
  const navigate = useNavigate()
  const { user, isLoading: isUserLoading, isFetching: isUserFetching } = useUserStore()
  const [projects, setProjects] = useState<StudioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<ProjectAction>(null)
  const [activeProject, setActiveProject] = useState<StudioProject | null>(null)
  const [draftName, setDraftName] = useState("")
  const [busy, setBusy] = useState(false)
  const isAuthPending = isUserLoading || isUserFetching

  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await api.studio.listProjects()
      setProjects(result.projects)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Studio projects")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!isAuthPending) void loadProjects()
  }, [isAuthPending, loadProjects])

  const closeDialog = () => {
    if (busy) return
    setAction(null)
    setActiveProject(null)
    setDraftName("")
  }

  const openCreate = () => {
    setDraftName("")
    setActiveProject(null)
    setAction("create")
  }

  const openRename = (project: StudioProject) => {
    setDraftName(project.name)
    setActiveProject(project)
    setAction("rename")
  }

  const openDelete = (project: StudioProject) => {
    setActiveProject(project)
    setAction("delete")
  }

  const submitProjectAction = async () => {
    if (!action) return
    setBusy(true)
    try {
      if (action === "create") {
        const name = draftName.trim()
        if (!name) return
        const result = await api.studio.createProject({ name })
        closeDialog()
        navigate(`/studio/${result.projectId}`)
        return
      }
      if (!activeProject) return
      if (action === "rename") {
        const name = draftName.trim()
        if (!name) return
        await api.studio.updateProject(activeProject.id, { name })
        setProjects(current =>
          current.map(project =>
            project.id === activeProject.id
              ? { ...project, name, updated_at: Math.floor(Date.now() / 1000) }
              : project
          )
        )
        toast.success("Project renamed")
      }
      if (action === "delete") {
        await api.studio.deleteProject(activeProject.id)
        setProjects(current => current.filter(project => project.id !== activeProject.id))
        toast.success("Project deleted")
      }
      setAction(null)
      setActiveProject(null)
      setDraftName("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Project update failed")
    } finally {
      setBusy(false)
    }
  }

  const featuredProject = projects[0] ?? null
  const totalShots = useMemo(
    () => projects.reduce((total, project) => total + (project.shot_count ?? 0), 0),
    [projects]
  )

  if (isAuthPending) {
    return (
      <main className="studio-projects studio-projects--loading">
        <Loader2 className="size-8 animate-spin" aria-label="Loading account" />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="studio-projects studio-projects--gate">
        <div>
          <span className="studio-projects-eyebrow">
            <Clapperboard className="size-4" /> Studio workspace
          </span>
          <h1>Sign in to open your projects.</h1>
          <p>Your projects, shots, and visual references stay connected to your tuziyo account.</p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("openLoginModal"))}
            className="studio-projects-primary"
          >
            Log in to continue <ArrowRight className="size-4" />
          </button>
          <Link to="/studio">Explore Studio first</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="studio-projects">
      <div className="studio-projects-shell">
        <header className="studio-projects-header">
          <div>
            <span className="studio-projects-eyebrow">
              <Clapperboard className="size-4" />
              tuziyo Studio
              <small>Beta</small>
            </span>
            <h1>My Projects</h1>
            <p>
              {projects.length} {projects.length === 1 ? "project" : "projects"} · {totalShots}{" "}
              shots
            </p>
          </div>
          <button type="button" onClick={openCreate} className="studio-projects-primary">
            <Plus className="size-4" />
            New Project
          </button>
        </header>

        {loading ? (
          <div className="studio-projects-grid" aria-label="Loading projects">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="studio-project-card studio-project-card--skeleton" />
            ))}
          </div>
        ) : (
          <>
            {featuredProject && (
              <section className="studio-projects-featured">
                <div className="studio-projects-featured__image">
                  <img src="/showcase/case351.jpg" alt="" />
                </div>
                <div className="studio-projects-featured__veil" />
                <div className="studio-projects-featured__content">
                  <span>
                    <Sparkles className="size-3.5" /> Continue working
                  </span>
                  <h2>{featuredProject.name}</h2>
                  <p>
                    Last updated {formatUpdatedAt(featuredProject.updated_at)} ·{" "}
                    {featuredProject.shot_count ?? 0} shots
                  </p>
                  <Link to={`/studio/${featuredProject.id}`}>
                    Open Project <ArrowRight className="size-4" />
                  </Link>
                </div>
              </section>
            )}

            <section className="studio-projects-library">
              <div className="studio-projects-library__heading">
                <div>
                  <span>Project library</span>
                  <h2>My Projects</h2>
                </div>
                <p>Each project keeps its own shots, cast, references, and sequence.</p>
              </div>
              <div className="studio-projects-grid">
                <button type="button" onClick={openCreate} className="studio-project-new">
                  <span>
                    <Plus className="size-7" />
                  </span>
                  <strong>New Project</strong>
                  <small>Start a new visual story</small>
                </button>

                {projects.map((project, index) => (
                  <article
                    key={project.id}
                    className={`studio-project-card ${projectArt[index % projectArt.length]}`}
                  >
                    <Link to={`/studio/${project.id}`} className="studio-project-card__open">
                      <div className="studio-project-card__preview">
                        <FolderKanban className="size-8" />
                        <div className="studio-project-card__frames" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                      <div className="studio-project-card__meta">
                        <h3>{project.name}</h3>
                        <p>
                          {project.shot_count ?? 0} shots · {project.aspect_ratio}
                        </p>
                      </div>
                    </Link>
                    <div className="studio-project-card__actions">
                      <span>Edited {formatUpdatedAt(project.updated_at)}</span>
                      <button
                        type="button"
                        onClick={() => openRename(project)}
                        aria-label={`Rename ${project.name}`}
                        title="Rename project"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(project)}
                        aria-label={`Delete ${project.name}`}
                        title="Delete project"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {!projects.length && (
                <div className="studio-projects-empty">
                  <Film className="size-5" />
                  Create the first project to start building your sequence.
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {action && (
        <div className="studio-dialog-backdrop" onMouseDown={closeDialog}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-project-dialog-title"
            className="studio-dialog"
            onMouseDown={event => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeDialog}
              className="studio-dialog__close"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>
            <span>
              {action === "create"
                ? "New project"
                : action === "rename"
                  ? "Rename project"
                  : "Delete project"}
            </span>
            <h2 id="studio-project-dialog-title">
              {action === "create"
                ? "Give this story a working title."
                : action === "rename"
                  ? "Rename this project."
                  : `Delete “${activeProject?.name}”?`}
            </h2>
            {action === "delete" ? (
              <p>This removes the project from your workspace. This action cannot be undone.</p>
            ) : (
              <input
                autoFocus
                value={draftName}
                onChange={event => setDraftName(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter" && draftName.trim()) void submitProjectAction()
                  if (event.key === "Escape") closeDialog()
                }}
                maxLength={120}
                placeholder="Project name"
                aria-label="Project name"
              />
            )}
            <div className="studio-dialog__actions">
              <button type="button" onClick={closeDialog} disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitProjectAction()}
                disabled={busy || (action !== "delete" && !draftName.trim())}
                className={action === "delete" ? "is-danger" : "is-primary"}
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                {action === "create"
                  ? "Create Project"
                  : action === "rename"
                    ? "Save Name"
                    : "Delete Project"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
