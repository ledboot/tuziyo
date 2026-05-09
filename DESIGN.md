# tuziyo - Style Reference

tuziyo is a SaaS product where creators enter prompts, choose models, tune generation options, and produce images or videos. The interface must feel cinematic, focused, and production-ready.

**Theme:** dark

## 1. Visual Theme & Atmosphere

The product should feel like a premium creator platform, not a generic AI dashboard.

- **Mood:** dark, immersive, cinematic, polished, calm, and high-contrast.
- **Surface language:** deep black page backgrounds, translucent charcoal panels, thin low-opacity borders, soft teal glows, and real generated media previews.
- **Primary emotion:** creative momentum. The UI should make users feel they can move from an idea to a finished visual asset quickly.
- **Product focus:** prompts, model selection, generation controls, media previews, subscription value, and creator trust signals.
- **Avoid:** purple-blue AI gradients, decorative blobs, washed-out gray dashboards, light theme pricing tables, oversized explanatory text, and purely abstract hero graphics.

Marketing, workspace, and commercial surfaces may vary in density, but they must share the same dark, cinematic, media-led visual system.

## 2. Color Palette & Roles

Use semantic tokens instead of page-local color decisions. `color-primary` is the visual anchor and must remain consistent across the site.

### Core Tokens

| Token                  | Value                       | Role                                                                                                                             |
| ---------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `color-primary`        | `oklch(71% 0.19 174.5)`     | Main brand color, primary CTAs, generation actions, selected model controls, check icons, stars, and highlighted headline words. |
| `color-primary-hex`    | `#20d5d2`                   | Hex fallback for tools that cannot consume OKLCH. Keep OKLCH as the source of truth in CSS.                                      |
| `color-primary-soft`   | `#6df3ee`                   | Hover glow, soft gradients, small luminous accents.                                                                              |
| `color-bg`             | `#05090d`                   | Global page background, header, footer, and immersive sections.                                                                  |
| `color-bg-deep`        | `#030608`                   | Deepest background for hero and studio canvas.                                                                                   |
| `color-surface`        | `#0b141a`                   | Cards, subscription plan cards, panels, FAQ rows, and sidebar surfaces.                                                          |
| `color-surface-raised` | `#101c24`                   | Active cards, selected history rows, floating prompt composer, and elevated panels.                                              |
| `color-surface-glass`  | `rgba(12, 24, 31, 0.78)`    | Blurred overlays, floating composer, sticky header, and media controls.                                                          |
| `color-border`         | `rgba(255, 255, 255, 0.08)` | Default card and panel border.                                                                                                   |
| `color-border-strong`  | `rgba(32, 213, 210, 0.55)`  | Recommended plan border, focused input, selected segmented controls.                                                             |
| `color-text`           | `#f5f9fb`                   | Primary text on dark backgrounds.                                                                                                |
| `color-text-muted`     | `#a7b3bd`                   | Body copy, secondary labels, descriptions.                                                                                       |
| `color-text-dim`       | `#667580`                   | Metadata, placeholders, disabled feature text.                                                                                   |
| `color-nav-menu`       | `#8e8d91`                   | Header navigation menu items default state.                                                                                      |
| `color-success`        | `#20d5d2`                   | Positive feature checks and completed states.                                                                                    |
| `color-warning`        | `#f5b85a`                   | Plan badges, upgrade prompts, commercial highlights.                                                                             |
| `color-danger`         | `#ff6b6b`                   | Errors, destructive actions, failed generation states.                                                                           |

### Color Usage Rules

- Use primary teal sparingly. It should mark action, selection, progress, and premium emphasis.
- Keep large areas dark. Do not flood full sections with primary teal except for one deliberate CTA band.
- Use teal text highlights inside major headings, especially for words like creativity, plan, image, or video.
- Recommended commercial states may use teal border glow plus a small warm badge.
- Disabled features should be visibly muted, not hidden.
- Footer, header, hero, commercial, and product surfaces must share the same black-to-charcoal family.

## Typography

### Space Grotesk — Primary typeface for all main content, headings, and UI elements. Its geometric letterforms give tuziyo a precise creator-tool character while still feeling modern and approachable. Weight 600 at 48px headlines creates confident emphasis without making the interface feel heavy; weight 400 at 14px and 16px keeps dense tool surfaces readable. Letter spacing stays at 0 to preserve a clean rhythm across product UI and multilingual content.

