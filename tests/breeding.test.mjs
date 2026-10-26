import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/config.js";
import { createState, startRound, captureStageOne, beginStageOneFinish, isStageOneFinishReady } from "../src/state.js";
import { updateAnimalAnimations } from "../src/animals.js";
import { adoptAnimal } from "../src/particles.js";
import { beginBreedingPulse, advanceBreedingPulse, getBreedingTiming, getPopulationLimit, samplePopulationLimit, measureDensity } from "../src/breeding.js";

test("breeding cadence progressively shortens to a bounded 2.2-second base interval", () => {
  const timings = Array.from({ length: 20 }, (_, i) => getBreedingTiming(i + 1, () => 0.5));
  assert.equal(timings[0].intervalMs, 4400);
  assert.equal(timings[5].intervalMs, 2200);
  assert.equal(timings.at(-1).intervalMs, CONFIG.breedIntervalMinMs);
  for (let i = 1; i < timings.length; i++) {
    assert.ok(timings[i].intervalMs <= timings[i - 1].intervalMs);
    assert.ok(timings[i].recoveryMs <= timings[i - 1].recoveryMs);
    assert.ok(timings[i].recoveryMs >= CONFIG.breedingRecoveryMinMs);
  }
});

test("initial parent counts keep the existing sparse-source ranges", () => {
  for (let round = 1; round <= 3; round++) {
    const state = createState(); startRound(state);
    state.breedRound = round - 1;
    assert.equal(beginBreedingPulse(state), true);
    const [min, max] = CONFIG.warmupParentRanges[round - 1];
    assert.ok(state.pendingParents.length >= min && state.pendingParents.length <= max);
    assert.equal(new Set(state.pendingParents).size, state.pendingParents.length);
  }
});

test("late waves are staggered inside the shorter cadence without truncating baby movement", () => {
  for (let round = 4; round <= 6; round++) {
    const state = createState(); startRound(state);
    state.breedRound = round - 1; state.elapsedMs = 20000;
    const startedAt = state.elapsedMs;
    assert.equal(beginBreedingPulse(state), true);
    const parents = [...state.pendingParents];
    assert.ok(parents.length >= 30);
    assert.ok(state.pendingParentSpacingMs > 0);
    assert.ok(state.nextBreedAt - startedAt >= CONFIG.breedIntervalMinMs);
    assert.ok(state.nextBreedAt - startedAt <= getBreedingTiming(round, () => 1).intervalMs + 1e-6);
    assert.ok(state.breedingBusyUntil < state.nextBreedAt);
    assert.equal(beginBreedingPulse(state), false, "do not start a second wave during scheduling");
    advanceBreedingPulse(state);
    const babies = state.animals.filter(animal => animal.birth);
    assert.ok(babies.length >= CONFIG.litterMin && babies.length <= CONFIG.litterMax);
    assert.ok(babies.every(child => child.x === parents[0].x && child.y === parents[0].y));
    assert.equal(state.waveParentsStarted, 1, "parents still start at different times");
    while (state.elapsedMs < state.nextBreedAt - 20) {
      state.elapsedMs += 1000 / 60;
      updateAnimalAnimations(state.animals, 1 / 60);
      if (state.pendingBirthAt !== null) advanceBreedingPulse(state);
    }
    assert.equal(state.waveParentsStarted, parents.length);
    assert.equal(state.pendingBirthAt, null);
    assert.ok(state.animals.filter(animal => animal.birth).every(animal => animal.birth.complete));
    assert.ok(state.animals.every(animal => Number.isFinite(animal.x) && Number.isFinite(animal.y)));
    assert.ok(state.animals.length <= getPopulationLimit(state));
    assert.equal(beginBreedingPulse(state), true, "next wave can proceed after the recovery gap");
  }
});

test("adopting a queued source skips its litter without counting an adoption twice", () => {
  const state = createState(); startRound(state); state.breedRound = 3;
  beginBreedingPulse(state);
  const parent = state.pendingParents[0];
  const oldCount = state.animals.length;
  assert.equal(adoptAnimal(state, state.animals.indexOf(parent)), true);
  advanceBreedingPulse(state);
  assert.equal(state.waveParentsStarted, 0);
  assert.equal(state.animals.length, oldCount - 1);
  assert.equal(state.adoptedCount, 1);
  assert.equal(adoptAnimal(state, -1), false);
  assert.equal(state.adoptedCount, 1);
});

test("restart resets the accelerated cadence and clears unfinished wave queues", () => {
  const state = createState(); startRound(state);
  state.breedRound = 5; state.elapsedMs = 40000;
  beginBreedingPulse(state); advanceBreedingPulse(state);
  startRound(state);
  assert.equal(state.breedRound, 0);
  assert.equal(state.elapsedMs, 0);
  assert.ok(state.nextBreedAt >= CONFIG.breedIntervalMs * (1 - CONFIG.breedIntervalJitter));
  assert.ok(state.nextBreedAt <= CONFIG.breedIntervalMs * (1 + CONFIG.breedIntervalJitter));
  assert.equal(state.pendingBirthAt, null);
  assert.deepEqual(state.pendingParents, []);
  assert.equal(state.animals.length, CONFIG.initialPopulation);
});

