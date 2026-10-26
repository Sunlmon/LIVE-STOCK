import { PHYSICS_CONFIG as P, PHYSICS_LAYOUT as L } from "./config.js";

// This module never assigns a route or exit to a moving animal. Only Matter
// integrates its motion, including the initial collision with the spring piston.
export function createPhysicsStage(Matter, representatives, outcomes = [], { random = Math.random } = {}) {
  if (!Matter?.Engine || !Matter?.Bodies) throw new Error("Matter.js 未能载入，请检查本地 vendor 文件。");
  if (representatives.length !== P.totalShots) throw new Error("本阶段需要四只待发射动物。");
  const { Engine, Bodies, Body, Composite, Events } = Matter;
  const engine = Engine.create({ positionIterations: 10, velocityIterations: 8, enableSleeping: false });
  engine.gravity.y = P.gravity;
  const walls = [];
  const pins = [];
  const baffles = [];
  const exits = [];
  const lanes = [];
  const state = {
    status: "ready", launched: 0, resolved: 0, elapsedMs: 0, pull: 0,
    outcomes, outletClosures: [], exitCounts: [0, 0, 0, 0], active: null, piston: null,
    walls, pins, baffles, exits, lanes, error: "", lastExit: null, exitFlashUntil: 0,
    diagnostics: { collisionCount: 0, pistonContacts: 0, maxSpeed: 0 },
  };
  let accumulator = 0;
  let disposed = false;
  let pullOriginY = 0;
  let flightStartedAt = 0;
  let pendingExit = null;

  function wall(x, y, width, height, angle = 0, kind = "wall") {
    const body = Bodies.rectangle(x, y, width, height, {
      isStatic: true, angle, friction: 0.025, restitution: 0.55,
      label: kind, plugin: { width, height, kind },
    });
    walls.push(body);
    Composite.add(engine.world, body);
    return body;
  }
  wall(L.leftWallX, 580, 26, 900);
  wall(L.rightWallX, 580, 26, 900);
  wall((L.leftWallX + L.rightWallX) / 2, L.ceilingY, L.rightWallX - L.leftWallX + 26, 26);
  wall(L.partitionX, (L.partitionTop + 1050) / 2, 20, 1050 - L.partitionTop, 0, "partition");
  wall(P.launchX, L.floorY, L.launchChannelWidth + 46, 24);
  // Reconnect the narrow launch well to the expanded upper chamber.
  const roofLeft = { x: L.fieldRight - 19, y: 194 };
  const roofRight = { x: L.rightWallX - 13, y: 270 };
  const roofDx = roofRight.x - roofLeft.x, roofDy = roofRight.y - roofLeft.y;
  wall((roofLeft.x + roofRight.x) / 2, (roofLeft.y + roofRight.y) / 2,
    Math.hypot(roofDx, roofDy), 20, Math.atan2(roofDy, roofDx), "deflector");
  // Above the permanent partition the entrance stays open in both directions.
  // No return-gate body (including an invisible/disabled one) is installed.
  // The partition and outer casing ARE the two sides of the entire launch well.
  // There is no second inner track. A rear-plane travel stop arrests the piston
  // at the original height; its filter excludes the animal, not the main field.
  const pistonStop = wall(P.launchX, L.pistonStopY, L.pistonStopWidth, L.pistonStopHeight, 0, "piston-stop");
  pistonStop.collisionFilter.category = 0x0004;
  pistonStop.collisionFilter.mask = 0x0002;

  // Expand the existing composition with the real main-field width. This
  // changes physical pin/baffle positions, not just a decorative backdrop.
  const expandX = x => L.fieldLeft + (x - 636) * (L.fieldRight - L.fieldLeft) / 560;

  const rows = [
    [320, [701, 806, 911, 1016, 1121]],
    [415, [753, 858, 963, 1068]],
    [510, [701, 806, 911, 1016, 1121]],
    [605, [753, 858, 963, 1068]],
    [700, [701, 806, 911, 1016, 1121]],
    [795, [753, 858, 963, 1068]],
  ];
  for (const [y, xs] of rows) for (const x of xs) {
    const body = Bodies.circle(expandX(x), y, 10, { isStatic: true, restitution: 0.8, friction: 0.02, label: "pin" });
    pins.push(body);
    Composite.add(engine.world, body);
  }
  // Keep at least a ball diameter plus clearance between each pin and baffle.
  for (const [x, y, angle] of [[765, 225, 0.25], [1005, 225, -0.25]]) {
    baffles.push(wall(expandX(x), y, 100 * (L.fieldRight - L.fieldLeft) / 560, 10, angle, "baffle"));
  }
  const laneWidth = (L.fieldRight - L.fieldLeft) / L.laneCount;
  for (let i = 1; i < L.laneCount; i++) {
    wall(L.fieldLeft + laneWidth * i, (L.dividerTop + 1044) / 2, 8, 1044 - L.dividerTop, 0, "divider");
  }
  for (let i = 0; i < L.laneCount; i++) {
    const left = L.fieldLeft + laneWidth * i + 4;
    const right = L.fieldLeft + laneWidth * (i + 1) - 4;
    const exitIndex = Math.floor(i / (L.laneCount / 4));
    const sensor = Bodies.rectangle((left + right) / 2, L.exitY + 24, right - left, 68, {
      isStatic: true, isSensor: true, label: "exit", plugin: { exitIndex, laneIndex: i },
    });
    lanes.push({ index: i, exitIndex, left, right, y: L.exitY, body: sensor });
    Composite.add(engine.world, sensor);
  }
  // Eight physical lanes, grouped into four abstract outcomes. A sensor reports
  // the lane actually crossed, never a selected / pre-assigned outcome.
  for (let i = 0; i < 4; i++) {
    const group = lanes.filter(lane => lane.exitIndex === i);
    exits.push({ index: i, left: group[0].left, right: group.at(-1).right, y: L.exitY });
  }
  const piston = Bodies.rectangle(P.launchX, P.pistonRestY, P.pistonWidth, 14, {
    friction: 0, restitution: 0.15, frictionAir: 0.012, label: "piston",
    collisionFilter: { category: 0x0002, mask: 0x0005 },
  });
  Body.setMass(piston, P.pistonMass);
  Body.setInertia(piston, Infinity);
  Body.setStatic(piston, true);
  Composite.add(engine.world, piston);
  state.piston = piston;

  function loadNext() {
    Body.setStatic(piston, true);
    Body.setPosition(piston, { x: P.launchX, y: P.pistonRestY });
    Body.setVelocity(piston, { x: 0, y: 0 });
    // A real loading tolerance breaks the identical-start/identical-force loop.
    // This is sampled BEFORE the shot, within the actual well's clearance; it
    // never reads an exit/count, changes force, or nudges a moving animal.
    const seatRange = Math.max(0, Math.min(P.launchSeatJitter,
      (L.launchChannelWidth - P.animalDiameter) / 2 - 1.5));
    const seatOffsetX = (Math.max(0, Math.min(1, random())) * 2 - 1) * seatRange;
    const body = Bodies.circle(P.launchX + seatOffsetX, P.pistonRestY - 7 - P.animalDiameter / 2 - 1, P.animalDiameter / 2, {
      restitution: P.ballRestitution, friction: 0.015, frictionAir: 0.001,
      label: "animal", slop: 0.02,
    });
    Body.setMass(body, P.ballMass);
    Body.setStatic(body, true);
    const source = representatives[state.launched];
    state.active = { body, species: source.species, shot: state.launched + 1,
      recorded: false, enteredField: false, hasLeftSeat: false, launchCount: 0,
      launches: [], compression: 0, pullDistance: 0, seatOffsetX };
    Composite.add(engine.world, body);
    state.status = "ready";
    state.pull = 0;
  }

  function inspectContacts(event) {
    if (disposed || !["flight", "returned", "pulling"].includes(state.status) ||
      !state.active?.launchCount || state.active.recorded) return;
    const active = state.active;
    for (const pair of event.pairs) {
      const other = pair.bodyA === active.body ? pair.bodyB : pair.bodyB === active.body ? pair.bodyA : null;
      if (!other) continue;
      if (!other.isSensor && event.name === "collisionStart") {
        state.diagnostics.collisionCount += 1;
        if (other === piston) state.diagnostics.pistonContacts += 1;
      }
      if (other.label !== "exit") continue;
      const lane = lanes[other.plugin.laneIndex];
      const point = active.body.position;
      // The trailing edge of the rendered circle AND physical body must clear
      // the existing line. Merely crossing with the centre is not sufficient.
      const trailingY = Math.min(point.y - P.animalDiameter / 2, active.body.bounds.min.y);
      if (active.enteredField && trailingY >= lane.y && point.x > lane.left && point.x < lane.right) {
        active.recorded = true; // synchronous guard, even if several pairs fire
        pendingExit = lane.index;
        break;
      }
    }
  }
  Events.on(engine, "collisionStart", inspectContacts);
  Events.on(engine, "collisionActive", inspectContacts);

  function settleExit() {
    const animal = state.active;
    const lane = lanes[pendingExit];
    const exitIndex = lane.exitIndex;
    pendingExit = null;
    // World mutations happen outside the collision event / Engine.update call.
    outcomes.push({ shot: animal.shot, species: animal.species, exitIndex, laneIndex: lane.index,
      compression: animal.compression, pullDistance: animal.pullDistance, seatOffsetX: animal.seatOffsetX,
      launchCount: animal.launchCount, launches: animal.launches.map(attempt => ({ ...attempt })),
      passedAtMs: state.elapsedMs });
    state.exitCounts[exitIndex] += 1;
    state.resolved += 1;
    state.lastExit = exitIndex;
    state.exitFlashUntil = state.elapsedMs + 900;
    Composite.remove(engine.world, animal.body);
    // Queue visual feedback only after the actual body has been safely removed.
    state.outletClosures.push({ shot: animal.shot, exitIndex, laneIndex: lane.index, startedAtMs: state.elapsedMs });
    state.active = null;
    if (state.resolved >= P.totalShots) {
      state.status = "complete";
      Body.setStatic(piston, true);
      state.pull = 0;
    } else loadNext();
  }

  function fail(message) {
    if (disposed) return;
    state.status = "error";
    state.error = message;
    accumulator = 0;
  }

  function inLaunchWell(animal) {
    const r = P.animalDiameter / 2;
    // Centre tolerance accounts for the polygonal circle's contact slop.
    return Math.abs(animal.body.position.x - P.launchX) <= (L.launchChannelWidth - P.animalDiameter) / 2 + 2 &&
      animal.body.position.y >= L.partitionTop + r;
  }

  function resumeFlight() {
    state.status = "flight";
    state.pull = 0;
    flightStartedAt = state.elapsedMs;
    Body.setStatic(piston, false);
    Body.setInertia(piston, Infinity);
  }

  function step() {
    const animal = state.active;
    if (state.status === "flight") {
      // Hooke's law + damping on the piston only. No launch force, position
      // correction, route or random steering is ever applied to the animal.
      Body.applyForce(piston, piston.position, {
        x: -0.01 * (piston.position.x - P.launchX) - 0.004 * piston.velocity.x,
        y: -P.springStiffness * (piston.position.y - P.pistonRestY) - P.springDamping * piston.velocity.y,
      });
    }
    Engine.update(engine, P.stepMs);
    state.elapsedMs += P.stepMs;
    if (pendingExit !== null) { settleExit(); return; }
    if (!animal?.launchCount) return;
    const point = animal.body.position;
    if (!animal.enteredField && point.x < L.fieldRight - P.animalDiameter / 2 - 4 && point.y < L.dividerTop) {
      animal.enteredField = true;
    }
    if (point.y < P.pistonRestY - P.animalDiameter / 2 - 48 || animal.enteredField) animal.hasLeftSeat = true;
    // Rearm only after a launched ball really returns and settles on the piston.
    // Only the piston is parked, at its CURRENT position; the animal is never
    // teleported, frozen, or assigned a replacement velocity on a return.
    if (state.status === "flight" && animal.hasLeftSeat && inLaunchWell(animal) &&
      animal.body.speed < 1.5 && Math.abs(piston.velocity.y) < 0.5 &&
      Math.abs(piston.position.y - P.pistonRestY) < 4 &&
      Math.abs(animal.body.bounds.max.y - piston.bounds.min.y) < 4) {
      Body.setStatic(piston, true);
      state.status = "returned";
      state.pull = 0;
    } else if (["returned", "pulling"].includes(state.status) && !inLaunchWell(animal)) {
      // A dynamic ball can still bounce away while the user reaches for the
      // handle. Keep simulating it instead of trapping it in a ready state.
      resumeFlight();
    }
    state.diagnostics.maxSpeed = Math.max(state.diagnostics.maxSpeed, animal.body.speed);
    if (!Number.isFinite(piston.position.y) || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < L.frameLeft || point.x > L.frameLeft + L.frameWidth || point.y < 100 || point.y > 1080) {
      fail("动物离开了装置边界，请重新体验本轮。");
    } else if (state.status === "flight" && state.elapsedMs - flightStartedAt > P.flightTimeoutMs) {
      fail("本次运动未能完成，请重新体验本轮。");
    }
  }

  function update(dt) {
    if (disposed || state.status === "error") return;
    accumulator += Math.max(0, Math.min(dt * 1000, P.stepMs * P.maxSubsteps));
    let steps = 0;
    while (accumulator >= P.stepMs && steps < P.maxSubsteps) {
      step();
      accumulator -= P.stepMs;
      steps += 1;
      if (state.status === "error") { accumulator = 0; break; }
    }
  }

  function handlePosition() {
    const displacement = ["pulling", "flight", "returned"].includes(state.status) ? Math.max(-16, Math.min(P.maxPull,
        (piston.position.y - P.pistonRestY) * P.maxPull / P.maxSpringCompression)) : 0;
    return { x: P.handleX, y: P.handleY + displacement };
  }
  function hitHandle(point) {
    const handle = handlePosition();
    return Math.abs(point.x - handle.x) <= P.handleWidth / 2 + 14 &&
      Math.abs(point.y - handle.y) <= P.handleHeight / 2 + 14;
  }
  function beginPull(point) {
    if (!canPull() || !hitHandle(point)) return false;
    // A cancelled return pull remains safely parked rather than snapping the
    // piston upwards through the still-dynamic ball. Resume from that position.
    state.pull = state.status === "returned" ? Math.max(0, handlePosition().y - P.handleY) : 0;
    state.status = "pulling";
    pullOriginY = point.y - state.pull;
    return true;
  }
  function canPull() {
    return !disposed && ["ready", "returned"].includes(state.status) && Boolean(state.active && !state.active.recorded);
  }
  function dragPull(point) {
    if (disposed || state.status !== "pulling") return false;
    state.pull = Math.max(0, Math.min(P.maxPull, point.y - pullOriginY));
    // Long control travel is geared down to the spring's safe physical stroke.
    const compression = state.pull * P.maxSpringCompression / P.maxPull;
    Body.setPosition(piston, { x: P.launchX, y: P.pistonRestY + compression });
    return true;
  }
  function cancelPull() {
    if (disposed || state.status !== "pulling") return;
    state.status = state.active?.launchCount ? "returned" : "ready";
    state.pull = 0;
    if (state.status === "ready") Body.setPosition(piston, { x: P.launchX, y: P.pistonRestY });
  }
  function releasePull() {
    if (disposed || state.status !== "pulling") return false;
    if (state.pull < P.minPull) { cancelPull(); return false; }
    state.active.pullDistance = state.pull;
    state.active.compression = state.pull * P.maxSpringCompression / P.maxPull;
    const firstLaunch = state.active.launchCount === 0;
    if (firstLaunch) {
      state.launched += 1; // unique animals, NOT the number of lever releases
      Body.setStatic(state.active.body, false);
    }
    state.active.launchCount += 1;
    state.active.launches.push({ pullDistance: state.active.pullDistance,
      compression: state.active.compression, atMs: state.elapsedMs });
    state.status = "flight";
    flightStartedAt = state.elapsedMs;
    state.active.launchedAtMs = state.elapsedMs;
    Body.setStatic(piston, false);
    Body.setInertia(piston, Infinity);
    Body.setVelocity(piston, { x: 0, y: 0 });
    return true;
  }
  function pause() { cancelPull(); accumulator = 0; }
  function dispose() {
    if (disposed) return;
    cancelPull();
    disposed = true;
    Events.off(engine, "collisionStart", inspectContacts);
    Events.off(engine, "collisionActive", inspectContacts);
    Composite.clear(engine.world, false);
    Engine.clear(engine);
    state.active = null;
    state.status = "disposed";
    state.outletClosures.length = 0;
    pendingExit = null;
    accumulator = 0;
  }
  loadNext();
  return { state, engine, update, beginPull, dragPull, releasePull, cancelPull, pause,
    handlePosition, hitHandle, canPull, fail, dispose };
}
