
# 🍌 Banana Couture: Multi-Agent Architecture

## Repo Sync & Hackathon Workflow (Read First)

This repository is a local mirror of the Google AI Studio project for the DeepMind hackathon. Treat AI Studio as the source-of-truth the judges will see.

- **Manual sync required:** Any file edited locally must be copy/pasted into the matching file in AI Studio’s File Explorer.
- **Keep `SYNC_NOTES.md` current:** For every file you touch/edit, add or update a bullet in `SYNC_NOTES.md` describing the change so we know what to sync.
- **Final handoff:** In your final response, list every changed file that needs to be synced into AI Studio.
- **Model priority:** Prefer AI Studio workflows and `gemini-3-pro-*` models unless a task explicitly calls for another model.

This document outlines the specialized AI agents orchestrating the Banana Couture platform.

## 1. The Design Agent (Studio)
**Role:** Creative Director & Concept Artist
- **Model:** `gemini-3-pro-image-preview`
- **Function:** Takes semantic prompts ("bioluminescent evening gown") and generates high-fidelity photorealistic concepts.
- **Context Awareness:** Maintains a "history" state to allow iterative remixing of designs.

## 2. The Engineer Agent (Tech Pack)
**Role:** Technical Designer & Pattern Maker
- **Model:** `gemini-3-pro-preview`
- **Function:** Analyzes the visual concept to reverse-engineer a vector-style CAD sketch and a structured Bill of Materials (BOM).
- **Output:** Returns structured JSON containing fabric composition, seam allowances, and construction notes.

## 3. Aura 2.0 (Live Co-Pilot)
**Role:** Real-time Design Assistant
- **Model:** `gemini-2.5-flash-native-audio-preview-09-2025`
- **Capabilities:**
    - **Vision:** Sees the canvas in real-time via `sendRealtimeInput`.
    - **Voice:** Bi-directional low-latency conversation.
    - **Tool Use:** Can execute functions like `updatePrompt`, `generatePattern`, and `suggestImprovement` directly on the app state.

## 4. FashionGPT (Pipeline Orchestrator)
**Role:** Brand Strategist & Production Manager
- **Model:** `gemini-3-pro-preview`
- **Function:** Autonomous agent that breaks down a high-level goal ("Launch a sustainable denim line") into 9 sequential stages:
    1.  Brief Generation
    2.  Prompt Engineering
    3.  Concept Visualization
    4.  Technical Engineering
    5.  Sourcing
    6.  Costing
    7.  Timeline Estimation
-   **Output:** A complete "Production Ready Pack".

## 5. The Sourcing Agent (FashionForge)
**Role:** Supply Chain Logistics
- **Model:** `gemini-3-pro-preview` + **Google Search Grounding** + **Maps Grounding**
- **Function:** Finds real-world suppliers for specific materials identified in the BOM. Calculates carbon footprint estimates based on logistics distances.

## 6. The Runway Agent (Veo)
**Role:** Show Producer
- **Model:** `veo-3.1-fast-generate-preview`
- **Function:** Transforms static 2D designs into cinematic 720p videos, simulating fabric physics and model movement.

---

*Built with Google Gemini API.*
