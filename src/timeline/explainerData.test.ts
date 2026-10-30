import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOTAL_DURATION,
  TOTAL_SEED_CELLS,
  calculateCyanideStats,
  getFrameStateAtTime,
  interpolateCameraAtTime,
} from './explainerData';

test('calculateCyanideStats computes accurate amygdalin and HCN values', () => {
  const zero = calculateCyanideStats(0);
  assert.equal(zero.amygdalinMg, 0);
  assert.equal(zero.hydrogenCyanideMg, 0);
  assert.equal(zero.lethalPercentage, 0);

  const lethal = calculateCyanideStats(150);
  assert.equal(lethal.amygdalinMg, 315);
  assert.equal(lethal.hydrogenCyanideMg, 67.5);
  assert.equal(lethal.lethalPercentage, 100);
  assert.equal(lethal.appleCoresEquivalent, 18.8);
});

test('getFrameStateAtTime transitions across all 5 explainer chapters and fills 30 seed cells', () => {
  const startState = getFrameStateAtTime(0);
  assert.equal(startState.chapter.id, 'hook');
  assert.equal(startState.stage, 'bedroom_night');
  assert.equal(startState.filledSeedCells, 0);
  assert.equal(startState.activeSubtitle?.text, 'How could a single fruit');
  assert.equal(startState.activeWordIndex, 0);

  const midSeedState = getFrameStateAtTime(10.0);
  assert.equal(midSeedState.chapter.id, 'seeds_secret');
  assert.equal(midSeedState.activeBigHeader?.text, 'CYANIDE');
  assert.equal(midSeedState.activeSubtitle?.text, "That's hydrogen cyanide.");

  const labState = getFrameStateAtTime(15.0);
  assert.equal(labState.chapter.id, 'cyanide_conversion');
  assert.equal(labState.stage, 'seed_lab');
  assert.ok(labState.filledSeedCells > 8 && labState.filledSeedCells <= 18);

  const lethalState = getFrameStateAtTime(22.5);
  assert.equal(lethalState.chapter.id, 'lethal_threshold');
  assert.equal(lethalState.stage, 'hypoxia_street');
  assert.ok(lethalState.filledSeedCells >= 26);

  const endState = getFrameStateAtTime(TOTAL_DURATION);
  assert.equal(endState.chapter.id, 'safe_reality');
  assert.equal(endState.stage, 'kitchen_day');
  assert.equal(endState.filledSeedCells, TOTAL_SEED_CELLS);
  assert.equal(endState.cellularOxygenPct, 100);
});

test('interpolateCameraAtTime smoothly interpolates position and FOV across timeline', () => {
  const cam0 = interpolateCameraAtTime(0);
  assert.deepEqual(cam0.position, [0, 1.45, 4.3]);
  assert.equal(cam0.fov, 38);

  const camMid = interpolateCameraAtTime(1.25);
  assert.ok(camMid.position[2] < 4.3 && camMid.position[2] > 3.2);
  assert.ok(camMid.fov < 38 && camMid.fov > 36);
});

test('VOICEOVER_BLOCKS span the exact 0s to 30s timeline without gaps', async () => {
  const { VOICEOVER_BLOCKS, FULL_VOICEOVER_SCRIPT } = await import('./explainerData');
  assert.equal(VOICEOVER_BLOCKS.length, 5);
  assert.equal(VOICEOVER_BLOCKS[0].startTime, 0.0);
  assert.equal(VOICEOVER_BLOCKS[4].endTime, 30.0);

  for (let i = 0; i < VOICEOVER_BLOCKS.length - 1; i++) {
    assert.equal(
      VOICEOVER_BLOCKS[i].endTime,
      VOICEOVER_BLOCKS[i + 1].startTime
    );
  }
  assert.ok(FULL_VOICEOVER_SCRIPT.includes('amygdalin'));
  assert.ok(FULL_VOICEOVER_SCRIPT.includes('hydrogen cyanide'));
});

