import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { OUTLET_TIMING as C, OUTLET_TOTAL_MS, outletVisualAt, outletPose } from "../src/outlet-processing.js";
import { COMPLETION_TIMING as T, completionVisualAt, beginPhysicsCompletion, updatePhysicsCompletion, confirmPhysicsCompletion } from "../src/physics-completion.js";
import { createPhysicsStage } from "../src/physics-stage.js";
import { PHYSICS_CONFIG as P } from "../src/config.js";
import { createState, startRound } from "../src/state.js";
const Matter = createRequire(import.meta.url)("../vendor/matter-0.20.0.min.js");
const representatives = ["cat", "dog", "bird", "goldfish"].map(species => ({ species }));
const make = () => createPhysicsStage(Matter, representatives, [], { random: () => 0.5 });
function fixtureEntry(stage, index = 0) {
  stage.beginPull(stage.handlePosition());
  stage.dragPull({ x: P.handleX, y: P.handleY + 180 }); stage.releasePull();
  const animal = stage.state.active, lane = stage.state.lanes[index];
  animal.enteredField = true;
  Matter.Body.setPosition(animal.body, { x: (lane.left + lane.right) / 2, y: lane.y + P.animalDiameter / 2 + 2 });
  Matter.Body.setVelocity(animal.body, { x: 0, y: 2 });
  stage.update(1 / 120);
  return animal;
}
function finishProcessing(stage) { for (let i = 0; i < 300 && stage.state.status === "processing"; i++) stage.update(1 / 120); }

test("outlet phases remain ordered and continuous through a 1.3-second mechanical cycle", () => {
  assert.equal(OUTLET_TOTAL_MS, 1300);
  let boundary = 0;
  const phases = ["arrive", "transform", "formed", "open", "drop", "close"];
  Object.values(C).forEach((duration, i) => {
    assert.equal(outletVisualAt(boundary + duration / 2).phase, phases[i]);
    boundary += duration;
    const before = outletVisualAt(boundary - 0.001), after = outletVisualAt(boundary);
    for (const key of ["travel", "transform", "gate", "drop"]) assert.ok(Math.abs(before[key] - after[key]) < 0.001, key);
  });
  assert.equal(outletVisualAt(OUTLET_TOTAL_MS).complete, true);
  assert.equal(outletVisualAt(10000).gate, 0);
  assert.equal(outletVisualAt(559).drop, 0);
  assert.equal(outletVisualAt(739).drop, 0);
  const startDrop = C.arriveMs + C.transformMs + C.formedMs + C.openMs;
  assert.ok(outletVisualAt(startDrop + 160).drop - outletVisualAt(startDrop + 80).drop <
    outletVisualAt(startDrop + 240).drop - outletVisualAt(startDrop + 160).drop);
});

test("the visual animal starts at the removed body pose and converges on the existing outlet icon", () => {
  const event = { fromX: 700, fromY: 1004, fromAngle: 8, startedAtMs: 100 };
  const exit = { left: 640, right: 780 };
  const start = outletPose(event, exit, 100);
  assert.equal(start.x, 700); assert.equal(start.y, 1004);
  assert.ok(Math.abs(Math.sin(start.angle) - Math.sin(8)) < 1e-10);
  const formed = outletPose(event, exit, 100 + C.arriveMs + C.transformMs);
  assert.equal(formed.x, 710); assert.equal(formed.y, 1006); assert.equal(formed.angle, 0);
  assert.equal(formed.transform, 1); assert.equal(formed.gate, 0);
  assert.equal(outletPose(event, exit, 100 + OUTLET_TOTAL_MS).y, 1096);
});

test("all eight real sensors queue only one post-removal picture and wait for gate reset", () => {
  for (let i = 0; i < 8; i++) {
    const stage = make(), animal = fixtureEntry(stage, i), event = stage.state.outletClosures[0];
    assert.equal(stage.state.status, "processing"); assert.equal(stage.state.active, null);
    assert.equal(event.species, animal.species); assert.equal(event.exitIndex, Math.floor(i / 2));
    assert.equal(event.fromX, animal.body.position.x); assert.equal(event.fromY, animal.body.position.y);
    assert.equal(event.fromAngle, animal.body.angle); assert.equal(event.complete, false);
    assert.equal(Matter.Composite.allBodies(stage.engine.world).includes(animal.body), false);
    const timestamp = stage.engine.timing.timestamp;
    assert.equal(stage.canPull(), false); assert.equal(stage.beginPull(stage.handlePosition()), false);
    for (let n = 0; n < 100; n++) stage.update(1 / 120);
    assert.equal(stage.engine.timing.timestamp, timestamp, "presentation must not step or mutate the physics");
    assert.equal(stage.state.status, "processing");
    Matter.Events.trigger(stage.engine, "collisionActive", {pairs:[{bodyA:animal.body,bodyB:stage.state.lanes[i].body}]});
    assert.equal(stage.state.outcomes.length, 1); assert.equal(stage.state.outletClosures.length, 1);
    finishProcessing(stage);
    assert.equal(event.complete, true); assert.equal(stage.state.status, "ready");
    assert.equal(stage.state.active.shot, 2); assert.equal(stage.state.resolved, 1);
    stage.dispose(); assert.equal(stage.state.outletClosures.length, 0);
  }
});

