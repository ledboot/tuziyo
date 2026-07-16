import { ArrowRight, Check } from "lucide-react"
import { Link } from "react-router"
import type { Route } from "./+types/ai.models._index"
import { AI_IMAGE_MODELS, AI_IMAGE_MODEL_SLUGS } from "~/data/aiImageModels"
import { createSeoMeta, SITE_ORIGIN } from "~/lib/seo"

const models = AI_IMAGE_MODEL_SLUGS.map(slug => AI_IMAGE_MODELS[slug])

export function meta({}: Route.MetaArgs) {
  const title = "Compare AI Image Models: Nano Banana, Seedream & GPT | tuziyo"
  const description = "Compare Nano Banana, Nano Banana Pro, Nano Banana 2, Seedream 5 Pro, and GPT Image 2 by resolution, references, credits, and best use case."

  return createSeoMeta({
    title,
    description,
    path: "/ai/models",
    socialImage: "/showcase/case250.jpg",
    socialImageAlt: "AI image model comparison and creative workspace",
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "AI Image Model Comparison",
        description,
        url: `${SITE_ORIGIN}/ai/models`,
        dateModified: "2026-07-16",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
            { "@type": "ListItem", position: 2, name: "AI Image Models", item: `${SITE_ORIGIN}/ai/models` },
          ],
        },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: models.length,
          itemListElement: models.map((model, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: model.name,
            url: `${SITE_ORIGIN}/ai/models/${model.slug}`,
          })),
        },
      },
    ],
  })
}

export default function AiImageModelsIndex() {
  return (
    <main className="model-index-page">
      <section className="model-index-hero">
        <div className="model-page-shell">
          <nav className="model-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span>/</span><span>AI Image Models</span>
          </nav>
          <div className="model-index-hero-copy">
            <h1>Find the right AI image model for the work.</h1>
            <p>Compare five creative models by resolution, reference capacity, starting credits, and the kind of brief each one handles best.</p>
          </div>
        </div>
      </section>

      <section className="model-index-cards">
        <div className="model-page-shell">
          <div className="model-index-card-grid">
            {models.map(model => (
              <article key={model.slug}>
                <img
                  src={model.heroImage.src}
                  width={model.heroImage.width}
                  height={model.heroImage.height}
                  alt={model.heroImage.alt}
                  loading="lazy"
                />
                <div>
                  <span>{model.provider}</span>
                  <h2>{model.name}</h2>
                  <p>{model.verdict}</p>
                  <ul>{model.bestFor.slice(0, 2).map(item => <li key={item}><Check className="size-4" />{item}</li>)}</ul>
                  <Link to={`/ai/models/${model.slug}`}>Read the model guide<ArrowRight className="size-4" /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="model-index-compare">
        <div className="model-page-shell">
          <div className="model-section-heading model-section-heading-left">
            <span>Side-by-side</span>
            <h2>Compare the controls available in tuziyo</h2>
            <p>This table reflects the current product controls rather than general claims about provider APIs.</p>
          </div>
          <div className="model-compare-scroll" tabIndex={0} aria-label="Scrollable AI image model comparison">
            <table>
              <thead><tr><th>Model</th><th>Maximum output</th><th>References</th><th>Starting credits</th><th>Best starting point</th></tr></thead>
              <tbody>
                {models.map(model => (
                  <tr key={model.slug}>
                    <th><Link to={`/ai/models/${model.slug}`}>{model.name}</Link><span>{model.provider}</span></th>
                    <td>{model.stats.find(stat => stat.label === "maximum resolution")?.value ?? "1K class"}</td>
                    <td>{model.stats.find(stat => stat.label === "reference images")?.value ?? "—"}</td>
                    <td>{model.baseCredits}</td>
                    <td>{model.bestFor[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="model-index-guide">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Quick decision guide</span>
            <h2>Start with the constraint that matters most</h2>
          </div>
          <div className="model-index-guide-grid">
            <article><span>01</span><h3>Need fast everyday edits?</h3><p>Start with Nano Banana for low-friction drafts and reference-guided changes.</p><Link to="/ai/models/nano-banana">Explore Nano Banana</Link></article>
            <article><span>02</span><h3>Need a flexible all-rounder?</h3><p>Nano Banana 2 balances formats, resolution, references, search, and reasoning controls.</p><Link to="/ai/models/nano-banana-2">Explore Nano Banana 2</Link></article>
            <article><span>03</span><h3>Need a complex final asset?</h3><p>Compare Nano Banana Pro's production focus with GPT Image 2's long briefs and batch exploration.</p><Link to="/ai/models/nano-banana-pro">Compare professional options</Link></article>
          </div>
        </div>
      </section>

      <section className="model-final-cta">
        <div className="model-page-shell">
          <div className="model-final-cta-card">
            <span>ONE STUDIO, MULTIPLE MODELS</span>
            <h2>Test the same brief across models.</h2>
            <p>Start with a draft, compare the result, and spend higher settings only where they add value.</p>
            <Link to="/ai-toolkit" className="model-button model-button-primary">Open AI Toolkit<ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>
    </main>
  )
}
