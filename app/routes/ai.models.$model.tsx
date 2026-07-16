import { ArrowRight, Check } from "lucide-react"
import { Link } from "react-router"
import type { Route } from "./+types/ai.models.$model"
import { AI_IMAGE_MODELS, AI_IMAGE_MODEL_SLUGS, isAiImageModelSlug } from "~/data/aiImageModels"
import { createSeoMeta, SITE_ORIGIN } from "~/lib/seo"
import { useModelStore } from "~/stores/modelStore"

export function meta({ params }: Route.MetaArgs) {
  if (!isAiImageModelSlug(params.model)) return [{ title: "AI image model not found | tuziyo" }]

  const model = AI_IMAGE_MODELS[params.model]
  const path = `/ai/models/${model.slug}`

  return createSeoMeta({
    title: `${model.name} AI Image Generator | tuziyo`,
    description: model.metaDescription,
    path,
    socialImage: model.heroImage.src,
    socialImageAlt: model.heroImage.alt,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${model.name} AI Image Generator`,
        description: model.metaDescription,
        url: `${SITE_ORIGIN}${path}`,
        dateModified: model.updatedAt,
        isPartOf: { "@type": "WebSite", name: "tuziyo", url: `${SITE_ORIGIN}/` },
        about: { "@type": "SoftwareApplication", name: model.name, applicationCategory: "MultimediaApplication" },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `${SITE_ORIGIN}${model.heroImage.src}`,
          width: model.heroImage.width,
          height: model.heroImage.height,
          caption: model.heroImage.alt,
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
            { "@type": "ListItem", position: 2, name: "AI Image Models", item: `${SITE_ORIGIN}/ai/models` },
            { "@type": "ListItem", position: 3, name: model.name, item: `${SITE_ORIGIN}${path}` },
          ],
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: model.faqs.map(faq => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  })
}

export default function AiImageModelPage({ params }: Route.ComponentProps) {
  if (!isAiImageModelSlug(params.model)) {
    throw new Response("AI image model not found", { status: 404 })
  }

  const model = AI_IMAGE_MODELS[params.model]
  const relatedModels = AI_IMAGE_MODEL_SLUGS.filter(slug => slug !== model.slug)
    .slice(0, 3)
    .map(slug => AI_IMAGE_MODELS[slug])
  const setUserSelectedModel = useModelStore(state => state.setUserSelectedModel)
  const selectModel = () => setUserSelectedModel(model.modelId)

  return (
    <article className="model-page">
      <section className="model-hero">
        <div className="model-page-shell">
          <nav className="model-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span>/</span><Link to="/ai/models">AI Image Models</Link><span>/</span><span>{model.name}</span>
          </nav>

          <div className="model-hero-grid">
            <div className="model-hero-copy">
              <h1>{model.title}</h1>
              <p>{model.description}</p>
              <div className="model-actions">
                <Link to="/ai-toolkit" onClick={selectModel} className="model-button model-button-primary">
                  Generate with {model.name}<ArrowRight className="size-4" />
                </Link>
                <a href="#features" className="model-button model-button-secondary">Explore features</a>
              </div>
            </div>

            <div className="model-hero-art" aria-label={`${model.name} creative example`}>
              <div className="model-hero-number">{model.name}</div>
              <img
                src={model.heroImage.src}
                width={model.heroImage.width}
                height={model.heroImage.height}
                alt={model.heroImage.alt}
                fetchPriority="high"
              />
            </div>
          </div>

          <dl className="model-stats">
            {model.stats.map(stat => <div key={stat.label}><dt>{stat.value}</dt><dd>{stat.label}</dd></div>)}
          </dl>
        </div>
      </section>

      <section className="model-overview-section">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Model fit</span>
            <h2>Know when to choose {model.name}</h2>
            <p>{model.verdict}</p>
          </div>
          <div className="model-fit-grid">
            <article>
              <span>Best for</span>
              <ul>{model.bestFor.map(item => <li key={item}><Check className="size-4" />{item}</li>)}</ul>
            </article>
            <article>
              <span>Consider first</span>
              <ul>{model.watchouts.map(item => <li key={item}><span aria-hidden="true">—</span>{item}</li>)}</ul>
            </article>
          </div>
        </div>
      </section>

      <section className="model-prompts" id="prompts">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Prompt lab</span>
            <h2>Practical prompts for {model.name}</h2>
            <p>These original blueprints were rewritten from recurring patterns in public creator workflows and official prompting guidance. Replace the subject and reference instructions with your own assets.</p>
          </div>
          <div className="model-prompt-grid">
            {model.promptBlueprints.map((example, index) => (
              <article key={example.title}>
                <div className="model-prompt-meta"><span>{String(index + 1).padStart(2, "0")}</span><span>{example.purpose}</span><span>{example.ratio}</span></div>
                <h3>{example.title}</h3>
                <p>{example.prompt}</p>
                <Link to="/ai-toolkit" onClick={selectModel}>Try this direction<ArrowRight className="size-4" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="model-features" id="features">
        <div className="model-page-shell">
          <div className="model-section-heading model-section-heading-left">
            <span>Why {model.name}</span>
            <h2>Controls that keep the idea moving</h2>
          </div>
          <div className="model-feature-grid">
            {model.features.map((feature, index) => (
              <article key={feature.title}>
                <div className="model-feature-index">0{index + 1}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <Check className="model-feature-check size-5" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="model-workflow">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>From prompt to output</span>
            <h2>Create with {model.name} in three steps</h2>
          </div>
          <ol className="model-steps">
            <li><span>01</span><div><h3>Describe the direction</h3><p>Write the scene, style, mood, composition, and details you want the model to explore.</p></div></li>
            <li><span>02</span><div><h3>Add visual context</h3><p>Upload reference images when a subject, palette, material, or aesthetic needs to stay recognizable.</p></div></li>
            <li><span>03</span><div><h3>Choose and generate</h3><p>Select the format and available quality controls, then create and refine your strongest result.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="model-use-cases">
        <div className="model-page-shell model-use-cases-grid">
          <div className="model-section-heading model-section-heading-left">
            <span>Made for real projects</span>
            <h2>Where {model.name} fits best</h2>
            <p>Use it at the point where visual exploration needs to become tangible, shareable, and ready to refine.</p>
          </div>
          <div className="model-use-case-list">
            {model.useCases.map((useCase, index) => (
              <article key={useCase.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{useCase.title}</h3><p>{useCase.description}</p></div></article>
            ))}
          </div>
        </div>
      </section>

      <section className="model-faq" id="faq">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Good to know</span>
            <h2>Questions about {model.name}</h2>
            <p>Clear answers before you start creating with this model.</p>
          </div>
          <div className="model-faq-cards">
            {model.faqs.map((faq, index) => (
              <article key={faq.question}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="model-related">
        <div className="model-page-shell">
          <div className="model-section-heading model-section-heading-left">
            <span>Compare your options</span>
            <h2>Explore other AI image models</h2>
            <p>Compare model strengths, controls, and production trade-offs before choosing a workflow.</p>
          </div>
          <div className="model-related-grid">
            {relatedModels.map(related => (
              <Link key={related.slug} to={`/ai/models/${related.slug}`}>
                <div className="model-related-provider">
                  <img
                    src={`https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${related.provider.toLowerCase()}.svg`}
                    alt=""
                    width="18"
                    height="18"
                  />
                  <span>{related.provider}</span>
                </div>
                <h3>{related.name}</h3>
                <p>{related.verdict}</p>
                <ArrowRight className="size-5" />
              </Link>
            ))}
          </div>
          <div className="model-source-note">
            <span>Reviewed {model.updatedAt}</span>
            <span>Capabilities reflect controls currently available in tuziyo.</span>
            {model.officialSource ? <a href={model.officialSource.url} target="_blank" rel="noreferrer">{model.officialSource.label}</a> : null}
          </div>
        </div>
      </section>

      <section className="model-final-cta">
        <div className="model-page-shell">
          <div className="model-final-cta-card">
            <span>YOUR NEXT FRAME STARTS HERE</span>
            <h2>Make something unmistakably yours.</h2>
            <p>Bring a prompt, choose {model.name}, and shape your next visual in tuziyo.</p>
            <Link to="/ai-toolkit" onClick={selectModel} className="model-button model-button-primary">Start creating<ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>
    </article>
  )
}
