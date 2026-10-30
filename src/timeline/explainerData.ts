export type EnvironmentStage =
  | 'bedroom_night'
  | 'seed_lab'
  | 'hypoxia_street'
  | 'kitchen_day';

export type CharacterExpression =
  | 'curious'
  | 'chewing'
  | 'shocked'
  | 'dizzy'
  | 'confident'
  | 'happy';

export type CharacterProp =
  | 'whole_apple'
  | 'bitten_apple'
  | 'halved_apple_seeds'
  | 'crushed_seeds_vial'
  | 'coffee_mug';

export type TopHudMode =
  | { type: 'badge'; text: string; dotColor: 'amber' | 'red' | 'emerald' }
  | {
      type: 'bar';
      label: string;
      progress: number; // 0 to 1
      barColor: 'red' | 'amber' | 'emerald';
    };

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  text: string;
  words: WordTiming[];
}

export interface BigHeaderCue {
  text: string;
  start: number;
  end: number;
  showRedUnderline: boolean;
}

export interface CameraKeyframe {
  time: number;
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

export interface ExplainerChapter {
  id: string;
  index: number;
  title: string;
  shortLabel: string;
  startTime: number;
  endTime: number;
  stage: EnvironmentStage;
  expression: CharacterExpression;
  prop: CharacterProp;
  seedCellsFilledStart: number; // 0 to 30
  seedCellsFilledEnd: number;   // 0 to 30
  cyanideMg: number;
  cellularOxygenPct: number;
  summary: string;
}

export const TOTAL_DURATION = 30.0;
export const TOTAL_SEED_CELLS = 30; // Each cell = 5 crushed seeds (30 cells = 150 seeds = lethal dose)

function buildWords(text: string, start: number, end: number): WordTiming[] {
  const rawWords = text.trim().split(/\s+/);
  const duration = Math.max(0.1, end - start);
  const step = duration / rawWords.length;
  return rawWords.map((word, idx) => ({
    word,
    start: Number((start + idx * step).toFixed(3)),
    end: Number((start + (idx + 1) * step).toFixed(3)),
  }));
}

export const EXPLAINER_CHAPTERS: ExplainerChapter[] = [
  {
    id: 'hook',
    index: 1,
    title: '01. The Innocent Bite',
    shortLabel: '1 APPLE',
    startTime: 0,
    endTime: 3.2,
    stage: 'bedroom_night',
    expression: 'curious',
    prop: 'whole_apple',
    seedCellsFilledStart: 0,
    seedCellsFilledEnd: 1,
    cyanideMg: 0,
    cellularOxygenPct: 100,
    summary: 'How could a normal everyday apple actually kill a human?',
  },
  {
    id: 'seeds_secret',
    index: 2,
    title: '02. The Seed Core Secret',
    shortLabel: 'THE SEEDS',
    startTime: 3.2,
    endTime: 11.2,
    stage: 'bedroom_night',
    expression: 'shocked',
    prop: 'halved_apple_seeds',
    seedCellsFilledStart: 1,
    seedCellsFilledEnd: 8,
    cyanideMg: 12,
    cellularOxygenPct: 78,
    summary: 'Inside every apple are 5 to 8 black seeds packed with amygdalin.',
  },
  {
    id: 'cyanide_conversion',
    index: 3,
    title: '03. Amygdalin to Cyanide',
    shortLabel: 'CYANIDE',
    startTime: 11.2,
    endTime: 18.0,
    stage: 'seed_lab',
    expression: 'dizzy',
    prop: 'crushed_seeds_vial',
    seedCellsFilledStart: 8,
    seedCellsFilledEnd: 18,
    cyanideMg: 42,
    cellularOxygenPct: 38,
    summary: 'When chewed and digested, enzymes turn amygdalin into hydrogen cyanide.',
  },
  {
    id: 'lethal_threshold',
    index: 4,
    title: '04. The 150-Seed Lethal Dose',
    shortLabel: '150 SEEDS',
    startTime: 18.0,
    endTime: 23.4,
    stage: 'hypoxia_street',
    expression: 'dizzy',
    prop: 'crushed_seeds_vial',
    seedCellsFilledStart: 18,
    seedCellsFilledEnd: 30,
    cyanideMg: 70,
    cellularOxygenPct: 12,
    summary: 'Crushing 150 seeds—about 18 apple cores—starves your cells of oxygen.',
  },
  {
    id: 'safe_reality',
    index: 5,
    title: '05. Why You Survive',
    shortLabel: 'SAFE SHELL',
    startTime: 23.4,
    endTime: 30.0,
    stage: 'kitchen_day',
    expression: 'happy',
    prop: 'coffee_mug',
    seedCellsFilledStart: 30,
    seedCellsFilledEnd: 30,
    cyanideMg: 0,
    cellularOxygenPct: 100,
    summary: 'Swallowed whole, the tough seed shell passes through untouched.',
  },
];

export const DEFAULT_SUBTITLE_CUES: SubtitleCue[] = [
  {
    id: 'cue-1',
    start: 0.0,
    end: 1.5,
    text: 'How could a single fruit',
    words: buildWords('How could a single fruit', 0.0, 1.5),
  },
  {
    id: 'cue-2',
    start: 1.5,
    end: 3.1,
    text: 'actually kill a human?',
    words: buildWords('actually kill a human?', 1.5, 3.1),
  },
  {
    id: 'cue-3',
    start: 3.1,
    end: 4.9,
    text: 'The flesh is harmless.',
    words: buildWords('The flesh is harmless.', 3.1, 4.9),
  },
  {
    id: 'cue-4',
    start: 4.9,
    end: 7.5,
    text: 'But inside the core sit five black seeds',
    words: buildWords('But inside the core sit five black seeds', 4.9, 7.5),
  },
  {
    id: 'cue-5',
    start: 7.5,
    end: 9.6,
    text: 'loaded with a chemical called amygdalin.',
    words: buildWords('loaded with a chemical called amygdalin.', 7.5, 9.6),
  },
  {
    id: 'cue-6',
    start: 9.6,
    end: 11.2,
    text: "That's hydrogen cyanide.",
    words: buildWords("That's hydrogen cyanide.", 9.6, 11.2),
  },
  {
    id: 'cue-7',
    start: 11.2,
    end: 13.7,
    text: 'Chewing cracks the tough outer shell.',
    words: buildWords('Chewing cracks the tough outer shell.', 11.2, 13.7),
  },
  {
    id: 'cue-8',
    start: 13.7,
    end: 16.0,
    text: 'Stomach enzymes unlock the poison,',
    words: buildWords('Stomach enzymes unlock the poison,', 13.7, 16.0),
  },
  {
    id: 'cue-9',
    start: 16.0,
    end: 18.0,
    text: 'and block your cells from using oxygen.',
    words: buildWords('and block your cells from using oxygen.', 16.0, 18.0),
  },
  {
    id: 'cue-10',
    start: 18.0,
    end: 20.6,
    text: 'By one hundred fifty crushed seeds,',
    words: buildWords('By one hundred fifty crushed seeds,', 18.0, 20.6),
  },
  {
    id: 'cue-11',
    start: 20.6,
    end: 23.3,
    text: 'about eighteen cores, the dose turns lethal.',
    words: buildWords('about eighteen cores, the dose turns lethal.', 20.6, 23.3),
  },
  {
    id: 'cue-12',
    start: 23.3,
    end: 24.8,
    text: 'And if you swallow a seed whole?',
    words: buildWords('And if you swallow a seed whole?', 23.3, 24.8),
  },
  {
    id: 'cue-13',
    start: 24.8,
    end: 27.3,
    text: 'Its armor keeps every drop of toxin',
    words: buildWords('Its armor keeps every drop of toxin', 24.8, 27.3),
  },
  {
    id: 'cue-14',
    start: 27.3,
    end: 30.0,
    text: 'locked safely away from your body.',
    words: buildWords('locked safely away from your body.', 27.3, 30.0),
  },
];

export const BIG_HEADER_CUES: BigHeaderCue[] = [
  { text: 'THE SEED', start: 2.8, end: 4.8, showRedUnderline: true },
  { text: 'CYANIDE', start: 9.4, end: 11.2, showRedUnderline: false },
  { text: 'CRUSHED', start: 11.4, end: 13.6, showRedUnderline: true },
  { text: '150 SEEDS', start: 18.0, end: 20.4, showRedUnderline: true },
  { text: '18 CORES', start: 23.2, end: 25.0, showRedUnderline: true },
];

export const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  { time: 0.0, position: [0.0, 1.45, 4.3], lookAt: [0.0, 1.25, 0.0], fov: 38 },
  { time: 2.5, position: [0.0, 1.5, 3.2], lookAt: [0.0, 1.4, 0.0], fov: 36 },
  { time: 3.3, position: [0.15, 1.35, 4.7], lookAt: [0.0, 1.2, 0.0], fov: 40 },
  { time: 6.5, position: [-0.2, 1.55, 2.75], lookAt: [0.0, 1.45, 0.0], fov: 35 },
  { time: 9.5, position: [0.0, 1.6, 2.35], lookAt: [0.0, 1.52, 0.0], fov: 34 },
  { time: 11.3, position: [-0.3, 1.4, 4.2], lookAt: [0.0, 1.28, 0.0], fov: 39 },
  { time: 15.5, position: [0.25, 1.45, 3.5], lookAt: [0.0, 1.35, 0.0], fov: 37 },
  { time: 18.0, position: [0.0, 1.55, 3.1], lookAt: [0.0, 1.45, 0.0], fov: 36 },
  { time: 21.5, position: [0.0, 1.62, 2.45], lookAt: [0.0, 1.52, 0.0], fov: 34 },
  { time: 23.4, position: [-0.25, 1.42, 4.1], lookAt: [0.0, 1.28, 0.0], fov: 38 },
  { time: 27.5, position: [0.0, 1.56, 2.65], lookAt: [0.0, 1.48, 0.0], fov: 35 },
  { time: 30.0, position: [0.0, 1.58, 2.45], lookAt: [0.0, 1.5, 0.0], fov: 34 },
];

