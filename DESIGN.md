# Design System: tuziyo

## 1. Visual Theme & Atmosphere

**Airy, Minimalist, and Professional** — A clean, spacious interface that feels light and breathable. The design emphasizes clarity and usability with a modern tech-forward aesthetic. Dense tool interfaces coexist with generous whitespace, creating visual rhythm across different page types. The overall mood is trustworthy, efficient, and approachable — a professional SaaS tool that doesn't take itself too seriously.

## 2. Color Palette & Roles

### Primary Brand
- **Luminous Teal-Mint (#00c2b8)** — The signature brand color. Used for primary actions, active states, hover highlights, and key UI accents. Creates a fresh, modern identity that stands out against neutral backgrounds.

### Neutrals (Light Mode)
- **Pure White (#ffffff)** — Primary background, card surfaces
- **Slate-50 (#f8fafc)** — Subtle section backgrounds, hover states
- **Slate-100 (#f1f5f9)** — Canvas patterns, input backgrounds
- **Slate-200 (#e2e8f0)** — Borders, dividers, inactive elements
- **Slate-400 (#94a3b8)** — Placeholder text, disabled states
- **Slate-500 (#64748b)** — Secondary text, descriptions
- **Slate-600 (#475569)** — Body text
- **Slate-700 (#334155)** — Dark mode scrollbar thumb
- **Slate-900 (#0f172a)** — Primary text (dark mode)

### Neutrals (Dark Mode)
- **Slate-950 (#020617)** — Primary dark background
- **Slate-900 (#1a1d23)** — Dark hero pattern background
- **Slate-800 (#1e293b)** — Dark canvas pattern dots
- **Slate-700 (#334155)** — Dark mode borders
- **Slate-400 (#94a3b8)** — Muted text (dark mode)

### Functional Colors
- **Accent Gradient (Linear: #00c2b8 → #74f2ec)** — Progress bars, shimmer animations, scrollbar thumbs (light mode)
- **Accent Gradient Dark (Linear: #00a89f → #008f87)** — Scrollbar thumbs (dark mode hover)
- **Destructive Red (#ef4444)** — Error states, destructive actions
- **Success Green** — Completed states (implied via brand teal)

## 3. Typography Rules

### Font Families
- **Display: Space Grotesk** — Used for headings, logo text, and UI labels that need visual impact. Weights: 300-700.
- **Body: Inter** — Clean, highly legible sans-serif for all body text, descriptions, and form elements.

### Type Scale
- **2xs (0.625rem / 10px)** — Labels, badges, metadata
- **xs (0.75rem / 12px)** — Secondary labels, timestamps
- **sm (0.875rem / 14px)** — Body small, form inputs
- **base (1rem / 16px)** — Body default
- **lg (1.125rem / 18px)** — Subheadings
- **xl (1.25rem / 20px)** — Section titles
- **2xl (1.5rem / 24px)** — Page titles
- **3xl+ (1.875rem+)** — Hero headlines

### Letter Spacing
- **Tight (-0.025em)** — Large headings
- **Normal (0)** — Body text
- **Wide (+0.05em)** — Navigation items
- **Wider (+0.1em)** — Section labels
- **Widest (+0.2em)** — 2xs uppercase labels, badges

### Font Weights
- **300** — Light display text, hero subtitles
- **400** — Body text
- **500** — Emphasis, button text
- **600** — Subheadings, active states
- **700** — Primary headings, logo
- **black (900)** — Pressed button states

## 4. Component Stylings

### Buttons

**Primary Button**
- Background: `#00c2b8` (primary-brand)
- Hover: `#000000` with white text
- Pressed: `#000000` with white text
- Padding: `py-3 px-5`
- Border-radius: `rounded-md` (0.375rem, subtly rounded)
- Font: Space Grotesk, font-bold
- Transition: 200ms ease all properties

**Secondary/Ghost Button**
- Background: transparent
- Hover: `bg-primary-brand/10` with brand text color
- Border: none by default
- Padding: matches primary
- Border-radius: matches primary

**Icon Button**
- Size: `size-10` to `size-12` (40-48px square)
- Background: `bg-slate-100 dark:bg-slate-800`
- Hover: `hover:bg-primary-brand/10`
- Icon color: `text-slate-600 dark:text-slate-400`
- Border-radius: `rounded-lg` or `rounded-full` for toggles

### Cards/Containers

**Standard Card**
- Background: `bg-white dark:bg-slate-900`
- Border: `border border-slate-200 dark:border-slate-800` (light) or `border-0` for elevated
- Border-radius: `rounded-2xl` (1rem, generously rounded)
- Shadow: `shadow-sm` to `shadow-xl` depending on elevation needs
- Padding: `p-6` to `p-8`

**Canvas/Workspace Card**
- Background: `canvas-pattern` (radial dot grid)
- Dot color: `radial-gradient(#e2e8f0 1.5px, transparent 1.5px)` light mode
- Dot color dark: `radial-gradient(#1e293b 1.5px, transparent 1.5px)`
- Dot spacing: 24px grid
- Padding: `p-12` for breathing room

**Modal/Dropdown**
- Background: `bg-white dark:bg-slate-900` with `backdrop-blur-md`
- Border-radius: `rounded-2xl`
- Shadow: `shadow-2xl` for prominence
- Enter animation: `animate-in fade-in slide-in-from-top-2`

### Inputs/Forms

**Text Input**
- Background: `bg-slate-50 dark:bg-slate-800`
- Border: `border-slate-100 dark:border-slate-700`
- Border-radius: `rounded-2xl` (generous)
- Height: `h-14` (56px) for comfortable touch targets
- Padding: `px-5`
- Focus ring: `focus:ring-4 focus:ring-primary-brand/10`
- Focus border: `focus:border-primary-brand`

**Range Slider**
- Track: `h-2 bg-slate-200 dark:bg-slate-800 rounded-lg`
- Thumb: `accent-primary-brand` (teal accent)
- Width: `flex-1`

**Select/Dropdown**
- Same styling as text input
- Icon: `ChevronsUpDown` size-4, positioned absolute right-5
- Appearance: `appearance-none` for custom styling

**Checkbox/Toggle**
- Border-radius: `rounded-full` for toggle
- Active color: `bg-primary-brand`

### Navigation

**Header**
- Background: `bg-white/80 dark:bg-slate-900/80` with `backdrop-blur-md`
- Border-bottom: `border-b border-gray-200/50 dark:border-gray-800/50`
- Height: `py-4`
- Logo height: `h-10`

**Nav Link**
- Font: Space Grotesk, `text-sm font-bold`
- Default: `text-slate-600 dark:text-slate-400`
- Hover: `hover:text-primary-brand`
- Active: `text-primary-brand`

**Dropdown Menu**
- Trigger: ChevronDown icon with `group-hover:rotate-180` animation
- Panel: `absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48`
- Items: `px-4 py-2.5 text-sm font-bold`
- Active item: `text-primary-brand bg-primary-brand/5`

**Mobile Drawer**
- Width: `w-75 max-w-[85vw]`
- Background: `bg-white dark:bg-slate-950`
- Shadow: `shadow-2xl`
- Enter animation: `animate-in slide-in-from-left duration-300`
- Overlay: `bg-slate-900/60 backdrop-blur-sm`

### Shadows

- **Whisper soft** (`shadow-sm`) — Subtle lift for cards on light backgrounds
- **Medium** (`shadow-xl`) — Elevated cards, preview containers
- **Heavy** (`shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.05)]`) — Sidebar elevation
- **Card lift** (`shadow-[0_48px_80px_-16px_rgba(0,0,0,0.2)]`) — Image preview canvas

### Border Radius

- **Pill** (`rounded-full`) — Toggles, icon-only buttons, badges
- **Generous** (`rounded-2xl`, 1rem) — Cards, modals, large buttons
- **Standard** (`rounded-xl`, 0.75rem) — Form inputs, medium containers
- **Subtle** (`rounded-lg`, 0.5rem) — Small buttons, thumbnails
- **Minimal** (`rounded-md`, 0.375rem) — Compact elements, tags

## 5. Layout Principles

### Grid System
- Max container width: `max-w-7xl` (80rem / 1280px)
- Header padding: `px-6` mobile, `lg:px-12` desktop
- Section padding: `p-8` for sidebars, `p-12` for canvas areas

### Spacing Scale
- **Tight** (4-8px) — Icon-to-text gaps, inline elements
- **Standard** (16-24px) — Component internal padding
- **Relaxed** (32-48px) — Section margins
- **Spacious** (64-96px) — Hero sections, major divisions

### Alignment
- Header: 3-column grid `grid-cols-[1fr_2fr_1fr]` — logo left, nav center, actions right
- Footer: 4-column grid `md:grid-cols-4 lg:grid-cols-6`
- Content: `mx-auto` centered with horizontal padding

### Visual Patterns
- **Hero Pattern**: Radial dot grid with brand color, 24px spacing, 0.5px dots
- **Canvas Pattern**: Subtle radial dots for workspace areas
- **Custom Dashed**: SVG dashed border using brand color for special callouts

### Responsive Strategy
- Mobile-first approach
- Breakpoints: `md:` (768px), `lg:` (1024px+)
- Hidden elements: `md:hidden` for mobile-only components
- Flexible layouts: `flex-1` for growing sections, `shrink-0` for fixed

### Animation & Transitions
- Duration: 200-300ms for micro-interactions
- Easing: `ease` default, `ease-in-out` for complex
- Color transitions: `transition-colors`
- Transform transitions: `transition-all` for hover effects
- Special: `animate-shimmer` for progress, `animate-in` for enter animations

### Dark Mode
- Toggle via `dark:` prefix in Tailwind
- Background shifts: white → slate-950 range
- Text shifts: slate-900 → slate-50 range
- Subtle borders remain for definition
- Brand color (#00c2b8) remains consistent
