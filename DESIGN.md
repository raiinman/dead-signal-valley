---
name: Dead Signal Valley — Copperlight river route
description: A quiet paper interface around a walkable Copperlight valley.
colors:
  paper: "#f5f0e5"
  ink: "#253f39"
  muted: "#52655b"
  line: "#cdd0bc"
  teal: "#276b62"
  hover: "#e0e3cf"
  pressed: "#d8e1ce"
  night-paper: "#1d302d"
  night-ink: "#f4ead4"
  night-muted: "#bfccb8"
  night-line: "#4c6257"
  night-teal: "#a7d0b7"
  night-hover: "#3d5145"
  night-pressed: "#405d4f"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(38px, 4vw, 58px)"
    fontWeight: 450
    lineHeight: 0.98
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "27px"
    fontWeight: 450
    lineHeight: 1.1
    letterSpacing: "-.025em"
  note-title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "19px"
    fontWeight: 450
  guide-title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "23px"
    fontWeight: 450
  welcome-body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: 1.8
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "12px"
    lineHeight: 1.8
  control:
    fontFamily: "system-ui, sans-serif"
    fontSize: "12px"
  label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "11px"
rounded:
  key: "3px"
  welcome: "4px"
  button: "5px"
  brand: "6px"
  navigation: "7px"
  panel: "9px"
spacing:
  compact: "8px"
  control-inline: "13px"
  mobile-edge: "14px"
  medium: "18px"
  panel: "25px"
  desktop-edge: "30px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.button}"
    padding: "13px 17px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.paper}"
  button-quiet:
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "9px 13px"
  button-quiet-hover:
    backgroundColor: "{colors.hover}"
  button-quiet-pressed:
    backgroundColor: "{colors.pressed}"
  reading-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "25px"
    width: "330px"
  select:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.welcome}"
    padding: "12px"
    width: "100%"
  route-navigation:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.navigation}"
    padding: "6px"
  location-status:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "12px 15px"
---

# Design System: Dead Signal Valley river route

## Overview

**Creative North Star: "Copperlight miniature"**

The inherited Copperlight world combines cream plaster, terracotta, timber, stone, teal copper, turquoise water and planted mountain ridges. This implementation gives that identity a walkable river route. The actual full-viewport 3D scene is the visual artifact; construction, changing light and inhabited places supply its detail.

Small paper surfaces and green-tinted ink make the interface quiet and legible over the world. Fraunces lends welcome and reading titles a gentle literary voice; compact sans-serif controls remain practical. Night pairs a deep green interface with ivory text while amber practical lighting warms the architecture.

**Key Characteristics:**

- Warm Copperlight materials against a turquoise river and layered mountain landscape.
- Full-viewport 3D with small floating paper controls.
- Local Fraunces titles and system sans-serif operational text.
- Coordinated day and night palettes with visible teal focus.

## Colors

Warm paper and forest ink carry the interface; teal is the functional accent. The frontmatter records the current CSS values and is normative.

### Primary

- **Valley Teal:** primary-action hover, live status, range accent and keyboard focus.

### Neutral

- **Warm Paper:** welcome, navigation, brand, guide and reading surfaces.
- **Forest Ink:** primary text, solid actions and inverted status messages.
- **Quiet Sage:** descriptions and secondary labels.
- **Paper Line:** dividers and field borders.
- **Hover Sage / Pressed Sage:** quiet button hover and pressed state.

Night replaces paper, ink, muted, line and teal with deep green paper, ivory ink, pale sage descriptions, darker dividers and mint focus. Its hover and pressed fills also change. The rendered world has separate material and lighting colors; interface tokens do not describe every scene material. Afternoon and dusk retain the light interface palette.

**The Live Palette Rule.** Use the live paper, ink, muted, line and teal variables for interface roles so reading surfaces remain coherent when night is selected.

## Typography

**Display Font:** Fraunces, Georgia, serif. Fraunces is a locally served variable font with weights 100–900 and swap loading.

**Body and Control Font:** system-ui, sans-serif.

