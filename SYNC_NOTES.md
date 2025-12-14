
# AI Studio Manual Sync Log

Use this list to copy/paste updated files into AI Studio (this workspace reflects the latest build).

## 🟢 Status: READY FOR SUBMISSION
**Last Verified:** Today
**Core Systems:**
- [x] **Studio Agent** (`gemini-3-pro-image-preview`): Functioning.
- [x] **Engineer Agent** (`gemini-3-pro-preview`): Tech Pack JSON generation verified.
- [x] **Aura 2.0** (`gemini-2.5-flash-native-audio`): Live API hook connected.
- [x] **FashionGPT** (`gemini-3-pro` chain): Pipeline stages consistent with types.
- [x] **Veo Runway** (`veo-3.1`): Video generation loop confirmed.

## Files to sync (Final Batch)

- `AGENTS.md` — Complete architecture documentation.
- `App.tsx` — Robust routing, demo mode banners, and state management.
- `components/FashionGPTModal.tsx` — Costing logic aligned with nested margin types.
- `components/FashionForge.tsx` — Supply chain visualization and tech pack rendering.
- `components/Studio.tsx` — Main orchestrator for Studio/Engineering/Aura interaction.
- `components/LivingAtelier.tsx` — Multimodal vision integration (fallback view).
- `components/ProfileView.tsx` — Data persistence and brand builder logic.
- `hooks/useLiveAPIv2.ts` — The primary hook for Aura 2.0 (ensure this is synced!).
- `hooks/useFashionGPT.ts` — Pipeline state manager.
- `services/fashionGPTService.ts` — The orchestrator for the autonomous agent.
- `services/fashionForgeService.ts` — Manufacturing logic.
- `services/geminiService.ts` — The core SDK wrapper (Critical: handles API keys & Veo polling).
- `services/designDNAService.ts` — Style analysis and splicing logic.
- `services/apiKey.ts` — Shared key extraction logic.
- `index.html` — Clean imports.
- `types.ts` — The source of truth for all data structures (BOM, Costing, DNA).

## Hackathon Critical Fixes

- **API Key Guard:** `services/apiKey.ts` is now used globally to gracefully handle missing keys by prompting the AI Studio selector.
- **Veo Billing:** `geminiService.ts` explicitly re-initializes the client before video generation to ensure the latest paid key is used.
- **Costing Consistency:** `FashionGPT` now calculates retail/wholesale margins deterministically (4x/2.2x) to ensure business logic consistency even if the AI hallucinates numbers.
- **Mobile Responsiveness:** All modals (`TechPack`, `FashionForge`, `FashionGPT`) have been tuned for viewport constraints.

## Test run (local)

- `npm install`
- `npm run dev`
- Open `http://localhost:3000`
- Click **"Select Key"** in the top banner if running in AI Studio demo mode.
