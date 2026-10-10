---
name: aaa-game-ui
description: >-
  Use this skill when designing, reviewing, or building UI components and pages for SquadCraft.
  Provides AAA sports game visual standards (EA Sports FC / Football Manager style), 60 FPS motion engineering,
  responsive mobile-first rules, WebGL/3D guidelines, and Vercel-grade design system quality gates.
---

# AAA Sports Game UI Design & Motion Craft

This skill establishes the visual identity, motion physics, responsive design rules, and performance quality gates for **SquadCraft**. It transforms standard web layouts into an immersive, broadcast-quality AAA sports gaming experience while ensuring 100% runtime performance, mobile usability, and zero regression to gameplay logic.

---

## 1. Visual Identity: AAA Game Menu vs. Generic SaaS

SquadCraft must feel like entering a next-gen football management console (inspired by EA Sports FC, Football Manager, and live sports broadcasting), **never** a corporate SaaS CRM or a generic dashboard template.

### The Contrast Test
| Anti-Pattern (Generic SaaS) | AAA Game Design Standard (SquadCraft) |
|---|---|
| Plain white/gray flat cards with 1px light borders | Deep obsidian (`#070a08`), stadium navy, and smoked carbon glass (`#0d120f/95`) |
| Blue `#3b82f6` generic links and buttons | Tactical Volt/Lime (`#b7ff35`) primary actions with subtle holographic bloom |
| Overloaded micro-text telemetry and cluttered metrics | Athletic condensed typography (Barlow / Space Grotesk), high-contrast hierarchy |
| Plain rectangular box layouts | Angled chamfers, subtle 3D bevels, rim lighting, and arena split layouts |
| Static instant state switches | Fluid spring physics, tactile press-down states, and kinetic feedback |
| Heavy full-screen 3D scenes obstructing forms | Subtle ambient stadium backdrop with readable, high-contrast foreground layers |

### Color Palette Tokens
- **Pitch Obsidian / Carbon:** `#070a08` (deep ground), `#0d120f` (card base), `#141b16` (elevated surface)
- **Tactical Volt / Lime:** `#b7ff35` (primary highlights, active CTA, win conditions, captaincy)
- **Tactical Cyan:** `#00f5d4` / `#38bdf8` (data telemetry, pass maps, scouting radars, transfer values)
- **Victory Gold:** `#ffd166` (trophies, star players, legendary ratings, milestones)
- **Danger / Pressure Red:** `#ff4d6d` (relegation zone, severe injury, high fatigue, match alerts)
- **Frosted Glass:** `rgba(13, 18, 15, 0.85)` with `backdrop-filter: blur(16px)` and `border: 1px solid rgba(255, 255, 255, 0.08)`

---

## 2. Component Architecture & UI Primitives

Always compose interfaces using the modular game UI toolkits in `@/components/ui/`:

### A. Game Design System (`@/components/ui/GameDesignSystem`)
- `GamePanel`: Core container with variants (`default`, `elevated`, `glass`, `highlight`, `tactical`).
- `ClubBadge`: SVG vector crests with authentic fictional identity.
- `StatBadge`: Formatted metric pill with color-coded sentiment.
- `FitnessIndicator` & `MoraleIndicator`: Real-time player condition bars.

### B. React-Bits Interaction Toolkit (`@/components/ui/react-bits`)
- `AnimatedCounter`: Smooth numeric counting for financial figures, ratings, and match time.
- `DecryptedText`: Cybernetic tactical text unscrambling on hover or card reveal.
- `MagneticButton`: Physical cursor-pull micro-interaction for primary action buttons.
- `SplitText` & `BlurText`: Cinematic headline reveals for match results and draft picks.
- `SpotlightCard`: Dynamic cursor-following radial glow on carbon cards.
- `TiltedCard`: 3D gyroscopic tilt with holographic specular glare for player cards.
- `ShinyText`: Subtle metallic/volt shimmer across badges and tier ratings.

### C. MagicUI Ambient Primitives (`@/components/ui/magicui`)
- `BorderBeam`: High-tech laser perimeter scan for active draft cards, transfer targets, or live matches.
- `ShineBorder`: Continuous rotating gradient border for elite player cards and trophies.
- `Particles`: Lightweight canvas dust/stadium atmosphere in background overlays.

### D. 3D & WebGL Canvas (`@/components/three`)
- `PlayerCard3D`: Three.js extruded card with real-time lighting and rotation.
- `TacticalPitch3D`: Spatial 3D pitch view with player markers.
- **WebGL Golden Rule:** Always clean up geometries/materials on unmount. Only render WebGL when viewport is active; use CSS 2D fallbacks on ultra-low-power devices.

---

## 3. Motion Engineering & 60 FPS Standards

Every animation must feel snappy, physical, and intentional. Never animate layout-triggering properties (`width`, `height`, `top`, `left`, `margin`).

1. **GPU-Accelerated Only:** Animate solely `transform` (`scale`, `translate3d`, `rotate`) and `opacity`.
2. **Spring Physics Over Easing Curves:** Use Framer Motion spring presets:
   ```ts
   transition: { type: 'spring', stiffness: 400, damping: 28 }
   ```
3. **Tactile Button Feedback:**
   ```tsx
   <motion.button
     whileHover={{ scale: 1.02 }}
     whileTap={{ scale: 0.97 }}
     className="px-6 py-3 bg-[#b7ff35] text-black font-black uppercase rounded-xl shadow-[0_0_20px_rgba(183,255,53,0.3)]"
   >
     Onayla
   </motion.button>
   ```
4. **Respect Accessibility:** Honor `prefers-reduced-motion` using Tailwind's `motion-reduce:` or Framer Motion's `useReducedMotion()`.

---

## 4. Mobile-First & Responsive Ergonomics

Sports managers are frequently played on tablets and mobile screens. A mobile layout is not a squished desktop layout; it is a dedicated handheld touch experience.

1. **Touch Targets:** Interactive targets (buttons, tabs, player row taps) must be at least `44px × 44px`.
2. **Thumb-Zone Navigation:** Place critical CTAs and bottom tabs within easy reach of one-handed thumb interaction.
3. **Horizontal Swipe Rails:** Convert wide data tables into swipeable cards or horizontal scroll rails on screens `< 768px`.
4. **Header Compression:** On mobile, collapse secondary stats into slide-over drawers or bottom sheets; preserve pitch/radar visibility.

---

## 5. Vercel Web Design Guidelines & Performance Checklist

Before releasing any UI changes, verify against the following quality gates:

- [ ] **No Network Waterfalls:** Fetch data in parallel (`Promise.all`) or via existing Zustand stores.
- [ ] **Zero Layout Shift (CLS):** Provide explicit aspect ratios and skeleton loaders for cards and crests.
- [ ] **High Contrast:** All text must meet WCAG AA standards against obsidian backgrounds (min 4.5:1 ratio).
- [ ] **Safe Hydration:** Dynamic timestamps and randomized decryptions must be wrapped in client-only guards or `useEffect` to prevent hydration mismatches.
- [ ] **Zero Gameplay Breakage:** Never overwrite game logic, IndexedDB saves, career state, or deterministic match simulation.

---

## 6. Visual QA Protocol

Run automated visual validation using Playwright:
```bash
# Capture Desktop 1440x900
npx playwright screenshot --viewport-size="1440,900" http://localhost:3000/<route> screenshot-desktop.png

# Capture Mobile 390x844 (iPhone 14)
npx playwright screenshot --viewport-size="390,844" http://localhost:3000/<route> screenshot-mobile.png
```
Inspect screenshots for clipping, unreadable text, broken borders, or misaligned badges before completing work.
