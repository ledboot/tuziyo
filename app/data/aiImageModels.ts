export const AI_IMAGE_MODEL_SLUGS = [
  "nano-banana",
  "nano-banana-pro",
  "nano-banana-2",
  "seedream-5-pro",
  "gpt-image-2",
] as const

export type AiImageModelSlug = (typeof AI_IMAGE_MODEL_SLUGS)[number]

export interface ModelImage {
  src: string
  width: number
  height: number
  alt: string
}

export interface PromptBlueprint {
  title: string
  purpose: string
  ratio: string
  prompt: string
}

export interface AiImageModelPage {
  slug: AiImageModelSlug
  modelId: string
  name: string
  provider: string
  eyebrow: string
  title: string
  description: string
  metaDescription: string
  verdict: string
  heroImage: ModelImage
  updatedAt: string
  baseCredits: number
  officialSource?: { label: string; url: string }
  stats: { value: string; label: string }[]
  bestFor: string[]
  watchouts: string[]
  features: { title: string; description: string }[]
  useCases: { title: string; description: string }[]
  promptBlueprints: PromptBlueprint[]
  faqs: { question: string; answer: string }[]
}

export const AI_IMAGE_MODELS: Record<AiImageModelSlug, AiImageModelPage> = {
  "nano-banana": {
    slug: "nano-banana",
    modelId: "google/nano-banana",
    name: "Nano Banana",
    provider: "Google",
    eyebrow: "Fast ideas, faithful edits",
    title: "Create and refine images with Nano Banana",
    description:
      "Turn a prompt or reference image into polished visuals with a fast, approachable model built for everyday creative iteration.",
    metaDescription:
      "Learn where Nano Banana works best, explore practical prompt blueprints, compare its controls, and generate reference-guided AI images in tuziyo.",
    verdict:
      "Choose Nano Banana when fast drafts and conversational image edits matter more than maximum resolution or complex multi-reference production.",
    heroImage: {
      src: "/showcase/case351.jpg",
      width: 1254,
      height: 1254,
      alt: "Warm editorial portrait with flowers used as a Nano Banana prompt reference",
    },
    updatedAt: "2026-07-16",
    baseCredits: 2,
    officialSource: {
      label: "Google Gemini image generation documentation",
      url: "https://ai.google.dev/gemini-api/docs/image-generation",
    },
    stats: [
      { value: "5", label: "reference images" },
      { value: "8", label: "aspect ratios" },
      { value: "2", label: "base credits" },
    ],
    bestFor: ["Quick visual drafts", "Reference-guided edits", "Social and product concepts"],
    watchouts: ["Fixed 1K-class output", "Fewer references than newer models", "Not the best fit for dense layouts"],
    features: [
      { title: "Prompt-to-image creation", description: "Move from a short creative brief to a finished visual without a complicated setup." },
      { title: "Reference-led editing", description: "Guide the result with up to five images when composition, subject, or mood needs a visual anchor." },
      { title: "Automatic framing", description: "Use automatic sizing or choose a familiar square, portrait, landscape, or social-first format." },
      { title: "Low-friction iteration", description: "Explore alternate lighting, backgrounds, and styling while keeping the original idea recognizable." },
    ],
    useCases: [
      { title: "Social creative", description: "Develop covers, posts, and campaign concepts in multiple common formats." },
      { title: "Product scene edits", description: "Place an existing product photo into a cleaner setting before committing to a production shoot." },
      { title: "Concept frames", description: "Translate a written scene into a visual reference for pitches, storyboards, and mood boards." },
    ],
    promptBlueprints: [
      {
        title: "Phone photo to studio product shot",
        purpose: "Reference-image edit",
        ratio: "4:5",
        prompt: "Keep the uploaded bottle's exact shape, cap, label placement, and proportions. Replace only the setting with a warm limestone studio surface, soft daylight from camera left, a restrained shadow, and a pale sand background. Frame it as a premium e-commerce hero photograph with natural material texture. Do not add text, props, or a new logo.",
      },
      {
        title: "Editorial portrait variation",
        purpose: "Fast creative draft",
        ratio: "3:4",
        prompt: "Create an intimate editorial portrait of a ceramic artist in a sunlit workshop, waist-up composition, hands lightly dusted with clay, muted terracotta and cream palette, soft window light, realistic skin texture, 50 mm documentary photography, quiet and candid rather than posed.",
      },
      {
        title: "Seasonal social crop",
        purpose: "Campaign exploration",
        ratio: "1:1",
        prompt: "A playful overhead still life for an early-summer tea campaign: a clear glass, sliced white peach, folded linen, and small green leaves arranged with generous negative space in the upper-right. Natural noon light, crisp but soft-edged shadows, fresh editorial color, no lettering or watermark.",
      },
    ],
    faqs: [
      { question: "What is Nano Banana best for?", answer: "It is a practical everyday choice for quick generation, conversational edits, social assets, product-scene variations, and visual exploration." },
      { question: "Can I use an existing image?", answer: "Yes. tuziyo supports up to five reference images for Nano Banana, making it useful for guided edits and visual continuity." },
      { question: "When should I choose a newer Nano Banana model?", answer: "Choose Nano Banana 2 for broader ratios and resolution controls, or Nano Banana Pro when a complex brief and high-resolution professional asset justify more credits." },
    ],
  },
  "nano-banana-pro": {
    slug: "nano-banana-pro",
    modelId: "google/nano-banana-pro",
    name: "Nano Banana Pro",
    provider: "Google",
    eyebrow: "High-resolution creative control",
    title: "Build production-ready visuals with Nano Banana Pro",
    description:
      "Create considered campaign art, brand scenes, and detailed compositions with high-resolution output and deeper reference control.",
    metaDescription:
      "Explore Nano Banana Pro controls, 4K and multi-reference workflows, production use cases, prompt blueprints, and comparisons in tuziyo.",
    verdict:
      "Choose Nano Banana Pro for complex professional briefs, brand consistency, search-grounded context, and final assets that need up to 4K output.",
    heroImage: {
      src: "/showcase/case22.jpg",
      width: 1200,
      height: 960,
      alt: "Surreal fashion campaign composition used as a Nano Banana Pro prompt reference",
    },
    updatedAt: "2026-07-16",
    baseCredits: 8,
    officialSource: {
      label: "Google Gemini image generation documentation",
      url: "https://ai.google.dev/gemini-api/docs/image-generation",
    },
    stats: [
      { value: "4K", label: "maximum resolution" },
      { value: "14", label: "reference images" },
      { value: "8", label: "base credits" },
    ],
    bestFor: ["Brand and campaign assets", "Complex multi-reference briefs", "High-resolution final artwork"],
    watchouts: ["Higher credit cost", "Over-specified prompts can feel rigid", "Use 4K only when delivery needs it"],
    features: [
      { title: "Studio-resolution output", description: "Choose 1K, 2K, or 4K output to match ideation, publishing, and presentation workflows." },
      { title: "Multi-reference consistency", description: "Use up to fourteen references to communicate a subject, world, palette, and visual language." },
      { title: "Broad format coverage", description: "Create square, portrait, cinematic, editorial, and ultrawide visuals from the same direction." },
      { title: "Search-assisted context", description: "Enable web grounding when the image direction benefits from current or specific real-world context." },
    ],
    useCases: [
      { title: "Brand campaigns", description: "Develop a coherent route across launch art, social crops, and supporting assets." },
      { title: "Editorial artwork", description: "Create detailed hero imagery and expressive illustrations for articles, covers, and features." },
      { title: "Visual development", description: "Keep characters, materials, and locations aligned across a series of concept frames." },
    ],
    promptBlueprints: [
      {
        title: "Premium fragrance key visual",
        purpose: "Multi-reference brand work",
        ratio: "4:5 · 2K",
        prompt: "Use the uploaded bottle and logo as identity references. Preserve the bottle geometry, label spelling, and metallic cap. Create a premium fragrance campaign on dark burgundy stone with one curved sheet of translucent amber glass behind it, precise rim lighting, controlled reflections, and deep negative space. Integrate the supplied logo only on the bottle label; add no other text.",
      },
      {
        title: "Grounded city information poster",
        purpose: "Search-assisted composition",
        ratio: "3:2 · 2K",
        prompt: "Create a clean 45-degree isometric city guide for Kyoto using current seasonal weather context. Include recognizable but uncluttered architectural cues, gentle physically based materials, and soft morning shadows. At the top center place only the title 'KYOTO', a simple weather icon, today's date, and temperature with consistent spacing. Keep every label readable and verify the hierarchy before rendering.",
      },
      {
        title: "Three-frame fashion story",
        purpose: "Editorial art direction",
        ratio: "21:9 · 4K",
        prompt: "Build one continuous three-frame editorial spread featuring the same model and cobalt tailored coat from the references: full-length street portrait, close material detail, and quiet profile. Rain-darkened concrete, silver daylight, realistic skin and fabric, subtle 35 mm grain. Maintain face, garment construction, and color across all panels; leave a clean outer margin and add no typography.",
      },
    ],
    faqs: [
      { question: "How is Nano Banana Pro different from Nano Banana?", answer: "In tuziyo, Pro adds 1K–4K output, more aspect ratios, up to fourteen references, and optional web search for demanding production work." },
      { question: "Is 4K always the best setting?", answer: "No. Use 1K for exploration, 2K for most deliverables, and 4K when viewing size or downstream production genuinely needs the extra detail." },
      { question: "How should I use fourteen references?", answer: "Give each reference a clear job—such as subject identity, product geometry, palette, material, or composition—and say which properties must remain unchanged." },
    ],
  },
  "nano-banana-2": {
    slug: "nano-banana-2",
    modelId: "google/nano-banana-2",
    name: "Nano Banana 2",
    provider: "Google",
    eyebrow: "Speed meets production range",
    title: "Scale visual production with Nano Banana 2",
    description:
      "Generate, edit, and art-direct consistent visuals across unusually flexible formats—from compact drafts to high-resolution final assets.",
    metaDescription:
      "Learn Nano Banana 2's 0.5K–4K workflow, search and thinking controls, best use cases, practical prompts, and model comparisons in tuziyo.",
    verdict:
      "Choose Nano Banana 2 as the flexible all-rounder when you need fast exploration, strong text and world knowledge, unusual ratios, and a path to 4K delivery.",
    heroImage: {
      src: "/showcase/case206.jpg",
      width: 1836,
      height: 857,
      alt: "Wide cinematic landscape used as a Nano Banana 2 panoramic prompt reference",
    },
    updatedAt: "2026-07-16",
    baseCredits: 4,
    officialSource: {
      label: "Google Gemini image generation documentation",
      url: "https://ai.google.dev/gemini-api/docs/image-generation",
    },
    stats: [
      { value: "4K", label: "maximum resolution" },
      { value: "14", label: "reference images" },
      { value: "15", label: "aspect ratios" },
    ],
    bestFor: ["General-purpose production", "Extreme wide or tall formats", "Text-aware visual concepts"],
    watchouts: ["High thinking and 4K cost more time", "Search should serve a real factual need", "Extreme ratios need simple composition"],
    features: [
      { title: "Draft-to-final resolution", description: "Move from compact 0.5K experiments through 1K and 2K to polished 4K deliverables." },
      { title: "Extreme format flexibility", description: "Create everything from tall 1:8 visuals to 8:1 panoramas, alongside standard content ratios." },
      { title: "Reference-rich art direction", description: "Guide characters, objects, environments, and style with up to fourteen visual references." },
      { title: "Adjustable reasoning", description: "Choose automatic, minimal, or high thinking to balance iteration speed and a demanding direction." },
    ],
    useCases: [
      { title: "Campaign variations", description: "Expand one creative route into platform-ready compositions without losing the core direction." },
      { title: "Storyboard sequences", description: "Explore scenes, camera positions, and production design with recurring visual cues." },
      { title: "Panoramic concepts", description: "Use unusually wide or tall formats for environments, banners, installations, and immersive layouts." },
    ],
    promptBlueprints: [
      {
        title: "Readable magazine cover",
        purpose: "Typography and layout",
        ratio: "3:4 · 2K",
        prompt: "Photograph a glossy independent design magazine standing on a walnut shelf against an apricot plaster wall. The cover is minimal cream with the exact title 'OBJECTS OF SUMMER' in one large black serif line and 'ISSUE 08 — JUL 2026' small in the lower-left. A sculptural red chair overlaps part of the title without hiding any letter. Use realistic print texture, balanced hierarchy, and no other words.",
      },
      {
        title: "Ultra-wide launch world",
        purpose: "Panoramic campaign art",
        ratio: "8:1 · 2K",
        prompt: "An ultra-wide continuous campaign landscape for a lightweight trail shoe, moving from misty pine forest at left through exposed granite ridge to sunrise grassland at right. Keep the uploaded shoe large and geometrically accurate near the center-left, with a believable contact shadow and restrained motion in the laces. Clean premium outdoor art direction, no text, no duplicated product.",
      },
      {
        title: "Consistent storyboard strip",
        purpose: "Multi-scene continuity",
        ratio: "4:1 · 1K",
        prompt: "Create four equal cinematic storyboard frames showing the same red-haired bicycle courier and yellow rain jacket: checking a map under an awning, riding through blue evening rain, arriving at a small bookshop, and handing over a parcel. Preserve face, jacket details, bicycle, weather, and screen direction. Natural urban lighting, realistic anatomy, no captions or panel borders.",
      },
    ],
    faqs: [
      { question: "What makes Nano Banana 2 a strong default?", answer: "Google positions it as the balanced generalist in the family. In tuziyo it combines 0.5K–4K output, fourteen references, search controls, and fifteen ratios." },
      { question: "What does thinking level change?", answer: "It lets you trade faster exploration for more deliberate handling of a complex composition. Start with auto, use min for drafts, and reserve high for difficult briefs." },
      { question: "When is Nano Banana Pro still the better choice?", answer: "Use Pro when the brief prioritizes premium professional control and brand consistency over the broader speed-to-cost balance of Nano Banana 2." },
    ],
  },
  "seedream-5-pro": {
    slug: "seedream-5-pro",
    modelId: "bytedance/seedream-5-pro",
    name: "Seedream 5 Pro",
    provider: "ByteDance",
    eyebrow: "Composed, detailed, campaign-ready",
    title: "Direct polished scenes with Seedream 5 Pro",
    description:
      "Shape commercial imagery and expressive concept art with multi-reference guidance, practical formats, and crisp output controls.",
    metaDescription:
      "Explore Seedream 5 Pro's 1K–2K controls, reference-image workflow, commercial use cases, rewritten prompt blueprints, and comparisons in tuziyo.",
    verdict:
      "Choose Seedream 5 Pro for polished stills, product concepts, portraits, and campaign compositions when 1K or 2K delivery is sufficient.",
    heroImage: {
      src: "/showcase/case6.jpg",
      width: 1080,
      height: 1920,
      alt: "Cinematic neon portrait used as a Seedream 5 Pro lighting prompt reference",
    },
    updatedAt: "2026-07-16",
    baseCredits: 3,
    stats: [
      { value: "2K", label: "maximum resolution" },
      { value: "10", label: "reference images" },
      { value: "3", label: "base credits" },
    ],
    bestFor: ["Commercial stills", "Fashion and portrait concepts", "Cost-aware 1K–2K production"],
    watchouts: ["No 4K setting in tuziyo", "Ten-reference maximum", "No search control in the current UI"],
    features: [
      { title: "Reference-guided generation", description: "Bring up to ten visual references into a scene to communicate a clearer creative target." },
      { title: "Publishing-ready formats", description: "Select common editorial, product, social, cinematic, and ultrawide aspect ratios." },
      { title: "Resolution control", description: "Use 1K for fast ideation or step up to 2K when the result is ready for closer viewing." },
      { title: "Flexible delivery", description: "Export PNG when clean image data matters or JPEG when a lighter delivery format makes sense." },
    ],
    useCases: [
      { title: "Commercial key art", description: "Build art-directed hero scenes for product launches, campaigns, and creative pitches." },
      { title: "Fashion and portrait concepts", description: "Explore wardrobe, setting, framing, and editorial mood before a production day." },
      { title: "Content series", description: "Develop a recognizable visual world across square, portrait, landscape, and widescreen assets." },
    ],
    promptBlueprints: [
      {
        title: "Reflective skincare still life",
        purpose: "Commercial product image",
        ratio: "4:5 · 2K",
        prompt: "A precise commercial still life of a frosted skincare jar on a shallow mirror of water, surrounded by three translucent gel forms and one pale green leaf. Cool overhead softbox with a narrow warm rim, controlled reflections, realistic glass and condensation, centered but not static, luxury editorial finish. Keep the uploaded package proportions and label unchanged; no added text.",
      },
      {
        title: "Neon editorial portrait",
        purpose: "Fashion concept",
        ratio: "9:16 · 2K",
        prompt: "Full-length night portrait of an androgynous dancer beneath a narrow cyan shop light, wet pavement reflecting a restrained coral sign outside frame, tailored charcoal clothing moving in the wind, authentic skin and fabric detail, 35 mm street-fashion photography, slight grain, deep blacks with preserved shadow detail, no visible brand names.",
      },
      {
        title: "Graphic food campaign",
        purpose: "Social content series",
        ratio: "1:1 · 1K",
        prompt: "A graphic overhead campaign image of one blood orange cut cleanly in half on matte ultramarine paper, a single stainless dessert spoon crossing the lower edge, hard late-afternoon shadow at 30 degrees, saturated complementary color, precise negative space for later copy, tactile paper fibers, no text and no extra fruit.",
      },
    ],
    faqs: [
      { question: "What does Seedream 5 Pro support in tuziyo?", answer: "The current integration supports text and up to ten reference images, eleven aspect-ratio choices, 1K or 2K output, and PNG or JPEG delivery." },
      { question: "Should I use 1K or 2K?", answer: "Use 1K to explore art direction and 2K for a selected image that needs closer review or publishing. The higher setting uses more credits." },
      { question: "How does it compare with GPT Image 2?", answer: "Seedream 5 Pro has a lower starting credit cost and a focused 1K–2K workflow; GPT Image 2 supports longer briefs, more references, more output sizes, and up to five results per run." },
    ],
  },
  "gpt-image-2": {
    slug: "gpt-image-2",
    modelId: "openai/gpt-image-2",
    name: "GPT Image 2",
    provider: "OpenAI",
    eyebrow: "Deep prompting, precise visual direction",
    title: "Turn detailed briefs into images with GPT Image 2",
    description:
      "Give complex visual instructions room to breathe with long-form prompting, extensive reference input, flexible quality, and production-scale output.",
    metaDescription:
      "Learn GPT Image 2's long-prompt, 16-reference and 1K–4K workflow, explore practical prompt blueprints, use cases, and comparisons in tuziyo.",
    verdict:
      "Choose GPT Image 2 when the job depends on a detailed brief, many visual inputs, flexible quality, or several candidates generated from one setup.",
    heroImage: {
      src: "/showcase/case324.jpg",
      width: 1024,
      height: 1536,
      alt: "Detailed science-fiction character artwork used as a GPT Image 2 prompt reference",
    },
    updatedAt: "2026-07-16",
    baseCredits: 5,
    officialSource: {
      label: "OpenAI GPT Image 2 model documentation",
      url: "https://developers.openai.com/api/docs/models/gpt-image-2",
    },
    stats: [
      { value: "4K", label: "maximum resolution" },
      { value: "16", label: "reference images" },
      { value: "5", label: "images per run" },
    ],
    bestFor: ["Detailed creative briefs", "Multi-image compositing direction", "Batch concept exploration"],
    watchouts: ["High quality costs more credits", "Long prompts still need clear priorities", "Reference roles should be explicit"],
    features: [
      { title: "Long-form creative briefs", description: "Use detailed prompts to describe subjects, materials, text, layout, lighting, and production intent." },
      { title: "Extensive visual context", description: "Guide the generation with up to sixteen images when the brief depends on multiple visual cues." },
      { title: "Quality and resolution controls", description: "Choose low, medium, or high quality and output from 1K through 4K for the job at hand." },
      { title: "Batch exploration", description: "Request up to five images in one run to compare creative directions without rebuilding the setup." },
    ],
    useCases: [
      { title: "Layout-aware creative", description: "Describe structured advertising compositions, cover concepts, and content hierarchy in detail." },
      { title: "Product visualization", description: "Develop variations around materials, environments, camera direction, and presentation style." },
      { title: "High-detail concept art", description: "Turn a nuanced world, character, or cinematic brief into multiple visual candidates." },
    ],
    promptBlueprints: [
      {
        title: "Structured launch poster",
        purpose: "Layout-aware advertising",
        ratio: "3:4 · 2K · high",
        prompt: "Create a refined launch poster for a fictional modular desk lamp. The lamp occupies the lower two-thirds on a matte graphite plinth, photographed at a three-quarter angle with one warm pool of light. At top-left set the exact headline 'LIGHT, REARRANGED.' in large white geometric sans serif; below it, smaller, 'MODULAR DESK SYSTEM / 2026'. Preserve ample margins, align both lines to one grid, keep every character readable, and add no other copy or logos.",
      },
      {
        title: "Reference-driven room redesign",
        purpose: "Interior visualization",
        ratio: "16:9 · 2K · high",
        prompt: "Use image 1 as the room geometry and camera reference, image 2 for the oak finish, and image 3 for the textile palette. Redesign only the furnishings as a calm contemporary reading room. Keep windows, walls, floor plan, camera position, and daylight unchanged. Add a low oak shelf, one rust wool chair, a paper floor lamp, and two framed abstract prints with physically plausible scale and shadows. No people and no structural alterations.",
      },
      {
        title: "Character turnaround sheet",
        purpose: "Concept-development batch",
        ratio: "3:2 · 4K · high",
        prompt: "A clean professional character-design sheet for an elderly deep-sea cartographer wearing a weathered navy pressure suit. Show the same person in front, three-quarter, profile, and back views plus three small facial expressions. Preserve age, face shape, suit construction, brass fittings, and color across every view. Neutral warm-gray background, even studio light, fine pencil-and-gouache concept-art finish, no captions, no cropped figures.",
      },
    ],
    faqs: [
      { question: "How many results can GPT Image 2 create per run?", answer: "tuziyo lets you request one to five images, which is useful when comparing several candidates from the same detailed setup." },
      { question: "How should I structure a long prompt?", answer: "State the goal first, then subject, composition, references, lighting, exact text, and invariants. Clear priorities work better than an unstructured list of adjectives." },
      { question: "When should I use high quality or 4K?", answer: "Reserve them for a chosen direction, small details, large delivery size, or downstream production. Medium quality and 1K–2K are usually more efficient for exploration." },
    ],
  },
}

export function isAiImageModelSlug(value: string | undefined): value is AiImageModelSlug {
  return Boolean(value && AI_IMAGE_MODEL_SLUGS.includes(value as AiImageModelSlug))
}
