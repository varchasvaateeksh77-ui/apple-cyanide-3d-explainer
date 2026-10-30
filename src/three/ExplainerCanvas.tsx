import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  FrameState,
  TOTAL_SEED_CELLS,
  EnvironmentStage,
} from '../timeline/explainerData';
import { createStudioMaterialLibrary } from './proceduralMaterials';
import {
  createHeroCharacter,
  createEnvironmentStages,
} from './proceduralModels';

interface ExplainerCanvasProps {
  frameState: FrameState;
  isPlaying: boolean;
  cameraPresetOverride: 'auto' | 'closeup' | 'wide' | 'molecule';
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const STAGE_ATMOSPHERE: Record<
  EnvironmentStage,
  { bgHex: number; fogHex: number; keyIntensity: number; hemiIntensity: number }
> = {
  bedroom_night: {
    bgHex: 0x243447,
    fogHex: 0x243447,
    keyIntensity: 1.55,
    hemiIntensity: 0.75,
  },
  seed_lab: {
    bgHex: 0x111827,
    fogHex: 0x111827,
    keyIntensity: 1.85,
    hemiIntensity: 0.65,
  },
  hypoxia_street: {
    bgHex: 0xdbeafe,
    fogHex: 0xdbeafe,
    keyIntensity: 1.9,
    hemiIntensity: 1.1,
  },
  kitchen_day: {
    bgHex: 0xfef3c7,
    fogHex: 0xfef3c7,
    keyIntensity: 2.1,
    hemiIntensity: 1.25,
  },
};

export const ExplainerCanvas: React.FC<ExplainerCanvasProps> = ({
  frameState,
  isPlaying,
  cameraPresetOverride,
  onCanvasReady,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const frameStateRef = useRef<FrameState>(frameState);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const cameraPresetRef = useRef(cameraPresetOverride);

  frameStateRef.current = frameState;
  isPlayingRef.current = isPlaying;
  cameraPresetRef.current = cameraPresetOverride;

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software-WebGL Guard per Three.js skill specification
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 405;
    const height = container.clientHeight || 720;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    if (onCanvasReady) {
      onCanvasReady(renderer.domElement);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x243447);
    scene.fog = new THREE.FogExp2(0x243447, 0.065);

    // 2. Studio Environment Reflection via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 45);
    camera.position.set(0, 1.45, 4.3);
    camera.lookAt(0, 1.25, 0);

    // 3. Balanced 3-Point Warm/Cool Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.85);
    hemiLight.position.set(0, 8, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.65);
    keyLight.position.set(3.2, 5.5, 4.2);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      const d = 4.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 18;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    fillLight.position.set(-3.5, 2.8, 3.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfde68a, 0.65);
    rimLight.position.set(0, 3.8, -3.5);
    scene.add(rimLight);

    // Build Procedural Materials, Hero Character, and Environment Stages
    const mats = createStudioMaterialLibrary(renderer, isSoftwareGl);
    const heroRig = createHeroCharacter(mats);
    const envRig = createEnvironmentStages(mats);

    scene.add(envRig.root);
    scene.add(heroRig.root);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pre-allocated vectors for zero-GC render loop
    const _camPos = new THREE.Vector3(0, 1.45, 4.3);
    const _lookAt = new THREE.Vector3(0, 1.25, 0);
    const _targetCamPos = new THREE.Vector3();
    const _targetLookAt = new THREE.Vector3();
    const _bgColor = new THREE.Color(0x243447);
    const _targetBgColor = new THREE.Color();

    let frameId = 0;
    let lastClock = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const now = performance.now();
      const dt = Math.min(0.1, Math.max(0.001, (now - lastClock) / 1000));
      lastClock = now;

      const st = frameStateRef.current;
      const preset = cameraPresetRef.current;

      // Determine camera target based on preset override or timeline keyframe
      if (preset === 'closeup') {
        _targetCamPos.set(0, 1.62, 2.25);
        _targetLookAt.set(0, 1.54, 0);
      } else if (preset === 'wide') {
        _targetCamPos.set(0.15, 1.42, 4.85);
        _targetLookAt.set(0, 1.15, 0);
      } else if (preset === 'molecule') {
        _targetCamPos.set(0.38, 1.32, 2.15);
        _targetLookAt.set(0.15, 1.18, 0.1);
      } else {
        _targetCamPos.set(...st.camera.position);
        _targetLookAt.set(...st.camera.lookAt);
      }

      // Exponential damping for silky-smooth camera movement
      const dampLambda = 7.5;
      _camPos.x = THREE.MathUtils.damp(_camPos.x, _targetCamPos.x, dampLambda, dt);
      _camPos.y = THREE.MathUtils.damp(_camPos.y, _targetCamPos.y, dampLambda, dt);
      _camPos.z = THREE.MathUtils.damp(_camPos.z, _targetCamPos.z, dampLambda, dt);

      _lookAt.x = THREE.MathUtils.damp(_lookAt.x, _targetLookAt.x, dampLambda, dt);
      _lookAt.y = THREE.MathUtils.damp(_lookAt.y, _targetLookAt.y, dampLambda, dt);
      _lookAt.z = THREE.MathUtils.damp(_lookAt.z, _targetLookAt.z, dampLambda, dt);

      camera.position.copy(_camPos);
      camera.lookAt(_lookAt);
      camera.fov = THREE.MathUtils.damp(camera.fov, st.camera.fov, dampLambda, dt);
      camera.updateProjectionMatrix();

      // Update atmosphere & lighting smoothly per stage
      const atm = STAGE_ATMOSPHERE[st.stage];
      _targetBgColor.setHex(atm.bgHex);
      _bgColor.lerp(_targetBgColor, 1 - Math.exp(-5 * dt));
      scene.background = _bgColor;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(_bgColor);
      }
      keyLight.intensity = THREE.MathUtils.damp(
        keyLight.intensity,
        atm.keyIntensity,
        5,
        dt
      );
      hemiLight.intensity = THREE.MathUtils.damp(
        hemiLight.intensity,
        atm.hemiIntensity,
        5,
        dt
      );

      // Update 3D character rig and environment stage
      heroRig.updateCharacter(st.time, st.expression, st.prop, st.stage);
      envRig.updateEnvironment(st.time, st.stage);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 405;
      const h = container.clientHeight || 720;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => handleResize())
        : null;
    if (resizeObserver) {
      resizeObserver.observe(container);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      mats.disposeAll();
      renderer.dispose();
    };
  }, []);

  const {
    topHud,
    activeBigHeader,
    activeSubtitle,
    activeWordIndex,
    filledSeedCells,
  } = frameState;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none rounded-2xl border border-slate-700/70 shadow-2xl bg-slate-900"
      data-testid="explainer-stage-9x16"
    >
      {/* Dedicated WebGL Mount Container */}
      <div
        ref={canvasMountRef}
        className="w-full h-full"
        data-testid="webgl-canvas-container"
      />

      {/* ===================================================================
          9:16 MOTION GRAPHICS OVERLAYS (Reference-Matched HUD)
          Note: Uses solid/rgba surfaces (zero backdrop-filter over WebGL!)
      =================================================================== */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 z-10">
        {/* 1. TOP STATUS BAR: Pill Badge OR Dopamine/Cyanide Progress Bar */}
        <div className="w-full flex flex-col items-center pt-2">
          {topHud.type === 'badge' ? (
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/85 border border-white/15 shadow-lg"
              data-testid="hud-top-badge"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  topHud.dotColor === 'amber'
                    ? 'bg-amber-400'
                    : topHud.dotColor === 'red'
                    ? 'bg-red-500'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-[11px] font-extrabold tracking-wider text-white uppercase font-mono">
                {topHud.text}
              </span>
            </div>
          ) : (
            <div
              className="w-[84%] flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/75 border border-white/10"
              data-testid="hud-top-bar"
            >
              <span className="text-[11px] font-extrabold tracking-wider text-white uppercase whitespace-nowrap shrink-0">
                {topHud.label}
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-transform duration-150 origin-left ${
                    topHud.barColor === 'red'
                      ? 'bg-red-500'
                      : topHud.barColor === 'amber'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{
                    transform: `scaleX(${Math.max(0.05, Math.min(1, topHud.progress))})`,
                  }}
                />
              </div>
            </div>
          )}

          {/* 2. GIANT 3D-STYLE CHAPTER HEADER WITH RED UNDERLINE */}
          <div className="mt-5 min-h-[76px] flex flex-col items-center justify-center">
            {activeBigHeader && (
              <div
                className="flex flex-col items-center animate-fade-in"
                data-testid="hud-big-header"
              >
                <div className="explainer-big-title text-4xl sm:text-5xl tracking-wide leading-none text-center">
                  {activeBigHeader.text}
                </div>
                {activeBigHeader.showRedUnderline && (
                  <div className="mt-2 w-28 h-1.5 rounded-full bg-red-500 shadow-md" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. LOWER-MIDDLE WORD-BY-WORD KARAOKE SUBTITLES */}
        <div className="w-full flex flex-col items-center mb-2">
          <div
            className="min-h-[76px] px-3 flex items-center justify-center text-center"
            data-testid="hud-subtitle-box"
          >
            {activeSubtitle && (
              <p className="text-xl sm:text-[22px] leading-snug max-w-[310px] flex flex-wrap justify-center gap-x-1.5 gap-y-0.5">
                {activeSubtitle.words.map((w, idx) => {
                  const isCurrentWord = idx === activeWordIndex;
                  return (
                    <span
                      key={`${activeSubtitle.id}-${idx}`}
                      className={`explainer-subtitle-word inline-block transition-transform duration-100 ${
                        isCurrentWord
                          ? 'text-amber-400 scale-105'
                          : 'text-white'
                      }`}
                    >
                      {w.word}
                    </span>
                  );
                })}
              </p>
            )}
          </div>

          {/* 4. BOTTOM 30-CELL LETHAL SEED TRACKER (Matches 30-DAY STREAK Grid in Reference!) */}
          <div
            className="mt-3 w-[86%] bg-slate-950/80 border border-white/10 rounded-xl p-2.5"
            data-testid="hud-seed-grid"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-extrabold tracking-wider text-slate-200 uppercase whitespace-nowrap shrink-0">
                150-SEED METER
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-400 tabular-nums whitespace-nowrap shrink-0">
                {frameState.crushedSeedsCount} / 150 SEEDS
              </span>
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: TOTAL_SEED_CELLS }, (_, idx) => {
                const isFilled = idx < filledSeedCells;
                const isHypoxiaDanger =
                  frameState.chapter.id === 'lethal_threshold';
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-[4px] transition-colors duration-150 ${
                      isFilled
                        ? isHypoxiaDanger
                          ? 'bg-red-500'
                          : 'bg-amber-400'
                        : 'bg-slate-700/75'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