- **Substitute:** Inter
- **Weights:** 400, 500, 600
- **Sizes:** 11px, 12px, 14px, 16px, 18px, 20px, 24px, 32px, 40px, 48px, 56px, 64px
- **Line height:** 1.00, 1.10, 1.20, 1.30, 1.40, 1.50, 1.65
- **Letter spacing:** 0
- **OpenType features:** normal

### Inter — Secondary typeface for fallback rendering, long-form support surfaces, and environments where Space Grotesk is unavailable. Its neutral proportions keep dense copy, documentation-style content, and utility labels readable without competing with the primary brand voice.

- **Substitute:** System Sans
- **Weights:** 400, 500, 600
- **Sizes:** 11px, 12px, 14px, 16px, 18px, 20px, 24px
- **Line height:** 1.30, 1.40, 1.50, 1.65
- **Letter spacing:** 0
- **OpenType features:** normal

### Type Scale

| Role        | Size | Weight | Line Height | Letter Spacing |
| ----------- | ---- | ------ | ----------- | -------------- |
| micro-label | 11px | 400    | 1.30        | 0              |
| caption     | 12px | 400    | 1.40        | 0              |
| `body-sm`     | 14px | 400    | 1.50        | 0              |
| `body`        | 16px | 400    | 1.65        | 0              |
| `nav-root`    | 16px | 400    | -           | 0              |
| `nav-submenu` | 14px | 400    | -           | 0              |
| `body-lg`     | 18px | 400    | 1.50        | 0              |
| `subheading`  | 20px | 500    | 1.40        | 0              |
| heading-sm  | 24px | 500    | 1.30        | 0              |
| heading     | 40px | 500    | 1.10        | 0              |
| display     | 48px | 600    | 1.00        | 0              |
| display-lg  | 56px | 600    | 1.00        | 0              |
| display-xl  | 64px | 600    | 1.00        | 0              |

### Typography Behavior

- Keep hero headlines short and confident.
- Use Space Grotesk as the default product typeface, but keep weights restrained so the UI does not feel heavy.
- Avoid `font-bold`, `font-extrabold`, and `font-black`; the default product voice should feel refined, not heavy.
- Use primary teal for one key phrase per hero or page title.
- Keep interface labels compact. Tool controls should read like production software, not marketing copy.
- Do not scale body text with viewport width.
- Do not use negative letter spacing.
- Use weight, size, and opacity consistently; do not invent new type roles inside individual pages.
- Long Chinese or English text must wrap naturally and never overflow buttons, cards, or segmented controls.

## 4. Layout Principles

### Global Page Frame

- Max content width: full viewport width (`100%`).
- Standard horizontal page padding: `px-6` (`1.5rem`) on both desktop and mobile.
- Section spacing: `96px` desktop, `64px` tablet, `48px` mobile.
- Header height: `72px` desktop, `64px` mobile.
- Card radius: `14px` to `18px`.
- Button radius: pill for primary CTAs, `10px` to `12px` for compact tool controls.

### Dark Depth System

Use depth through surface contrast, opacity, blur, borders, and shadows.

- Base page: flat black or near-black.
- Cards: dark charcoal with subtle border.
- Floating panels: glass surface with backdrop blur and stronger shadow.
- Selected states: teal border, teal text, or low-opacity teal fill.
- Hero media: layered images with shadow and slight overlap, never abstract-only.

Recommended shadow patterns:

```css
--shadow-card: 0 18px 50px rgba(0, 0, 0, 0.32);
--shadow-float: 0 28px 90px rgba(0, 0, 0, 0.48);
--shadow-primary: 0 0 32px rgba(32, 213, 210, 0.28);
```

## 5. Navigation & Footer

### Header

The header is sticky, dark, and slightly translucent.

