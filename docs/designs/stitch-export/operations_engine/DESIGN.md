---
name: Operations Engine
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3e4947'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#a6002f'
  on-tertiary: '#ffffff'
  tertiary-container: '#d2093f'
  on-tertiary-container: '#ffe4e4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b6'
  on-tertiary-fixed: '#40000c'
  on-tertiary-fixed-variant: '#920028'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.06em
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style
The design system targets residential operators, regional dispatchers, and property managers handling mission-critical asset stability. It bridges high-density diagnostic telematics with accessible triage execution. The interface evokes rigorous accountability, zero-latency situational awareness, and total algorithmic transparency.

The visual style is characterized by hard-edged precision minimalism. Rejecting frivolous ornamentation and curved buffers, the aesthetic draws inspiration from developer consoles and avionics dispatch software. Sharp borders, monoline typographic markers, high-contrast textual layers, and deterministic structural grids eliminate ambiguity. Automated AI interventions appear under explicit containment protocols, visually signaled through structured data ribbons, auditable verification chips, and distinct state boundaries.

## Colors
The palette leverages a technical light-mode architecture built on stark white, cold-slate structural baselines, and deep navy text. 

- **Primary (`#0f766e`):** Pine Teal establishes operational certainty. It indicates verified states, principal actions, human-approved triggers, and core navigation nodes.
- **Secondary (`#0284c7`):** Precision Sky anchors background processes, active algorithmic triage, diagnostic telemetry, and standard in-progress dispatches.
- **Tertiary (`#e11d48`):** Safety Rose flags critical breaches, urgent plumbing/HVAC hazards, structural liability, and immediate intervention requirements. Paired with an alert amber (`#d97706`) for preventative notices.
- **Neutral (`#0f172a` / `#1e293b`):** Deep Navy anchors technical hierarchy. The background surfaces transition systematically from `#ffffff` (canvas) to `#f8fafc` (slate-50 workspace) and `#f1f5f9` (slate-100 diagnostic grouping).
- **Subtle Boundaries (`#e2e8f0`):** Hairline delineations for strict module containment.

## Typography
The system enforces a dual-typeface structure: **Space Grotesk** governs structural wayfinding, numerical telemetry, property identifiers, and section headers; **Geist** structures body density, operational records, and forms.

- All display headers use tightly-tracked Space Grotesk to emphasize mechanical alignment.
- Numeric data, system runtimes, unit tags, and status labels utilize micro-uppercase variants with elevated letter-spacing (`label-sm`).
- Geist handles long-form maintenance descriptions, contractor quotes, and audit trails to guarantee scanning legibility under emergency conditions.

## Layout & Spacing
A fluid 12-column architectural matrix governs desktop triage screens, compressing to 6 columns on tablet and 4 columns on mobile. 

- **Grid Alignment:** Column gutters are set rigidly to `1rem` (mobile/tablet) and `1.5rem` (desktop). Components adhere to strict exterior boundaries without floating padding bleed.
- **Rhythm & Gaps:** Component interiors favor compact densities (`space-xs` to `space-md`) to ensure critical metrics remain above the viewport fold without scrolling.
- **Data Partitions:** Panels prioritize segmented line rules over whitespace separation. Structural grouping relies on 1px borders aligned to the base unit grid.

## Elevation & Depth
This design system avoids soft, blurred, or skeuomorphic dropshadows. Depth is derived from structural zoning, tonal stepping, and sharp planar overlays.

- **Level 0 (Canvas):** Pure `#ffffff` or structural `#f8fafc` backdrop.
- **Level 1 (Card & Module Shells):** `#ffffff` surfaced panels enclosed by a distinct 1px outline (`#e2e8f0`).
- **Level 2 (Diagnostic Overlays & Flyouts):** Solid white surface flanked by an offset 2px hard border (`#0f172a`), creating zero-radius, architectural contrast.
- **Level 3 (Modal Execution Sheets):** Pure white container layered with an explicit, high-contrast 1px border (`#0f766e` or `#0f172a`) backed by an opaque 40% `#0f172a` backdrop shield without blur.

## Shapes
Every element operates on a strict `0px` radius framework (`roundedness: 0`). 

Buttons, modal dialogs, status badges, avatar boxes, image viewports, and table row groupings feature sharp 90-degree corners. This pure rectangular geometry references blueprint diagrams, hardware telemetry, and precision instruments, ensuring that every interface container feels structurally engineered and permanent.

## Components

### Action Triggers (Buttons)
- **Primary:** Solid `#0f766e` background, crisp `#ffffff` text, 0px border radius, monoline Geist Medium font, 1px solid `#0f766e` stroke. On hover: shifts to `#115e59`.
- **Secondary / Actionable Audit:** Pure `#ffffff` surface, `#0f172a` text, bounded by a 1px `#e2e8f0` stroke. On hover: background shifts to `#f1f5f9` with an `#0f172a` outline.
- **Critical / Emergency:** Solid `#e11d48` background, `#ffffff` text. On hover: `#be123c`.

### Status Indicators & Triage Badges
- Constructed with 0px corner geometry, 1px solid perimeter borders, and dense typography (`label-sm`).
- **Urgent / Safety Flag:** Background `#fff1f2`, text `#e11d48`, border `#fecdd3`.
- **In Progress / Dispatch:** Background `#f0f9ff`, text `#0284c7`, border `#bae6fd`.
- **Resolved / Complete:** Background `#f0fdf4`, text `#15803d`, border `#bbf7d0`.

### Human-in-the-Loop AI Surfaces (Scout AI / Flow AI)
- **AI Identification Ribbon:** A dedicated container using a 1px dashed or distinct solid `#0f766e` border over an ultra-faint `#f0fdfa` background.
- **AI Action Bar:** Integrates an auditable badge (`SCOUT AI: SUGGESTED DISPATCH`) set in Space Grotesk, paired directly with inline editable controls (`[Review Scope]`, `[Override]`, `[Approve]`). Machine suggestions never execute autonomously without distinct visual verification states.

### Data Modules & Cards
- Contained entirely within 1px solid `#e2e8f0` perimeter borders.
- Headers are marked by a baseline divider separating the title and metadata from content rows, eliminating ambiguity between module definitions.

### Inputs & Selectors
- Flat `#ffffff` backgrounds, 1px `#cbd5e1` exterior outlines, 0px corners, and monospaced or Geist body text.
- Focus state instantly activates a 1px continuous `#0f766e` boundary with zero glow or blur.
- Checkboxes and radios are strictly sharp-cornered boxes (radios utilize a centered inset black square when checked).