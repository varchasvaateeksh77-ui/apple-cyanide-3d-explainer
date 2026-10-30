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
  - A complete **`finished output/`** (`finished_output/`) directory pushed to the GitHub repository containing:
    1. The final compiled `9:16` 30.0s `.mp4` video (`how_apples_kill_humans_final.mp4`) with 3D animation, HUD overlays, subtitles, compiled voiceover, and 10 real Foley sound effects.
    2. The mastered 30.0s broadcast audio mix (`master_audio_vo_and_sfx_30s.mp3`).
    3. The naturally paced and compiled 30.0s voiceover stem (`voiceover_compiled_30s.mp3`) and individual paced voiceover blocks (`voiceover_blocks/vo_01_hook.mp3` – `vo_05_safe.mp3`).
    4. The compiled 30.0s Foley & SFX stem (`sfx_compiled_30s.mp3`) and all 10 real Foley sound effect `.mp3` files (`sfx/sfx_01_whoosh_transition.mp3` – `sfx_10_dark_ambient_drone.mp3`).

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

## 3. Master Deliverables in `finished output/` (`finished_output/`)
1. **`how_apples_kill_humans_final.mp4`** (`720x1280` 9:16 H.264 + 192kbps Stereo AAC, `30.0s`, 30fps):
   - Full compiled 30.0-second vertical 3D explainer video muxed with the mastered voiceover and 10 Foley sound effects.
2. **`master_audio_vo_and_sfx_30s.mp3`** (`30.0s`, 192kbps Stereo MP3):
   - Combined master soundtrack mixing `voiceover_compiled_30s.mp3` with `sfx_compiled_30s.mp3`.
3. **`voiceover_compiled_30s.mp3`** (`30.0s`, 192kbps Stereo MP3):
   - Continuous 30.0s voiceover stem with all 5 blocks silence-trimmed, naturally tempo-matched to fit each chapter window with breathing room, and loudness-normalized (`-16 LUFS`).
4. **`sfx_compiled_30s.mp3`** & **`sfx/`** (10 Real Foley Sound Effects):
   - `sfx_01_whoosh_transition.mp3` (`0.05s`, `3.10s`, `11.20s`, `18.00s`, `23.40s`)
   - `sfx_02_apple_bite_juicy.mp3` (`1.10s`, `28.00s`)
   - `sfx_03_seed_crush_crunch.mp3` (`11.45s`)
   - `sfx_04_stomach_acid_bubbles.mp3` (`13.00s – 17.50s`)
   - `sfx_05_toxicity_counter_geiger.mp3` (`18.30s – 22.50s`)
   - `sfx_06_hypoxia_warning_beep.mp3` (`21.20s`)
   - `sfx_07_swallow_intact_seed.mp3` (`24.10s`)
   - `sfx_08_safe_shell_chime.mp3` (`26.80s`)
   - `sfx_09_ui_pop.mp3` (`4.80s`, `7.50s`)
   - `sfx_10_dark_ambient_drone.mp3` (`0.00s – 30.00s`)
