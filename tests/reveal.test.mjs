import test from "node:test";
import assert from "node:assert/strict";
import { createReveal, updateReveal, revealVisualAt, revealItemAlphas, percentageTenths, REVEAL_CONFIG as R } from "../src/reveal.js";
import { createState, startRound, captureStageOne } from "../src/state.js";
import { adoptAnimal } from "../src/particles.js";
import { getOutletFlash, OUTLET_FLASH_MS } from "../src/physics-feedback.js";

const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const population = count => Object.freeze(Array.from({ length: count }, (_, i) => Object.freeze({
  species: ["cat", "dog", "rabbit", "hamster", "bird", "goldfish"][i % 6],
  x: 30 + (i % 30) * 60, y: 150 + Math.floor(i / 30) * 60,
})));

test("simulation keeps every snapshot animal in place and never changes real physical outcomes", () => {
  const state = createState(); startRound(state); adoptAnimal(state, 0); captureStageOne(state);
  state.physicalOutcomes = [{ shot: 1, species: "cat", exitIndex: 2 }];
  const before = JSON.stringify(state.stageOneSnapshot), actual = JSON.stringify(state.physicalOutcomes);
  state.reveal = createReveal(state.stageOneSnapshot, seeded(42));
  state.simulatedFates = state.reveal.items;
  assert.equal(state.simulatedFates.length, 44);
  assert.equal(state.reveal.counts.reduce((a, b) => a + b), 44);
  assert.equal(state.stageOneSummary.adoptedCount, 1);
  assert.deepEqual(state.simulatedFates.map(({ x, y, species }) => ({ x, y, species })),
    state.stageOneSnapshot.map(({ x, y, species }) => ({ x, y, species })));
  assert.equal(JSON.stringify(state.stageOneSnapshot), before);
  assert.equal(JSON.stringify(state.physicalOutcomes), actual);
  assert.ok(Object.isFrozen(state.simulatedFates));
  assert.ok(state.simulatedFates.every(Object.isFrozen));
});

test("weighted creative assignment allows zero outcomes and never forces four occupied categories", () => {
  for (const exit of [0, 1, 2, 3]) {
    const weights = [0, 0, 0, 0]; weights[exit] = 1;
    const reveal = createReveal(population(47), seeded(19), weights);
    assert.equal(reveal.counts[exit], 47);
    assert.equal(reveal.counts.filter(n => n === 0).length, 3);
  }
  assert.throws(() => createReveal([], Math.random, [0, 0, 0, 0]));
  assert.throws(() => createReveal([], Math.random, [-1, 1, 1, 1]));
  assert.throws(() => createReveal([], Math.random, [1, 1]));
});

test("rounded displayed percentages sum to 100.0%, including small and empty samples", () => {
  for (let total = 1; total <= 2000; total++) {
    const a = Math.floor(total * 0.13), b = Math.floor(total * 0.27), c = Math.floor(total * 0.41);
    const counts = [a, b, c, total - a - b - c];
    const tenths = percentageTenths(counts);
    assert.equal(tenths.reduce((a, b) => a + b), 1000);
    assert.ok(tenths.every((n, i) => Math.abs(n - counts[i] / total * 1000) <= 1));
  }
  assert.deepEqual(percentageTenths([0, 0, 0, 0]), [0, 0, 0, 0]);
});

test("the reveal follows hold, fade, fate symbols, skulls, and individual disappearance continuously", () => {
  const reveal = createReveal(population(120), seeded(3));
  const positions = JSON.stringify(reveal.items);
  const symbolsReady = R.holdMs + R.fadeMs + R.symbolsMs;
  const skullsStart = symbolsReady + R.symbolsHoldMs;
  const startDissolve = skullsStart + R.skullsMs;
  assert.equal(revealVisualAt(0).animal, 1);
  assert.equal(revealVisualAt(R.holdMs / 2).phase, "hold");
  assert.ok(revealVisualAt(R.holdMs + R.fadeMs / 2).animal < 1);
  assert.ok(revealVisualAt(R.holdMs + R.fadeMs + R.symbolsMs / 2).fate > 0);
  assert.ok(revealVisualAt(startDissolve - R.skullsMs / 2).skull > 0);
  for (const time of [R.holdMs, R.holdMs + R.fadeMs, symbolsReady, skullsStart, startDissolve]) {
    const a = revealVisualAt(time - 0.001), b = revealVisualAt(time);
    for (const key of ["animal", "fate", "skull"]) assert.ok(Math.abs(a[key] - b[key]) < 0.0001);
  }
  reveal.elapsedMs = startDissolve + R.disappearSpanMs / 2;
  const alphas = reveal.items.map(item => revealItemAlphas(reveal, item).skull);
  assert.ok(alphas.some(a => a === 0));
  assert.ok(alphas.some(a => a === 1));
  assert.ok(alphas.some(a => a > 0 && a < 1));
  assert.equal(new Set(reveal.items.map(i => i.vanishDelayMs)).size, reveal.items.length);
  while (!reveal.complete) updateReveal(reveal, 1 / 60);
  assert.ok(reveal.items.every(i => revealItemAlphas(reveal, i).skull === 0));
  const endTime = reveal.elapsedMs; updateReveal(reveal, 1 / 60);
  assert.equal(reveal.elapsedMs, endTime);
  assert.equal(JSON.stringify(reveal.items), positions);
});

