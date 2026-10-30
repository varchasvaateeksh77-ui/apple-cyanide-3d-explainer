# Project Memory & Context Log (`memory.md`)

> **Last Updated**: 2026-10-30
> **Project Name**: HyperFrames 3D Explainer — *How Can an Apple Kill a Human?*
> **GitHub Repository**: `https://github.com/varchasvaateeksh77-ui/apple-cyanide-3d-explainer`

---

## 1. User Intent & Goal
- **What the User Wants**:
  - A viral-style `9:16` 3D animated short-form explanation video (`30.0s`) about **"How Can an Apple Kill a Human?"** (apple seeds → amygdalin → enzymatic conversion to hydrogen cyanide in the stomach → 150 crushed seeds / ~18 apple cores lethal cellular hypoxia threshold → why swallowing whole seeds is safe).
  - Visually and structurally modeled after the user's attached reference video (`/public/assets/aistudio/What_if_you_stopped_gooning_for_a_whole_month__MP4__1b5a4199.mp4`).
  - Automated AI voiceover generation using **Fish Audio 2.1 Pro** (`bf322df2096a46f18c579d0baa36f41d` — **Adrian** narrator voice) + **OpenRouter** with no Gemini fallback, integrated directly into the 3D video timeline.
  - Automated creation and full-codebase + audio push to a dedicated GitHub repository (`varchasvaateeksh77-ui/apple-cyanide-3d-explainer`).

---

## 2. Saved Credentials & Persistent Configuration
- **Selected Fish Audio Narrator Voice**:
  - Official Fish Audio Voice: **Adrian** (`bf322df2096a46f18c579d0baa36f41d`) — [https://fish.audio/m/bf322df2096a46f18c579d0baa36f41d](https://fish.audio/m/bf322df2096a46f18c579d0baa36f41d)
- **Saved Environment Secrets (`.env` & `.env.example`)**:
  - `OPENROUTER_API_KEY`: Saved in `.env` (`sk-or-v1-05bb...7a67`) and pre-declared in `.env.example` for Google AI Studio Secrets persistence.
  - `GITHUB_PERSONAL_ACCESS_TOKEN`: Saved in `.env` (`ghp_Nv9P...JBTZ`, authenticated as `varchasvaateeksh77-ui`) and pre-declared in `.env.example`.
  - `FISH_AUDIO_VOICE_ID`: `bf322df2096a46f18c579d0baa36f41d`
  - `GITHUB_REPO`: `varchasvaateeksh77-ui/apple-cyanide-3d-explainer`
  - *(Note: Raw token strings are stored exclusively in gitignored `/.env` so GitHub Push Protection never blocks commits or revokes the tokens).*

---

## 3. What Has Been Built & Integrated
1. **Core Timeline & Biochemistry Engine (`src/timeline/explainerData.ts` & `src/timeline/explainerData.test.ts`)**:
   - 5 chapters (`0.0s – 30.0s`), 14 word-by-word karaoke subtitle cues, 5 giant 3D title cues (`THE SEED`, `CYANIDE`, `CRUSHED`, `150 SEEDS`, `18 CORES`), 12 smoothstep camera keyframes, 5 voiceover generation blocks (`VOICEOVER_BLOCKS`), and deterministic amygdalin/HCN dosage math.
   - Unit tested with `node:test` (`4/4` tests passing).
2. **Procedural 3D Character & 4 Environments (`src/three/proceduralMaterials.ts`, `src/three/proceduralModels.ts`, `src/three/ExplainerCanvas.tsx`)**:
   - Low-poly character in orange hoodie holding stage-specific 3D props (plump red apple, halved seed-core apple, `H-C≡N` molecule cluster, white ceramic mug).
   - 4 stages: Night Bedroom with bullseye rug (`0–11.2s`), Seed & Cyanide Lab (`11.2–18.0s`), 150-Seed Hypoxia Street (`18.0–23.4s`), Bright Teal Kitchen (`23.4–30.0s`).
3. **Generated Voiceover Audio Files (`/public/assets/voiceovers/`)**:
   - `vo_01_hook.mp3` (`0.0s – 3.1s`): *"How could a single fruit actually kill a human?"*
   - `vo_02_seeds.mp3` (`3.1s – 11.2s`): *"The flesh is harmless. But inside the core sit tiny black seeds loaded with a chemical called amygdalin."*
   - `vo_03_cyanide.mp3` (`11.2s – 18.0s`): *"When you chew and crush those seeds, your stomach enzymes convert amygdalin directly into lethal hydrogen cyanide."*
   - `vo_04_150seeds.mp3` (`18.0s – 23.4s`): *"One seed will not hurt you. Wait until you crush a hundred and fifty seeds, about eighteen apple cores, and cyanide locks your cells from using oxygen."*
   - `vo_05_safe.mp3` (`23.4s – 30.0s`): *"Swallow a whole seed by mistake? Its tough outer shell passes right through intact. Enjoy the apple, just do not blend the cores."*
4. **Full-Stack Voiceover & GitHub Pipeline (`server.ts` + `src/App.tsx`)**:
   - `GET /api/pipeline-status`: Returns `openRouterConfigured: true`, `githubConfigured: true`, active voice ID `bf322df2096a46f18c579d0baa36f41d`, and pre-links all 5 generated `.mp3` voiceover files into the 3D video player on startup.
   - `POST /api/generate-voiceovers`: Synthesizes all 5 voiceover blocks to `.mp3` without any Gemini fallback.
   - `POST /api/push-github`: Creates and syncs the repository `https://github.com/varchasvaateeksh77-ui/apple-cyanide-3d-explainer` with all source files, `instructions.md`, `memory.md`, and the 5 `.mp3` voiceover tracks.
