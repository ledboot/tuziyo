import { Link } from "react-router"
import { ArrowRight, Play } from "lucide-react"
import type { Route } from "./+types/_index"
import { translations, useI18n } from "~/lib/i18n"
import { SEOMeta } from "~/components/SeoMeta"
import { createSeoMeta, createWebApplicationSchema } from "~/lib/seo"

export function meta({}: Route.MetaArgs) {
  const seo = translations.en.seo

  return createSeoMeta({
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    path: "/",
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "tuziyo",
        url: "https://tuziyo.com/",
        description: seo.description,
      },
      createWebApplicationSchema({
        name: "tuziyo AI Image & Video Generation Studio",
        description: seo.description,
        path: "/",
      }),
    ],
  })
}

const showcaseImages = {
  hero: "/showcase/case1.avif",
  heroVideo: "/videos/cover-video.mp4",
  image: "/showcase/case351.jpg",
  video: "/showcase/case206.jpg",
  edit: "/showcase/case250.jpg",
  poster: "/showcase/case22.jpg",
  vertical: "/showcase/case6.jpg",
  concept: "/showcase/case324.jpg",
}

const models = [
  { name: "GPT Image", slug: "openai" },
  { name: "Nano Banana", slug: "google" },
  { name: "Seedance", slug: "bytedance" },
  { name: "Grok", slug: "grok" },
  { name: "Recraft", slug: "recraft" },
]

const galleryImages = [
  showcaseImages.hero,
  showcaseImages.image,
  showcaseImages.poster,
  showcaseImages.video,
  showcaseImages.vertical,
  showcaseImages.concept,
]

export default function Index() {
  const { t } = useI18n()
  const home = t.home

  const featureCards = [
    {
      title: home.imageTitle,
      description: home.imageDesc,
      action: home.imageAction,
      to: "/ai-toolkit",
      image: showcaseImages.image,
    },
    {
      title: home.videoTitle,
      description: home.videoDesc,
      action: home.videoAction,
      to: "/ai-toolkit",
      image: showcaseImages.video,
      wide: true,
    },
    {
      title: home.toolkitTitle,
      description: home.toolkitDesc,
      action: t.common.tools,
      to: "/inpainting",
      image: showcaseImages.edit,
    },
  ]

  return (
    <>
      <SEOMeta page="home" />

      <section className="home-redesign-hero">
        <figure className="home-redesign-hero__media" aria-hidden="true">
          <video autoPlay loop muted playsInline preload="metadata" poster={showcaseImages.hero}>
            <source src={showcaseImages.heroVideo} type="video/mp4" />
          </video>
          <img src={showcaseImages.hero} alt="" />
        </figure>

        <div className="home-redesign-shell home-redesign-hero__inner">
          <div className="home-redesign-hero__content">
            <h1>{home.heroLead}</h1>
            <p>{home.heroBody}</p>

            <div className="home-redesign-actions">
              <Link to="/ai-toolkit" className="home-redesign-button home-redesign-button--primary">
                {home.start}
              </Link>
            </div>
          </div>

          <div className="home-model" aria-label={home.proofAriaLabel}>
            {models.map(model => (
              <span key={model.name}>
                <img
                  src={`https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${model.slug}.svg`}
                  alt=""
                />
                {model.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="home-redesign-section" id="suite">
        <div className="home-redesign-shell">
          <div className="home-redesign-section__head home-redesign-section__head--center">
            <h2>{home.generationTitle}</h2>
            <p>{home.generationDesc}</p>
          </div>

          <div className="home-redesign-capabilities">
            {featureCards.map(({ title, description, action, to, image, wide }) => (
              <Link
                key={title}
                to={to}
                className={`home-redesign-capability-card ${
                  wide ? "home-redesign-capability-card--wide" : ""
                }`}
              >
                <img src={image} alt="" />
                <div>
                  <small>{action}</small>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <ArrowRight className="home-redesign-card-arrow size-5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-redesign-section home-redesign-section--studio">
        <div className="home-redesign-shell home-redesign-studio">
          <div className="home-redesign-studio__copy">
            <span>{home.browse}</span>
            <h2>{home.voicesTitle}</h2>
            <p>{home.voicesDesc}</p>
          </div>

          <div className="home-redesign-workflow">
            {home.testimonials.map(([name, role, quote]) => (
              <article key={name}>
                <span>{role}</span>
                <h3>{name}</h3>
                <p>{quote}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-redesign-showcase" id="inspiration">
        <div className="home-redesign-shell">
          <div className="home-redesign-showcase__head">
            <div>
              <h2>{home.galleryTitle}</h2>
              <p>{home.galleryDesc}</p>
            </div>
            <Link to="/ai-toolkit">
              {home.browse}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="home-redesign-gallery">
          {galleryImages.map((src, index) => (
            <figure key={src} className={index === 3 ? "is-wide" : undefined}>
              <img src={src} alt={home.galleryImageAlt} />
              {index === 0 ? (
                <span aria-hidden="true">
                  <Play className="size-5" fill="currentColor" />
                </span>
              ) : null}
            </figure>
          ))}
        </div>
      </section>

      <section className="home-redesign-cta-section">
        <div className="home-redesign-shell">
          <div className="home-redesign-cta">
            <h2>{home.ctaTitle}</h2>
            <p>{home.ctaDesc}</p>
            <Link to="/ai-toolkit" className="home-redesign-button home-redesign-button--primary">
              {home.register}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
