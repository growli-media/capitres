# CAPITRES — Design System (Master)

Global source of truth for the storefront. Page code must follow this
file; deviations belong in `design-system/pages/<page>.md`.

## 1. Brand foundation (provenance)

Style: **Exaggerated Minimalism** (oversized type, extreme contrast,
generous negative space) — selected via ui-ux-pro-max design-system run
(variance 7 / motion 7 / density 4) and confirmed against the brand's
own black-and-white wordmark language.

Every color is **extracted from real Capitres assets** (median-cut
quantization over the storefront CDN originals — see
`TODO-ASSETS.md` for the asset manifest):

| Token | Hex | Traced from |
| --- | --- | --- |
| `--color-ink` | `#0B0A09` | Wordmark hero (92% black coverage) |
| `--color-paper` | `#F5F4F6` | Studio backdrop shared by all product photography |
| `--color-studio` | `#ECECEE` | Product-canvas midtone |
| `--color-green` | `#065E37` | "Iraq 80's Heritage" tee print (national green) |
| `--color-terracotta` | `#926149` | "IRAQ 70" retro palette |
| `--color-sand` | `#CBAE96` | "IRAQ 70" highlight |
| `--color-line` | `#E3E2E5` | Storefront hairlines |
| `--color-danger` | `#B3261E` | Functional only (errors, destructive) |

Rules:
- Ink and paper carry the identity; green is *the* accent (CTA hovers,
  progress, success). Terracotta marks sale/urgency only. Never
  introduce new hues.
- Photography sits on `studio` canvases, never pure white, so images
  blend into layout seamlessly.

## 2. Typography

| Role | Family | Notes |
| --- | --- | --- |
| Latin display + body | **Archivo** (variable `wght` + `wdth`) | Display = 800/`font-stretch:125%`/uppercase — echoes the wordmark. Body = 400–600, normal width |
| Arabic + Kurdish display + body | **Noto Sans Arabic** (variable) | One family: body 400–600, display 800 (`--display-weight`) from the same files; full Sorani coverage (ە ۆ ێ ڕ ڵ). A second kufi display face was tried and removed — it cost 162KB at VeryHigh priority and a second swap that destabilised LCP on throttled mobile |

Locale switching happens through CSS variables on `html[lang]` —
components use `.text-display`, `.text-eyebrow`, `font-body` and never
name a family directly. **Arabic script is never letter-spaced,
never uppercased, and display leading rises 0.92 → 1.28** (handled by
the same variables).

The Latin wordmark "CAPITRES" stays Latin in every locale (as on the
garments); force it with `font-family: var(--font-archivo)`.

Scale: display `clamp(2.9rem→8.75rem)` (hero), section H2
`text-4xl→6xl`, body 16px/1.6+, eyebrow 11px/600/tracking `0.22em`
(LTR only).

## 3. Space, layout, radius, elevation

- Container: `.container-x` = max-w-96rem, inline padding
  `clamp(1.25rem, 4vw, 3.5rem)`.
- Vertical rhythm: sections `py-20 md:py-28`; intra-block 4/8-based
  Tailwind steps only.
- **Radius: 0 everywhere** (sharp editorial edges). Exceptions: color
  swatch circles and count badges (`rounded-full`).
- Elevation: none by default; hairline `border-line` separations.
  Only overlays (mega-menu, drawer, zoom) may cast shadow.
- Product imagery: 4:5 (`aspect-[4/5]`) on cards/PDP, 5:4 mega-menu,
  square IG strip.

## 4. Motion

Framer Motion + Lenis smooth scroll; global rhythm ease
`[0.22,1,0.36,1]`.

- Reveal-on-scroll: 0.7s rise+fade, once, 20% viewport margin;
  grids stagger 80ms (`RevealGroup`/`RevealItem`).
- **Above-the-fold hero uses pure CSS `.hero-enter` (90ms stagger)**
  so LCP never waits for hydration — do not wrap hero content in
  JS-gated animation.
- Parallax: `Parallax` (±8–12% drift) and `ParallaxScale` (hero
  1→1.12 scale + fade) only; subtle.
- Micro: buttons 200ms color + `active:scale(0.98)`; cards
  700ms image zoom to 1.05; underlines animate `background-size`
  (direction-aware for RTL).
- Everything respects `prefers-reduced-motion` (Lenis off, reveals
  static, marquee stopped).

## 5. RTL rules (ar, ku)

- `dir="rtl"` set on `<html>`; **only logical properties/classes**
  (`ps/pe`, `ms/me`, `start/end`, `text-start`) — physical
  left/right classes are forbidden outside `rtl:` overrides.
- Directional icons (arrows, breadcrumb carets) get
  `rtl:-scale-x-100`. Globe/cart/plus-minus do not flip.
- Cart drawer docks at `end` (left in RTL) — `translate-x-full
  rtl:-translate-x-full` for the hidden state.
- Marquee reverses via `[dir="rtl"] .marquee-track`.
- Phone numbers force `dir="ltr"` with `text-start`.
- Prices: `formatIQD()` — Eastern digits + `د.ع` for ar/ku,
  `IQD 65,000` for en. Never `Intl` at render time (hydration
  determinism).

## 6. Components

- Buttons: `.btn` + `.btn-ink | .btn-paper | .btn-outline`; min
  height 3rem (44px+); loading state disables + swaps label.
- Forms: visible labels + `*` required marker; errors under fields in
  `--color-danger` with `role="alert"`; validate on submit, focus the
  first invalid field; inputs h-12 (48px), white on paper, ink focus
  border. Semantic `type=`/`autocomplete` everywhere.
- Badges: NEW (ink), SALE (terracotta), SOLD OUT (ink strip on image
  bottom).
- Accordions: native `<details>` with rotating `+`.
- Overlays: scrim `bg-ink/50`+; Escape closes; body scroll locks;
  close button autofocused; `role="dialog" aria-modal` on a `div`.

## 7. Accessibility floor (verified via Lighthouse)

- Text contrast ≥ 4.5:1 — muted text is `ink/60`+ on paper,
  `paper/60`+ on ink. Decorative ghost type lives in CSS
  pseudo-elements, not DOM text.
- Touch targets ≥ 44px (`min-h-11`/`h-12`/`h-13`).
- Focus: 2px `currentColor` outline, 3px offset, never removed.
- Skip link, `aria-label`ed icon buttons, `aria-live` for async
  status, semantic landmarks in both directions.

## 8. Performance budget

- Home LCP < 4s on throttled mobile (currently 3.7s, score 89): hero
  image ≤ 1920px/q60 + `priority`; Arabic fonts `preload:false`
  (zero bytes on /en); all routes SSG except /shop + APIs; CLS 0 via
  static-import image dimensions.
- New pages must not add client JS to the critical path above the
  fold (no hydration-gated hero content).