- **Display:** the welcome uses the display clamp and tight line height in frontmatter. At 620px and below, its size is fixed to 43px.
- **Headline:** reading-panel titles use the headline role; journal item and guide titles use their distinct smaller serif roles.
- **Welcome body:** descriptive copy uses the welcome-body role; mobile becomes 12px with 1.65 line height.
- **Body:** panel prose uses 12px with 1.8 line height; guide prose uses 1.7 line height.
- **Control:** header actions and the primary action use 12px. Route actions, status, counts and supporting labels finish at 11px, including mobile.
- **Brand:** desktop wordmark is 16px, weight 650 and -.025em tracking; mobile is 12px. Its 11px subtitle hides at the mobile breakpoint.

Counts and route numbers use tabular numerals. Keyboard hints use the system stack and finish at 11px.

**The Two Voices Rule.** Use Fraunces for invitation and reading titles; keep controls, status and instructions in the system sans-serif stack.

## Layout

The world is fixed to every viewport edge. The document is overflow-hidden and canvas fills its container. Overlays float above the scene rather than allocating a separate page column. This is a code-led scene, with no image-comp replacement.

Desktop header is fixed at the top with 22px block and 30px inline padding. Brand and control groups sit at opposite ends. Footer uses the same outer padding and distributes location, four-stop route navigation and the walking-guide action. Header and footer wrappers pass pointer events through to the world; their children remain interactive.

Welcome sits 42px from the left and 145px above the bottom, capped at 350px wide, with 26px/30px/27px padding. Reading panels sit 94px from the top and 30px from the right, are 330px wide, use 25px padding and cap their scrollable height at `calc(100dvh - 210px)`. The guide is horizontally centered, 120px above the bottom, with width `min(400px, 90vw)`.

At 1000px and below, header and footer use 18px/20px padding; welcome moves to 25px left and 125px bottom. Location minimum width becomes 150px, route connectors shorten, and the footer guide action hides. Settings still provides the guide action.

At 620px and below, header and footer use 14px margins. Brand padding is 8px; its icon is 22px. Sound becomes icon-only, Field notes displays as Notes, and operational labels remain 11px. Welcome moves to 18px left and 105px bottom, caps at 275px and uses 22px/24px padding. Phone instructions are visible before entry. Location status hides; route navigation fills the footer width. Reading panels sit 78px from the top, 14px from either side, use width `calc(100% - 28px)` and cap height at `calc(100dvh - 170px)`.

After entry on mobile, the movement pad is 100px square at left 25px/bottom 90px; jump is 64px square at right 30px/bottom 105px. Interaction rises to bottom 190px and omits its keyboard hint. Guide sits 100px above the bottom. Buttons retain 44px minimum height; the final compact header minimum width is 38px. Added controls should preserve readable labels and avoid colliding with the movement areas.

## Elevation & Depth

Geometry, textures, atmospheric distance and light carry the world's depth. UI shadows distinguish opaque paper overlays from the moving scene without decorative glass effects. The full shadow vocabulary and responsive values are recorded in the sidecar.

- **Navigation:** `0 6px 25px #233c3320`.
- **Brand and location:** `0 6px 25px #233c3318`.
- **Welcome:** `0 12px 42px #273f3928`.
- **Reading panel:** `0 14px 45px #1e3e3436`.
- **Guide:** `0 10px 35px #233c3338`.
- **Interaction:** `0 6px 25px #233c3330`.

Night is a lighting change as well as an interface palette. Amber practical lights illuminate nearby architecture; the sky and distant ridges retain a cool blue-green atmosphere. Quality settings vary shadow resolution and the number of nearby active practical lights, so low quality must remain navigable with fewer lights.

**The World First Rule.** Let the scene carry the visual richness; use interface depth to keep controls readable over it.

## Shapes

Paper controls have restrained, gently curved corners: small actions, welcome, brand, navigation and reading panels use the radius roles in frontmatter. Field borders and journal dividers are thin, with no ornamental frames. The live status marker, movement pad, jump action and crosshair are circular.

Outline icons use 22px geometry, 1.5px strokes, rounded caps and joins. The desktop brand icon is 33px with a 1.3px stroke; its mobile size is 22px. Architectural form comes from real roof, timber, facade, bridge and station geometry, with coherent material detail rather than UI decoration.

