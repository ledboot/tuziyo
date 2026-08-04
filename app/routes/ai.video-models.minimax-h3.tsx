import { ArrowRight, Check, Film, Images, Music2 } from "lucide-react"
import { Link } from "react-router"
import type { Route } from "./+types/ai.video-models.minimax-h3"
import { createSeoMeta, SITE_ORIGIN } from "~/lib/seo"
import { useModelStore } from "~/stores/modelStore"

const PAGE_PATH = "/ai/video-models/minimax-h3"
const UPDATED_AT = "2026-08-04"

const promptExamples = [
  {
    title: "Cinematic product reveal",
    mode: "Text-to-Video",
    ratio: "16:9 · 6s",
    prompt:
      "A brushed-aluminum wristwatch rests on a dark stone pedestal in a quiet gallery. A narrow beam of morning light travels slowly across the dial while the camera makes a controlled half-circle dolly from left to right. Fine dust catches the light, the second hand moves naturally, and the background remains minimal. Premium cinematic product photography, realistic materials, restrained contrast, no text or logo changes.",
  },
  {
    title: "First-and-last-frame transition",
    mode: "Image-to-Video",
    ratio: "9:16 · 8s",
    prompt:
      "Begin exactly from the first frame. The woman turns toward the open train door as wind lifts the edge of her coat; the camera follows with a smooth handheld push forward. Outside, the platform lights stretch into soft motion trails. Transition naturally toward the supplied last frame while preserving her face, clothing, train geometry, and direction of movement. Realistic body motion and continuous lighting.",
  },
  {
    title: "Character and motion reference",
    mode: "Reference-to-Video",
    ratio: "21:9 · 10s",
    prompt:
      "Use Image 1 as the exact character and wardrobe reference. Follow the running rhythm, camera distance, and lateral tracking movement from Video 1, but place the action on a rain-soaked elevated walkway above a futuristic city at blue hour. Keep the character recognizable in every shot, preserve realistic foot contact and coat motion, and time the main turn to the strongest beat in Audio 1. Cinematic ultrawide framing, no captions.",
  },
  {
    title: "Atmospheric environment loop",
    mode: "Text-to-Video",
    ratio: "1:1 · 5s",
    prompt:
      "A small glass greenhouse stands alone in a misty alpine meadow before sunrise. Warm practical lights glow inside while condensation slowly runs down the panes and tall grass moves in a gentle circular breeze. The camera holds a nearly static composition with a subtle forward drift. Calm, photorealistic, soft volumetric fog, natural color, seamless visual rhythm, no people and no lettering.",
  },
]

const faqs = [
  {
    question: "Is MiniMax H3 the same as Hailuo 3 or Hailuo 03?",
    answer:
      "Yes. H3 is the API model name used for the new Hailuo 3 generation, which is also written as Hailuo 03 on some release and product pages. This guide uses H3 for the API and Hailuo 3 for the product name.",
  },
  {
    question: "What is MiniMax H3?",
    answer:
      "MiniMax H3 is a video generation model available through separate text-to-video, image-to-video, and multimodal reference-to-video routes.",
  },
  {
    question: "What are the H3 API model IDs?",
    answer:
      "The three EvoLink routes are minimax-h3-text-to-video, minimax-h3-image-to-video, and minimax-h3-reference-to-video. tuziyo selects the appropriate route from the media you attach.",
  },
  {
    question: "How much does H3 video generation cost?",
    answer:
      "In tuziyo, H3 starts at 6 Credits per output second. Reference-video seconds are also billable, while reference images and audio use the attachment Credit rules shown before generation.",
  },
  {
    question: "How long can an H3 video be?",
    answer:
      "The current API accepts integer durations from 4 through 15 seconds and currently outputs at the fixed 2K quality tier.",
  },
  {
    question: "What reference files can H3 use?",
    answer:
      "Reference-to-video supports up to 9 images, 3 videos, and 3 audio clips, with no more than 12 reference files in one request. Audio may be used as the only reference.",
  },
  {
    question: "How should references be named in the prompt?",
    answer:
      "Refer to assets as Image 1, Image 2, Video 1, or Audio 1 according to their order. H3 does not use Seedance-style @image1 tags.",
  },
]

