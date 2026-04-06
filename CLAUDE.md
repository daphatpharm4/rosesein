# ROSE-SEIN — Claude Code Project Context

## Project Overview

ROSE-SEIN is a privacy-first digital companion for breast cancer patients, caregivers, volunteers, and association team members. It combines trusted health information, secure peer support, community interaction, and personal journey management. The experience should feel like a "digital sanctuary" — warm, safe, and human — not a clinical portal.

**Stage**: Foundation in progress (architecture defined, features not yet wired to live data).

## Tech Stack

- **Framework**: Next.js 15.2.4 (App Router, experimental typedRoutes)
- **Language**: TypeScript 5.8.2, React 19
- **Styling**: Tailwind CSS 3.4.17 with custom design tokens (no shadcn or UI library)
- **Backend**: Supabase (PostgreSQL + RLS + SSR auth via `@supabase/ssr`)
- **Icons**: Lucide React
- **Fonts**: Plus Jakarta Sans (headlines/labels) + Be Vietnam Pro (body)
- **Hosting**: Vercel

## Design System

### Color Palette
- **Primary**: `#b2254f` (warm rose) — brand anchor, CTAs, gradient start
- **Primary container**: `#fc5e84` — gradient end
- **Primary gradient**: `linear-gradient(135deg, #b2254f 0%, #fc5e84 100%)`
- **Secondary**: `#576068` (muted gray-blue) / container `#dbe4ed`
- **Tertiary**: `#8a4d5b` (muted burgundy)
- **Surface**: `#f8f9fa` — page background
- **On-surface**: `#2d3335` — primary text
- **On-surface-variant**: `#5a6062` — secondary text

### Typography
- **Headline font**: Plus Jakarta Sans (weights: 400–800), letter-spacing: `-0.03em`
- **Body font**: Be Vietnam Pro (weights: 400–700)
- **Eyebrow labels**: uppercase, `tracking-[0.18em]`, primary color

### Spacing & Shape
- **Border-radius**: `brand` (1rem), `brand-md` (1.5rem), `brand-xl` (3rem)
- **Shadow**: `ambient: 0 8px 24px rgba(45, 51, 53, 0.04)` — soft depth only
- **Focus ring**: `box-shadow: 0 0 0 3px rgba(178, 37, 79, 0.15)` — no outline

### Component Patterns
- `.glass-panel` — `backdrop-blur(18px)` frosted glass (used in bottom nav)
- `.surface-section` — `rounded-brand-xl` container with tonal background
- `.surface-card` — white card with ambient shadow
- **No hard dividers** — tonal separation only
- **No arbitrary borders** — hierarchy via color weight and spacing

---

## Design Context

### Users
Breast cancer patients navigating treatment, caregivers supporting them, volunteers offering peer support, and association staff managing content and moderation. Users access the app in emotionally vulnerable moments — often on mobile, fatigued, sometimes cognitively overloaded. The interface must reduce friction and never increase anxiety.

### Brand Personality
**Gentle, Hopeful, Human**

The brand is warm and emotionally present — not clinical, not wellness-generic, not corporate. It has its own editorial warmth that feels like a trusted friend who also happens to be competent. Rose is the color of the ribbon, of softness, of care.

### Emotional Goals
**Supported & held.** Users should never feel alone. Every interaction should signal human presence, community warmth, and care over efficiency. The app's role is to hold the user — not to perform productivity or wellness optimization.

### Aesthetic Direction
- **Not** like Calm/Headspace (too generic wellness)
- **Not** like Notion/Linear (too corporate/productivity)
- **Own direction**: Editorial warmth — soft rose palette, generous whitespace, tonal hierarchy without hard borders, gentle depth, typographic confidence
- Gradients used sparingly and only for primary emphasis (never decorative)
- Light mode only (for now)
- Organic feel with structured clarity

### Design Principles
1. **Warmth before efficiency** — Emotional comfort takes precedence over information density or speed. Never rush the user.
2. **Tonal hierarchy** — Separate content regions through color weight and spacing, never borders or hard lines.
3. **Human presence** — Avatars, names, and community signals remind users they are supported by real people.
4. **Accessibility as care** — WCAG AA minimum, reduced motion support, large-text legibility, and bilingual (French + English) — accessibility is an expression of the brand's values, not a compliance checkbox.
5. **Editorial confidence** — Typography is the primary design tool. Headlines are bold and generous; body text is warm and readable. Let type carry the experience.

### Accessibility Requirements
- **WCAG AA** minimum contrast ratios throughout
- **Reduced motion**: Respect `prefers-reduced-motion` — no autoplay animations, transitions should be functional not decorative
- **Large text / low vision**: Ensure readability at 150–200% font size; avoid relying on small text for critical information
- **Bilingual**: French (primary) and English — use `lang` attributes correctly, avoid hardcoded strings

### Language
French is the primary language. English support is required. All UI components must support bilingual content — no hardcoded French-only strings in components.
