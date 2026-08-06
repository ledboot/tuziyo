import { ArrowRight, Check } from "lucide-react"
import { Link } from "react-router"
import type { Route } from "./+types/prompts.ai-image-prompts-examples"
import { SEO_PAGE_UPDATED_AT, SEO_PROMPT_EXAMPLES } from "~/data/seoLandingPages"
import { createSeoMeta, SITE_ORIGIN } from "~/lib/seo"
import { useModelStore } from "~/stores/modelStore"

const path = "/prompts/ai-image-prompts-examples"
const description =
  "Explore practical AI image prompt examples for product photography, typography, storyboards, characters, interiors, campaigns, and social content."

export function meta({}: Route.MetaArgs) {
  return createSeoMeta({
    title: "Practical AI Image Prompt Examples | tuziyo",
    description,
    path,
    keywords: "ai image prompts examples, good AI image prompts, image generation prompt examples",
    socialImage: "/showcase/case250.jpg",
    socialImageAlt: "Creative AI image prompt example gallery",
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "AI Image Prompt Examples",
        description,
        url: `${SITE_ORIGIN}${path}`,
        dateModified: SEO_PAGE_UPDATED_AT,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: SEO_PROMPT_EXAMPLES.length,
          itemListElement: SEO_PROMPT_EXAMPLES.map((example, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: example.title,
            description: example.prompt,
          })),
        },
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
            item: `${SITE_ORIGIN}/prompts/ai-image-prompts`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Prompt Examples",
            item: `${SITE_ORIGIN}${path}`,
          },
        ],
      },
    ],
  })
}

export default function AiImagePromptExamplesPage() {
  const setUserSelectedModel = useModelStore(state => state.setUserSelectedModel)
  const setUserPrompt = useModelStore(state => state.setUserPrompt)

  const usePrompt = (modelId: string, prompt: string) => {
    setUserSelectedModel(modelId)
    setUserPrompt(prompt)
  }

  return (
    <article className="seo-page prompt-examples-page">
      <section className="seo-hero seo-examples-hero">
        <div className="model-page-shell">
          <nav className="model-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/prompts/ai-image-prompts">AI Image Prompts</Link>
            <span>/</span>
            <span>Examples</span>
          </nav>
          <div className="seo-examples-heading">
            <span>Eight complete creative briefs</span>
            <h1>AI image prompt examples you can actually adapt.</h1>
            <p>
              Each example defines a visible goal, composition, fixed constraints, and delivery
              format. Replace the subject or references, then preserve the structure that makes the
              brief testable.
            </p>
          </div>
        </div>
      </section>

      <section className="prompt-example-section">
        <div className="model-page-shell prompt-example-list">
          {SEO_PROMPT_EXAMPLES.map((example, index) => (
            <article key={example.title} className="prompt-example-card">
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p>
                    {example.category} · {example.ratio}
                  </p>
                  <h2>{example.title}</h2>
                </div>
                <strong>{example.model}</strong>
              </header>
              <blockquote>{example.prompt}</blockquote>
              <footer>
                <p>
                  <Check className="size-4" />
                  <span>
                    <strong>Why it works:</strong> {example.whyItWorks}
                  </span>
                </p>
                <Link to="/ai-toolkit" onClick={() => usePrompt(example.modelId, example.prompt)}>
                  Use this prompt
                  <ArrowRight className="size-4" />
                </Link>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="seo-related">
        <div className="model-page-shell">
          <div className="model-section-heading model-section-heading-left">
            <span>Build your own</span>
            <h2>Turn examples into a repeatable workflow</h2>
          </div>
          <div className="model-related-grid">
            <Link to="/prompts/ai-image-prompts">
              <h3>AI image prompt guide</h3>
              <p>Learn the five-part structure behind every example on this page.</p>
              <ArrowRight />
            </Link>
            <Link to="/ai/compare/nano-banana-pro-vs-nano-banana-2">
              <h3>Nano Banana comparison</h3>
              <p>Run the same brief across Pro and Nano Banana 2.</p>
              <ArrowRight />
            </Link>
            <Link to="/ai/compare/gpt-image-2-vs-nano-banana-2">
              <h3>GPT Image 2 comparison</h3>
              <p>Compare long briefs, references, formats, and batch output.</p>
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}