export interface FrameState {
  time: number;
  progress: number;
  chapter: ExplainerChapter;
  stage: EnvironmentStage;
  expression: CharacterExpression;
  prop: CharacterProp;
  topHud: TopHudMode;
  activeBigHeader: BigHeaderCue | null;
  activeSubtitle: SubtitleCue | null;
  activeWordIndex: number;
  filledSeedCells: number;
  crushedSeedsCount: number;
  cyanideMg: number;
  cellularOxygenPct: number;
  camera: {
    position: [number, number, number];
    lookAt: [number, number, number];
    fov: number;
  };
}

export function calculateCyanideStats(crushedSeeds: number): {
  amygdalinMg: number;
  hydrogenCyanideMg: number;
  lethalPercentage: number;
  appleCoresEquivalent: number;
} {
  const clampedSeeds = Math.max(0, Math.min(500, crushedSeeds));
  // Each apple seed weighs ~0.7g and contains ~2.1mg amygdalin -> yields ~0.45mg HCN
  const amygdalinMg = Number((clampedSeeds * 2.1).toFixed(1));
  const hydrogenCyanideMg = Number((clampedSeeds * 0.45).toFixed(2));
  // ~67.5mg HCN (150 seeds) is the standard textbook lethal threshold for a 70kg adult
  const lethalPercentage = Math.min(100, Math.round((clampedSeeds / 150) * 100));
  const appleCoresEquivalent = Number((clampedSeeds / 8).toFixed(1));
  return {
    amygdalinMg,
    hydrogenCyanideMg,
    lethalPercentage,
    appleCoresEquivalent,
  };
}

