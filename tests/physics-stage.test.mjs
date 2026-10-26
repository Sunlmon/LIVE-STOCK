import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createPhysicsStage } from "../src/physics-stage.js";
import { PHYSICS_CONFIG as P, PHYSICS_LAYOUT as L } from "../src/config.js";
import { createState, startRound, captureStageOne } from "../src/state.js";
import { adoptAnimal } from "../src/particles.js";
import { getOutletFlash, OUTLET_FLASH_MS } from "../src/physics-feedback.js";

const require = createRequire(import.meta.url);
const Matter = require("../vendor/matter-0.20.0.min.js");
const representatives = ["cat", "dog", "bird", "goldfish"].map(species => ({ species }));
// Centre-loaded fixtures preserve exact regression paths. Separate tests below
// exercise the production loading tolerance instead of relying on chance.
const make = () => createPhysicsStage(Matter, representatives, [], { random: () => 0.5 });
function launch(stage, pull) {
  assert.equal(stage.beginPull(stage.handlePosition()), true);
  stage.dragPull({ x: P.handleX, y: P.handleY + pull });
  assert.equal(stage.releasePull(), true);
}
function finishFlight(stage, dt = 1 / 120) {
  let steps = 0;
  let maxLaunchSpeed = 0;
  let returns = 0;
  while (["flight", "returned"].includes(stage.state.status) && steps++ < 12000) {
    if (stage.state.status === "returned") {
      assert.ok(returns < 8, "too many returns in the fixed-input test");
      // Test-user lever inputs only; production never relaunches automatically.
      launch(stage, [180, 240, 156, 210][returns++ % 4]);
    }
    stage.update(dt);
    const animal = stage.state.active;
    if (animal?.launchCount === 1 && !animal.enteredField) maxLaunchSpeed = Math.max(maxLaunchSpeed, animal.body.speed);
  }
  assert.notEqual(stage.state.status, "error", stage.state.error);
  assert.ok(["ready", "complete"].includes(stage.state.status));
  return maxLaunchSpeed;
}

test("tap, cancelled drag and below-threshold pull do not spend a shot", () => {
  const stage = make();
  assert.equal(stage.beginPull({ x: 10, y: 10 }), false);
  stage.beginPull({ x: P.handleX, y: P.handleY });
  stage.dragPull({ x: P.handleX, y: P.handleY + P.minPull - 1 });
  assert.equal(stage.releasePull(), false);
  assert.equal(stage.state.launched, 0);
  stage.beginPull({ x: P.handleX, y: P.handleY });
  stage.dragPull({ x: P.handleX, y: P.handleY + 1000 });
  assert.equal(stage.state.pull, P.maxPull);
  assert.equal(stage.state.piston.position.y, P.pistonRestY + P.maxSpringCompression);
  assert.equal(stage.handlePosition().y, P.handleY + P.maxPull);
  assert.equal(P.minPull, P.maxPull / 2);
  stage.pause();
  assert.equal(stage.state.status, "ready");
  assert.equal(stage.state.pull, 0);
  assert.equal(stage.state.piston.position.y, P.pistonRestY);
  stage.dispose();
});

test("241 pull depths retain increasing spring strength and reach real exits, allowing user relaunches", () => {
  let priorLaunchSpeed = 0;
  const reachedExits = new Set();
  for (let pull = P.minPull; pull <= P.maxPull; pull += 0.5) {
    const stage = make();
    launch(stage, pull);
    // The ball is released at rest: gravity acts before the piston reaches it.
    stage.update(1 / 120);
    assert.ok(stage.state.active.body.velocity.y > 0);
    const speed = finishFlight(stage);
    assert.ok(speed > priorLaunchSpeed, `spring strength not increasing at ${pull}`);
    priorLaunchSpeed = speed;
    assert.equal(stage.state.outcomes.length, 1);
    assert.equal(stage.state.resolved, 1);
    assert.ok(stage.state.diagnostics.pistonContacts >= 1);
    assert.ok(stage.state.diagnostics.collisionCount > stage.state.diagnostics.pistonContacts);
    assert.equal(stage.state.outcomes[0].launches[0].pullDistance, pull);
    assert.equal(stage.state.outcomes[0].launches[0].compression, pull * P.maxSpringCompression / P.maxPull);
    assert.equal(stage.state.launched, 1, "relaunches must not consume other animals");
    reachedExits.add(stage.state.outcomes[0].exitIndex);
    stage.dispose();
  }
  // Reachability across different user inputs, not forced diversity in a round.
  assert.equal(reachedExits.size, 4, "the force sweep should reach all four real outlets");
});

