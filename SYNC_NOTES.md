
# AI Studio Manual Sync Log

Use this list to copy/paste updated files into AI Studio (this workspace reflects the latest build).

## Files to sync

- `App.tsx` — in-app Exit Preview button (top-left) for safe return to home without browser back.
- `App.tsx` — refined LiveTicker strip (softer background, typography, reduced noise).
- `components/BomParser.tsx` — accepts string arrays, safer structured BOM defaults, and empty-state guard.
- `components/Marketplace.tsx` — detail modal wrapped in `ErrorBoundary` to prevent blank screen on product click.
- `components/PatternGenerator.tsx` — clearer Pattern Lab feedback when a pattern is generated/applied.
- `components/Studio.tsx` — toolbar buttons carry titles; prompt panel now shows sample prompts and guidance.
- `AGENTS.md` — added AI Studio manual sync workflow and Gemini 3 Pro priority guidance.
- `App.tsx` — demo-mode banner, missing `GEMINI_API_KEY` notice, and in-app Home/back control.
- `services/apiKey.ts` — new shared API key guard.
- `services/geminiService.ts` — uses key guard, clearer missing-key error, safer download fetch.
- `services/designDNAService.ts` — uses key guard and missing-key messaging.
- `services/fashionForgeService.ts` — uses key guard and missing-key messaging.
- `services/fashionGPTService.ts` — uses key guard.
- `hooks/geminiService.ts.ts` — uses key guard, missing-key messaging, guarded download fetch.
- `hooks/useLiveAPI.ts` — uses key guard for Aura connection.
- `hooks/useLiveAPIv2.ts` — uses key guard for Aura 2.0.
- `hooks/useMultimodalLiveAPI.ts` — uses key guard for multimodal live.
- `components/LazyImage.tsx` — offline-safe fallback image (no external placeholder).
- `components/LandingPage.test.tsx` — new CTA navigation coverage.
- `components/Marketplace.test.tsx` — new marketplace smoke coverage.
- `components/LandingPage.tsx` — removes logo image; text-only brand label.
- `components/Studio.tsx` — default prompt seed, accessible tool buttons, pattern feedback plumbing.
- `components/PatternGenerator.tsx` — pattern status + toast feedback.
- `components/Marketplace.tsx` — safer product selection with toast on failure.
- `index.html` — removed broken `/index.css` link.
- `public/images/logo.svg` — updated brand mark (dress/gown SVG, inlined on landing page).
- `SYNC_NOTES.md` — updated sync log to include latest AGENTS.md changes.

## Hackathon Critical Fixes (Dec 11)

- `services/apiKey.ts` — enhanced API key flow to check AI Studio `window.aistudio` for key (getSelectedApiKey, getApiKey, etc).
- `index.html` — removed broken `/index.css` link, aligned react-dom importmap to aistudiocdn for version consistency.
- `components/Studio.tsx` — Aura connect now surfaces errors via toast on mic/key failure.
- `hooks/useLiveAPIv2.ts` — connect() re-throws errors so UI can catch and display them.
- `components/TechPackModal.tsx` — mobile-responsive layout (grid-cols-1 md:grid-cols-2, reduced padding), added accessibility attrs.
- `Marketplace.test.tsx` — fixed import path from `./Marketplace` to `./components/Marketplace`, fixed types import.
- `components/VideoRecorder.tsx` — FAB hidden on mobile (hidden sm:block), added accessibility attrs to buttons.
- `hooks/useMultimodalLiveAPI.ts` — multimodal connect errors distinguish permission vs key issues; no key prompt on mic/cam denial; rethrows for UI toast.
- `components/LivingAtelier.tsx` — catches multimodal connect errors and surfaces toast to user.
- `App.tsx` — DEMO MODE banner now auto-dismisses after key selection (periodic recheck + callback).

## V4 Alignment Fixes (Dec 12)

- `services/fashionGPTService.ts` — updated FashionGPT cost stage to use new nested `CostBreakdown.margin` schema; fixed Tech Pack cost export table.
- `components/FashionGPTModal.tsx` — updated costing UI + quick stats to read nested `CostBreakdown` fields and margin object.
- `index.html` — removed stray `/index.css` link reintroduced during AI Studio fixes.

## Test run (local)

- `npm install --no-package-lock` (to pull dev deps locally only).
- `npm run test` — passed (canvas warnings expected due to jsdom stub).
