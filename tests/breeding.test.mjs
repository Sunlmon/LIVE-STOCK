import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/config.js";
import { createState, startRound } from "../src/state.js";
import { updateAnimalAnimations } from "../src/animals.js";
import { adoptAnimal } from "../src/particles.js";
import { beginBreedingPulse, advanceBreedingPulse, getBreedingTiming, getPopulationLimit } from "../src/breeding.js";

test("breeding cadence progressively shortens to a bounded 3.2-second interval", () => {
  const timings = Array.from({ length: 20 }, (_, i) => getBreedingTiming(i + 1));
  assert.equal(timings[0].intervalMs, 4800);
  assert.equal(timings[3].intervalMs, 3200);
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
    assert.equal(state.nextBreedAt - startedAt, getBreedingTiming(round).intervalMs);
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
    assert.ok(state.animals.length <= getPopulationLimit());
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
  assert.equal(state.nextBreedAt, CONFIG.breedIntervalMs);
  assert.equal(state.pendingBirthAt, null);
  assert.deepEqual(state.pendingParents, []);
  assert.equal(state.animals.length, CONFIG.initialPopulation);
});