test("the enlarged ball has clearance between every pin and baffle", () => {
  const stage = make();
  for (const baffle of stage.state.baffles) {
    const halfLength = baffle.plugin.width / 2;
    const dx = Math.cos(baffle.angle) * halfLength;
    const dy = Math.sin(baffle.angle) * halfLength;
    const start = { x: baffle.position.x - dx, y: baffle.position.y - dy };
    for (const pin of stage.state.pins) {
      const t = Math.max(0, Math.min(1, ((pin.position.x - start.x) * dx * 2 +
        (pin.position.y - start.y) * dy * 2) / (4 * halfLength ** 2)));
      const gap = Math.hypot(pin.position.x - start.x - 2 * dx * t,
        pin.position.y - start.y - 2 * dy * t) - pin.circleRadius - baffle.plugin.height / 2;
      assert.ok(gap >= P.animalDiameter + 6, `pin/baffle gap ${gap} is too tight`);
    }
  }
  stage.dispose();
});

test("portrait board has a staggered pin field and eight passable lanes grouped into four outcomes", () => {
  const stage = make();
  assert.ok(L.frameHeight > L.frameWidth);
  assert.equal(stage.state.pins.length, 27);
  assert.equal(new Set(stage.state.pins.map(pin => pin.position.y)).size, 6);
  assert.equal(stage.state.lanes.length, 8);
  assert.equal(stage.state.exits.length, 4);
  for (const lane of stage.state.lanes) {
    assert.ok(lane.right - lane.left >= P.animalDiameter + 12);
    assert.equal(lane.body.plugin.exitIndex, Math.floor(lane.index / 2));
    assert.equal(lane.body.plugin.laneIndex, lane.index);
  }
  for (const pin of stage.state.pins) {
    assert.ok(pin.position.x - pin.circleRadius - L.fieldLeft >= P.animalDiameter + 6);
    assert.ok(L.fieldRight - pin.position.x - pin.circleRadius >= P.animalDiameter + 6);
  }
  for (const a of stage.state.pins) for (const b of stage.state.pins) {
    if (a === b) continue;
    const gap = Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) - a.circleRadius - b.circleRadius;
    assert.ok(gap >= P.animalDiameter + 6);
  }
  stage.dispose();
});

test("four unique animals produce four records, even with extra releases, and no fifth animal", () => {
  const stage = make();
  for (const fraction of [0, 0.3, 0.6, 1]) {
    const pull = P.minPull + (P.maxPull - P.minPull) * fraction;
    launch(stage, pull);
    assert.equal(stage.releasePull(), false);
    assert.equal(stage.beginPull({ x: P.handleX, y: P.handleY }), false);
    finishFlight(stage);
  }
  assert.equal(stage.state.status, "complete");
  assert.equal(stage.state.launched, 4);
  assert.equal(stage.state.resolved, 4);
  assert.equal(stage.state.outcomes.length, 4);
  assert.deepEqual(stage.state.outcomes.map(r => r.shot), [1, 2, 3, 4]);
  assert.equal(stage.state.exitCounts.reduce((a, b) => a + b, 0), 4);
  assert.ok(stage.state.exitCounts.some(n => n === 0), "test fixture should leave at least one empty exit");
  assert.equal(stage.beginPull({ x: P.handleX, y: P.handleY }), false);
  assert.equal(Matter.Composite.allBodies(stage.engine.world).filter(b => b.label === "animal").length, 0);
  for (let i = 0; i < 200; i++) stage.update(1 / 60);
  assert.equal(stage.state.outcomes.length, 4);
  stage.dispose();
});