test("wave timing varies only within configured bounds, including at the late-game floor", () => {
  for (const round of [1, 2, 3, 4, 8, 20]) {
    const low = getBreedingTiming(round, () => 0);
    const middle = getBreedingTiming(round, () => 0.5);
    const high = getBreedingTiming(round, () => 1);
    assert.ok(low.intervalMs >= CONFIG.breedIntervalMinMs);
    assert.ok(high.intervalMs > low.intervalMs, "late waves must not become a fixed metronome");
    assert.ok(low.intervalMs <= middle.intervalMs && middle.intervalMs <= high.intervalMs);
    assert.ok(high.intervalMs <= middle.intervalMs * (1 + CONFIG.breedIntervalJitter) + 1e-6);
    assert.equal(low.recoveryMs, high.recoveryMs);
  }
});

test("waves after six do not silently revert to a long fixed parent schedule", () => {
  const state = createState(); startRound(state);
  state.breedRound = 8; state.elapsedMs = 40000;
  assert.equal(beginBreedingPulse(state), true);
  assert.ok(state.nextBreedAt - state.elapsedMs <= 2508 + 1e-6);
  assert.ok(state.breedingBusyUntil < state.nextBreedAt);
});

test("the last one to three places reach the sampled limit with animated births instead of getting stuck", () => {
  for (const remaining of [1, 2, 3]) {
    const state = createState(); startRound(state);
    while (state.animals.length < getPopulationLimit(state) - remaining) state.animals.push({ ...state.animals[0] });
    state.breedRound = 5; state.elapsedMs = 40000;
    assert.equal(beginBreedingPulse(state), true);
    advanceBreedingPulse(state);
    assert.equal(state.animals.length, state.populationLimit);
    assert.equal(state.pendingBirthAt, null);
    const children = state.animals.slice(-remaining);
    assert.ok(children.every(child => child.birth && !child.birth.complete));
    assert.ok(children.every(child => child.x === child.birth.fromX && child.y === child.birth.fromY));
    assert.equal(beginStageOneFinish(state), true);
    assert.equal(isStageOneFinishReady(state), false);
  }
});

test("seeded no-click and continuous-adoption samples finish their final animations without a prolonged equilibrium", (context) => {
  for (const clicksPerSecond of [0, 3, 6]) for (const seed of [11, 31, 97]) {
    let value = seed;
    context.mock.method(Math, "random", () =>
      ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 2 ** 32));
    const state = createState(); startRound(state);
    let nextClick = 3000;
    while (state.elapsedMs < 60000 && !isStageOneFinishReady(state)) {
      state.elapsedMs += 1000 / 60;
      updateAnimalAnimations(state.animals, 1 / 60);
      state.density = measureDensity(state.animals);
      beginStageOneFinish(state);
      if (state.mode === "active" && clicksPerSecond && state.elapsedMs >= nextClick) {
        const parent = state.pendingParents.slice(state.pendingParentIndex).find(a => state.animals.includes(a));
        adoptAnimal(state, parent ? state.animals.indexOf(parent) : 0);
        nextClick += 1000 / clicksPerSecond;
      }
      if (state.mode === "active" && state.pendingBirthAt === null &&
        state.elapsedMs >= state.nextBreedAt && state.elapsedMs >= state.breedingBusyUntil) beginBreedingPulse(state);
      if (state.pendingBirthAt !== null && state.elapsedMs >= state.pendingBirthAt) advanceBreedingPulse(state);
      beginStageOneFinish(state);
    }
    assert.equal(isStageOneFinishReady(state), true, `seed=${seed}, clicks=${clicksPerSecond}`);
    assert.equal(state.animals.length, state.populationLimit);
    assert.ok(state.animals.length >= 550 && state.animals.length <= 580);
    assert.ok(state.animals.length <= getPopulationLimit(state));
    if (clicksPerSecond) assert.ok(state.adoptedCount > 0);
    context.mock.restoreAll();
  }
});

test("all 31 integer stop thresholds are reachable, within both configured and geometric limits", () => {
  const values = new Set(Array.from({ length: 31 }, (_, i) => samplePopulationLimit(() => (i + 0.5) / 31)));
  assert.equal(values.size, 31);
  assert.equal(Math.min(...values), 550);
  assert.equal(Math.max(...values), 580);
  assert.equal(samplePopulationLimit(() => 0), 550);
  assert.equal(samplePopulationLimit(() => 1), 580);
  assert.equal(getPopulationLimit(), 580);
});

test("a round retains its sampled threshold across adoptions, breeding and snapshot; restart samples afresh", () => {
  const state = createState(); startRound(state, { populationRandom: () => 0 });
  assert.equal(state.populationLimit, 550);
  const threshold = state.populationLimit;
  adoptAnimal(state, 0); beginBreedingPulse(state); advanceBreedingPulse(state);
  captureStageOne(state);
  assert.equal(state.populationLimit, threshold);
  assert.equal(state.stageOneSummary.populationLimit, threshold);
  assert.equal(getPopulationLimit(state), threshold);
  startRound(state, { populationRandom: () => 0.999 });
  assert.equal(state.populationLimit, 580);
  assert.equal(state.animals.length, CONFIG.initialPopulation);
});
