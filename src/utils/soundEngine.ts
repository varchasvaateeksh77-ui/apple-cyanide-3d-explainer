class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  public sfxEnabled = true;
  public voiceoverEnabled = false;
  private lastCueId = '';
  private lastHeaderText = '';
  private hasUserGesture = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.hasUserGesture = true;
      };
      window.addEventListener('pointerdown', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined' || !this.hasUserGesture) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playTitleImpact(type: 'warning' | 'neutral' | 'safe' = 'neutral') {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.28);
    } else if (type === 'safe') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.25);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.22);
    }

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  public playSeedTick() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public syncTimelineAudio(
    cueId: string | null,
    cueText: string | null,
    headerText: string | null
  ) {
    if (headerText && headerText !== this.lastHeaderText) {
      this.lastHeaderText = headerText;
      this.playTitleImpact(
        headerText === 'CYANIDE' || headerText === '150 SEEDS'
          ? 'warning'
          : 'neutral'
      );
    } else if (!headerText) {
      this.lastHeaderText = '';
    }

    if (cueId && cueId !== this.lastCueId) {
      this.lastCueId = cueId;
      this.playSeedTick();

      if (
        this.voiceoverEnabled &&
        cueText &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(cueText);
          utter.rate = 1.08;
          utter.pitch = 0.96;
          window.speechSynthesis.speak(utter);
        } catch {
          // Ignore speech synthesis errors in headless environments
        }
      }
    }
  }

  public stopAll() {
    this.lastCueId = '';
    this.lastHeaderText = '';
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }
}

export const soundEngine = new ProceduralSoundEngine();
