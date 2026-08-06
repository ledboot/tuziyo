import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import type { Route } from "./+types/_index"
import { translations, useI18n } from "~/lib/i18n"
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
  image: { src: "/showcase/case351.webp", width: 1254, height: 1254 },
  edit: { src: "/showcase/case250.webp", width: 1199, height: 889 },
  poster: { src: "/showcase/case22.webp", width: 1200, height: 960 },
  vertical: { src: "/showcase/case6.webp", width: 1080, height: 1920 },
  concept: { src: "/showcase/case324.webp", width: 1024, height: 1536 },
}

const models = [
  { name: "GPT Image", slug: "openai" },
  { name: "Nano Banana", slug: "google" },
  { name: "Seedance", slug: "bytedance" },
  { name: "Grok", slug: "grok" },
  { name: "Recraft", slug: "recraft" },
]

const galleryImages = [
  showcaseImages.image,
  showcaseImages.poster,
  showcaseImages.edit,
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
      title: home.toolkitTitle,
      description: home.toolkitDesc,
      action: home.toolkitAction,
      to: "/ai/models",
      image: showcaseImages.edit,
    },
  ]

  return (
    <>
      <section className="home-redesign-hero">
        <figure className="home-redesign-hero__media" aria-hidden="true">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={showcaseImages.hero}
            width={1280}
            height={720}
          >
            <source src={showcaseImages.heroVideo} type="video/mp4" />
          </video>
          <img src={showcaseImages.hero} alt="" width={800} height={447} />
        </figure>

        <div className="home-redesign-shell home-redesign-hero__inner">
          <div className="home-redesign-hero__content">
            <h1>{home.heroLead}</h1>
            <p>{home.heroBody}</p>

            <div className="home-redesign-actions">
              <Link to="/ai-toolkit" className="model-button model-button-primary">
                {home.start}
              </Link>
            </div>
            <p className="home-redesign-credit-note">{home.freeCreditNote}</p>
          </div>

          <div className="home-model" aria-label={home.proofAriaLabel}>
            {models.map(model => (
              <span key={model.name}>
                <img
                  src={`https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${model.slug}.svg`}
                  alt=""
                  width={20}
                  height={20}
                />
                {model.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="home-suite" id="suite">
        <div className="home-redesign-shell">
          <div className="home-suite__intro">
            <div>
              <span>Creative workflow</span>
              <h2>{home.generationTitle}</h2>
            </div>
            <p>{home.generationDesc}</p>
          </div>

          <div className="home-suite__grid">
            {featureCards.map(({ title, description, action, to, image }, index) => (
              <Link key={title} to={to} className="home-suite-card">
                <figure>
                  <img
                    src={image.src}
                    alt=""
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </figure>
                <div className="home-suite-card__copy">
                  <small>{action}</small>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
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
          {galleryImages.map(image => (
            <figure key={image.src}>
              <img
                src={image.src}
                alt={home.galleryImageAlt}
                width={image.width}
                height={image.height}
                loading="lazy"
                decoding="async"
              />
            </figure>
          ))}
        </div>
      </section>

      <section className="home-redesign-cta-section">
        <div className="home-redesign-shell">
          <div className="home-redesign-cta">
            <h2>{home.ctaTitle}</h2>
            <p>{home.ctaDesc}</p>
            <Link to="/ai-toolkit" className="model-button model-button-primary">
              {home.register}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
