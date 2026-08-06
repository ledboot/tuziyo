import { ArrowRight, Check, Layers3, Lightbulb, ScanSearch, SlidersHorizontal } from "lucide-react"
import { Link } from "react-router"
import type { Route } from "./+types/prompts.ai-image-prompts"
import { SEO_PAGE_UPDATED_AT, SEO_PROMPT_EXAMPLES } from "~/data/seoLandingPages"
import { createSeoMeta, SITE_ORIGIN } from "~/lib/seo"

const path = "/prompts/ai-image-prompts"
const description =
  "Learn how to write AI image prompts with a practical structure, model-aware guidance, reusable templates, and examples for products, portraits, layouts, and scenes."

export function meta({}: Route.MetaArgs) {
  return createSeoMeta({
    title: "AI Image Prompt Guide & Templates | tuziyo",
    description,
    path,
    keywords:
      "ai image prompts, good ai image prompts, AI prompt structure, image generation prompts",
    socialImage: "/showcase/case351.jpg",
    socialImageAlt: "Editorial image created from a structured AI image prompt",
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to write an AI image prompt",
        description,
        dateModified: SEO_PAGE_UPDATED_AT,
        url: `${SITE_ORIGIN}${path}`,
        step: [
          "State the image goal and subject.",
          "Describe composition and camera.",
          "Define environment, lighting, and materials.",
          "List references and details that must remain unchanged.",
          "Add output format and exclusions.",
        ].map((text, index) => ({ "@type": "HowToStep", position: index + 1, text })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: "AI Image Prompts",
            item: `${SITE_ORIGIN}${path}`,
          },
        ],
      },
    ],
  })
}

const promptFormula = [
  {
    title: "Goal and subject",
    example: "A premium product photograph of the uploaded fragrance bottle",
  },
  {
    title: "Composition",
    example: "Three-quarter camera angle, centered low in frame, negative space above",
  },
  {
    title: "Environment and light",
    example: "Dark burgundy stone, precise rim light, controlled reflections",
  },
  {
    title: "Invariants",
    example: "Preserve bottle geometry, label spelling, cap, color, and logo",
  },
  {
    title: "Delivery constraints",
    example: "4:5 portrait, realistic materials, no added text or extra products",
  },
]

export default function AiImagePromptsPage() {
  return (
    <article className="seo-page prompt-page">
      <section className="seo-hero seo-prompt-hero">
        <div className="model-page-shell">
          <nav className="model-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>AI Image Prompts</span>
          </nav>
          <div className="seo-prompt-hero-grid">
            <div className="seo-hero-copy">
              <span>Prompt field guide</span>
              <h1>AI image prompts that give models a clear job.</h1>
              <p>
                A good prompt is not a pile of adjectives. It is a compact creative brief that
                separates the goal, composition, visual treatment, fixed constraints, and delivery
                format.
              </p>
              <div className="model-actions">
                <Link
                  to="/prompts/ai-image-prompts-examples"
                  className="model-button model-button-primary"
                >
                  Browse prompt examples
                  <ArrowRight className="size-4" />
                </Link>
                <a href="#framework" className="model-button model-button-secondary">
                  Learn the framework
                </a>
              </div>
            </div>
            <div className="seo-prompt-card" aria-label="AI image prompt structure example">
              <span>Reusable structure</span>
              <p>
                <mark>[Goal]</mark> of <mark>[subject]</mark>, composed as{" "}
                <mark>[camera and layout]</mark>, in <mark>[environment and light]</mark>. Preserve{" "}
                <mark>[invariants]</mark>. Deliver as <mark>[ratio and quality]</mark>. Avoid{" "}
                <mark>[exclusions]</mark>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="seo-comparison" id="framework">
        <div className="model-page-shell">
          <div className="model-section-heading model-section-heading-left">
            <span>Five-part framework</span>
            <h2>Build the prompt in a useful order</h2>
            <p>
              Lead with the job, then narrow the model's freedom. Put the most important constraints
              before decorative language.
            </p>
          </div>
          <ol className="prompt-formula-grid">
            {promptFormula.map((item, index) => (
              <li key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.example}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="seo-decisions">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Four prompt decisions</span>
            <h2>Write for control without over-directing</h2>
          </div>
          <div className="prompt-principle-grid">
            <article>
              <Lightbulb />
              <h3>State the outcome</h3>
              <p>
                “Campaign key visual” gives the model a job. “Beautiful, cinematic, amazing” only
                adds mood without defining success.
              </p>
            </article>
            <article>
              <ScanSearch />
              <h3>Name what cannot change</h3>
              <p>
                For reference-based work, list identity, geometry, color, text, or camera properties
                that must survive.
              </p>
            </article>
            <article>
              <Layers3 />
              <h3>Give each reference a role</h3>
              <p>
                Say which image defines the subject, palette, material, composition, or environment
                instead of uploading an unexplained stack.
              </p>
            </article>
            <article>
              <SlidersHorizontal />
              <h3>Match the model</h3>
              <p>
                Use a model's real controls—ratio, resolution, references, search, thinking, or
                batch output—only where they support the brief.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="model-prompts">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Start from a complete brief</span>
            <h2>Three adaptable AI image prompts</h2>
            <p>Replace the subject and fixed details, but keep the structure and order.</p>
          </div>
          <div className="model-prompt-grid">
            {SEO_PROMPT_EXAMPLES.slice(0, 3).map((example, index) => (
              <article key={example.title}>
                <div className="model-prompt-meta">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{example.category}</span>
                  <span>{example.ratio}</span>
                </div>
                <h3>{example.title}</h3>
                <p>{example.prompt}</p>
                <Link to="/prompts/ai-image-prompts-examples">
                  See why it works
                  <ArrowRight className="size-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="seo-scenarios">
        <div className="model-page-shell">
          <div className="model-section-heading model-section-heading-left">
            <span>Prompt review checklist</span>
            <h2>Before you generate</h2>
          </div>
          <ul className="prompt-checklist">
            {[
              "Can someone identify the intended image in the first sentence?",
              "Are camera and composition specific enough for the required crop?",
              "Does every reference image have a stated role?",
              "Are fixed product, character, text, or layout details explicit?",
              "Are ratio and resolution appropriate for the final placement?",
              "Did you remove adjectives that do not change a visible decision?",
            ].map(item => (
              <li key={item}>
                <Check className="size-5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="seo-related">
        <div className="model-page-shell">
          <div className="model-section-heading model-section-heading-left">
            <span>Choose the next step</span>
            <h2>Move from prompt to comparison</h2>
          </div>
          <div className="model-related-grid">
            <Link to="/prompts/ai-image-prompts-examples">
              <h3>AI image prompt examples</h3>
              <p>
                Eight complete prompts for products, text, characters, interiors, and campaigns.
              </p>
              <ArrowRight />
            </Link>
            <Link to="/ai/compare/best-ai-model-for-product-photography">
              <h3>Product photography models</h3>
              <p>Choose a model based on references, resolution, cost, and production intent.</p>
              <ArrowRight />
            </Link>
            <Link to="/ai/models">
              <h3>Compare AI image models</h3>
              <p>Review current tuziyo controls before adapting the prompt to a model.</p>
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}
