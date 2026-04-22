# Stitch Design Prompt: AI Toolkit

## Enhanced Prompt for Stitch

**Overall Vibe, Mood, and Purpose:**
A modern, creative AI image generation playground with an immersive visual experience. The page feels like stepping into an art gallery meets creative studio — inspiring, dynamic, and focused on creativity. The waterfall image background creates a sense of creative abundance and possibility.

---

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first with mobile responsiveness
- Palette:
  - Primary: Luminous Teal-Mint (#00c2b8) — brand accent, active states, primary actions
  - Surface: Pure White (#ffffff) — cards, elevated surfaces
  - Background: Slate-50 (#f8fafc) light / Slate-950 (#020617) dark
  - Text Primary: Slate-900 (#0f172a) light / Slate-50 (#f8fafc) dark
  - Text Secondary: Slate-500 (#64748b)
  - Border: Slate-200 (#e2e8f0) light / Slate-800 (#1e293b) dark
- Styles:
  - Roundness: Generously rounded corners (rounded-2xl for cards, rounded-full for pills/buttons)
  - Shadow/Elevation: Whisper-soft diffused shadows, floating effect for input bar
  - Glassmorphism: Semi-transparent surfaces with backdrop blur for input area
  - Typography: Space Grotesk for headings, Inter for body

---

**PAGE STRUCTURE:**

### 1. Immersive Background
- Full-viewport waterfall/masonry grid of sample AI-generated images
- Images should be semi-transparent or with overlay to not compete with UI
- Subtle parallax or hover effects on background images
- Dark gradient overlay at bottom to smoothly transition to input area

### 2. Fixed Bottom Input Area (The Creative Hub)
- Position: Fixed at bottom center, horizontally centered
- Design: Glassmorphism floating bar with:
  - Backdrop blur (backdrop-blur-xl)
  - Semi-transparent white/dark background
  - Generous rounded corners (rounded-2xl or rounded-full)
  - Soft outer shadow for floating effect
  - Max-width container (max-w-3xl)
- Components:
  - Model selector dropdown (pill-style tabs for: gpt-image-1.5, wan-2.6-image, seedream-5, nano-banna-2)
  - Large text input field with placeholder "Describe your image..."
  - Submit button with brand color, icon (Sparkles or Wand)
- States:
    - Default: Subtle, doesn't dominate
    - Focused: Slight scale-up, enhanced glow
    - Loading: Shimmer animation on submit button

### 3. Optional Top Header (Minimal)
- Transparent/semi-transparent header
- Logo on left
- Simple navigation or settings icon on right
- Should not distract from the immersive background

---

**KEY COMPONENTS:**

| Component | Description |
|-----------|-------------|
| Waterfall Background | CSS grid or masonry layout with 3-4 columns, gap-4, images with rounded-lg and subtle hover scale |
| Gradient Overlay | Linear gradient from transparent to matching background color at bottom 30% |
| Input Bar | Fixed bottom-8, w-full max-w-3xl, mx-auto, glassmorphism effect |
| Model Pills | Horizontal row of rounded-full pills, active state uses brand color |
| Input Field | h-14, bg-transparent, border-none, focus:ring-0, placeholder:text-slate-400 |
| Generate Button | bg-primary-brand, rounded-full, p-3, icon button with Sparkles |

---

**SUGGESTED STITCH PROMPT:**

```
Design an AI image generation playground page with:

1. A full-screen immersive waterfall/masonry grid background showing sample AI-generated images (subtle, semi-transparent to not compete with UI)

2. A fixed-bottom floating glassmorphism input bar (centered horizontally) containing:
   - Model selector as horizontal pill tabs: "gpt-image-1.5", "wan-2.6-image", "seedream-5", "nano-banna-2"
   - Large text input with placeholder "Describe your image..."
   - Submit button with sparkles icon

3. Minimal transparent header at top with logo and settings

DESIGN SYSTEM:
- Brand color: Teal-Mint (#00c2b8)
- Glassmorphism: white/90 dark:bg-slate-900/80 with backdrop-blur-xl
- Generous rounded corners (rounded-2xl, rounded-full)
- Soft floating shadow
- Fonts: Space Grotesk (headings), Inter (body)

The vibe should feel like an art gallery meets creative studio — inspiring, dynamic, and focused on creativity. Make the background images interact subtly on hover.
```