- Left: symbol mark plus `tuziyo` wordmark.
- Center: concise product navigation, centered against the full viewport rather than the remaining space between brand and actions.
- Right: language selector, login, and primary registration CTA.
- Header navigation, dropdown rows, language selector, and account actions use `1rem` text with normal weight.
- Header menu item content must be horizontally centered inside each daisyUI `menu` item.
- Header menu styling should be applied directly with Tailwind and daisyUI classes in the component. Do not add custom `site-nav-*`, `site-dropdown`, or menu-only classes in `app.css`.
- Header menu text is white by default. Hover and active states use darker surfaces for feedback while keeping text white.
- Active nav item: dark glass surface with white text and a subtle white border. Do not use `color-primary` for menu hover or selected states.
- Dropdown triggers should use simple chevrons and retain the same dark surface style.
- Header blur should be subtle. It should feel integrated with the page, not like a separate white SaaS navbar.

### Navigation Dropdowns

Use daisyUI `dropdown` plus `menu` for header navigation, language menus, compact account menus, and mobile navigation.

- Structure: use `dropdown`, `dropdown-content`, `menu`, `menu-sm`, `rounded-box`, `bg-base-200`, and `shadow-2xl` before adding project-specific overrides.
- Position below the trigger with a small visual offset; use padding on `dropdown-content` when a hover-safe gap is needed.
- Surface: `bg-base-200`, `1px` low-opacity white border, `rounded-box`, and a deep black shadow.
- Layout: daisyUI menu stack with a small item gap (`gap-1`) and compact internal padding.
- Items: full-width rows with `0.75rem 0.85rem` padding, white text at reduced opacity, and `400` weight.
- Hover and selected states: white text with a low-opacity white surface. Do not use `color-primary`.
- Use `color-primary` only inside dropdown content when it represents a real product action, not a menu state.

### Footer

The footer should use the same dark surface system as the rest of the product.

- Dark background with brand block on the left.
- Link columns for Product, Resources, Company, and Legal.
- Social icons should sit inside small circular dark buttons.
- Include language selector and copyright row.
- Keep footer typography muted and compact.

## 6. Component Styling

### Buttons

Primary buttons:

- Background: `color-primary`.
- Text: `#031012` or the deepest background token.
- Shape: pill for marketing CTAs, `12px` radius for tool panels.
- Use for: start creating, generate, upgrade, subscribe, register.
- Hover: slightly brighter teal, small lift, soft primary glow.

Secondary buttons:

- Background: dark glass or transparent.
- Border: `color-border` or muted teal border when important.
- Text: `color-text`.
- Hover: surface becomes slightly lighter and border becomes more visible.

Icon buttons:

- Use familiar icons for language, close, upload, play, settings, history, arrows, and social links.
- Minimum hit area: `40px`, preferably `44px`.
- Add accessible labels.

### Cards

Use cards for real content units only: generation tools, subscription plans, gallery items, testimonials, FAQ rows, and media outputs.

- Background: `color-surface` or `color-surface-glass`.
- Border: `1px solid color-border`.
- Radius: `14px` to `18px`.
- Shadows: low black shadow for static cards, stronger shadow for floating panels.
- Hover: small lift, brighter border, reveal arrow or action.
- Do not nest decorative cards inside larger decorative cards.

### Media Cards

Media cards must use actual generated visuals, product screenshots, or useful thumbnails.

- Image cards should have stable aspect ratios.
- Video cards require a play control, duration, or clear motion affordance.
- Layered hero cards can overlap, but alignment must stay intentional.
- Gallery rows should scan quickly with consistent gaps and crop behavior.

### Prompt Composer

The prompt composer is the most important product component.

- Position: floating near the bottom center on desktop.
- Width: `min(920px, calc(100vw - 40px))`.
- Surface: glass dark panel with blur, border, and strong shadow.
- Top area: prompt textarea, model context, reference image affordance, and close action.
- Bottom controls: model selector, aspect ratio, style, output count, quality, advanced settings, negative prompt, and generate button.
- Controls should be compact, segmented, and clear. Avoid long instructional copy.
- The generate button must remain visually dominant even when many controls are visible.

### Forms & Inputs

- Inputs use dark surfaces, thin borders, and muted placeholders.
- Focus state uses primary teal border plus a low glow.
- Selects and segmented controls should preserve fixed dimensions to prevent layout shift.
- Sliders use teal active tracks and compact numeric labels.
- Toggles use teal for enabled states and dim charcoal for disabled states.

### Plan Cards & Comparison Tables

Plan cards should use a clear grid on desktop and stack on mobile.

