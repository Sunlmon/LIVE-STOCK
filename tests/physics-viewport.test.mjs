import test from "node:test";
import assert from "node:assert/strict";
import { fitPhysicsViewport, physicsPointToScreen, screenPointToPhysics, MACHINE_BOUNDS, DECORATION_GAP } from "../src/physics-viewport.js";
import { PHYSICS_LAYOUT as L, PHYSICS_CONFIG as P } from "../src/config.js";

test("responsive fit preserves 774:932 ratio and contains the entire apparatus and handle", () => {
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080], [2560, 1440], [844, 390]]) {
    const view = fitPhysicsViewport(width, height, width < 620 ? 100 : 80);
    assert.ok(Math.abs(view.board.width / view.board.height - 774 / 932) < 1e-10);
    assert.ok(view.machine.x >= view.margin - 1e-8);
    assert.ok(view.machine.x + view.machine.width <= width - view.margin + 1e-8);
    assert.ok(view.machine.y >= view.top - 1e-8);
    assert.ok(view.machine.y + view.machine.height <= height - view.margin + 1e-8);
    // One limiting dimension must be filled, not a fixed 16:9 letterbox.
    assert.ok(Math.abs(view.machine.height - (height - view.top - view.margin - view.decorationReserve)) < 1e-8 ||
      Math.abs(view.machine.width - (width - view.margin * 2)) < 1e-8);
    for (const [x, y] of [[P.handleX, P.handleY], [P.handleX, P.handleY + P.maxPull],
      [L.fieldLeft, L.exitY], [L.fieldRight, L.exitY], [P.launchX, P.pistonRestY]]) {
      const screen = physicsPointToScreen(view, x, y);
      const point = screenPointToPhysics(view, screen.x, screen.y);
      assert.ok(Math.abs(point.x - x) < 1e-9 && Math.abs(point.y - y) < 1e-9);
    }
    assert.equal(view.decorations.length, 6);
    for (const image of view.decorations) {
      const r = image.diameter / 2;
      assert.ok(image.x - r >= 0 && image.x + r <= width);
      assert.ok(image.y - r >= view.top && image.y + r <= height - view.margin);
      const overlaps = image.x + r > view.machine.x && image.x - r < view.machine.x + view.machine.width &&
        image.y + r + 6 > view.machine.y && image.y - r - 6 < view.machine.y + view.machine.height;
      assert.equal(overlaps, false, `decoration overlaps machine at ${width}x${height}`);
    }
  }
  assert.ok(MACHINE_BOUNDS.right > P.handleX + P.handleWidth / 2);
});

test("background motifs never overlap the apparatus at intermediate window aspect ratios", () => {
  for (let width = 320; width <= 1920; width += 40) for (let height = 360; height <= 1200; height += 40) {
    const view = fitPhysicsViewport(width, height, width < 620 ? 100 : 80);
    for (const image of view.decorations) {
      const r = image.diameter / 2, amplitude = Math.min(6, image.diameter * 0.035);
      const overlaps = image.x + r > view.machine.x && image.x - r < view.machine.x + view.machine.width &&
        image.y + r + amplitude > view.machine.y && image.y - r - amplitude < view.machine.y + view.machine.height;
      assert.equal(overlaps, false, `decoration overlaps ${width}x${height}`);
      assert.ok(image.y - r - amplitude >= view.top && image.y + r + amplitude <= height - view.margin);
    }
  }
});

test("larger motifs are stable, staggered and non-mirrored on spacious desktop layouts", () => {
  for (const [width, height] of [[1440, 900], [1920, 1080], [2560, 1440]]) {
    const view = fitPhysicsViewport(width, height, 80);
    const oldDiameter = Math.min(180,
      Math.min(view.board.x - view.margin - 16, width - view.margin - view.machine.x - view.machine.width - 16) * 0.78,
      view.board.height * 0.22);
    assert.deepEqual(view.decorations, fitPhysicsViewport(width, height, 80).decorations);
    for (const image of view.decorations) assert.ok(Math.abs(image.diameter / oldDiameter - 1.35) < 1e-10);
    for (const side of [view.decorations.slice(0, 3), view.decorations.slice(3)]) {
      assert.ok(Math.max(...side.map(p => p.x)) - Math.min(...side.map(p => p.x)) > 0.5, "not a straight column");
      assert.ok(Math.abs((side[1].y - side[0].y) - (side[2].y - side[1].y)) > 0.5, "not equal row spacing");
    }
    assert.ok(Math.abs(view.decorations[0].y - view.decorations[3].y) > 0.5, "not mirrored rows");
  }
});

test("all six floating envelopes retain 12px pair gaps and clear the header, edges and machine", () => {
  // Include tall wrapped status text, not just a single fixed desktop header.
  for (const hudBottom of [80, 100, 140, 180]) {
    for (let width = 320; width <= 1920; width += 40) for (let height = 360; height <= 1200; height += 40) {
      const view = fitPhysicsViewport(width, height, hudBottom);
      assert.equal(view.decorations.length, 6);
      const label = `${width}x${height}, header ${hudBottom}`;
      for (const [i, image] of view.decorations.entries()) {
        assert.ok(image.diameter > 0, label);
        // A conservative circular envelope includes both extremes of floating.
        const radius = image.diameter / 2 + Math.min(6, image.diameter * 0.035) + 0.65;
        assert.ok(image.x - radius >= view.margin - 1e-7, label);
        assert.ok(image.x + radius <= width - view.margin + 1e-7, label);
        assert.ok(image.y - radius >= view.top - 1e-7, label);
        assert.ok(image.y + radius <= height - view.margin + 1e-7, label);
        const overlaps = image.x + radius > view.machine.x && image.x - radius < view.machine.x + view.machine.width &&
          image.y + radius > view.machine.y && image.y - radius < view.machine.y + view.machine.height;
        assert.equal(overlaps, false, label);
        for (const other of view.decorations.slice(i + 1)) {
          const otherRadius = other.diameter / 2 + Math.min(6, other.diameter * 0.035) + 0.65;
          assert.ok(Math.hypot(image.x - other.x, image.y - other.y) + 1e-7 >= radius + otherRadius + DECORATION_GAP, label);
        }
      }
    }
  }
});
