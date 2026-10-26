import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/config.js";
import { createState, startRound, beginStageOneFinish, isStageOneFinishReady, beginCapacityNotice, confirmCapacityNotice } from "../src/state.js";
import { createAnimal, updateAnimalAnimations } from "../src/animals.js";
import { beginBreedingPulse, advanceBreedingPulse, getPopulationLimit } from "../src/breeding.js";
import { adoptAnimal } from "../src/particles.js";

function fillToCapacity(state, remaining = 0) {
  while (state.animals.length < getPopulationLimit(state) - remaining) state.animals.push(createAnimal("cat", 100, 200));
}

test("only this round's sampled threshold triggers finishing, never an early high density reading", () => {
 for (const threshold of [550, 565, 580]) {
  const state = createState(); startRound(state); state.populationLimit = threshold;
  assert.equal(getPopulationLimit(state), threshold);
  state.density = 1;
  assert.equal(beginStageOneFinish(state), false);
  fillToCapacity(state, 1);
  assert.equal(state.animals.length, threshold - 1);
  assert.equal(beginStageOneFinish(state), false);
  fillToCapacity(state);
  assert.equal(beginStageOneFinish(state), true);
  assert.equal(state.mode, "finishing");
  startRound(state); state.density = 0; fillToCapacity(state);
  assert.equal(beginStageOneFinish(state), true);
 }
});

test("finishing immediately locks adoptions and new waves even if density later falls", () => {
  const state = createState(); startRound(state);
  assert.equal(adoptAnimal(state, 0), true);
  fillToCapacity(state);
  beginStageOneFinish(state);
  const population = [...state.animals], particles = [...state.particles];
  const adopted = state.adoptedCount, round = state.breedRound;
  state.density = 0; state.elapsedMs = 1e9;
  for (let i = 0; i < 50; i++) {
    assert.equal(beginStageOneFinish(state), false);
    assert.equal(adoptAnimal(state, 0), false);
    assert.equal(beginBreedingPulse(state), false);
  }
  assert.equal(state.mode, "finishing");
  assert.deepEqual(state.animals, population);
  assert.deepEqual(state.particles, particles);
  assert.equal(state.adoptedCount, adopted);
  assert.equal(state.breedRound, round);
});

test("the last births finish moving at the sampled limit before capacity and the transition remains once-only", (context) => {
  context.mock.method(Math, "random", () => 0.5);
  const state = createState(); startRound(state); state.breedRound = 3;
  fillToCapacity(state, 10);
  beginBreedingPulse(state); advanceBreedingPulse(state);
  const initialCount = state.animals.length;
  while (state.animals.length < getPopulationLimit(state)) {
    state.elapsedMs += 1000 / 60;
    updateAnimalAnimations(state.animals, 1 / 60);
    advanceBreedingPulse(state);
  }
  assert.equal(beginStageOneFinish(state), true);
  assert.ok(state.animals.some(animal => animal.birth && !animal.birth.complete));
  // An estimated finish time far in the future must not delay the true finish.
  state.breedingBusyUntil = 1e9;
  let frames = 0;
  while (!isStageOneFinishReady(state) && frames++ < 600) {
    assert.equal(beginCapacityNotice(state), false, "do not hide live or delayed offspring");
    state.elapsedMs += 1000 / 60;
    updateAnimalAnimations(state.animals, 1 / 60);
    if (state.pendingBirthAt !== null) advanceBreedingPulse(state);
  }
  assert.ok(frames > 0 && frames < 600);
  assert.ok(state.animals.length > initialCount, "queued parents still produce their litters");
  assert.equal(state.breedRound, 4, "no extra wave may start");
  assert.equal(state.waveParentsStarted, 2);
  assert.equal(state.pendingBirthAt, null);
  assert.deepEqual(state.pendingParents, []);
  assert.ok(state.animals.filter(a => a.birth).every(a => a.birth.complete));
  assert.equal(beginCapacityNotice(state), true);
  assert.equal(beginCapacityNotice(state), false, "the transition must be once-only");
  assert.equal(state.mode, "capacity");
  assert.equal(state.physics, null);
});