- Free, Basic, Pro, and Enterprise should have equal card height when possible.
- The recommended plan uses primary teal border, subtle glow, and a small warm badge.
- Price typography should be large, clean, and easy to compare.
- Primary action inside each card should match the plan priority.
- Feature lists use teal checks for included features and muted dashes or crosses for unavailable features.
- The comparison table uses a dark panel with thin row dividers and centered plan values.
- FAQ rows are compact dark panels with chevron controls.
- Commercial CTA bands may use a horizontal teal gradient, but keep the button dark for contrast.

### Testimonials

- Use dark cards, small circular avatars, compact identity text, quote copy, and teal star ratings.
- Keep quote length short.
- Carousel arrows should be small circular dark buttons.

## 7. Do's and Don'ts

### Do's

- Do use the dark tuziyo surface system as the default foundation.
- Do keep `color-primary` reserved for primary actions, generation controls, selected model options, progress, and key highlights.
- Do use real generated media, product screenshots, thumbnails, or output previews when a surface needs visual proof.
- Do keep controls compact, stable, and production-oriented.
- Do use thin borders, soft shadows, glass surfaces, and restrained teal glow to create depth.
- Do maintain full-width layouts with `px-6` horizontal padding.
- Do make dense controls scannable through grouping, segmented controls, icons, and clear hierarchy.
- Do design every component to work in both Chinese and English without text overflow.
- Do keep commercial comparison surfaces dark, structured, and easy to scan.
- Do use accessible labels for icon-only controls.

### Don'ts

- Don't design around a fixed `1280px` centered container.
- Don't use white SaaS dashboards, light pricing tables, or generic pale marketing sections.
- Don't flood entire screens with primary teal.
- Don't use purple-blue AI template gradients, decorative blobs, or abstract-only hero visuals.
- Don't place important product text inside decorative nested cards.
- Don't nest cards inside cards unless the inner element is a real control, modal, or content unit.
- Don't use long explanatory copy inside buttons, chips, narrow cards, or controls.
- Don't let typography scale directly with viewport width.
- Don't use negative letter spacing.
- Don't use `color-primary` for navigation/menu hover or selected states.
- Don't allow controls, cards, tables, or media grids to create horizontal overflow.

## 8. Motion & Interaction

Motion should feel premium and useful.

- Use `180ms` to `260ms` transitions for hover and focus.
- Use subtle lift on cards and buttons: `translateY(-2px)` maximum for standard UI.
- Use low-opacity teal glow on primary actions, generation states, and recommended commercial states.
- Use smooth reveal for dropdowns, FAQ rows, and advanced options.
- Do not animate layout in ways that move controls while the user is typing.
- Respect reduced motion preferences.

## 9. Accessibility & Responsive Rules

- Maintain WCAG AA contrast for all text.
- Interactive elements should be at least `44px` tall on touch devices.
- Every icon-only button must include an accessible label.
- Cards, buttons, and input text must never overflow their containers.
- Mobile navigation should collapse cleanly and preserve the primary registration CTA.
- Plan cards stack in a logical order on mobile.
- The prompt composer should become a bottom sheet or full-width dock on small screens.
- Avoid horizontal overflow, especially in segmented controls and comparison tables.

## 10. Implementation Rules

- Define global design tokens in the shared CSS layer.
- Prefer semantic classes and reusable component variants over one-off styles.
- Use `color-primary: oklch(71% 0.19 174.5)` as the source of truth.
- Use the hex fallback only when the target tool cannot read OKLCH.
- Use `lucide-react` or the existing icon library for standard interface icons.
- Use real media assets or generated preview assets for major visual sections.
- Any new page must reuse the header, footer, buttons, card surfaces, typography scale, and dark token system from this document.
- Major visual changes should include a preview screenshot before delivery.

## 11. Design Checklist

Before shipping a new page or component, confirm:

- It uses the dark tuziyo surface system.
- Primary teal is reserved for primary actions, generation states, and highlights.
- The page includes real product or generated media when visuals are central.
- Buttons and controls have stable dimensions.
- Text wraps cleanly in Chinese and English.
- Cards are not nested decoratively.
- Mobile layouts remain usable without horizontal scrolling.
- The screen feels like the same product as the reference visual system.
