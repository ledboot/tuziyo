import { Link } from "react-router"
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Film,
  Grid2X2,
  Image,
  Maximize2,
  PenTool,
  Play,
  RefreshCcw,
  Scissors,
  Sparkles,
  Star,
} from "lucide-react"
import type { Route } from "./+types/_index"
import { translations, useI18n } from "~/lib/i18n"
import { SEOMeta } from "~/components/SeoMeta"

export function meta({}: Route.MetaArgs) {
  const seo = translations.en.seo

  return [
    { title: seo.title },
    {
      name: "description",
      content: seo.description,
    },
    {
      name: "keywords",
      content: seo.keywords,
    },
    { property: "og:title", content: seo.title },
    {
      property: "og:description",
      content: seo.description,
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://tuziyo.com" },
    { property: "og:image", content: "https://tuziyo.com/og-index.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: seo.title },
    {
      name: "twitter:description",
      content: seo.description,
    },
    { name: "twitter:image", content: "https://tuziyo.com/og-index.png" },
    { name: "robots", content: "index, follow" },
  ]
}

const images = {
  castle:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=82",
  portrait:
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=82",
  city: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=82",
  astronaut:
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=82",
  glass:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=82",
  lake: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=82",
  robot:
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=82",
  moon: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=82",
}

const toolIcons = [Maximize2, RefreshCcw, PenTool, Grid2X2]
const galleryImages = [
  images.portrait,
  images.lake,
  images.robot,
  images.city,
  images.moon,
  images.castle,
]

export default function Index() {
  const { t } = useI18n()
  const home = t.home

  return (
    <>
      <SEOMeta page="home" />

      <section className="home-hero">
        <div className="home-shell home-hero__inner">
          <div className="home-hero__copy">
            <h1>
              {home.heroLead}
              <span>{home.heroAccent}</span>
            </h1>
            <p>{home.heroBody}</p>

            <div className="home-hero__actions">
              <Link to="/ai-toolkit" className="home-button home-button--primary">
                {home.start}
                <ArrowRight className="size-4" />
              </Link>
              <a href="#inspiration" className="home-button home-button--dark">
                {home.explore}
              </a>
            </div>

            <div className="home-proof" aria-label={home.proofAriaLabel}>
              <div className="home-avatars" aria-hidden="true">
                {["P", "M", "A"].map(initial => (
                  <span key={initial}>{initial}</span>
                ))}
              </div>
              <span>{home.proof}</span>
              <div className="home-proof-tags">
                {home.proofTags.map(item => (
                  <strong key={item}>{item}</strong>
                ))}
              </div>
            </div>
          </div>

          <div className="home-hero__visual" aria-label={home.heroVisualAriaLabel}>
            <div className="home-collage">
              <figure className="home-collage__tile home-collage__tile--wide">
                <img src={images.castle} alt="" />
              </figure>
              <figure className="home-collage__tile home-collage__tile--video">
                <img src={images.city} alt="" />
                <span>
                  <Play className="size-8" fill="currentColor" />
                </span>
              </figure>
              <figure className="home-collage__tile">
                <img src={images.astronaut} alt="" />
              </figure>
              <figure className="home-collage__feature">
                <img src={images.portrait} alt="" />
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-shell">
          <div className="home-section__head">
            <h2>{home.generationTitle}</h2>
            <p>{home.generationDesc}</p>
          </div>

          <div className="generation-grid">
            <article className="generation-card">
              <div className="generation-card__copy">
                <h3>{home.imageTitle}</h3>
                <p>{home.imageDesc}</p>
                <div className="generation-prompt">
                  <span>{home.imagePrompt}</span>
                  <Link to="/ai-toolkit">
                    {home.imageAction}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
              <img src={images.glass} alt="" />
            </article>

            <article className="generation-card">
              <div className="generation-card__copy">
                <h3>{home.videoTitle}</h3>
                <p>{home.videoDesc}</p>
                <div className="generation-prompt">
                  <span>{home.videoPrompt}</span>
                  <Link to="/ai-toolkit">
                    {home.videoAction}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
              <div className="generation-video">
                <img src={images.castle} alt="" />
                <span>
                  <Play className="size-7" fill="currentColor" />
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-shell">
          <div className="home-section__head">
            <h2>{home.toolkitTitle}</h2>
            <p>{home.toolkitDesc}</p>
          </div>

          <div className="tool-grid">
            {home.tools.map(([title, description], index) => {
              const Icon = toolIcons[index]

              return (
                <Link key={title} to="/ai-toolkit" className="tool-card">
                  <Icon className="size-7" />
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                  {index < 3 ? (
                    <img
                      src={[images.lake, images.glass, images.city][index]}
                      alt=""
                      className="tool-card__preview"
                    />
                  ) : (
                    <div className="tool-card__icons" aria-hidden="true">
                      <Camera className="size-5" />
                      <Image className="size-5" />
                      <Scissors className="size-5" />
                      <Film className="size-5" />
                    </div>
                  )}
                  <ArrowRight className="tool-card__arrow size-4" />
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="home-section" id="inspiration">
        <div className="home-shell">
          <div className="home-section__head home-section__head--row">
            <div>
              <h2>{home.galleryTitle}</h2>
              <p>{home.galleryDesc}</p>
            </div>
            <Link to="/ai-toolkit">
              {home.browse}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="gallery-strip">
            {galleryImages.map((src, index) => (
              <figure key={src} className="gallery-card">
                <img src={src} alt={`${home.galleryImageAlt} ${index + 1}`} />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-shell">
          <div className="home-section__head home-section__head--row">
            <div>
              <h2>{home.voicesTitle}</h2>
              <p>{home.voicesDesc}</p>
            </div>
            <div className="testimonial-arrows" aria-hidden="true">
              <span>
                <ArrowLeft className="size-4" />
              </span>
              <span>
                <ArrowRight className="size-4" />
              </span>
            </div>
          </div>

          <div className="testimonial-grid">
            {home.testimonials.map(([name, role, quote], index) => (
              <article key={name} className="testimonial-card">
                <div className="testimonial-card__person">
                  <span>{name.charAt(0)}</span>
                  <div>
                    <strong>{name}</strong>
                    <small>{role}</small>
                  </div>
                </div>
                <p>{quote}</p>
                <div className="home-stars" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <Star key={`${index}-${star}`} className="size-4" fill="currentColor" />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta-section">
        <div className="home-shell">
          <div className="home-cta">
            <div>
              <h2>{home.ctaTitle}</h2>
              <p>{home.ctaDesc}</p>
            </div>
            <Link to="/ai-toolkit" className="home-button home-button--black">
              {home.register}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
