import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/config.js";
import { createState, startRound, beginCapacityNotice, advanceCapacityNotice } from "../src/state.js";

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
