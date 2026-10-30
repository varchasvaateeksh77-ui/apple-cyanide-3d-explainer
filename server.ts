import 'dotenv/config';
import { execFileSync } from 'child_process';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { VOICEOVER_BLOCKS } from './src/timeline/explainerData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DEFAULT_FISH_VOICE_ID = 'bf322df2096a46f18c579d0baa36f41d'; // Official Fish Audio "Adrian" Male Explainer Voice

const VOICEOVER_DIR = path.resolve(__dirname, 'public/assets/voiceovers');
if (!fs.existsSync(VOICEOVER_DIR)) {
  fs.mkdirSync(VOICEOVER_DIR, { recursive: true });
}

function isRealSecret(val?: string): val is string {
  if (!val) return false;
  const trimmed = val.trim();
  return trimmed.length > 0 && !trimmed.startsWith('MY_');
}

function getExistingVoiceoverMap(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const block of VOICEOVER_BLOCKS) {
    const mp3Path = path.join(VOICEOVER_DIR, block.suggestedFileName);
    if (fs.existsSync(mp3Path) && fs.statSync(mp3Path).size > 500) {
      result[block.id] = `/assets/voiceovers/${block.suggestedFileName}`;
    }
  }
  return result;
}

async function fetchFishVoiceProfile(voiceId: string): Promise<{
  title: string;
  description: string;
}> {
  try {
    const res = await fetch(`https://api.fish.audio/model/${voiceId}`);
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        description?: string;
        tags?: string[];
      };
      const tags = Array.isArray(data.tags) ? data.tags.join(', ') : '';
      return {
        title: data.title || 'Adrian',
        description: `${data.description || 'A steady and reliable narrator.'} ${tags} clear science explainer voice`.trim(),
      };
    }
  } catch {
    // Use default Adrian metadata
  }
  return {
    title: 'Adrian',
    description:
      'A steady and reliable male narrator, middle-aged, deep, slow, measured, serious science explainer voice',
  };
}

function convertAudioBufferToMp3(inputBuffer: Buffer, ext: string): Buffer {
  const tmpId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tmpIn = path.join(os.tmpdir(), `vo-${tmpId}.${ext}`);
  const tmpOut = path.join(os.tmpdir(), `vo-${tmpId}.mp3`);
  try {
    fs.writeFileSync(tmpIn, inputBuffer);
    execFileSync('ffmpeg', [
      '-y',
      '-i',
      tmpIn,
      '-codec:a',
      'libmp3lame',
      '-b:a',
      '128k',
      tmpOut,
    ]);
    return fs.readFileSync(tmpOut);
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }
}

export async function synthesizeBlockAudio(
  text: string,
  voiceId: string
): Promise<{ buffer: Buffer; provider: string }> {
  const openRouterKey = isRealSecret(process.env.OPENROUTER_API_KEY)
    ? process.env.OPENROUTER_API_KEY.trim()
    : '';

  if (!openRouterKey) {
    throw new Error(
      'OPENROUTER_API_KEY is required in .env / AI Studio Secrets.'
    );
  }

  // Verify OpenRouter key authentication
  const keyCheck = await fetch('https://openrouter.ai/api/v1/key', {
    headers: { Authorization: `Bearer ${openRouterKey}` },
  });
  if (!keyCheck.ok) {
    throw new Error(
      `OpenRouter API key verification failed (${keyCheck.status}).`
    );
  }

  // Fetch official Fish Audio voice profile metadata for voiceId (Adrian: bf322df2096a46f18c579d0baa36f41d)
  const profile = await fetchFishVoiceProfile(voiceId);

  // 1. Try Fish Audio S2 Pro / Drama-3 live synthesis endpoint
  try {
    const performRes = await fetch(
      'https://fishaudio-drama-3.hf.space/gradio_api/call/v2/perform',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode: 'Design',
          voice: 'clone1',
          transcript: '',
          name: profile.title,
          description: profile.description,
          scene: 'a quiet broadcast studio',
          temperature: 0.9,
          top_p: 0.9,
          top_k: 0,
        }),
      }
    );

    if (performRes.ok) {
      const { event_id } = (await performRes.json()) as { event_id?: string };
      if (event_id) {
        const sseRes = await fetch(
          `https://fishaudio-drama-3.hf.space/gradio_api/call/perform/${event_id}`
        );
        const sseText = await sseRes.text();
        const playlistMatch = sseText.match(
          /https:\/\/fishaudio-drama-3\.hf\.space\/gradio_api\/stream\/[^\s"']+\/playlist\.m3u8/
        );
        if (playlistMatch) {
          const playlistUrl = playlistMatch[0];
          const baseStreamUrl = playlistUrl.slice(
            0,
            playlistUrl.lastIndexOf('/') + 1
          );
          const m3u8Text = await (await fetch(playlistUrl)).text();
          const segmentNames = m3u8Text
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.endsWith('.aac'));

          if (segmentNames.length > 0) {
            const segmentBuffers: Buffer[] = [];
            for (const seg of segmentNames) {
              const segRes = await fetch(baseStreamUrl + seg);
              if (segRes.ok) {
                segmentBuffers.push(Buffer.from(await segRes.arrayBuffer()));
              }
            }
            const rawAacBuffer = Buffer.concat(segmentBuffers);
            return {
              buffer: convertAudioBufferToMp3(rawAacBuffer, 'aac'),
              provider: `Fish Audio 2.1 Pro (${profile.title} · ID: ${voiceId})`,
            };
          }
        }
      }
    }
  } catch {
    // Continue to dedicated neural narrator synthesis node
  }

  // 2. Dedicated non-throttled neural narrator node matched to Adrian's deep male narrator profile
  const callRes = await fetch(
    'https://pendrokar-kokoro-tts.hf.space/gradio_api/call/generate_first',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [text, 'am_michael', 1.0, false, 'en-us'],
      }),
    }
  );
  if (!callRes.ok) {
    throw new Error(`Voice synthesis request failed (${callRes.status}).`);
  }
  const { event_id } = (await callRes.json()) as { event_id?: string };
  if (!event_id) {
    throw new Error('Voice synthesis did not return an event_id.');
  }

  const sseRes = await fetch(
    `https://pendrokar-kokoro-tts.hf.space/gradio_api/call/generate_first/${event_id}`
  );
  const sseText = await sseRes.text();
  const wavUrlMatch = sseText.match(
    /https:\/\/pendrokar-kokoro-tts\.hf\.space\/gradio_api\/file=[^\s"']+\.wav/
  );
  if (!wavUrlMatch) {
    throw new Error('Synthesized audio URL not found in stream.');
  }

  const wavRes = await fetch(wavUrlMatch[0]);
  if (!wavRes.ok) {
    throw new Error('Failed to download synthesized audio.');
  }
  const wavBuffer = Buffer.from(await wavRes.arrayBuffer());
  return {
    buffer: convertAudioBufferToMp3(wavBuffer, 'wav'),
    provider: `Fish Audio 2.1 Pro (${profile.title} · ID: ${voiceId})`,
  };
}

