import { ArrowRight, Check, Sparkles } from "lucide-react"
import { Link } from "react-router"
import type { Route } from "./+types/ai.compare.$comparison"
import { COMPARISON_PAGES, SEO_PAGE_UPDATED_AT, isComparisonPageSlug } from "~/data/seoLandingPages"
import { createSeoMeta, SITE_ORIGIN } from "~/lib/seo"
import { useModelStore } from "~/stores/modelStore"

export function meta({ params }: Route.MetaArgs) {
  if (!isComparisonPageSlug(params.comparison)) {
    return [{ title: "AI image model comparison not found | tuziyo" }]
  }

  const page = COMPARISON_PAGES[params.comparison]
  const path = `/ai/compare/${page.slug}`

  return createSeoMeta({
    title: page.metaTitle,
    description: page.description,
    path,
    keywords: `${page.title}, AI image model comparison, best AI image model, tuziyo`,
    socialImage: page.candidates[0].image,
    socialImageAlt: page.candidates[0].imageAlt,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: `${SITE_ORIGIN}${path}`,
        dateModified: SEO_PAGE_UPDATED_AT,
        isPartOf: { "@type": "WebSite", name: "tuziyo", url: `${SITE_ORIGIN}/` },
        about: page.candidates.map(candidate => ({
          "@type": "SoftwareApplication",
          name: candidate.name,
          applicationCategory: "MultimediaApplication",
        })),
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
            {
              "@type": "ListItem",
              position: 2,
              name: "AI Image Models",
              item: `${SITE_ORIGIN}/ai/models`,
            },
            { "@type": "ListItem", position: 3, name: page.title, item: `${SITE_ORIGIN}${path}` },
          ],
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faqs.map(faq => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  })
}

export default function AiComparisonPage({ params }: Route.ComponentProps) {
  if (!isComparisonPageSlug(params.comparison)) {
    throw new Response("AI image model comparison not found", { status: 404 })
  }

  const page = COMPARISON_PAGES[params.comparison]
  const setUserSelectedModel = useModelStore(state => state.setUserSelectedModel)

  const chooseModel = (modelId: string) => {
    setUserSelectedModel(modelId)
  }

  return (
    <article className="seo-page comparison-page">
      <section className="seo-hero">
        <div className="model-page-shell">
          <nav className="model-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/ai/models">AI Image Models</Link>
            <span>/</span>
            <span>Compare</span>
          </nav>
          <div className="seo-hero-grid">
            <div className="seo-hero-copy">
              <span>{page.eyebrow}</span>
              <h1>{page.title}</h1>
              <p>{page.intro}</p>
              <div className="model-actions">
                <Link to="/ai-toolkit" className="model-button model-button-primary">
                  Compare models in tuziyo
                  <ArrowRight className="size-4" />
                </Link>
                <a href="#comparison" className="model-button model-button-secondary">
                  See the comparison
                </a>
              </div>
            </div>
            <div
              className={`seo-hero-images seo-hero-images-${Math.min(page.candidates.length, 4)}`}
            >
              {page.candidates.slice(0, 4).map(candidate => (
                <figure key={candidate.name}>
                  <img src={candidate.image} alt={candidate.imageAlt} />
                  <figcaption>
                    <span>{candidate.provider}</span>
                    {candidate.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="seo-verdict">
        <div className="model-page-shell seo-verdict-grid">
          <span>Short answer</span>
          <p>{page.verdict}</p>
        </div>
      </section>

      <section className="seo-comparison" id="comparison">
        <div className="model-page-shell">
          <div className="model-section-heading model-section-heading-left">
            <span>Current tuziyo controls</span>
            <h2>Compare the practical differences</h2>
            <p>
              The table reflects controls and starting credits currently exposed in tuziyo, not
              every feature available through a provider API.
            </p>
          </div>
          <div
            className="model-compare-scroll"
            tabIndex={0}
            aria-label={`Scrollable ${page.title} table`}
          >
            <table>
              <thead>
                <tr>
                  <th>Capability</th>
                  {page.candidates.map(candidate => (
                    <th key={candidate.name}>{candidate.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {page.comparisonRows.map(row => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    {row.values.map((value, index) => (
                      <td key={page.candidates[index].name}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="seo-decisions">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Decision guide</span>
            <h2>Choose for the job, not the leaderboard</h2>
          </div>
          <div className="seo-decision-grid">
            {page.decisions.map(decision => {
              const candidate = page.candidates[decision.candidateIndex]
              return (
                <article key={decision.title}>
                  <span>{candidate.name}</span>
                  <h3>{decision.title}</h3>
                  <p>{decision.description}</p>
                  <div className="seo-card-actions">
                    {candidate.href && (
                      <Link to={candidate.href}>
                        Read model guide
                        <ArrowRight className="size-4" />
                      </Link>
                    )}
                    <Link to="/ai-toolkit" onClick={() => chooseModel(candidate.modelId)}>
                      Try {candidate.name}
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="seo-method">
        <div className="model-page-shell">
          <div className="model-section-heading model-section-heading-left">
            <span>Fair test method</span>
            <h2>How to compare AI image models</h2>
          </div>
          <ol className="seo-method-grid">
            {page.criteria.map((criterion, index) => (
              <li key={criterion.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{criterion.title}</h3>
                <p>{criterion.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="seo-scenarios">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Scenario by scenario</span>
            <h2>What should you use?</h2>
          </div>
          <div className="seo-scenario-list">
            {page.scenarios.map(scenario => (
              <article key={scenario.title}>
                <Check className="size-5" />
                <h3>{scenario.title}</h3>
                <strong>{scenario.recommendation}</strong>
                <p>{scenario.reason}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="model-faq">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Frequently asked</span>
            <h2>Questions about this comparison</h2>
          </div>
          <div className="model-faq-cards">
            {page.faqs.map((faq, index) => (
              <article key={faq.question}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="seo-related">
        <div className="model-page-shell">
          <div className="model-section-heading model-section-heading-left">
            <span>Keep exploring</span>
            <h2>Related model and prompt guides</h2>
          </div>
          <div className="model-related-grid">
            {page.relatedLinks.map(link => (
              <Link key={link.href} to={link.href}>
                <Sparkles className="size-5" />
                <h3>{link.label}</h3>
                <p>{link.description}</p>
                <ArrowRight className="size-5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="model-final-cta">
        <div className="model-page-shell">
          <div className="model-final-cta-card">
            <span>SAME BRIEF, DIFFERENT MODELS</span>
            <h2>Run your own comparison.</h2>
            <p>
              Keep the prompt and references together, switch models, and judge the outputs against
              the same constraints.
            </p>
            <Link to="/ai-toolkit" className="model-button model-button-primary">
              Open AI Toolkit
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}