test("completed fate icons remain fully visible for 2.5 seconds before any skull appears", () => {
  const start = R.holdMs + R.fadeMs + R.symbolsMs;
  assert.ok(R.symbolsHoldMs >= 2000 && R.symbolsHoldMs <= 3000);
  for (let elapsed = 0; elapsed < R.symbolsHoldMs; elapsed += 17) {
    const visual = revealVisualAt(start + elapsed);
    assert.equal(visual.phase, "fates");
    assert.equal(visual.animal, 0);
    assert.equal(visual.fate, 1);
    assert.equal(visual.skull, 0);
    assert.equal(visual.dissolveMs, -1);
  }
  const transition = revealVisualAt(start + R.symbolsHoldMs + R.skullsMs / 2);
  assert.equal(transition.phase, "skulls");
  assert.ok(transition.fate > 0 && transition.fate < 1);
  assert.ok(transition.skull > 0 && transition.skull < 1);
});

test("empty and one-animal snapshots complete without NaNs or an undefined fate", () => {
  for (const n of [0, 1]) {
    const reveal = createReveal(population(n), seeded(1));
    for (let i = 0; i < 1000 && !reveal.complete; i++) updateReveal(reveal, 1 / 60);
    assert.equal(reveal.complete, true);
    assert.equal(reveal.counts.reduce((a, b) => a + b), n);
    assert.ok(reveal.items.every(i => Number.isFinite(i.vanishDelayMs)));
  }
});

test("restart clears simulation, reveal clock, snapshots, real records and particles at any ending phase", () => {
  for (const mode of ["reveal", "ending"]) {
    const state = createState(); startRound(state); adoptAnimal(state, 0); captureStageOne(state);
    state.reveal = createReveal(state.stageOneSnapshot, seeded(1));
    state.simulatedFates = state.reveal.items;
    state.reveal.elapsedMs = 5000;
    state.physicalOutcomes = [{ shot: 1, exitIndex: 3 }];
    state.mode = mode;
    startRound(state);
    assert.equal(state.mode, "active");
    assert.equal(state.reveal, null);
    assert.deepEqual(state.simulatedFates, []);
    assert.deepEqual(state.physicalOutcomes, []);
    assert.deepEqual(state.stageOneSnapshot, []);
    assert.deepEqual(state.particles, []);
    assert.equal(state.animals.length, 45);
    assert.equal(state.adoptedCount, 0);
  }
});

test("all outlets flash at most once per collection and always switch off at 360ms", () => {
  for (let index = 0; index < 4; index++) {
    const physics = { elapsedMs: 0, outletClosures: [{ exitIndex: index, startedAtMs: 100 }] };
    assert.equal(getOutletFlash(physics, index).intensity, 0);
    physics.elapsedMs = 100 + OUTLET_FLASH_MS * 0.15;
    assert.equal(getOutletFlash(physics, index).intensity, 1);
    for (let i = 0; i < 100; i++) assert.equal(getOutletFlash(physics, index).triggers, 1);
    physics.elapsedMs = 100 + OUTLET_FLASH_MS;
    assert.equal(getOutletFlash(physics, index).intensity, 0);
    physics.elapsedMs += 10000;
    assert.equal(getOutletFlash(physics, index).intensity, 0);
    assert.equal(physics.outletClosures.length, 1);
    assert.equal(getOutletFlash(physics, (index + 1) % 4).intensity, 0);
  }
});
