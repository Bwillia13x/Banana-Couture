
# BananaCouture 🍌👗

**The World's First AI-Native Fashion Atelier**

> **Built for the Google DeepMind Hackathon** using the full spectrum of the Gemini ecosystem: Gemini 3.0 Pro, Imagen 3, Veo, and Gemini Live.

BananaCouture collapses the weeks-long process of fashion design, engineering, and sourcing into a real-time, interactive experience. It empowers designers to go from a vague idea to a production-ready technical package in minutes.

![Banana Couture Banner](https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2400&auto=format&fit=crop)

## 🏗️ Architecture & AI Stack

BananaCouture orchestrates a multi-agent system where specialized Gemini models handle different stages of the creative pipeline:

| Feature | Model Used | Purpose |
| :--- | :--- | :--- |
| **Generative Design** | `gemini-3-pro-image-preview` | High-fidelity photorealistic concept generation from text prompts. |
| **Design Logic** | `gemini-3-pro-preview` | Fast reasoning for JSON extraction, color palette analysis, and sizing charts. |
| **Complex Reasoning** | `gemini-3-pro-preview` | Deep analysis for manufacturing feasibility, risk assessment, and DNA splicing. |
| **Runway Video** | `veo-3.1-fast-generate-preview` | Cinematic video generation for virtual runway shows. |
| **Aura 2.0 (Co-Pilot)** | `gemini-2.5-flash-native-audio` | Real-time multimodal voice & vision interaction (Live API). |
| **Sourcing Agent** | `gemini-3-pro-preview` + Search | Google Search Grounding to find real-world sustainable suppliers. |

## 🌟 Key Features

### 1. **Multimodal Studio**
- **Text-to-Design**: Create photorealistic concepts with Gemini 3.0 Image.
- **FashionGPT**: An autonomous agent that breaks down high-level briefs into complete production packs (CAD, BOM, Costing).
- **Engineering**: Automatically generates vector-style technical flat sketches and structured Bill of Materials.
- **DNA Splicer**: Merges the "genetic" style code of two designs to breed new hybrids.

### 2. **Aura 2.0 (Gemini Live)**
- **Voice & Vision**: Talk to your design assistant. Aura can "see" your canvas and provide feedback on silhouette and feasibility.
- **Agentic Tools**: Aura can manipulate the UI, generate patterns, and perform edits based on voice commands.

### 3. **Production Intelligence**
- **Sourcing Engine**: Finds real-world suppliers for fabrics using Search Grounding.
- **Sustainability Analysis**: Estimates carbon footprint using Maps Grounding for logistics.
- **Cost Estimation**: Real-time calculation of COGS (Cost of Goods Sold).

### 4. **Immersive Media**
- **Veo Runway**: Generates cinematic runway videos.
- **Magic Mirror**: Virtual try-on using webcam input.

## 🧪 How to Test (Judge's Guide)

Follow this flow to experience the full power of the platform:

1.  **Start in the Studio**:
    -   Enter a prompt like *"Avant-garde neon trench coat, translucent vinyl, fiber optic details"* and click **Generate**.
2.  **Engineer the Design**:
    -   Once the image appears, look at the right sidebar. Click **"Generate Tech Pack"**.
    -   Watch as Gemini analyzes the image to create a Technical Flat (CAD) and a structured Bill of Materials (BOM).
3.  **Consult Aura (Live API)**:
    -   Click the **Orb** in the top-left of the canvas to activate Aura.
    -   *Say:* "What do you think of this design? How can I make it more sustainable?"
    -   *Say:* "Generate a fabric pattern that looks like electric rain." (Aura will trigger the pattern tool).
4.  **Run FashionGPT**:
    -   Click the **Robot Icon** in the left sidebar.
    -   Enter a high-level brief: *"A sustainable denim line for Gen-Z urban explorers."*
    -   Watch the agent iteratively generate the brief, prompt, concept, and cost analysis.
5.  **Create a Video**:
    -   (Requires Paid API Key) Click the **Video Icon** in the left sidebar to generate a Veo runway loop.

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   A Google Cloud Project with Gemini API enabled.
-   **Important**: Veo video generation requires a paid billing account linked to your project.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/banana-couture.git
    cd banana-couture
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    -   Create a `.env` file in the root directory.
    -   Add your API key:
        ```env
        GEMINI_API_KEY=your_api_key_here
        ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🛠️ Technology

-   **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion (animations).
-   **State Management**: React Hooks & Context.
-   **Audio/Video**: Web Audio API, MediaStream API for sensory input.

---

*BananaCouture - Designing the Future, One Token at a Time.*
