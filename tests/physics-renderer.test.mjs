import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createPhysicsStage } from "../src/physics-stage.js";
import { drawPhysicsStage, drawPhysicsDecorations } from "../src/physics-renderer.js";
import { fitPhysicsViewport } from "../src/physics-viewport.js";
import { drawMachineSurface } from "../src/physics-materials.js";
import { SPECIES } from "../src/animals.js";

const require = createRequire(import.meta.url);
const Matter = require("../vendor/matter-0.20.0.min.js");
const worldSignature = stage => JSON.stringify(Matter.Composite.allBodies(stage.engine.world).map(body => ({
  id: body.id, position: body.position, velocity: body.velocity, force: body.force, angle: body.angle,
  mass: body.mass, isStatic: body.isStatic, restitution: body.restitution, friction: body.friction,
  filter: body.collisionFilter, plugin: body.plugin,
  vertices: body.vertices.map(v => ({ x: v.x, y: v.y })),
})));

// Trace draw calls, not pixel fidelity: actual Canvas output is checked in Chrome.
function drawingTrace() {
  const images = [];
  const stack = [];
  const ctx = {
    globalAlpha: 1, x: 0, y: 0,
    save() { stack.push({ alpha: this.globalAlpha, x: this.x, y: this.y }); },
    restore() { const s = stack.pop(); this.globalAlpha = s.alpha; this.x = s.x; this.y = s.y; },
    translate(x, y) { this.x += x; this.y += y; },
    drawImage(image) { images.push({ species: image.species, x: this.x, y: this.y, alpha: this.globalAlpha }); },
  };
  for (const name of ["rotate", "strokeRect", "fillRect", "beginPath", "arc", "stroke", "fill",
    "setLineDash", "moveTo", "lineTo", "closePath", "fillText", "roundRect", "bezierCurveTo", "clip"]) ctx[name] = () => {};
  ctx.createLinearGradient = ctx.createRadialGradient = () => ({ addColorStop() {} });
  return { ctx, images };
}

test("six cover motifs stay at half opacity, outside the board, without adding physics bodies", () => {
  const stage = createPhysicsStage(Matter, SPECIES.slice(0, 4).map(s => ({ species: s.key })));
  const sprites = new Map(SPECIES.map(s => [s.key, { species: s.key, complete: true, naturalWidth: 100 }]));
  const bodyCount = Matter.Composite.allBodies(stage.engine.world).length;
  const worldBefore = worldSignature(stage);
  const layout = fitPhysicsViewport(1440, 900, 80);
  function draw(time, reducedMotion = false) {
    stage.state.elapsedMs = time;
    const trace = drawingTrace();
    drawPhysicsDecorations(trace.ctx, sprites, reducedMotion ? 0 : time, layout.decorations);
    drawPhysicsStage(trace.ctx, stage.state, sprites);
    assert.equal(trace.ctx.globalAlpha, 1);
    assert.equal(trace.images.length, 7); // six decoration sprites + the one real ball
    assert.equal(trace.images.at(-1).alpha, 1);
    return trace.images.slice(0, 6);
  }
  const initial = draw(0);
  const moved = draw(1400);
  assert.deepEqual(initial.map(i => i.species), SPECIES.map(s => s.key));
  for (const [i, image] of initial.entries()) {
    assert.equal(image.alpha, 0.5);
    assert.ok(image.x < layout.machine.x || image.x > layout.machine.x + layout.machine.width);
    assert.equal(moved[i].x, image.x);
    assert.ok(Math.abs(moved[i].y - image.y) <= 12);
    assert.notEqual(moved[i].y, image.y);
  }
  assert.deepEqual(draw(0, true), draw(10000, true));
  assert.equal(Matter.Composite.allBodies(stage.engine.world).length, bodyCount);
  assert.equal(worldSignature(stage), worldBefore);
  stage.dispose();
});

test("metal surface cache is reused across frames and rebuilt only when raster scale changes", () => {
  const stage = createPhysicsStage(Matter, SPECIES.slice(0, 4).map(s => ({ species: s.key })));
  const trace = drawingTrace();
  let scale = 1, created = 0;
  trace.ctx.getTransform = () => ({ a: scale, b: 0 });
  trace.ctx.canvas = { ownerDocument: { createElement() {
    created += 1;
    const paint = drawingTrace().ctx;
    paint.setTransform = () => {};
    return { getContext: () => paint };
  } } };
  for (let frame = 0; frame < 30; frame++) drawMachineSurface(trace.ctx, stage.state);
  assert.equal(created, 1);
  scale = 1.4;
  drawMachineSurface(trace.ctx, stage.state);
  assert.equal(created, 2);
  drawMachineSurface(trace.ctx, stage.state);
  assert.equal(created, 2);
  stage.dispose();
});