function waitForReturn(stage) {
  for (let i = 0; i < 4000 && stage.state.status === "flight"; i++) stage.update(1 / 120);
  assert.equal(stage.state.status, "returned", stage.state.error);
}

test("the upper entrance has no gate and permits real passage in both directions", () => {
  for (const direction of [-1, 1]) {
    const stage = make();
    launch(stage, P.minPull);
    assert.equal(Matter.Composite.allBodies(stage.engine.world).some(b => b.label === "gate"), false);
    const body = stage.state.active.body;
    // Controlled collision fixture above the permanent partition. Neither
    // the real partition below nor the roof deflector is removed for this test.
    Matter.Body.setPosition(body, { x: direction < 0 ? P.launchX : L.partitionX - 45, y: 310 });
    Matter.Body.setVelocity(body, { x: direction * 6, y: 0 });
    for (let i = 0; i < 28; i++) stage.update(1 / 120);
    assert.ok(direction < 0 ? body.position.x < L.partitionX - 25 : body.position.x > L.partitionX + 25);
    assert.equal(stage.state.outcomes.length, 0);
    assert.ok(stage.state.walls.some(b => b.label === "partition"));
    assert.ok(stage.state.walls.some(b => b.label === "deflector"));
    stage.dispose();
  }
});

test("a naturally returning ball waits indefinitely and relaunches without resetting its body or count", () => {
  const stage = make();
  launch(stage, 156); // This fixed spring input naturally returns with the open entrance.
  const active = stage.state.active, body = active.body;
  const bodyCount = Matter.Composite.allBodies(stage.engine.world).length;
  waitForReturn(stage);
  assert.equal(stage.canPull(), true);
  assert.equal(body.isStatic, false);
  assert.equal(stage.state.launched, 1);
  assert.equal(stage.state.outcomes.length, 0);
  assert.equal(stage.state.outletClosures.length, 0);
  for (let i = 0; i < 4200; i++) stage.update(1 / 120); // >30s is user waiting, not a stalled flight.
  assert.equal(stage.state.status, "returned");
  const pistonContacts = stage.state.diagnostics.pistonContacts;
  stage.beginPull(stage.handlePosition());
  stage.dragPull({ x: P.handleX, y: P.handleY + 180 });
  const motion = { position: { ...body.position }, velocity: { ...body.velocity }, angle: body.angle, angularVelocity: body.angularVelocity };
  assert.equal(stage.releasePull(), true);
  assert.deepEqual({ position: { ...body.position }, velocity: { ...body.velocity }, angle: body.angle, angularVelocity: body.angularVelocity }, motion);
  assert.equal(stage.state.active, active);
  assert.equal(stage.state.active.body, body);
  assert.equal(stage.state.active.launchCount, 2);
  assert.equal(stage.state.launched, 1);
  assert.equal(Matter.Composite.allBodies(stage.engine.world).length, bodyCount);
  finishFlight(stage);
  assert.ok(stage.state.diagnostics.pistonContacts > pistonContacts, "relaunch must physically hit the ball");
  assert.equal(stage.state.resolved, 1);
  assert.equal(stage.state.outcomes.length, 1);
  assert.ok(stage.state.outcomes[0].launchCount >= 2);
  assert.equal(stage.state.outcomes[0].launches[0].pullDistance, 156);
  assert.equal(stage.state.outletClosures.length, 1);
  assert.equal(Matter.Composite.allBodies(stage.engine.world).includes(body), false);
  stage.dispose();
});

test("cancelling a returned-ball pull parks the piston without snapping or freezing the ball", () => {
  const stage = make(); launch(stage, 156); waitForReturn(stage);
  const body = stage.state.active.body;
  stage.beginPull(stage.handlePosition());
  stage.dragPull({ x: P.handleX, y: P.handleY + 100 });
  for (let i = 0; i < 20; i++) stage.update(1 / 120);
  const pistonY = stage.state.piston.position.y;
  const position = { ...body.position }, velocity = { ...body.velocity };
  stage.pause();
  assert.equal(stage.state.status, "returned");
  assert.equal(stage.state.piston.position.y, pistonY);
  assert.deepEqual(body.position, position);
  assert.deepEqual(body.velocity, velocity);
  assert.equal(body.isStatic, false);
  assert.equal(stage.state.launched, 1);
  assert.equal(stage.state.active.launchCount, 1);
  launch(stage, P.maxPull); finishFlight(stage);
  assert.equal(stage.state.resolved, 1);
  stage.dispose();
});

