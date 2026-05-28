# Vakil Chambers — Pattang Design System

This is the canonical design language for Pattang. Apply it to every screen, component, and interaction. Do not introduce ad-hoc colors, fonts, or shapes outside this system.

## Design philosophy

Vakil Chambers is a workspace design language for the modern Indian advocate. It draws from the lived sensory world of an Indian court: cream foolscap paper, the black coat and white bands of bar attire, the deep maroon of official seals, the brass of the Ashoka emblem, and the teak of courtroom benches.

The aesthetic is **minimalist and sharp**. Forms are rectilinear, echoing the geometry of court forms, rubber stamps, and bound case files. Curves are used sparingly and only where they serve clarity. Colors stay restrained at rest and come alive on interaction — mirroring how a quiet brief becomes urgent the moment it is picked up.

## Color palette

### Backgrounds
| Token | Hex | Use |
|---|---|---|
| Page | `#FFFFFF` | Primary page background |
| Foolscap cream | `#FAF8F3` | Cards, surfaces, elevated panels (very subtle warm tint) |

### Primary
| Token | Hex | Use |
|---|---|---|
| Bar coat black | `#1A1F2E` | Headings, top nav, primary buttons, formal emphasis |

### Semantic
| Token | Hex | Use |
|---|---|---|
| Sindoor seal | `#4A1818` | Alerts, urgent flags, deadline warnings, notices |
| Court lawn | `#2D4A3E` | Success states, approved filings, granted orders |

### Accent
| Token | Hex | Use |
|---|---|---|
| Ashoka brass | `#B8862F` | Logo, hero CTAs, featured items. Used sparingly. |

### Supporting
| Token | Hex | Use |
|---|---|---|
| Teak bench | `#5A3A1F` | Strong borders, section dividers |
| Ink wash | `#6B6358` | Body text |
| Twine binding | `#8B6F47` | Tags, file labels, category markers |
| Court fee stamp | `#A8956F` | Secondary tags, metadata |

## Typography

- **Serif (formal, editorial)** — petition-style headings, case titles, court names, blockquotes. Primary: **Spectral** or Source Serif 4. Alt: Cormorant Garamond for more classical character.
- **Sans-serif (UI workhorse)** — body UI, form labels, navigation, buttons, data. Primary: **Inter** or IBM Plex Sans. Both render Indic scripts well.
- **Monospace (precision)** — case numbers, citations, statute references, timestamps. Primary: **JetBrains Mono** or IBM Plex Mono.

### Type scale
| Role | Size | Weight | Family |
|---|---|---|---|
| Display | 32px | 500 | Serif |
| H1 | 24px | 500 | Serif |
| H2 | 20px | 500 | Serif |
| H3 | 16px | 600 | Sans |
| Body | 15px | 400 | Sans |
| Small | 13px | 400 | Sans |
| Caption / overline | 11px, 0.5px tracking, UPPERCASE | 500 | Sans |
| Citation / case no. | 13px | 400 | Mono |

Line-height: **1.6** for body, **1.3** for headings.

## Shape language

Sharp over soft. Rectilinear forms with minimal radius.

| Element | Radius |
|---|---|
| Cards, panels | 2px |
| Buttons, inputs | 2px |
| Tags, chips | 2px (not pill-shaped) |
| Avatars, emblems | 0px or full circle (people only) |
| Modals, sheets | 4px max |

Borders are thin and deliberate — **0.5px to 1px, never thicker**. They define structure rather than decorate.

Dividers use **Teak bench at 30% opacity** for soft separation, or full Teak bench at 0.5px for hard section breaks.

**No drop shadows. No gradients.** Elevation is communicated through background contrast (Foolscap cream on Brief paper) and border weight, not depth.

## Interaction — the hover principle

At rest, the interface is quiet. On hover, the relevant element **wakes up**: color saturates, contrast deepens, and the element claims attention.

### Hover behaviors

**Buttons (primary — Bar coat black)**
- Rest: solid `#1A1F2E`, text Foolscap cream
- Hover: background shifts to Sindoor seal `#4A1818`, 180ms ease-out
- Active: Bar coat black with 2px inset Ashoka brass border

**Buttons (secondary — outlined)**
- Rest: 1px Teak bench border, transparent fill, Ink wash text
- Hover: fill becomes Foolscap cream, border + text become Bar coat black, 150ms ease-out

**Cards**
- Rest: Foolscap cream, 0.5px Teak bench at 30%
- Hover: border becomes full Teak bench, 2px left-edge Ashoka brass accent slides in (200ms)

**Navigation links**
- Rest: Ink wash, no underline
- Hover: shifts to Bar coat black, thin Ashoka brass underline (1px, 100ms)
- Active: Bar coat black, persistent brass underline

**Tags & chips**
- Rest: Twine binding @ 20% bg, Twine binding text
- Hover: full Twine binding bg, Foolscap cream text, 150ms

**Urgent indicators**
- Rest: Sindoor seal @ 70%, Foolscap cream text
- Hover: full Sindoor seal, 1px Ashoka brass outline
- A muted pulse (2s loop, 5% opacity osc.) acceptable for critical-only

**Table rows**
- Rest: alternating Brief paper / Foolscap cream
- Hover: Court fee stamp @ 25%, 100ms (snappy)

### Timing
- Quick utility (rows, tags, links): 100–150ms ease-out
- Substantial state (buttons, cards): 150–200ms ease-out
- Page / modal: 250ms ease-out
- **Never** bounce, spring, or elastic. Motion is a stamp pressed onto paper.

## Iconography
- Thin line, squared terminals, 1.5px stroke
- 90° or chamfered corners only — never rounded
- Libraries: Phosphor (Regular) or Tabler Icons, sharpened manually
- Sizes: 16px inline, 20px standalone, 24px in headers
- Color inherits text; brass only for branded marks

## Layout
- 8px baseline grid
- 12-column page grid, 24px gutters
- Generous whitespace. Feel like a well-kept brief, not a crowded notice board
- Max content width: 1240px (dashboards), 720px (reading views)

## Voice & microcopy
Formal but not stiff. Use proper legal terminology where accurate (petitioner, respondent, vakalatnama, cause list) but avoid jargon that excludes. **Sentence case** for everything; no ALL CAPS except short overlines and statute abbreviations (CPC, CrPC, BNS).

## Optional signature flourishes
At most one per screen.
- Small Devanagari glyph (सत् for truth, धर्म for dharma) as watermark / favicon / letterhead mark
- Ashoka chakra rendered minimally (24 spokes, 0.5px stroke, single color) as section break or footer ornament
- An em-dash divider in Ashoka brass for editorial separation within long documents