test("elapsed time alone cannot complete a delayed or unfinished baby", () => {
  const state = createState(); startRound(state);
  const parent = state.animals[0];
  const child = createAnimal(parent.species, parent.x, parent.y, {
    parent, fromX: parent.x, fromY: parent.y, toX: parent.x + 80, toY: parent.y, delayMs: 9000,
  });
  state.animals.push(child); state.density = CONFIG.saturationDensity;
  fillToCapacity(state);
  beginStageOneFinish(state); state.elapsedMs = 1e12;
  assert.equal(isStageOneFinishReady(state), false);
  assert.equal(beginCapacityNotice(state), false);
  assert.equal(child.birth.started, false);
  child.birth.started = true; child.birth.progress = 0.9;
  assert.equal(isStageOneFinishReady(state), false);
  child.birth.complete = true;
  assert.equal(isStageOneFinishReady(state), true);
  assert.equal(beginCapacityNotice(state), true);
});

test("a completed final wave can enter capacity immediately without a guessed delay", () => {
  const state = createState(); startRound(state); state.density = CONFIG.saturationDensity;
  fillToCapacity(state);
  beginStageOneFinish(state);
  assert.equal(state.elapsedMs, 0);
  assert.equal(isStageOneFinishReady(state), true);
  assert.equal(beginCapacityNotice(state), true);
});

test("restart clears an unfinished final wave and restores normal adoption and breeding", () => {
  const state = createState(); startRound(state); beginBreedingPulse(state);
  fillToCapacity(state);
  state.density = CONFIG.saturationDensity; beginStageOneFinish(state);
  startRound(state);
  assert.equal(state.mode, "active");
  assert.equal(state.pendingBirthAt, null);
  assert.deepEqual(state.pendingParents, []);
  assert.equal(isStageOneFinishReady(state), false);
  assert.equal(state.animals.length, CONFIG.initialPopulation);
  assert.equal(adoptAnimal(state, 0), true);
  assert.equal(state.adoptedCount, 1);
  assert.equal(beginBreedingPulse(state), true);
});

test("capacity explanation freezes the active population without creating a physics world", () => {
  const state = createState(); startRound(state);
  state.elapsedMs = 25000; state.adoptedCount = 3;
  const population = state.animals, before = JSON.stringify(state.animals);
  assert.equal(beginCapacityNotice(state), true);
  assert.equal(state.mode, "capacity");
  assert.equal(state.physics, null);
  assert.equal(beginCapacityNotice(state), false);
  assert.equal(state.capacityConfirmed, false);
  assert.equal(state.animals, population);
  assert.equal(JSON.stringify(state.animals), before);
  assert.equal(state.elapsedMs, 25000);
  assert.equal(state.adoptedCount, 3);
});

test("capacity waits for one explicit confirmation, never a timer or a duplicate confirmation", () => {
  const state = createState(); startRound(state); beginCapacityNotice(state);
  state.elapsedMs += 60000;
  assert.equal(state.mode, "capacity");
  assert.equal(state.capacityConfirmed, false);
  assert.equal(state.physics, null);
  assert.equal(confirmCapacityNotice(state), true);
  assert.equal(confirmCapacityNotice(state), false);
  state.mode = "physics";
  assert.equal(confirmCapacityNotice(state), false);
});

test("restart clears capacity confirmation and cannot leave a stale entry request", () => {
  const state = createState(); startRound(state); beginCapacityNotice(state);
  confirmCapacityNotice(state);
  startRound(state);
  assert.equal(state.mode, "active");
  assert.equal(state.capacityConfirmed, false);
  assert.equal(confirmCapacityNotice(state), false);
  assert.equal(state.mode, "active");
});
