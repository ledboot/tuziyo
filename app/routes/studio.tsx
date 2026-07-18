import { useEffect, useState } from "react"
import { ArrowRight, Clapperboard, Plus, Sparkles } from "lucide-react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { api, type StudioProject } from "~/lib/api"
import { useUserStore } from "~/stores/userStore"
import { createNoIndexMeta } from "~/lib/seo"

export function meta() {
  return createNoIndexMeta("Studio | tuziyo")
}

export default function StudioPage() {
  const navigate = useNavigate()
  const user = useUserStore(state => state.user)
  const [projects, setProjects] = useState<StudioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    api.studio
      .listProjects()
      .then(result => setProjects(result.projects))
      .catch(error => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [user])

  const createProject = async () => {
    if (!name.trim()) return
    const result = await api.studio.createProject({ name: name.trim() })
    navigate(`/studio/${result.projectId}`)
  }

  if (!user && !loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07080b] text-white">
        <div className="text-center">
          <Clapperboard className="mx-auto size-12 text-violet-300" />
          <h1 className="mt-5 text-3xl font-semibold">Studio Lite</h1>
          <p className="mt-2 text-white/45">Sign in to turn your Library into a sequence.</p>
          <button
            className="btn btn-primary mt-6 rounded-full"
            onClick={() => window.dispatchEvent(new CustomEvent("openLoginModal"))}
          >
            Sign in
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#07080b] px-6 pb-16 pt-28 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-violet-300">
              <Sparkles className="size-3.5" />
              Studio Lite
            </div>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight">
              Build a story, shot by shot.
            </h1>
            <p className="mt-3 max-w-xl text-white/45">
              Organize references, compare generations, arrange a sequence, and export one MP4.
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary rounded-full px-6">
            <Plus className="size-4" />
            New project
          </button>
        </header>
        {loading ? (
          <div className="grid grid-cols-1 gap-5 py-8 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton h-56 rounded-3xl opacity-20" key={i} />
            ))}
          </div>
        ) : projects.length ? (
          <div className="grid grid-cols-1 gap-5 py-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <button
                key={project.id}
                onClick={() => navigate(`/studio/${project.id}`)}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#171922] to-[#0c0e13] p-6 text-left transition hover:-translate-y-1 hover:border-white/25"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 ${index % 3 === 0 ? "bg-violet-400" : index % 3 === 1 ? "bg-cyan-400" : "bg-amber-300"}`}
                />
                <div className="flex items-start justify-between">
                  <Clapperboard className="size-8 text-white/25" />
                  <ArrowRight className="size-5 text-white/25 transition group-hover:translate-x-1 group-hover:text-white" />
                </div>
                <h2 className="mt-12 text-xl font-semibold">{project.name}</h2>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/40">
                  {project.description || "A new visual story waiting for its first shot."}
                </p>
                <div className="mt-6 flex gap-4 text-xs text-white/35">
                  <span>{project.shot_count || 0} shots</span>
                  <span>{project.entity_count || 0} entities</span>
                  <span>{project.aspect_ratio}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="mt-8 grid min-h-[360px] w-full place-items-center rounded-3xl border border-dashed border-white/12 bg-white/[0.02] text-center hover:border-white/25"
          >
            <div>
              <Plus className="mx-auto size-10 text-white/20" />
              <p className="mt-4 text-lg font-medium">Create your first project</p>
              <p className="mt-1 text-sm text-white/35">Start with a name. Add assets next.</p>
            </div>
          </button>
        )}
      </div>
      {showCreate && (
        <div
          className="fixed inset-0 z-[200] grid place-items-center bg-black/80 p-5 backdrop-blur-xl"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#14161d] p-7"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              New project
            </p>
            <h2 className="mt-2 text-2xl font-semibold">What are you making?</h2>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && void createProject()}
              placeholder="Project name"
              className="mt-6 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-400"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost rounded-full" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary rounded-full px-6"
                onClick={() => void createProject()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