## Components

### Buttons

Quiet actions are transparent with ink text, the button radius, 9px/13px padding and a minimum height of 44px. Hover uses the relevant sage fill; pressed actions have their own fill. The welcome action is full-width, inverted ink/paper with 13px/17px padding and a spaced arrow; hover turns teal. Disabled buttons use .6 opacity and a wait cursor.

All buttons, links, selects and inputs use a 3px teal `:focus-visible` outline with a 3px offset. Background transitions run for .2s. Reduced-motion removes CSS transitions on elements and pseudo-elements.

### Navigation

Header controls share a paper enclosure with 4px padding, 3px gaps, navigation radius and ambient shadow. Route navigation uses the same radius and shadow with 6px padding; four numbered buttons connect with short line-colored rules. Mobile uses 4px padding and distributes stops across the available footer width. Skip navigation reveals a paper link to the destinations.

### Welcome and reading panels

Welcome is a compact invitation with an opaque paper surface, serif heading, muted description, primary action and supporting note. It includes mobile movement instructions before entry. Settings and field notes share the reading-panel surface, title style, scroll cap and 44px close action. Journal rows use line-colored top rules, serif titles and teal discovery actions.

### Settings fields

Selects fill the reading-panel width, use paper, a thin line border, 12px padding and the welcome radius. The range control fills the width and uses teal accent. Labels use 11px system text. Settings exposes time, quality, sound volume, recovery and walking help.

### Location and discovery feedback

The location surface combines a small teal dot, a current place and muted railway status. Discovery interaction is a centered paper prompt above the footer with an inverted Listen action. Toast feedback inverts ink/paper, uses 13px/19px padding, 12px text with 1.6 line height and fades over .25s; mobile text is 11px. The guide is a paper reading surface with a serif invitation and a solid acknowledgement action. Night explicitly keeps the footer guide action on deep green paper with ivory text and a readable hover/focus fill.

### Touch movement

The movement pad uses a translucent dark fill and pale border; its 34px thumb uses translucent paper and a small ambient shadow. Jump uses translucent paper and dark ink. These controls appear only after entry on the mobile layout; right-side dragging controls the look direction.

## Do's and Don'ts

### Do:

- Do preserve Copperlight materials, original place identities and the turquoise river.
- Do keep the actual 3D scene visible around small, readable paper controls.
- Do use the live palette and visible teal keyboard focus across light and night states.
- Do retain pre-entry phone instructions and keep route controls clear of touch movement.
- Do treat the café, bell plaza, timber bridge and station as the implemented first route; the original route anchors the completed 15-shop, seven-landmark town.
- Do distinguish browser mobile-layout evidence from physical-phone performance, which is unverified.

### Don't:

- Don't replace the navigable world with a flat image or image comp.
- Don't let interface ornament overpower architecture and place detail.
- Don't hardcode daytime text and paper roles into night reading surfaces.
- Don't describe physical-phone performance as verified by desktop mobile-layout testing.

Extracted from `dist/style.css`, `dist/index.html` and `dist/app.js`, checked against desktop/mobile review captures and night evidence. The inherited town DESIGN.md supplies Copperlight language; this file records this route's current implementation values rather than copying its earlier geometry.


## Living-town expansion

The footer retains the four original stops and adds a paper All places control. Its scrollable panel lists all ten destinations with 44px actions; mobile abbreviates Plaza and Bridge while retaining 11px labels. Field notes derives its total from destination data and preserves existing progress. Panel opening immediately hides transient toasts so headings remain clear.

All 15 retail premises have real recessed rooms and purposeful displays. Café, Coppercoil Workshop and Afterglow Arcade have open collision-tested doors. Cinderwatch Observatory, Riverglass Studio, Resonance Hall and the station complete seven landmark premises. The market extends to the southern hall, with accessible observatory ramp, cross lanes, quiet homes, planted gardens and continuous river terrain.

Static geometry merges by material for this compact town. Nearby residents retain articulated rigs; distant residents use five shared instanced meshes. Quality presets cap lights, resolution and foliage detail. Original espresso geometry, maps and PBR factors remain unchanged.