test("fourth result is not complete until reset, and a complete world remains frozen", () => {
  const stage = make();
  for (let shot = 1; shot <= 4; shot++) {
    fixtureEntry(stage, 4);
    assert.equal(stage.state.status, "processing"); assert.equal(stage.state.resolved, shot);
    assert.equal(stage.state.outcomes.length, shot); finishProcessing(stage);
  }
  assert.equal(stage.state.status, "complete"); assert.equal(stage.state.active, null);
  assert.ok(stage.state.outletClosures.every(event => event.complete));
  assert.deepEqual(stage.state.exitCounts, [0, 0, 4, 0]);
  const before = JSON.stringify({ time: stage.state.elapsedMs, engine: stage.engine.timing.timestamp, piston: stage.state.piston.position });
  for (let i = 0; i < 100; i++) stage.update(1 / 30);
  assert.equal(JSON.stringify({ time: stage.state.elapsedMs, engine: stage.engine.timing.timestamp, piston: stage.state.piston.position }), before);
  assert.equal(stage.beginPull(stage.handlePosition()), false); assert.equal(stage.releasePull(), false);
  stage.dispose();
});

test("completion fades in and stays ready indefinitely without an automatic deadline", () => {
  const fullAt = T.machineFadeMs + T.textFadeMs;
  assert.equal(completionVisualAt(0).machineAlpha, 1);
  assert.equal(completionVisualAt(T.machineFadeMs).machineAlpha, 0);
  assert.equal(completionVisualAt(T.machineFadeMs).textAlpha, 0);
  assert.equal(completionVisualAt(fullAt).textAlpha, 1);
  assert.equal(completionVisualAt(fullAt - 0.001).ready, false);
  for (const time of [fullAt, fullAt + 8000, fullAt + 60000, 86400000]) {
    assert.equal(completionVisualAt(time).textAlpha, 1);
    assert.equal(completionVisualAt(time).ready, true);
    assert.equal(completionVisualAt(time).phase, "ready");
  }
  assert.equal(Object.hasOwn(T, "holdMs"), false);
});

test("completion entry is guarded, hidden time pauses, and restart clears physics and transition state", () => {
  const state = createState(); startRound(state);
  state.mode = "physics";
  const stage = make(); state.physics = stage;
  assert.equal(beginPhysicsCompletion(state), false);
  for (let shot = 0; shot < 4; shot++) { fixtureEntry(stage, 1); if (shot < 3) finishProcessing(stage); }
  assert.equal(beginPhysicsCompletion(state), false, "pending fourth animation blocks completion");
  finishProcessing(stage);
  assert.equal(beginPhysicsCompletion(state), true);
  assert.equal(beginPhysicsCompletion(state), false);
  assert.equal(state.mode, "physics-complete");
  updatePhysicsCompletion(state, 20, true);
  assert.equal(state.physicsCompletion.elapsedMs, 0);
  assert.equal(confirmPhysicsCompletion(state), false, "fade must finish before confirmation");
  assert.equal(updatePhysicsCompletion(state, 0.8), true);
  updatePhysicsCompletion(state, 100000);
  assert.equal(state.mode, "physics-complete");
  assert.equal(state.physicsCompletion.elapsedMs, 800);
  assert.equal(confirmPhysicsCompletion(state), true);
  assert.equal(confirmPhysicsCompletion(state), false, "double confirmation must not create another reveal");
  startRound(state);
  assert.equal(state.physicsCompletion, null); assert.equal(state.physics, null);
  assert.equal(state.mode, "active"); assert.equal(state.animals.length, 45);
  assert.equal(stage.state.status, "disposed"); assert.equal(stage.state.outletClosures.length, 0);
  assert.equal(Matter.Composite.allBodies(stage.engine.world).length, 0);
});

test("long waiting frames clamp the fade clock and never confirm automatically", () => {
  const state = { mode: "physics-complete", physicsCompletion: { elapsedMs: 790 } };
  assert.equal(updatePhysicsCompletion(state, 0.05), true);
  assert.equal(state.physicsCompletion.elapsedMs, 800);
  assert.equal(updatePhysicsCompletion(state, 120), true);
  assert.equal(state.mode, "physics-complete");
  assert.equal(state.physicsCompletion.elapsedMs, 800);
  assert.equal(state.physicsCompletion.confirmed, undefined);
  state.mode = "active";
  assert.equal(confirmPhysicsCompletion(state), false);
});

test("restart cancels every outlet phase and every completion phase without stale work", () => {
  for (const elapsedMs of [0, 250, 500, 650, 900, 1150]) {
    const state = createState(); startRound(state); state.mode = "physics";
    const stage = make(); state.physics = stage; fixtureEntry(stage);
    stage.state.elapsedMs = stage.state.outletClosures[0].startedAtMs + elapsedMs;
    const oldEvent = stage.state.outletClosures[0];
    startRound(state); stage.update(100);
    assert.equal(state.physics, null); assert.equal(stage.state.status, "disposed");
    assert.equal(stage.state.outletClosures.length, 0); assert.equal(oldEvent.complete, false);
    assert.equal(state.physicalOutcomes.length, 0); assert.equal(state.physicsCompletion, null);
    assert.equal(Matter.Composite.allBodies(stage.engine.world).length, 0);
  }
  for (const elapsedMs of [200, 600, 3000]) {
    const state = createState(); startRound(state);
    state.mode = "physics-complete"; state.physicsCompletion = { elapsedMs };
    startRound(state);
    assert.equal(updatePhysicsCompletion(state, 100), false);
    assert.equal(state.physicsCompletion, null); assert.equal(state.mode, "active");
  }
});