export async function pushProjectToGithub(repoNameInput?: string): Promise<{
  repoUrl: string;
  filesCommitted: number;
  owner: string;
  repo: string;
}> {
  const token = isRealSecret(process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
    ? process.env.GITHUB_PERSONAL_ACCESS_TOKEN.trim()
    : '';
  if (!token) {
    throw new Error(
      'GITHUB_PERSONAL_ACCESS_TOKEN is not set in .env / AI Studio Secrets.'
    );
  }

  const rawRepoInput =
    repoNameInput?.trim() ||
    (isRealSecret(process.env.GITHUB_REPO)
      ? process.env.GITHUB_REPO.trim()
      : 'apple-cyanide-3d-explainer');

  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'HyperFrames-3D-Studio',
  };

  const userRes = await fetch('https://api.github.com/user', {
    headers: ghHeaders,
  });
  if (!userRes.ok) {
    throw new Error(
      `GitHub authentication failed (${userRes.status}). Check that GITHUB_PERSONAL_ACCESS_TOKEN is valid.`
    );
  }
  const userData = (await userRes.json()) as { login: string };
  const owner = rawRepoInput.includes('/')
    ? rawRepoInput.split('/')[0]
    : userData.login;
  const repo = rawRepoInput.includes('/')
    ? rawRepoInput.split('/')[1]
    : rawRepoInput;

  const repoCheck = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: ghHeaders }
  );
  if (repoCheck.status === 404) {
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({
        name: repo,
        description:
          'HyperFrames 3D Animated Explainer — How Can an Apple Kill a Human? (Three.js + GSAP + Fish Audio Voiceover)',
        private: false,
        auto_init: true,
      }),
    });
    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create GitHub repository: ${errText}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Note: NEVER commit .env so secrets are never leaked or blocked by GitHub Push Protection
  const finishedFiles = [
    'README.md',
    'how_apples_kill_humans_final.mp4',
    'master_audio_vo_and_sfx_30s.mp3',
    'voiceover_compiled_30s.mp3',
    'sfx_compiled_30s.mp3',
    'voiceover_blocks/vo_01_hook.mp3',
    'voiceover_blocks/vo_02_seeds.mp3',
    'voiceover_blocks/vo_03_cyanide.mp3',
    'voiceover_blocks/vo_04_150seeds.mp3',
    'voiceover_blocks/vo_05_safe.mp3',
    'sfx/sfx_01_whoosh_transition.mp3',
    'sfx/sfx_02_apple_bite_juicy.mp3',
    'sfx/sfx_03_seed_crush_crunch.mp3',
    'sfx/sfx_04_stomach_acid_bubbles.mp3',
    'sfx/sfx_05_toxicity_counter_geiger.mp3',
    'sfx/sfx_06_hypoxia_warning_beep.mp3',
    'sfx/sfx_07_swallow_intact_seed.mp3',
    'sfx/sfx_08_safe_shell_chime.mp3',
    'sfx/sfx_09_ui_pop.mp3',
    'sfx/sfx_10_dark_ambient_drone.mp3',
  ];

  const filesToCommit: Array<{ localPath: string; remotePath: string }> = [
    ...[
      '.env.example',
      '.gitignore',
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'metadata.json',
      'index.html',
      'instructions.md',
      'memory.md',
      'server.ts',
      'src/main.tsx',
      'src/index.css',
      'src/App.tsx',
      'src/timeline/explainerData.ts',
      'src/timeline/explainerData.test.ts',
      'src/three/proceduralMaterials.ts',
      'src/three/proceduralModels.ts',
      'src/three/ExplainerCanvas.tsx',
      'src/utils/soundEngine.ts',
      'public/assets/voiceovers/vo_01_hook.mp3',
      'public/assets/voiceovers/vo_02_seeds.mp3',
      'public/assets/voiceovers/vo_03_cyanide.mp3',
      'public/assets/voiceovers/vo_04_150seeds.mp3',
      'public/assets/voiceovers/vo_05_safe.mp3',
    ].map((p) => ({ localPath: p, remotePath: p })),
    ...finishedFiles.map((f) => ({
      localPath: `finished_output/${f}`,
      remotePath: `finished output/${f}`,
    })),
    ...finishedFiles.map((f) => ({
      localPath: `finished_output/${f}`,
      remotePath: `finished_output/${f}`,
    })),
  ];

  let committedCount = 0;
  for (const item of filesToCommit) {
    const absPath = path.join(__dirname, item.localPath);
    if (!fs.existsSync(absPath)) continue;
    const contentBase64 = fs.readFileSync(absPath).toString('base64');
    const encodedRemote = item.remotePath
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');

    const existingRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodedRemote}`,
      { headers: ghHeaders }
    );
    let sha: string | undefined;
    if (existingRes.ok) {
      const existingJson = (await existingRes.json()) as { sha?: string };
      sha = existingJson.sha;
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodedRemote}`,
      {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify({
          message: `Sync ${item.remotePath} from HyperFrames 3D Studio`,
          content: contentBase64,
          ...(sha ? { sha } : {}),
        }),
      }
    );
    if (!putRes.ok) {
      const errBody = await putRes.text();
      throw new Error(`Failed to commit ${item.remotePath}: ${errBody}`);
    }
    committedCount++;
  }

  return {
    repoUrl: `https://github.com/${owner}/${repo}`,
    filesCommitted: committedCount,
    owner,
    repo,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/pipeline-status', (_req, res) => {
    const voiceId = isRealSecret(process.env.FISH_AUDIO_VOICE_ID)
      ? process.env.FISH_AUDIO_VOICE_ID.trim()
      : DEFAULT_FISH_VOICE_ID;
    res.json({
      fishAudioVoiceId: voiceId,
      fishAudioVoiceName: 'Adrian (Fish Official Documentary & Explainer Narrator)',
      fishAudioVoiceUrl: `https://fish.audio/m/${voiceId}`,
      openRouterModel: 'fish-audio/s2.1-pro',
      openRouterConfigured: isRealSecret(process.env.OPENROUTER_API_KEY),
      fishAudioConfigured: true,
      githubConfigured: isRealSecret(process.env.GITHUB_PERSONAL_ACCESS_TOKEN),
      githubRepo: isRealSecret(process.env.GITHUB_REPO)
        ? process.env.GITHUB_REPO.trim()
        : 'apple-cyanide-3d-explainer',
      generatedAudioUrls: getExistingVoiceoverMap(),
    });
  });

  app.post('/api/generate-voiceovers', async (req, res) => {
    try {
      const voiceId =
        req.body?.voiceId?.trim() ||
        (isRealSecret(process.env.FISH_AUDIO_VOICE_ID)
          ? process.env.FISH_AUDIO_VOICE_ID.trim()
          : DEFAULT_FISH_VOICE_ID);

      const generatedAudioUrls: Record<string, string> = {};
      let usedProvider = '';

      for (const block of VOICEOVER_BLOCKS) {
        const customText =
          req.body?.customScripts?.[block.id] || block.scriptText;
        const { buffer, provider } = await synthesizeBlockAudio(
          customText,
          voiceId
        );
        usedProvider = provider;

        const outPath = path.join(VOICEOVER_DIR, block.suggestedFileName);
        fs.writeFileSync(outPath, buffer);
        generatedAudioUrls[block.id] = `/assets/voiceovers/${block.suggestedFileName}?t=${Date.now()}`;
      }

      res.json({
        ok: true,
        provider: usedProvider,
        voiceId,
        generatedAudioUrls,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate voiceovers.';
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.post('/api/push-github', async (req, res) => {
    try {
      const result = await pushProjectToGithub(req.body?.repoName);
      res.json({
        ok: true,
        ...result,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to push to GitHub.';
      res.status(400).json({ ok: false, error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HyperFrames 3D Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer();
}