test("the fourth animal can return and relaunch even when the unique-animal counter is already four", () => {
  const stage = make();
  for (let i = 0; i < 3; i++) { launch(stage, P.minPull); finishFlight(stage); }
  launch(stage, 156); waitForReturn(stage);
  const body = stage.state.active.body;
  assert.equal(stage.state.launched, 4);
  assert.equal(stage.state.resolved, 3);
  launch(stage, 180);
  assert.equal(stage.state.active.body, body);
  assert.equal(stage.state.launched, 4);
  finishFlight(stage);
  assert.equal(stage.state.status, "complete");
  assert.deepEqual(stage.state.outcomes.map(o => o.shot), [1, 2, 3, 4]);
  assert.equal(stage.canPull(), false);
  stage.dispose();
});

test("each sensor records only its own crossed channel, never a duplicate", () => {
  for (let index = 0; index < L.laneCount; index++) {
    const stage = make();
    launch(stage, P.minPull);
    const active = stage.state.active;
    const lane = stage.state.lanes[index];
    // Controlled sensor fixture, not a production animation / assigned route.
    active.enteredField = true;
    Matter.Body.setPosition(active.body, { x: (lane.left + lane.right) / 2, y: lane.y + 9 });
    Matter.Body.setVelocity(active.body, { x: 0, y: 0 });
    stage.update(1 / 120);
    assert.equal(stage.state.outcomes.length, 0, "centre crossing alone must not resolve the ball");
    assert.equal(stage.state.outletClosures.length, 0);
    assert.equal(active.recorded, false);
    Matter.Body.setPosition(active.body, { x: (lane.left + lane.right) / 2, y: lane.y + P.animalDiameter / 2 + 2 });
    Matter.Body.setVelocity(active.body, { x: 0, y: 2 });
    stage.update(1 / 120);
    assert.equal(stage.state.outcomes.length, 1);
    assert.equal(stage.state.outcomes[0].exitIndex, lane.exitIndex);
    assert.equal(stage.state.outcomes[0].laneIndex, index);
    assert.equal(stage.state.outletClosures.length, 1);
    assert.equal(stage.state.outletClosures[0].startedAtMs, stage.state.outcomes[0].passedAtMs);
    Matter.Events.trigger(stage.engine, "collisionActive", { pairs: [{ bodyA: active.body, bodyB: lane.body }] });
    for (let i = 0; i < 10; i++) stage.update(1 / 60);
    assert.equal(stage.state.outcomes.length, 1);
    assert.equal(stage.state.outletClosures.length, 1);
    assert.equal(Matter.Composite.allBodies(stage.engine.world).includes(active.body), false);
    stage.dispose();
  }
});

test("whole launch well narrows as the main field expands, with no inner rails or side clamps", () => {
  const stage = make();
  assert.equal(L.frameWidth, 774);
  assert.equal(L.frameHeight, 932);
  assert.equal(L.fieldRight - L.fieldLeft, 613);
  assert.equal(stage.state.walls.some(body => body.plugin.kind === "launch-rail"), false);
  assert.equal(stage.state.walls.some(body => body.plugin.kind === "stop"), false);
  const partition = stage.state.walls.find(body => body.plugin.kind === "partition");
  const casing = stage.state.walls.find(body => body.position.x === L.rightWallX && body.plugin.height === 900);
  assert.equal(casing.bounds.min.x - partition.bounds.max.x, 58);
  assert.equal(P.launchX, (casing.bounds.min.x + partition.bounds.max.x) / 2);
  assert.ok(stage.state.piston.bounds.min.x > partition.bounds.max.x);
  assert.ok(stage.state.piston.bounds.max.x < casing.bounds.min.x);
  assert.equal(stage.state.piston.plugin.kind, undefined);
  const rearStop = stage.state.walls.find(body => body.plugin.kind === "piston-stop");
  assert.equal(rearStop.bounds.max.y, 904);
  const canCollide = (a, b) => Boolean(a.collisionFilter.mask & b.collisionFilter.category) &&
    Boolean(b.collisionFilter.mask & a.collisionFilter.category);
  assert.equal(canCollide(stage.state.active.body, rearStop), false);
  assert.equal(canCollide(stage.state.piston, rearStop), true);
  assert.equal(canCollide(stage.state.active.body, partition), true);
  assert.equal(canCollide(stage.state.active.body, stage.state.piston), true);
  assert.ok(stage.state.pins[4].position.x > 1166);
  assert.equal(stage.state.lanes.at(-1).right, L.fieldRight - 4);
  assert.ok(stage.state.baffles.every(body => body.plugin.width > 109));
  stage.dispose();
});