export function getTopHudForTime(time: number): TopHudMode {
  if (time < 3.2) {
    return { type: 'badge', text: '1 APPLE = 0 MG HCN', dotColor: 'amber' };
  }
  if (time < 9.6) {
    // Draining cellular oxygen / rising toxicity bar (matches DOPAMINE red bar in reference)
    const t = Math.max(0, Math.min(1, (time - 3.2) / (9.6 - 3.2)));
    const remaining = Math.max(0.15, 0.85 - t * 0.68);
    return {
      type: 'bar',
      label: 'CELL OXYGEN',
      progress: Number(remaining.toFixed(2)),
      barColor: 'red',
    };
  }
  if (time < 13.7) {
    return { type: 'badge', text: 'AMYGDALIN + ENZYMES', dotColor: 'red' };
  }
  if (time < 18.0) {
    return { type: 'badge', text: 'ATP BLOCKED — HYPOXIA', dotColor: 'red' };
  }
  if (time < 23.4) {
    // Rising cyanide load bar (matches REWARD amber bar in reference)
    const t = Math.max(0, Math.min(1, (time - 18.0) / (23.4 - 18.0)));
    const load = 0.25 + t * 0.72;
    return {
      type: 'bar',
      label: 'CYANIDE DOSE',
      progress: Number(load.toFixed(2)),
      barColor: 'amber',
    };
  }
  return { type: 'badge', text: 'INTACT SEED = 100% SAFE', dotColor: 'emerald' };
}

