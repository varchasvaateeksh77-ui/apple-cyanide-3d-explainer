/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Upload,
} from 'lucide-react';
import {
  TOTAL_DURATION,
  EXPLAINER_CHAPTERS,
  DEFAULT_SUBTITLE_CUES,
  VOICEOVER_BLOCKS,
  FULL_VOICEOVER_SCRIPT,
  SubtitleCue,
  getFrameStateAtTime,
  calculateCyanideStats,
} from './timeline/explainerData';
import { ExplainerCanvas } from './three/ExplainerCanvas';
import { soundEngine } from './utils/soundEngine';

declare global {
  interface Window {
    __timelines?: Record<string, gsap.core.Timeline>;
    __seekExplainer?: (seconds: number) => void;
  }
}

type StudioViewMode = 'stage' | 'compare' | 'script' | 'biochem';
type CameraPreset = 'auto' | 'closeup' | 'wide' | 'molecule';

export default function App() {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [viewMode, setViewMode] = useState<StudioViewMode>('stage');
  const [scriptSubTab, setScriptSubTab] = useState<'blocks' | 'cues'>('blocks');
  const [copiedId, setCopiedId] = useState<string>('');
  const [uploadedAudioUrls, setUploadedAudioUrls] = useState<Record<string, string>>({});
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('auto');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>(DEFAULT_SUBTITLE_CUES);
  const [customSeedInput, setCustomSeedInput] = useState<number>(150);
  const [isRecordingWebm, setIsRecordingWebm] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [isGeneratingVo, setIsGeneratingVo] = useState<boolean>(false);
  const [isPushingGithub, setIsPushingGithub] = useState<boolean>(false);
  const [pipelineInfo, setPipelineInfo] = useState<{
    fishAudioVoiceId: string;
    fishAudioVoiceName: string;
    openRouterModel: string;
    openRouterConfigured: boolean;
    fishAudioConfigured: boolean;
    githubConfigured: boolean;
    githubRepo: string;
    repoUrl?: string;
  }>({
    fishAudioVoiceId: 'bf322df2096a46f18c579d0baa36f41d',
    fishAudioVoiceName: 'Adrian (Fish Official Documentary Narrator)',
    openRouterModel: 'fish-audio/s2.1-pro:free',
    openRouterConfigured: false,
    fishAudioConfigured: false,
    githubConfigured: false,
    githubRepo: 'apple-cyanide-3d-explainer',
  });

  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const refVideoElement = useRef<HTMLVideoElement | null>(null);
  const gsTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const playheadProxyRef = useRef<{ t: number }>({ t: 0 });
  const audioElementsRef = useRef<Record<string, HTMLAudioElement | null>>({});
  const masterSfxAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastActiveBlockIdRef = useRef<string>('');

  // Compute deterministic frame state for current timeline time
  const frameState = useMemo(
    () => getFrameStateAtTime(currentTime, subtitles),
    [currentTime, subtitles]
  );

  // Sync procedural audio cues & custom uploaded voiceover blocks
  useEffect(() => {
    soundEngine.sfxEnabled = sfxEnabled;
    soundEngine.voiceoverEnabled = voiceEnabled;
  }, [sfxEnabled, voiceEnabled]);

  useEffect(() => {
    if (isPlaying) {
      soundEngine.syncTimelineAudio(
        frameState.activeSubtitle?.id || null,
        frameState.activeSubtitle?.text || null,
        frameState.activeBigHeader?.text || null
      );

      const activeBlock = VOICEOVER_BLOCKS.find(
        (b) => currentTime >= b.startTime && currentTime < b.endTime
      );
      if (activeBlock && activeBlock.id !== lastActiveBlockIdRef.current) {
        lastActiveBlockIdRef.current = activeBlock.id;
        const blockAudio = audioElementsRef.current[activeBlock.id];
        if (blockAudio && uploadedAudioUrls[activeBlock.id]) {
          blockAudio.currentTime = Math.max(0, currentTime - activeBlock.startTime);
          blockAudio.play().catch(() => {});
        }
      }

      if (masterSfxAudioRef.current) {
        if (sfxEnabled) {
          if (Math.abs(masterSfxAudioRef.current.currentTime - currentTime) > 0.35) {
            masterSfxAudioRef.current.currentTime = currentTime;
          }
          if (masterSfxAudioRef.current.paused) {
            masterSfxAudioRef.current.play().catch(() => {});
          }
        } else if (!masterSfxAudioRef.current.paused) {
          masterSfxAudioRef.current.pause();
        }
      }
    } else {
      Object.values(audioElementsRef.current).forEach((el) => {
        if (el && !el.paused) el.pause();
      });
      if (masterSfxAudioRef.current && !masterSfxAudioRef.current.paused) {
        masterSfxAudioRef.current.pause();
      }
    }
  }, [
    isPlaying,
    currentTime,
    sfxEnabled,
    uploadedAudioUrls,
    frameState.activeSubtitle?.id,
    frameState.activeSubtitle?.text,
    frameState.activeBigHeader?.text,
  ]);

  // Register GSAP timeline for HyperFrames contract (`window.__timelines["apple-cyanide-explainer"]`)
  useEffect(() => {
    const proxy = playheadProxyRef.current;
    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => {
        setCurrentTime(Number(proxy.t.toFixed(3)));
      },
    });
    tl.to(proxy, {
      t: TOTAL_DURATION,
      duration: TOTAL_DURATION,
      ease: 'none',
    });

    gsTimelineRef.current = tl;
    window.__timelines = window.__timelines || {};
    window.__timelines['apple-cyanide-explainer'] = tl;
    window.__seekExplainer = (sec: number) => {
      const clamped = Math.max(0, Math.min(TOTAL_DURATION, sec));
      tl.seek(clamped, false);
      setCurrentTime(clamped);
    };

    return () => {
      tl.kill();
    };
  }, []);

  // Load server-side pipeline status & any pre-generated Fish Audio voiceover files
  useEffect(() => {
    fetch('/api/pipeline-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setPipelineInfo((prev) => ({
          ...prev,
          fishAudioVoiceId: data.fishAudioVoiceId || prev.fishAudioVoiceId,
          fishAudioVoiceName: data.fishAudioVoiceName || prev.fishAudioVoiceName,
          openRouterModel: data.openRouterModel || prev.openRouterModel,
          openRouterConfigured: Boolean(data.openRouterConfigured),
          fishAudioConfigured: Boolean(data.fishAudioConfigured),
          githubConfigured: Boolean(data.githubConfigured),
          githubRepo: data.githubRepo || prev.githubRepo,
        }));
        if (
          data.generatedAudioUrls &&
          Object.keys(data.generatedAudioUrls).length > 0
        ) {
          setUploadedAudioUrls((prev) => ({
            ...data.generatedAudioUrls,
            ...prev,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerateFishVoiceovers = async () => {
    if (isGeneratingVo) return;
    setIsGeneratingVo(true);
    setExportStatus(
      `Generating 5 voiceovers via Fish Audio 2.1 Pro (Voice ID: ${pipelineInfo.fishAudioVoiceId})...`
    );
    try {
      const res = await fetch('/api/generate-voiceovers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: pipelineInfo.fishAudioVoiceId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setExportStatus(data.error || 'Voiceover synthesis failed.');
      } else {
        setUploadedAudioUrls((prev) => ({
          ...prev,
          ...(data.generatedAudioUrls || {}),
        }));
        setExportStatus(
          `All 5 blocks generated & linked via ${data.provider}!`
        );
      }
    } catch {
      setExportStatus('Could not reach /api/generate-voiceovers.');
    } finally {
      setIsGeneratingVo(false);
    }
  };

  const handlePushToGithub = async () => {
    if (isPushingGithub) return;
    setIsPushingGithub(true);
    setExportStatus(`Pushing project & instructions.md / memory.md to GitHub...`);
    try {
      const res = await fetch('/api/push-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: pipelineInfo.githubRepo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setExportStatus(data.error || 'GitHub push failed.');
      } else {
        setPipelineInfo((prev) => ({ ...prev, repoUrl: data.repoUrl }));
        setExportStatus(`Pushed ${data.filesCommitted} files to ${data.repoUrl}`);
      }
    } catch {
      setExportStatus('Could not reach /api/push-github.');
    } finally {
      setIsPushingGithub(false);
    }
  };

  // Advance playhead smoothly when playing (throttled to ~20Hz React state updates per Ultra-Mode 3D rules)
  useEffect(() => {
    if (!isPlaying) return;

    let lastTick = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const dt = ((now - lastTick) / 1000) * playbackRate;
      lastTick = now;

      setCurrentTime((prev) => {
        const next = prev + dt;
        if (next >= TOTAL_DURATION) {
          return 0; // Loop seamlessly like a vertical short
        }
        if (gsTimelineRef.current) {
          gsTimelineRef.current.seek(next, false);
        }
        return Number(next.toFixed(3));
      });
    }, 50);

    return () => window.clearInterval(interval);
  }, [isPlaying, playbackRate]);

  // Keyboard shortcuts: Space (Play/Pause), H (Collapse/Expand Bottom Dock)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSeek = (newTime: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_DURATION, newTime));
    setCurrentTime(clamped);
    if (gsTimelineRef.current) {
      gsTimelineRef.current.seek(clamped, false);
    }
    if (refVideoElement.current) {
      try {
        refVideoElement.current.currentTime = clamped;
      } catch {
        // Ignore video seek errors
      }
    }
  };

  const handleSubtitleChange = (id: string, newText: string) => {
    setSubtitles((prev) =>
      prev.map((cue) => {
        if (cue.id !== id) return cue;
        const rawWords = newText.trim().split(/\s+/).filter(Boolean);
        const wordsList = rawWords.length > 0 ? rawWords : ['...'];
        const span = Math.max(0.1, cue.end - cue.start);
        const step = span / wordsList.length;
        return {
          ...cue,
          text: newText,
          words: wordsList.map((w, idx) => ({
            word: w,
            start: Number((cue.start + idx * step).toFixed(3)),
            end: Number((cue.start + (idx + 1) * step).toFixed(3)),
          })),
        };
      })
    );
  };

  const handleExportHyperFramesTemplate = () => {
    const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>How Can an Apple Kill a Human? — HyperFrames 9:16 Composition</title>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
</head>
<body data-composition-id="apple-cyanide-explainer" data-duration="30" data-width="1080" data-height="1920" data-fps="30">
  <div id="root" data-track-kind="graphics">
    ${subtitles
      .map(
        (c, idx) =>
          `<div id="${c.id}" class="clip" data-start="${c.start}" data-duration="${Number(
            (c.end - c.start).toFixed(2)
          )}" data-track-index="${idx}">${c.text}</div>`
      )
      .join('\n    ')}
  </div>
  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
    tl.to("#root", { duration: 30 });
    window.__timelines["apple-cyanide-explainer"] = tl;
  </script>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apple-cyanide-hyperframes.html';
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('HyperFrames HTML composition exported.');
    window.setTimeout(() => setExportStatus(''), 3500);
  };

  const handleRecordWebmClip = () => {
    const canvas = webglCanvasRef.current;
    if (!canvas || isRecordingWebm) return;
    if (typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      handleExportHyperFramesTemplate();
      return;
    }

    try {
      setIsRecordingWebm(true);
      setExportStatus('Recording 5s 3D WebM preview...');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'how-apples-kill-humans-3d.webm';
        a.click();
        URL.revokeObjectURL(url);
        setIsRecordingWebm(false);
        setExportStatus('3D WebM video downloaded.');
        window.setTimeout(() => setExportStatus(''), 3500);
      };
      recorder.start();
      window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 5000);
    } catch {
      setIsRecordingWebm(false);
      handleExportHyperFramesTemplate();
    }
  };

  const customDoseStats = useMemo(
    () => calculateCyanideStats(customSeedInput),
    [customSeedInput]
  );

  return (
    <div
      className="min-h-screen w-full bg-[#090d16] text-slate-100 flex flex-col justify-between relative overflow-hidden"
      data-state={isPlaying ? 'playing' : 'paused'}
      data-chapter={frameState.chapter.id}
      data-composition-id="apple-cyanide-explainer"
      data-duration="30"
    >
      {/* =====================================================================
          STRICT 3-ZONE TOP BAR CONTRACT
      ===================================================================== */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/80 bg-[#090d16] z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#stage"
          onClick={(e) => {
            e.preventDefault();
            setViewMode('stage');
          }}
          className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 font-display"
        >
          HyperFrames 3D
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Workspace Views"
          className="flex items-center gap-6 text-sm font-medium text-slate-400"
        >
          <button
            type="button"
            onClick={() => setViewMode('stage')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'stage'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2'
                : ''
            }`}
          >
            3D Stage
          </button>
          <button
            type="button"
            onClick={() => setViewMode('compare')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'compare'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2'
                : ''
            }`}
          >
            Reference Match
          </button>
          <button
            type="button"
            onClick={() => setViewMode('script')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'script'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2'
                : ''
            }`}
          >
            Script & Timing
          </button>
          <button
            type="button"
            onClick={() => setViewMode('biochem')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'biochem'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2'
                : ''
            }`}
          >
            Dose Calculator
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleExportHyperFramesTemplate}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Export HyperFrames
          </button>
        </div>
      </header>

      {/* =====================================================================
          MAIN WORKSPACE AREA (Unobstructed 9:16 3D Viewport + Side-by-Side Views)
      ===================================================================== */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 relative z-10">
        {exportStatus && (
          <div
            role="status"
            className="mb-2 px-3 py-1 rounded-md bg-slate-800 text-amber-300 text-xs font-medium border border-slate-700"
          >
            {exportStatus}
          </div>
        )}

        <div className="w-full max-w-[1280px] flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* PRIMARY 9:16 VERTICAL 3D EXPLAINER VIEWPORT */}
          <div className="flex flex-col items-center">
            <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                {frameState.chapter.title}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-amber-400">
                {currentTime.toFixed(1)}s / {TOTAL_DURATION.toFixed(1)}s
              </span>
              <span aria-hidden="true">·</span>
              <span>Voiceover-Ready 9:16 Master</span>
            </div>

            <div
              className={`transition-all duration-200 shrink-0 ${
                dockCollapsed
                  ? 'w-[396px] h-[704px]'
                  : 'w-[315px] h-[560px]'
              }`}
            >
              <ExplainerCanvas
                frameState={frameState}
                isPlaying={isPlaying}
                cameraPresetOverride={cameraPreset}
                onCanvasReady={(canvas) => {
                  webglCanvasRef.current = canvas;
                }}
              />
            </div>
          </div>

          {/* SECONDARY PANEL (Only visible when Compare, Script, or Biochem is selected) */}
          {viewMode === 'compare' && (
            <div
              className="flex flex-col items-center"
              data-testid="reference-comparison-panel"
            >
              <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">
                  Attached Reference Video
                </span>
                <span aria-hidden="true">·</span>
                <span>3D Low-Poly Style & HUD Benchmark</span>
              </div>
              <div
                className={`rounded-2xl overflow-hidden border border-slate-700/70 bg-slate-950 shadow-2xl relative shrink-0 ${
                  dockCollapsed
                    ? 'w-[396px] h-[704px]'
                    : 'w-[315px] h-[560px]'
                }`}
              >
                <video
                  ref={refVideoElement}
                  src="/assets/aistudio/What_if_you_stopped_gooning_for_a_whole_month__MP4__1b5a4199.mp4"
                  className="w-full h-full object-cover"
                  controls
                  muted
                  playsInline
                  loop
                />
              </div>
            </div>
          )}

          {viewMode === 'script' && (
            <section
              aria-label="Voiceover Blocks and Subtitle Cue Studio"
              className="w-full max-w-xl h-[560px] bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
              data-testid="script-editor-panel"
            >
              <div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white font-display">
                      Voiceover Blocks & Audio Integrator
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Copy each block to generate your voiceover, then attach the audio here or send the files in chat.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setScriptSubTab('blocks')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        scriptSubTab === 'blocks'
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      5 VO Blocks
                    </button>
                    <button
                      type="button"
                      onClick={() => setScriptSubTab('cues')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        scriptSubTab === 'cues'
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      14 Word Cues
                    </button>
                  </div>
                </div>

                {scriptSubTab === 'blocks' ? (
                  <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[395px] pr-1">
                    {/* Automated Fish Audio 2.1 Pro (OpenRouter) + GitHub Pipeline Card */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Fish Audio 2.1 Pro Narrator:</span>
                            <span className="text-amber-400 font-mono">
                              Adrian ({pipelineInfo.fishAudioVoiceId.slice(0, 10)}…)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                            Voice ID: {pipelineInfo.fishAudioVoiceId} · Model: {pipelineInfo.openRouterModel}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(pipelineInfo.fishAudioVoiceId);
                            setCopiedId('voice-id');
                            window.setTimeout(() => setCopiedId(''), 2000);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {copiedId === 'voice-id' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>ID Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Voice ID</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>
                            OpenRouter:{' '}
                            <strong
                              className={
                                pipelineInfo.openRouterConfigured ||
                                pipelineInfo.fishAudioConfigured
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }
                            >
                              {pipelineInfo.openRouterConfigured ||
                              pipelineInfo.fishAudioConfigured
                                ? 'Secret Saved'
                                : 'Add in AI Studio Secrets'}
                            </strong>
                          </span>
                          <span>·</span>
                          <span>
                            GitHub:{' '}
                            <strong
                              className={
                                pipelineInfo.githubConfigured
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }
                            >
                              {pipelineInfo.githubConfigured
                                ? 'Token Saved'
                                : 'Add in Secrets'}
                            </strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleGenerateFishVoiceovers}
                            disabled={isGeneratingVo}
                            className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {isGeneratingVo
                              ? 'Generating 5 Blocks...'
                              : 'Auto-Generate VO (Fish 2.1)'}
                          </button>
                          <button
                            type="button"
                            onClick={handlePushToGithub}
                            disabled={isPushingGithub}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {isPushingGithub ? 'Pushing...' : 'Push to GitHub'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Full 30s Master Script Copy Bar */}
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-400/30 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-amber-400">
                          Full 30.0s Continuous Voiceover Script (76 words)
                        </div>
                        <p className="text-xs text-slate-300 truncate mt-0.5">
                          {FULL_VOICEOVER_SCRIPT}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(FULL_VOICEOVER_SCRIPT);
                          setCopiedId('full-script');
                          window.setTimeout(() => setCopiedId(''), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedId === 'full-script' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Full</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Full 30s</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 5 Individual Timed Chapter Voiceover Blocks */}
                    {VOICEOVER_BLOCKS.map((block) => {
                      const isCurrentBlock =
                        currentTime >= block.startTime && currentTime < block.endTime;
                      const hasAudio = Boolean(uploadedAudioUrls[block.id]);

                      return (
                        <div
                          key={block.id}
                          className={`p-3 rounded-xl border transition-colors ${
                            isCurrentBlock
                              ? 'bg-slate-800/90 border-amber-400/60'
                              : 'bg-slate-950/60 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <button
                              type="button"
                              onClick={() => handleSeek(block.startTime + 0.05)}
                              className="text-xs font-mono font-bold text-amber-400 hover:underline cursor-pointer tabular-nums text-left"
                            >
                              {block.title} · {block.startTime.toFixed(1)}s–{block.endTime.toFixed(1)}s ({block.durationSeconds.toFixed(1)}s)
                            </button>
                            <span className="text-[11px] font-mono text-slate-400">
                              {block.suggestedFileName}
                            </span>
                          </div>

                          <p className="text-sm font-medium text-white bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 select-all">
                            {block.scriptText}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400 truncate">
                              Tone: {block.voiceDirection}
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(block.scriptText);
                                  setCopiedId(block.id);
                                  window.setTimeout(() => setCopiedId(''), 2000);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                {copiedId === block.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Block {block.blockNumber}</span>
                                  </>
                                )}
                              </button>

                              <label
                                htmlFor={`audio-upload-${block.id}`}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                                  hasAudio
                                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                }`}
                              >
                                <Upload className="w-3 h-3" />
                                <span>{hasAudio ? 'Audio Linked' : 'Attach Audio'}</span>
                                <input
                                  id={`audio-upload-${block.id}`}
                                  type="file"
                                  accept="audio/*"
                                  className="sr-only"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const url = URL.createObjectURL(file);
                                    setUploadedAudioUrls((prev) => ({
                                      ...prev,
                                      [block.id]: url,
                                    }));
                                  }}
                                />
                              </label>
                            </div>
                          </div>

                          {hasAudio && (
                            <audio
                              id={`audio-${block.id}`}
                              ref={(el) => {
                                audioElementsRef.current[block.id] = el;
                              }}
                              src={uploadedAudioUrls[block.id]}
                              className="hidden"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 overflow-y-auto max-h-[395px] pr-1">
                    {subtitles.map((cue, idx) => {
                      const isActive = frameState.activeSubtitle?.id === cue.id;
                      return (
                        <div
                          key={cue.id}
                          className={`p-2.5 rounded-xl border transition-colors ${
                            isActive
                              ? 'bg-slate-800/90 border-amber-400/60'
                              : 'bg-slate-950/60 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <button
                              type="button"
                              onClick={() => handleSeek(cue.start + 0.05)}
                              className="text-xs font-mono font-bold text-amber-400 hover:underline cursor-pointer tabular-nums"
                            >
                              Cue {String(idx + 1).padStart(2, '0')} · {cue.start.toFixed(1)}s – {cue.end.toFixed(1)}s
                            </button>
                            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                              {cue.words.length} words
                            </span>
                          </div>
                          <label htmlFor={`input-${cue.id}`} className="sr-only">
                            Subtitle Cue {idx + 1}
                          </label>
                          <input
                            id={`input-${cue.id}`}
                            type="text"
                            value={cue.text}
                            onChange={(e) => handleSubtitleChange(cue.id, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-400">
                <span className="truncate">
                  5/5 Paced VO Blocks + 10 Real Foley SFX Compiled (`finished output/`)
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="/assets/master/how_apples_kill_humans_final.mp4"
                    download="how_apples_kill_humans_final.mp4"
                    className="px-3 py-1.5 font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Download Final 30s MP4
                  </a>
                  <button
                    type="button"
                    onClick={handleRecordWebmClip}
                    disabled={isRecordingWebm}
                    className="px-3 py-1.5 font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {isRecordingWebm ? 'Recording...' : 'Capture 5s WebM'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {viewMode === 'biochem' && (
            <section
              aria-label="Apple Seed Cyanide Toxicology Calculator"
              className="w-full max-w-xl h-[560px] bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between overflow-y-auto"
              data-testid="biochem-calculator-panel"
            >
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white font-display">
                    Apple Seed Cyanide Toxicology
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Why apple flesh is 100% safe, and how chewed apple seeds release hydrogen cyanide (HCN) inside the human stomach.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="crushed-seeds-slider"
                      className="text-sm font-semibold text-slate-200"
                    >
                      Interactive Crushed Seeds Simulator
                    </label>
                    <span className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                      {customSeedInput} Crushed Seeds
                    </span>
                  </div>
                  <input
                    id="crushed-seeds-slider"
                    type="range"
                    min={0}
                    max={240}
                    step={5}
                    value={customSeedInput}
                    onChange={(e) => setCustomSeedInput(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1 tabular-nums">
                    <span>0 Seeds (1 Apple Flesh)</span>
                    <span>75 Seeds (~9 Cores)</span>
                    <span>150 Seeds (Lethal Threshold)</span>
                    <span>240 Seeds</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-xs text-slate-400">Amygdalin Released</div>
                    <div
                      className="text-xl font-bold text-white font-mono mt-0.5 tabular-nums"
                      data-testid="calc-amygdalin"
                    >
                      {customDoseStats.amygdalinMg} mg
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Cyanogenic glycoside in seed endosperm
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-xs text-slate-400">Hydrogen Cyanide (HCN)</div>
                    <div
                      className="text-xl font-bold text-red-400 font-mono mt-0.5 tabular-nums"
                      data-testid="calc-hcn"
                    >
                      {customDoseStats.hydrogenCyanideMg} mg
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Lethal adult oral dose: ~50–70 mg
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-xs text-slate-400">Whole Apple Cores</div>
                    <div className="text-xl font-bold text-amber-400 font-mono mt-0.5 tabular-nums">
                      ~{customDoseStats.appleCoresEquivalent} apples
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Assuming ~8 seeds per apple core
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-xs text-slate-400">Lethal Dose Risk</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5 tabular-nums">
                      {customDoseStats.lethalPercentage}%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {customDoseStats.lethalPercentage >= 100
                        ? 'Critical cytochrome c oxidase inhibition'
                        : customDoseStats.lethalPercentage >= 40
                        ? 'Moderate hypoxia & dizziness'
                        : 'Detoxified by rhodanese liver enzyme'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                  <p>
                    <strong className="text-white">01. Intact Seed Coat Protection:</strong>{' '}
                    Swallowing whole apple seeds is harmless because the tough outer testa resists stomach acid and digestive enzymes.
                  </p>
                  <p>
                    <strong className="text-white">02. Enzymatic Hydrolysis:</strong>{' '}
                    When seeds are thoroughly chewed or blended, beta-glucosidase enzymes contact amygdalin and cleave it into benzaldehyde, glucose, and toxic hydrogen cyanide (HCN).
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Jump 3D Stage to matching dose:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSeedInput(0);
                      handleSeek(1.0);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    0 Seeds (Safe)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSeedInput(65);
                      handleSeek(14.0);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    65 Seeds (Lab)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSeedInput(150);
                      handleSeek(20.5);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    150 Seeds (Lethal)
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* =====================================================================
          UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Zero Viewport Occlusion)
      ===================================================================== */}
      <footer
        className="w-full px-4 pb-3 pt-1 flex flex-col items-center z-30"
        data-testid="bottom-control-dock"
      >
        <div className="w-full max-w-[940px] flex flex-col items-center">
          {/* Collapse / Expand Cinema Toggle Button */}
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            aria-expanded={!dockCollapsed}
            className="mb-1.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white shadow-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Controls (H)</span>
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-2xl space-y-2.5">
              {/* Row 1: Timeline Scrubber & Chapter Pills */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    aria-label={isPlaying ? 'Pause Video' : 'Play Video'}
                    className="w-8 h-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSeek(0)}
                    aria-label="Restart Video"
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex flex-col">
                    <label htmlFor="timeline-scrubber" className="sr-only">
                      Timeline Scrubber (Seconds)
                    </label>
                    <input
                      id="timeline-scrubber"
                      type="range"
                      min={0}
                      max={TOTAL_DURATION}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => handleSeek(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <span
                    className="text-xs font-mono font-bold text-slate-200 tabular-nums whitespace-nowrap shrink-0"
                    data-testid="timeline-readout"
                  >
                    {currentTime.toFixed(1)}s / 30.0s
                  </span>
                </div>

                {/* 5 Interactive Chapter Jump Buttons */}
                <div className="grid grid-cols-5 gap-1.5">
                  {EXPLAINER_CHAPTERS.map((chap) => {
                    const isActive = frameState.chapter.id === chap.id;
                    return (
                      <button
                        key={chap.id}
                        type="button"
                        onClick={() => handleSeek(chap.startTime + 0.05)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors truncate cursor-pointer ${
                          isActive
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {chap.index}. {chap.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Camera Rig Presets, Speed, Audio & View Mode Controls */}
              <div className="pt-2 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Camera Rig Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(
                    [
                      { id: 'auto', label: 'Auto Camera' },
                      { id: 'closeup', label: 'Face Close-Up' },
                      { id: 'wide', label: 'Wide Room' },
                      { id: 'molecule', label: 'Prop Macro' },
                    ] as const
                  ).map((cam) => (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => setCameraPreset(cam.id)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        cameraPreset === cam.id
                          ? 'bg-slate-800 text-amber-400'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cam.label}
                    </button>
                  ))}
                </div>

                {/* Speed & Audio Toggles */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {[0.5, 1, 1.5].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setPlaybackRate(spd)}
                        className={`px-2 py-1 rounded font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          playbackRate === spd
                            ? 'bg-slate-800 text-amber-400 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSfxEnabled((s) => !s)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      sfxEnabled
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {sfxEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5" />
                    )}
                    <span>SFX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoiceEnabled((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      voiceEnabled
                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {voiceEnabled ? (
                      <Mic className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5" />
                    )}
                    <span>{voiceEnabled ? 'Synth VO On' : 'VO Muted (Post-VO)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </footer>
      <audio
        ref={masterSfxAudioRef}
        src="/assets/master/sfx_compiled_30s.mp3"
        className="hidden"
        loop
      />
    </div>
  );
}