test("four visits to the same outlet each flash once and return to default without extra colliders", () => {
  const stage = make();
  const lane = stage.state.lanes[0];
  const initialBodyCount = Matter.Composite.allBodies(stage.engine.world).length;
  assert.equal(getOutletFlash(stage.state, 0).triggers, 0);
  for (let shot = 1; shot <= 4; shot++) {
    launch(stage, P.minPull);
    const ball = stage.state.active;
    ball.enteredField = true;
    Matter.Body.setPosition(ball.body, { x: (lane.left + lane.right) / 2, y: lane.y + P.animalDiameter / 2 + 2 });
    stage.update(1 / 120);
    assert.equal(stage.state.outletClosures.length, shot);
    assert.equal(getOutletFlash(stage.state, 0).intensity, 0);
    assert.equal(Matter.Composite.allBodies(stage.engine.world).includes(ball.body), false);
    const start = stage.state.elapsedMs;
    let peak = 0;
    for (let ms = 0; ms <= OUTLET_FLASH_MS; ms += 10) {
      stage.state.elapsedMs = start + ms;
      const flash = getOutletFlash(stage.state, 0);
      assert.ok(flash.intensity >= 0 && flash.intensity <= 1);
      assert.equal(flash.triggers, shot);
      peak = Math.max(peak, flash.intensity);
    }
    assert.ok(peak > 0.9);
    const off = getOutletFlash(stage.state, 0);
    assert.equal(off.intensity, 0);
    stage.state.elapsedMs += 500;
    assert.deepEqual(getOutletFlash(stage.state, 0), off);
    assert.equal(getOutletFlash(stage.state, 1).triggers, 0);
    assert.equal(Matter.Composite.allBodies(stage.engine.world).length, initialBodyCount - (shot === 4 ? 1 : 0));
  }
  assert.deepEqual(stage.state.exitCounts, [4, 0, 0, 0]);
  assert.equal(stage.beginPull({ x: P.handleX, y: P.handleY }), false);
  stage.dispose();
  assert.equal(stage.state.outletClosures.length, 0);
});

test("30, 60 and 144 Hz render updates all complete with bounded fixed physics steps", () => {
  for (const hz of [30, 60, 144]) {
    const stage = make(); launch(stage, (P.minPull + P.maxPull) / 2); finishFlight(stage, 1 / hz);
    assert.equal(stage.state.outcomes.length, 1);
    stage.dispose();
  }
});

test("out-of-bounds and stalled shots fail without fabricated outcomes", () => {
  const stage = make(); launch(stage, P.minPull);
  Matter.Body.setPosition(stage.state.active.body, { x: 1800, y: 500 });
  stage.update(1 / 120);
  assert.equal(stage.state.status, "error");
  assert.equal(stage.state.outcomes.length, 0);
  stage.dispose();
  const stalled = make(); launch(stalled, P.minPull);
  Matter.Body.setStatic(stalled.state.active.body, true);
  for (let i = 0; i < 4000 && stalled.state.status === "flight"; i++) stalled.update(1 / 120);
  assert.equal(stalled.state.status, "error");
  assert.equal(stalled.state.outcomes.length, 0);
  stalled.dispose();
});

