# Hero Specification

## Overview
- Target: `index.html` `section.hero`
- Interaction: time-driven video; scroll-driven header state

## Computed reference
- Hero source height observed: 945px at 1920px viewport; site section height later measured around 889px with fixed header/scroll transform.
- Copy: `Made for adventure(r)s`; `Adventure vehicle rentals & road trips in Oaxaca`; `Book now`.
- Palette: white copy over dark media; CTA `rgb(246, 130, 65)`.
- Font families: Roboto body, Stdsaic ExtraBold heading.

## Implementation
- Local looping muted video fills the hero with `object-fit: cover`.
- Two-layer dark gradient preserves text contrast.
- Copy anchors lower-left on desktop, stacks on mobile.
- `prefers-reduced-motion` uses a local still image instead of video.