export function interpolateCameraAtTime(time: number): {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
} {
  const clamped = Math.max(0, Math.min(TOTAL_DURATION, time));
  let prev = CAMERA_KEYFRAMES[0];
  let next = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1];

  for (let i = 0; i < CAMERA_KEYFRAMES.length - 1; i++) {
    if (clamped >= CAMERA_KEYFRAMES[i].time && clamped <= CAMERA_KEYFRAMES[i + 1].time) {
      prev = CAMERA_KEYFRAMES[i];
      next = CAMERA_KEYFRAMES[i + 1];
      break;
    }
  }

  const span = next.time - prev.time;
  const rawAlpha = span > 0 ? (clamped - prev.time) / span : 0;
  // Smoothstep interpolation
  const alpha = rawAlpha * rawAlpha * (3 - 2 * rawAlpha);

  const lerp = (a: number, b: number) => Number((a + (b - a) * alpha).toFixed(4));

  return {
    position: [
      lerp(prev.position[0], next.position[0]),
      lerp(prev.position[1], next.position[1]),
      lerp(prev.position[2], next.position[2]),
    ],
    lookAt: [
      lerp(prev.lookAt[0], next.lookAt[0]),
      lerp(prev.lookAt[1], next.lookAt[1]),
      lerp(prev.lookAt[2], next.lookAt[2]),
    ],
    fov: lerp(prev.fov, next.fov),
  };
}

export function getFrameStateAtTime(
  rawTime: number,
  customSubtitles: SubtitleCue[] = DEFAULT_SUBTITLE_CUES
): FrameState {
  const time = Math.max(0, Math.min(TOTAL_DURATION, rawTime));
  const progress = time / TOTAL_DURATION;

  const chapter =
    EXPLAINER_CHAPTERS.find((c) => time >= c.startTime && time <= c.endTime) ||
    EXPLAINER_CHAPTERS[EXPLAINER_CHAPTERS.length - 1];

  const chapterSpan = Math.max(0.01, chapter.endTime - chapter.startTime);
  const chapterProgress = Math.max(0, Math.min(1, (time - chapter.startTime) / chapterSpan));

  const filledSeedCells = Math.round(
    chapter.seedCellsFilledStart +
      (chapter.seedCellsFilledEnd - chapter.seedCellsFilledStart) * chapterProgress
  );

  const crushedSeedsCount = filledSeedCells * 5;
  const stats = calculateCyanideStats(crushedSeedsCount);

  const activeBigHeader =
    BIG_HEADER_CUES.find((h) => time >= h.start && time <= h.end) || null;

  const activeSubtitle =
    customSubtitles.find((s) => time >= s.start && time < s.end) ||
    (time >= TOTAL_DURATION - 0.05 ? customSubtitles[customSubtitles.length - 1] : null);

  let activeWordIndex = 0;
  if (activeSubtitle && activeSubtitle.words.length > 0) {
    const foundIdx = activeSubtitle.words.findIndex(
      (w) => time >= w.start && time <= w.end
    );
    if (foundIdx !== -1) {
      activeWordIndex = foundIdx;
    } else if (time > activeSubtitle.words[activeSubtitle.words.length - 1].end) {
      activeWordIndex = activeSubtitle.words.length - 1;
    }
  }

  return {
    time,
    progress,
    chapter,
    stage: chapter.stage,
    expression: chapter.expression,
    prop: chapter.prop,
    topHud: getTopHudForTime(time),
    activeBigHeader,
    activeSubtitle,
    activeWordIndex,
    filledSeedCells,
    crushedSeedsCount,
    cyanideMg: stats.hydrogenCyanideMg,
    cellularOxygenPct:
      chapter.id === 'safe_reality'
        ? 100
        : Math.max(10, 100 - Math.round((filledSeedCells / TOTAL_SEED_CELLS) * 88)),
    camera: interpolateCameraAtTime(time),
  };
}