test("snapshot excludes adopted animals and survives physics retry; full restart disposes world", () => {
  const state = createState(); startRound(state);
  adoptAnimal(state, 0); captureStageOne(state);
  assert.equal(state.stageOneSnapshot.length, 44);
  assert.equal(state.stageOneSummary.adoptedCount, 1);
  assert.notEqual(state.stageOneSnapshot[0], state.animals[0]);
  assert.equal(Object.isFrozen(state.stageOneSnapshot), true);
  const snapshotJSON = JSON.stringify(state.stageOneSnapshot);
  state.physics = createPhysicsStage(Matter, state.physicsRepresentatives, state.physicalOutcomes);
  launch(state.physics, P.minPull); finishFlight(state.physics);
  assert.equal(state.physicalOutcomes.length, 1);
  assert.equal(JSON.stringify(state.stageOneSnapshot), snapshotJSON);
  const old = state.physics;
  old.dispose(); state.physicalOutcomes = [];
  state.physics = createPhysicsStage(Matter, state.physicsRepresentatives, state.physicalOutcomes);
  assert.equal(JSON.stringify(state.stageOneSnapshot), snapshotJSON);
  const retryWorld = state.physics;
  startRound(state);
  assert.equal(Matter.Composite.allBodies(old.engine.world).length, 0);
  assert.equal(Matter.Composite.allBodies(retryWorld.engine.world).length, 0);
  assert.equal(retryWorld.engine.events.collisionStart.length, 0);
  assert.equal(state.physics, null);
  assert.equal(state.physicalOutcomes.length, 0);
  assert.equal(state.stageOneSnapshot.length, 0);
  assert.equal(state.animals.length, 45);
});

test("missing library produces an understandable initialization error", () => {
  assert.throws(() => createPhysicsStage(null, representatives), /Matter.js/);
});

test("loading tolerance stays inside the well and is sampled once per unique animal, not per release", () => {
  let calls = 0;
  const stage = createPhysicsStage(Matter, representatives, [], { random: () => { calls++; return 0; } });
  const body = stage.state.active.body;
  assert.equal(calls, 1);
  assert.equal(body.position.x, P.launchX - P.launchSeatJitter);
  assert.ok(body.position.x - P.animalDiameter / 2 > L.partitionX + 10);
  assert.ok(body.position.x + P.animalDiameter / 2 < L.rightWallX - 13);
  stage.beginPull(stage.handlePosition()); stage.cancelPull();
  assert.equal(calls, 1, "cancel does not reroll the animal");
  const initial = { position: { ...body.position }, velocity: { ...body.velocity } };
  launch(stage, 180);
  assert.deepEqual({ position: { ...body.position }, velocity: { ...body.velocity } }, initial,
    "release must not inject a random position or velocity");
  finishFlight(stage);
  assert.equal(stage.state.outcomes[0].seatOffsetX, -P.launchSeatJitter);
  assert.equal(calls, 2, "only loading the next animal samples another tolerance");
  stage.dispose();
});

test("identical forces with bounded loading offsets can reach different real exits without forcing a quota", (context) => {
  for (const pull of [180, 220, 240]) {
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 29; i++) {
      const stage = createPhysicsStage(Matter, representatives, [], { random: () => i / 28 });
      launch(stage, pull);
      finishFlight(stage);
      const outcome = stage.state.outcomes[0];
      assert.equal(outcome.launches[0].pullDistance, pull);
      assert.ok(Math.abs(outcome.seatOffsetX) <= P.launchSeatJitter);
      assert.equal(outcome.exitIndex, Math.floor(outcome.laneIndex / 2));
      counts[outcome.exitIndex]++;
      stage.dispose();
    }
    assert.ok(counts.filter(n => n > 0).length >= 3, `fixed force ${pull}: ${counts}`);
    assert.equal(counts.reduce((a, b) => a + b), 29);
    assert.ok(new Set(counts).size > 1, "there is no equal-outlet quota");
    context.diagnostic(`pull=${pull}, actual exit counts (29 offset samples): ${counts.join(", ")}`);
  }
});