export function meta({}: Route.MetaArgs) {
  const title = "MiniMax H3 (Hailuo 3) AI Video Generator & Prompts | tuziyo"
  const description =
    "Create 2K videos with MiniMax H3, also called Hailuo 3. Explore its API, pricing, text-to-video, image-to-video, references, and prompt examples."

  return createSeoMeta({
    title,
    description,
    path: PAGE_PATH,
    socialImage: "/showcase/case324.jpg",
    socialImageAlt: "Cinematic visual reference for a MiniMax H3 video prompt guide",
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "MiniMax H3 (Hailuo 3) AI Video Generator Guide",
        description,
        url: `${SITE_ORIGIN}${PAGE_PATH}`,
        dateModified: UPDATED_AT,
        isPartOf: { "@type": "WebSite", name: "tuziyo", url: `${SITE_ORIGIN}/` },
        about: {
          "@type": "SoftwareApplication",
          name: "MiniMax H3 (Hailuo 3)",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Web",
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
            {
              "@type": "ListItem",
              position: 2,
              name: "MiniMax H3",
              item: `${SITE_ORIGIN}${PAGE_PATH}`,
            },
          ],
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(faq => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  })
}

export default function MiniMaxH3Page() {
  const setUserSelectedModel = useModelStore(state => state.setUserSelectedModel)
  const setUserMediaType = useModelStore(state => state.setUserMediaType)
  const selectMiniMaxH3 = () => {
    setUserMediaType("video")
    setUserSelectedModel("minimax/minimax-h3")
  }

  return (
    <article className="model-page">
      <section className="model-hero">
        <div className="model-page-shell">
          <nav className="model-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span>/</span><span>AI Video Models</span><span>/</span><span>MiniMax H3</span>
          </nav>
          <div className="model-hero-grid">
            <div className="model-hero-copy">
              <span className="model-kicker">MINIMAX H3 · HAILUO 3 · HAILUO 03</span>
              <h1>MiniMax H3 (Hailuo 3) AI video generator</h1>
              <p>
                Create a 4–15 second 2K video from text, first and last frames, or mixed image,
                video, and audio references with the MiniMax H3 API workflow.
              </p>
              <div className="model-actions">
                <Link to="/ai-toolkit" onClick={selectMiniMaxH3} className="model-button model-button-primary">
                  Generate with H3<ArrowRight className="size-4" />
                </Link>
                <a href="#prompts" className="model-button model-button-secondary">View prompt examples</a>
              </div>
            </div>
            <div className="model-hero-art" aria-label="Cinematic storyboard reference">
              <div className="model-hero-number">H3</div>
              <img
                src="/showcase/case324.jpg"
                width="1024"
                height="1536"
                alt="Cinematic visual reference illustrating a MiniMax H3 prompt direction"
                fetchPriority="high"
              />
            </div>
          </div>
          <dl className="model-stats">
            <div><dt>2K</dt><dd>current output tier</dd></div>
            <div><dt>4–15s</dt><dd>integer duration range</dd></div>
            <div><dt>3</dt><dd>generation modes</dd></div>
          </dl>
        </div>
      </section>

      <section className="model-overview-section">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Model overview</span>
            <h2>MiniMax H3 API modes for text, frames, and references</h2>
            <p>
              The model exposes separate routes for prompt-only generation, frame-controlled
              animation, and multimodal reference work. tuziyo selects the route from the inputs you add.
            </p>
          </div>
          <div className="model-feature-grid">
            <article><Film className="size-6" /><h3>Text-to-Video</h3><p>Describe the subject, action, camera movement, setting, lighting, and mood without attaching media.</p><Check className="model-feature-check size-5" /></article>
            <article><Images className="size-6" /><h3>Image-to-Video</h3><p>Animate a first frame, a last frame, or both. The output ratio adapts to the supplied frame.</p><Check className="model-feature-check size-5" /></article>
            <article><Music2 className="size-6" /><h3>Reference-to-Video</h3><p>Combine images, motion clips, and audio timing. Refer to them as Image 1, Video 1, and Audio 1.</p><Check className="model-feature-check size-5" /></article>
          </div>
        </div>
      </section>

      <section className="model-use-cases">
        <div className="model-page-shell model-use-cases-grid">
          <div className="model-section-heading model-section-heading-left">
            <span>Search and model names</span>
            <h2>MiniMax H3, Hailuo 3, and Hailuo 03 explained</h2>
            <p>
              These names describe the same new MiniMax video generation family. The product name
              appears as Hailuo 3 or Hailuo 03, while the callable EvoLink routes use the H3 name.
            </p>
          </div>
          <div className="model-use-case-list">
            <article><span>01</span><div><h3>API name: MiniMax H3</h3><p>Use this name when looking for API parameters, model IDs, input limits, pricing, and integration guidance.</p></div></article>
            <article><span>02</span><div><h3>Hailuo 3 / Hailuo 03</h3><p>Use these product-name variants when researching the release, creative examples, and the broader Hailuo AI video model family.</p></div></article>
            <article><span>03</span><div><h3>H3 video generator</h3><p>Use the generator workflow when you want to create a clip directly rather than integrate the API into another product.</p></div></article>
          </div>
        </div>
      </section>

      <section className="model-prompts" id="prompts">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Prompt examples</span>
            <h2>MiniMax H3 and Hailuo 3 prompt examples</h2>
            <p>
              A useful video prompt connects subject, action, camera, timing, environment, and visual
              finish. For reference mode, name each asset exactly by its numbered API role.
            </p>
          </div>
          <div className="model-prompt-grid">
            {promptExamples.map((example, index) => (
              <article key={example.title}>
                <div className="model-prompt-meta"><span>{String(index + 1).padStart(2, "0")}</span><span>{example.mode}</span><span>{example.ratio}</span></div>
                <h3>{example.title}</h3>
                <p>{example.prompt}</p>
                <Link to="/ai-toolkit" onClick={selectMiniMaxH3}>Try this prompt<ArrowRight className="size-4" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="model-workflow">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>Prompt structure</span>
            <h2>Write the shot in three passes</h2>
          </div>
          <ol className="model-steps">
            <li><span>01</span><div><h3>Anchor the subject and action</h3><p>State who or what appears, what changes during the clip, and which details must remain consistent.</p></div></li>
            <li><span>02</span><div><h3>Direct camera and timing</h3><p>Specify framing, camera movement, pace, and the moment when the main action should happen.</p></div></li>
            <li><span>03</span><div><h3>Finish the visual language</h3><p>Add environment, lighting, texture, realism, and exclusions that materially affect the final shot.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="model-faq" id="faq">
        <div className="model-page-shell">
          <div className="model-section-heading">
            <span>H3 FAQ</span>
            <h2>MiniMax H3 API, pricing, prompts, and limits</h2>
          </div>
          <div className="model-faq-cards">
            {faqs.map((faq, index) => (
              <article key={faq.question}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
          <div className="model-source-note">
            <span>Reviewed {UPDATED_AT}</span>
            <span>Capabilities reflect the current EvoLink H3 API contract.</span>
            <a href="https://evolink.ai/docs/en/api-manual/video-series/minimax/minimax-h3/minimax-h3-overview" target="_blank" rel="noreferrer">MiniMax H3 API documentation</a>
          </div>
        </div>
      </section>

      <section className="model-final-cta">
        <div className="model-page-shell">
          <div className="model-final-cta-card">
            <span>FROM DIRECTION TO MOTION</span>
            <h2>Build your next shot with H3.</h2>
            <p>Choose a prompt-only, frame-guided, or multimodal reference workflow and see the Credit estimate before generating.</p>
            <Link to="/ai-toolkit" onClick={selectMiniMaxH3} className="model-button model-button-primary">Start generating<ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>
    </article>
  )
}
