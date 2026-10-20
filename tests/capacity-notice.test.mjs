import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/config.js";
import { createState, startRound, beginStageOneFinish, isStageOneFinishReady, beginCapacityNotice, advanceCapacityNotice } from "../src/state.js";
import { createAnimal, updateAnimalAnimations } from "../src/animals.js";
import { beginBreedingPulse, advanceBreedingPulse, getPopulationLimit } from "../src/breeding.js";
import { adoptAnimal } from "../src/particles.js";

test("first-stage finishing uses the unchanged density threshold or existing population limit", () => {
  const state = createState(); startRound(state);
  state.density = CONFIG.saturationDensity - 0.000001;
  assert.equal(beginStageOneFinish(state), false);
  state.density = CONFIG.saturationDensity;
  assert.equal(beginStageOneFinish(state), true);
  assert.equal(state.mode, "finishing");
  startRound(state); state.density = 0;
  while (state.animals.length < getPopulationLimit()) state.animals.push(createAnimal("cat", 100, 200));
  assert.equal(beginStageOneFinish(state), true);
});

test("finishing immediately locks adoptions and new waves even if density later falls", () => {
  const state = createState(); startRound(state);
  assert.equal(adoptAnimal(state, 0), true);
  state.density = CONFIG.saturationDensity;
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

test("the already queued final wave keeps generating and animating every litter before capacity", () => {
  const state = createState(); startRound(state); state.breedRound = 3;
  beginBreedingPulse(state); advanceBreedingPulse(state);
  const parents = [...state.pendingParents], initialCount = state.animals.length;
  state.density = CONFIG.saturationDensity;
  beginStageOneFinish(state);
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
  assert.equal(state.waveParentsStarted, parents.length);
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
  beginStageOneFinish(state);
  assert.equal(state.elapsedMs, 0);
  assert.equal(isStageOneFinishReady(state), true);
  assert.equal(beginCapacityNotice(state), true);
});

test("restart clears an unfinished final wave and restores normal adoption and breeding", () => {
  const state = createState(); startRound(state); beginBreedingPulse(state);
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
  for (let i = 0; i < 60; i++) assert.equal(advanceCapacityNotice(state, 1 / 60), false);
  assert.equal(state.animals, population);
  assert.equal(JSON.stringify(state.animals), before);
  assert.equal(state.elapsedMs, 25000);
  assert.equal(state.adoptedCount, 3);
});

test("capacity countdown pauses when hidden, is bounded, and expires after the configured hold", () => {
  const state = createState(); startRound(state); beginCapacityNotice(state);
  assert.equal(advanceCapacityNotice(state, 99), false);
  assert.equal(state.capacityElapsedMs, 50);
  assert.equal(advanceCapacityNotice(state, -1), false);
  assert.equal(state.capacityElapsedMs, 50);
  for (let i = 0; i < 600; i++) advanceCapacityNotice(state, 1 / 60, true);
  assert.equal(state.capacityElapsedMs, 50);
  let ready = false;
  while (!ready) ready = advanceCapacityNotice(state, 1 / 60);
  assert.ok(Math.abs(state.capacityElapsedMs - CONFIG.capacityNoticeMs) < 1e-6);
  state.mode = "physics";
  assert.equal(advanceCapacityNotice(state, 1 / 60), false);
});

test("restart cancels capacity timing and cannot leave a stale auto-transition", () => {
  const state = createState(); startRound(state); beginCapacityNotice(state);
  for (let i = 0; i < 250; i++) advanceCapacityNotice(state, 1 / 60);
  startRound(state);
  assert.equal(state.mode, "active");
  assert.equal(state.capacityElapsedMs, 0);
  for (let i = 0; i < 600; i++) assert.equal(advanceCapacityNotice(state, 1 / 60), false);
  assert.equal(state.mode, "active");
});
