import { ArrowUpRight, Clapperboard, FolderKanban, Play, Sparkles } from "lucide-react"
import { createSeoMeta, createWebApplicationSchema } from "~/lib/seo"

const STUDIO_DESCRIPTION =
  "Turn generated images and videos into organized visual projects, build shot sequences, and export a finished MP4 in tuziyo Studio."

export function meta() {
  return createSeoMeta({
    title: "AI Video Project Workspace & Shot Sequencer | tuziyo Studio",
    description: STUDIO_DESCRIPTION,
    path: "/studio",
    keywords:
      "AI video workspace, AI video storyboard, shot sequencer, visual project manager, AI video editor",
    socialImage: "/showcase/case351.jpg",
    socialImageAlt: "tuziyo Studio visual project workspace",
    schema: createWebApplicationSchema({
      name: "tuziyo Studio",
      description: STUDIO_DESCRIPTION,
      path: "/studio",
    }),
  })
}

const workflow = [
  {
    number: "01",
    title: "Collect the visual world",
    body: "Bring generated images and video clips together with characters, locations, and reference frames.",
  },
  {
    number: "02",
    title: "Direct every shot",
    body: "Shape prompts, compare takes, and keep the intent of each scene next to the footage it controls.",
  },
  {
    number: "03",
    title: "Sequence the story",
    body: "Arrange shots into a clear timeline, review the pacing, and export one production-ready MP4.",
  },
]

export default function StudioLandingPage() {
  return (
    <main className="studio-landing">
      <section className="studio-landing-hero">
        <div className="studio-landing-hero__image" aria-hidden="true">
          <img src="/showcase/case351.jpg" alt="" />
        </div>
        <div className="studio-landing-hero__veil" />
        <div className="studio-landing-shell studio-landing-hero__content">
          <div className="studio-landing-kicker">
            <Clapperboard className="size-4" />
            tuziyo Studio
            <span>Beta</span>
          </div>
          <h1>
            Your visual story.
            <br />
            One focused workspace.
          </h1>
          <p>
            Move from scattered generations to a directed sequence. Organize projects, develop
            shots, and keep every visual decision in context.
          </p>
          <div className="studio-landing-actions">
            <a
              href="/studio/projects"
              target="_blank"
              rel="noopener noreferrer"
              className="studio-landing-primary"
            >
              Go To Your Projects
              <ArrowUpRight className="size-4" />
            </a>
            <a href="#workflow" className="studio-landing-secondary">
              <Play className="size-3.5 fill-current" />
              See how it works
            </a>
          </div>
          <div className="studio-landing-proof">
            <span>
              <FolderKanban className="size-4" /> Multiple projects
            </span>
            <span>
              <Sparkles className="size-4" /> Shot-by-shot direction
            </span>
          </div>
        </div>
      </section>

      <section className="studio-landing-workflow" id="workflow">
        <div className="studio-landing-shell">
          <div className="studio-landing-section-heading">
            <span>From generation to sequence</span>
            <h2>A workspace that thinks in scenes, not loose files.</h2>
          </div>
          <div className="studio-landing-workflow__grid">
            {workflow.map(item => (
              <article key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="studio-landing-editor">
        <div className="studio-landing-shell studio-landing-editor__grid">
          <div className="studio-landing-editor__copy">
            <span>Built for visual continuity</span>
            <h2>Keep the direction beside the frame.</h2>
            <p>
              Each project connects its cast, references, prompts, active take, and shot order. You
              can move from the big picture to a single moment without losing the thread.
            </p>
            <a
              href="/studio/projects"
              target="_blank"
              rel="noopener noreferrer"
              className="studio-landing-text-link"
            >
              Open your workspace <ArrowUpRight className="size-4" />
            </a>
          </div>
          <div className="studio-landing-editor__mockup" aria-label="Studio editor preview">
            <div className="studio-landing-editor__rail">
              <Clapperboard className="size-5" />
              <span />
              <FolderKanban className="size-5" />
            </div>
            <div className="studio-landing-editor__brief">
              <small>DIRECTING · SHOT 04</small>
              <h3>Hold on the quiet before the reveal.</h3>
              <p>
                Static camera. Low eye line. Let the doorway stay dark for the first beat, then
                bring the subject into the warm edge light.
              </p>
              <div>
                <span>4 sec</span>
                <span>16:9</span>
                <span>Motion</span>
              </div>
            </div>
            <div className="studio-landing-editor__monitor">
              <img src="/showcase/case250.jpg" alt="Cinematic visual preview in tuziyo Studio" />
              <div className="studio-landing-editor__timeline">
                {[351, 250, 324, 6].map(image => (
                  <img key={image} src={`/showcase/case${image}.jpg`} alt="" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="studio-landing-final">
        <div className="studio-landing-shell">
          <p>YOUR PROJECTS ARE WAITING</p>
          <h2>Give every idea a place to become a story.</h2>
          <a
            href="/studio/projects"
            target="_blank"
            rel="noopener noreferrer"
            className="studio-landing-primary"
          >
            Go To Your Projects
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </section>
    </main>
  )
}
