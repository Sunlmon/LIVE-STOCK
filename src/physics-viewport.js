import { PHYSICS_LAYOUT as L, PHYSICS_CONFIG as P } from "./config.js";

// Presentation only. Never resize / reposition a Matter body to fit the screen.
export const MACHINE_BOUNDS = Object.freeze({
  left: L.frameLeft - 12,
  top: L.frameTop - 12,
  right: Math.max(L.frameLeft + L.frameWidth + 12, P.handleX + 82),
  bottom: Math.max(L.frameTop + L.frameHeight + 12, P.handleY + P.maxPull + 40),
});

export const DECORATION_GAP = 12; // CSS pixels between full floating envelopes
const DECORATION_GROWTH = 1.35; // another 12.5% over the preceding 1.2-sized version
const DECORATION_PADDING = 2; // include the outer-circle stroke
const DECORATION_STROKE = 1.3;

// Stable, small variations: no random re-roll on a frame, resize, or HUD update.
function variation(index, salt) {
  const value = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function floatingEnvelope(diameter) {
  // Match drawPhysicsDecorations, including both extremes of its vertical float.
  return diameter + 2 * Math.min(6, diameter * 0.035) + DECORATION_STROKE;
}

function fitDecorationDiameter(target, regions, horizontal) {
  let envelope = Infinity;
  for (const region of regions) {
    const along = horizontal ? region.width : region.height;
    const across = horizontal ? region.height : region.width;
    envelope = Math.min(envelope, across - 2 * DECORATION_PADDING,
      (along - 2 * DECORATION_PADDING - 2 * DECORATION_GAP) / 3);
  }
  // Invert d + 2*min(6, .035*d), rather than shrinking/moving the apparatus.
  envelope -= DECORATION_STROKE;
  const diameter = envelope <= 6 / 0.035 + 12 ? envelope / 1.07 : envelope - 12;
  return Math.max(0, Math.min(target, diameter));
}

function looseTriplet(region, diameter, horizontal, seed) {
  const envelope = floatingEnvelope(diameter);
  const along = horizontal ? region.width : region.height;
  const across = horizontal ? region.height : region.width;
  // Split spare space into unequal end margins and unequal inter-icon gaps.
  // The reserved envelope + minimum gap is never spent on these variations.
  const spare = Math.max(0, along - 2 * DECORATION_PADDING - 3 * envelope - 2 * DECORATION_GAP);
  const weights = Array.from({ length: 4 }, (_, i) => 0.15 + variation(i, seed));
  // Opposing, subtle vertical biases keep the sides balanced, not mirrored.
  weights[0] *= seed % 2 === 0 ? 0.45 : 1.65;
  weights[3] *= seed % 2 === 0 ? 1.6 : 0.6;
  weights[1] *= seed % 2 === 0 ? 1.45 : 0.6;
  weights[2] *= seed % 2 === 0 ? 0.65 : 1.5;
  const sum = weights.reduce((a, b) => a + b, 0);
  const extra = weights.map(weight => spare * weight / sum);
  let centre = DECORATION_PADDING + extra[0] + envelope / 2;
  return Array.from({ length: 3 }, (_, i) => {
    const crossRoom = Math.max(0, across - 2 * DECORATION_PADDING - envelope);
    const lean = (i + seed) % 2 === 0 ? 0.22 : 0.78;
    const cross = DECORATION_PADDING + envelope / 2 + crossRoom * (lean + (variation(i, seed + 7) - 0.5) * 0.16);
    const position = { x: region.x + (horizontal ? centre : cross),
      y: region.y + (horizontal ? cross : centre), diameter };
    centre += envelope + DECORATION_GAP + extra[i + 1];
    return position;
  });
}

export function fitPhysicsViewport(width, height, hudBottom = 80) {
  const margin = Math.max(12, Math.min(24, width * 0.015));
  const top = Math.max(margin, hudBottom + 8);
  const availableHeight = Math.max(1, height - top - margin);
  const boundsWidth = MACHINE_BOUNDS.right - MACHINE_BOUNDS.left;
  const boundsHeight = MACHINE_BOUNDS.bottom - MACHINE_BOUNDS.top;
  let scale = Math.max(0.001, Math.min((width - margin * 2) / boundsWidth, availableHeight / boundsHeight));
  // Center the board when possible; on narrow screens shift the whole assembly
  // just enough to include the entire handle and all of its travel.
  function fitX() {
    const centered = width / 2 - (L.frameLeft + L.frameWidth / 2) * scale;
    return Math.max(margin - MACHINE_BOUNDS.left * scale,
      Math.min(width - margin - MACHINE_BOUNDS.right * scale, centered));
  }
  let offsetX = fitX();
  let decorationReserve = 0;
  const initialLeftRoom = offsetX + L.frameLeft * scale - margin - 16;
  const initialRightRoom = width - margin - offsetX - MACHINE_BOUNDS.right * scale - 16;
  if (Math.min(initialLeftRoom, initialRightRoom) < 60 && availableHeight - boundsHeight * scale < 96) {
    // At intermediate aspect ratios neither side columns nor free top/bottom
    // bands fit. Reserve two small motif rows instead of overlapping controls.
    decorationReserve = Math.min(96, availableHeight * 0.3);
    scale = Math.min(scale, (availableHeight - decorationReserve) / boundsHeight);
    offsetX = fitX();
  }
  const offsetY = top + (availableHeight - boundsHeight * scale) / 2 - MACHINE_BOUNDS.top * scale;
  const board = { x: offsetX + L.frameLeft * scale, y: offsetY + L.frameTop * scale,
    width: L.frameWidth * scale, height: L.frameHeight * scale };
  const machine = { x: offsetX + MACHINE_BOUNDS.left * scale, y: offsetY + MACHINE_BOUNDS.top * scale,
    width: boundsWidth * scale, height: boundsHeight * scale };
  const leftRoom = board.x - margin - 16;
  const rightRoom = width - margin - machine.x - machine.width - 16;
  let regions, targetDiameter, horizontal = false;
  if (Math.min(leftRoom, rightRoom) >= 60) {
    targetDiameter = Math.min(180, Math.min(leftRoom, rightRoom) * 0.78, board.height * 0.22) * DECORATION_GROWTH;
    regions = [
      { x: margin, y: board.y, width: machine.x - 16 - margin, height: board.height },
      { x: machine.x + machine.width + 16, y: board.y, width: rightRoom, height: board.height },
    ];
  } else {
    // Width-limited portrait screens have spare space above/below the board.
    // Keep all six motifs, but let them yield space to the working apparatus.
    const upperRoom = machine.y - top;
    const lowerRoom = height - margin - machine.y - machine.height;
    targetDiameter = Math.max(8, Math.min(56, Math.min(upperRoom, lowerRoom) - 16)) * DECORATION_GROWTH;
    horizontal = true;
    regions = [
      { x: margin, y: top, width: width - 2 * margin, height: upperRoom - 8 },
      { x: margin, y: machine.y + machine.height + 8, width: width - 2 * margin, height: lowerRoom - 8 },
    ];
  }
  const diameter = fitDecorationDiameter(targetDiameter, regions, horizontal);
  const decorations = regions.flatMap((region, side) => looseTriplet(region, diameter, horizontal, side + 2));
  return { scale, offsetX, offsetY, board, machine, decorations, top, margin, decorationReserve };
}

export function physicsPointToScreen(view, x, y) {
  return { x: view.offsetX + x * view.scale, y: view.offsetY + y * view.scale };
}

export function screenPointToPhysics(view, x, y) {
  return { x: (x - view.offsetX) / view.scale, y: (y - view.offsetY) / view.scale };
}
