# Video Generation Requirements & Pipeline Instructions (`instructions.md`)

> **Purpose**: This document serves as the permanent single source of truth for generating, voicing, and exporting 9:16 3D short-form explanation videos in this workspace so no context is ever lost across sessions.

---

## 1. Visual & Aesthetic Requirements (Reference Video Benchmark)
- **Reference Source**: `/public/assets/aistudio/What_if_you_stopped_gooning_for_a_whole_month__MP4__1b5a4199.mp4`
- **Format**: `9:16` Vertical Short-Form Video (`1080×1920` logical composition, `30.0s` duration, `30 FPS`).
- **3D Low-Poly Character Rig (`src/three/proceduralModels.ts`)**:
  - Must be a composite 12+ part `THREE.Group` (never single-primitive placeholders).
  - Features: Faceted low-poly skin-toned head (`IcosahedronGeometry` with `flatShading: true`), 7-block sculpted brown hair tuft, animatable eyelids (blinking/squinting), expressive eyebrows (`curious`, `shocked`, `dizzy`, `happy`), morphing mouth (`neutral`, `open O`, `smile`), signature bright orange hoodie (`#e85d24`) with front kangaroo pocket and two white vertical drawstrings, blue trousers, and white sneakers grounded at `y = 0` over a soft radial contact shadow disc (`y = 0.015`).
- **4 Evolving 3D Environment Stages**:
  1. **`bedroom_night` (`0.0s – 11.2s`)**: Dark slate-blue bedroom, concentric orange-and-cream bullseye target rug under the character, bed with blue blanket, warm glowing bedside lamp, and starry night window with moon.
  2. **`seed_lab` (`11.2s – 18.0s`)**: Biochemical dark studio with red grid floor, giant cross-section halved apple showing 5 black amygdalin seeds in a star-shaped core, and 6 orbiting 3D `H-C≡N` (Hydrogen Cyanide) molecules.
  3. **`hypoxia_street` (`18.0s – 23.4s`)**: Stylized low-poly winter street flanked by faceted trees and falling snow/seed particles as the character walks/staggers under cellular oxygen depletion.
  4. **`kitchen_day` (`23.4s – 30.0s`)**: Bright sunlit teal kitchen with wooden countertops, hanging teal dome pendant lamp, floating wall shelf with 3 jars, and potted succulent plants while the character waves and holds a white ceramic mug.
- **Synchronized 9:16 Motion Graphics HUD (`src/three/ExplainerCanvas.tsx`)**:
  - **Top Status Pill / Bar**: Alternates between dark status pills (`• 1 APPLE = 0 MG HCN`, `• AMYGDALIN + ENZYMES`, `• ATP BLOCKED — HYPOXIA`, `• INTACT SEED = 100% SAFE`) and dynamic progress bars (`CELL OXYGEN` red bar draining down; `CYANIDE DOSE` amber bar filling up).
  - **Giant 3D-Style Section Headers**: Uppercase bold white `Outfit` 900 typography with heavy dark stroke and red underline bar (`THE SEED`, `CYANIDE`, `CRUSHED`, `150 SEEDS`, `18 CORES`).
  - **Karaoke Word-by-Word Subtitles**: Lower-middle third, bold white text where the active spoken word highlights in warm golden amber (`#FBBF24`) with a subtle scale pop.
  - **Bottom 30-Cell Grid Tracker (`150-SEED METER`)**: `10×3` grid of 30 rounded square cells (each cell = 5 crushed seeds; 30 cells = 150 seeds / 67.5 mg HCN lethal dose).

---

## 2. Installed Skill Bundles & Tooling
The following agent skill bundles are installed in `~/.agents/skills/` and must be respected:
1. **HyperFrames Core** (`npx hyperframes skills update`):
   - `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `media-use`
   - Registers master timeline at `window.__timelines["apple-cyanide-explainer"]`.
2. **CloudAI-X Three.js 13-Skill Bundle** (`npx skills add CloudAI-X/threejs-skills -y -g`):
   - `threejs-fundamentals`, `threejs-lighting`, `threejs-materials`, `threejs-animation`, `threejs-geometry`, `threejs-interaction`, `threejs-loaders`, `threejs-performance`, `threejs-postprocessing`, `threejs-react-three-fiber`, `threejs-shaders`, `threejs-textures`, `threejs-asset-pipeline`.
3. **Nexu Open-Design Three.js Skill** (`npx skills add nexu-io/open-design --skill threejs -y -g`):
   - `threejs` procedural 3D scenes & exponential-damped camera rigs.

---

## 3. Voiceover Generation Pipeline (Fish Audio S2.1 Pro + OpenRouter)
- **Selected Official Fish Audio Voice**:
  - **Voice Name**: `Adrian` (Steady, authoritative male documentary & explainer narrator)
  - **Fish Audio Voice ID (`reference_id`)**: `bf322df2096a46f18c579d0baa36f41d`
  - **Direct Voice URL**: `https://fish.audio/m/bf322df2096a46f18c579d0baa36f41d`
  - **Alternate Energetic Explainer Voice**: `Guyzo` (`8ec9973300874562962bbcb300f82213`)
- **5 Timed Voiceover Blocks**:
  1. `vo_01_hook.mp3` (`0.0s – 3.1s`): *"How could a single fruit actually kill a human?"*
  2. `vo_02_seeds.mp3` (`3.1s – 11.2s`): *"The flesh is harmless. But inside the core sit five black seeds loaded with a chemical called amygdalin. That's hydrogen cyanide."*
  3. `vo_03_cyanide.mp3` (`11.2s – 18.0s`): *"Chewing cracks the tough outer shell. Stomach enzymes unlock the poison, and block your cells from using oxygen."*
  4. `vo_04_150seeds.mp3` (`18.0s – 23.3s`): *"By one hundred fifty crushed seeds, about eighteen cores, the dose turns lethal."*
  5. `vo_05_safe.mp3` (`23.3s – 30.0s`): *"And if you swallow a seed whole? Its armor keeps every drop of toxin locked safely away from your body."*
- **Server-Side Generation Route (`POST /api/generate-voiceovers` in `server.ts`)**:
  - Reads `OPENROUTER_API_KEY`, `FISH_AUDIO_API_KEY`, and `FISH_AUDIO_VOICE_ID` (`bf322df2096a46f18c579d0baa36f41d`) from environment secrets.
  - Generates the 5 audio files into `/public/assets/voiceovers/vo_01_hook.wav` .. `vo_05_safe.wav` (or `.mp3`) and serves them automatically to the 3D player.

---

## 4. GitHub Automated Push Pipeline (`POST /api/push-github`)
- Uses `GITHUB_PERSONAL_ACCESS_TOKEN` and `GITHUB_REPO` from AI Studio Secrets (`process.env`).
- Automatically creates the repository (if it does not yet exist under the authenticated user) and commits the project source files, `instructions.md`, `memory.md`, and generated voiceover assets via the GitHub REST API.