export interface VoiceoverBlock {
  id: string;
  blockNumber: number;
  chapterId: string;
  title: string;
  suggestedFileName: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  voiceDirection: string;
  cueIds: string[];
  scriptText: string;
}

export const VOICEOVER_BLOCKS: VoiceoverBlock[] = [
  {
    id: 'vo-block-1',
    blockNumber: 1,
    chapterId: 'hook',
    title: 'Block 01 — The Hook (1 Apple)',
    suggestedFileName: 'vo_01_hook.mp3',
    startTime: 0.0,
    endTime: 3.1,
    durationSeconds: 3.1,
    voiceDirection: 'Curious, punchy hook (like the reference video opening question)',
    cueIds: ['cue-1', 'cue-2'],
    scriptText: 'How could a single fruit actually kill a human?',
  },
  {
    id: 'vo-block-2',
    blockNumber: 2,
    chapterId: 'seeds_secret',
    title: 'Block 02 — The Seed Core Secret (Amygdalin)',
    suggestedFileName: 'vo_02_seeds.mp3',
    startTime: 3.1,
    endTime: 11.2,
    durationSeconds: 8.1,
    voiceDirection: 'Matter-of-fact start, building tension, sharp pause before "That\'s hydrogen cyanide."',
    cueIds: ['cue-3', 'cue-4', 'cue-5', 'cue-6'],
    scriptText:
      "The flesh is harmless. But inside the core sit five black seeds loaded with a chemical called amygdalin. That's hydrogen cyanide.",
  },
  {
    id: 'vo-block-3',
    blockNumber: 3,
    chapterId: 'cyanide_conversion',
    title: 'Block 03 — Crushing & Cellular Hypoxia',
    suggestedFileName: 'vo_03_cyanide.mp3',
    startTime: 11.2,
    endTime: 18.0,
    durationSeconds: 6.8,
    voiceDirection: 'Serious, scientific urgency explaining the stomach reaction',
    cueIds: ['cue-7', 'cue-8', 'cue-9'],
    scriptText:
      'Chewing cracks the tough outer shell. Stomach enzymes unlock the poison, and block your cells from using oxygen.',
  },
  {
    id: 'vo-block-4',
    blockNumber: 4,
    chapterId: 'lethal_threshold',
    title: 'Block 04 — The 150-Seed Lethal Dose',
    suggestedFileName: 'vo_04_150seeds.mp3',
    startTime: 18.0,
    endTime: 23.3,
    durationSeconds: 5.3,
    voiceDirection: 'Heavy emphasis on "one hundred fifty" and "eighteen cores"',
    cueIds: ['cue-10', 'cue-11'],
    scriptText:
      'By one hundred fifty crushed seeds, about eighteen cores, the dose turns lethal.',
  },
  {
    id: 'vo-block-5',
    blockNumber: 5,
    chapterId: 'safe_reality',
    title: 'Block 05 — Why Swallowing Whole Seeds Is Safe',
    suggestedFileName: 'vo_05_safe.mp3',
    startTime: 23.3,
    endTime: 30.0,
    durationSeconds: 6.7,
    voiceDirection: 'Lifting the tension, warm and reassuring finale',
    cueIds: ['cue-12', 'cue-13', 'cue-14'],
    scriptText:
      'And if you swallow a seed whole? Its armor keeps every drop of toxin locked safely away from your body.',
  },
];

export const FULL_VOICEOVER_SCRIPT = VOICEOVER_BLOCKS.map(
  (b) => b.scriptText
).join(' ');

