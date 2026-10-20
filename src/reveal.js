import { CONFIG, COLORS } from "./config.js";
import { drawExitIcon } from "./physics-renderer.js";

export const FATE_LABELS = Object.freeze(["流浪", "意外死亡", "商品化处理", "继续繁育"]);
export const REVEAL_CONFIG = Object.freeze({
  entryDelayMs: 520, holdMs: 1000, fadeMs: 1400, symbolsMs: 1500,
  symbolsHoldMs: 2500,
  skullsMs: 1100, disappearSpanMs: 2600, disappearFadeMs: 320, blankMs: 240,
  // Creative simulation weights only, NOT researched real-world frequencies.
  weights: Object.freeze([1, 1, 1, 1]),
});

export function percentageTenths(counts) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return counts.map(() => 0);
  const exact = counts.map(count => count * 1000 / total);
  const rounded = exact.map(Math.floor);
  const order = exact.map((value, i) => ({ i, remainder: value - rounded[i] }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  const missing = 1000 - rounded.reduce((a, b) => a + b, 0);
  for (let i = 0; i < missing; i++) rounded[order[i].i]++;
  return rounded;
}

export function createReveal(snapshot, random = Math.random, weights = REVEAL_CONFIG.weights) {
  if (weights.length !== 4 || weights.some(w => !Number.isFinite(w) || w < 0) || !weights.some(w => w > 0)) {
    throw new Error("结尾模拟需要四个有效的创作权重。");
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const counts = [0, 0, 0, 0];
  const randomUnit = () => Math.max(0, Math.min(1 - Number.EPSILON, random()));
  // Shuffle disappearance order, NOT positions or species. No four-group layout.
  const order = snapshot.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(randomUnit() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const ranks = [];
  order.forEach((index, rank) => { ranks[index] = rank; });
  const items = Object.freeze(snapshot.map((animal, i) => {
    let pick = randomUnit() * totalWeight, exitIndex = 0;
    while (exitIndex < 3 && pick >= weights[exitIndex]) pick -= weights[exitIndex++];
    counts[exitIndex]++;
    return Object.freeze({ species: animal.species, x: animal.x, y: animal.y, exitIndex,
      vanishDelayMs: snapshot.length > 1 ? ranks[i] / (snapshot.length - 1) * REVEAL_CONFIG.disappearSpanMs : 0 });
  }));
  return { items, counts: Object.freeze(counts), percentages: Object.freeze(percentageTenths(counts)),
    elapsedMs: 0, complete: false };
}

const clamp = t => Math.max(0, Math.min(1, t));
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export function revealVisualAt(elapsedMs) {
  const C = REVEAL_CONFIG;
  let t = Math.max(0, elapsedMs);
  if (t < C.holdMs) return { phase: "hold", animal: 1, fate: 0, skull: 0, dissolveMs: -1, complete: false };
  t -= C.holdMs;
  if (t < C.fadeMs) return { phase: "fade", animal: 1 - 0.7 * smooth(t / C.fadeMs), fate: 0, skull: 0, dissolveMs: -1, complete: false };
  t -= C.fadeMs;
  if (t < C.symbolsMs) {
    const u = smooth(t / C.symbolsMs);
    return { phase: "symbols", animal: 0.3 * (1 - u), fate: u, skull: 0, dissolveMs: -1, complete: false };
  }
  t -= C.symbolsMs;
  if (t < C.symbolsHoldMs) {
    return { phase: "fates", animal: 0, fate: 1, skull: 0, dissolveMs: -1, complete: false };
  }
  t -= C.symbolsHoldMs;
  if (t < C.skullsMs) {
    const u = smooth(t / C.skullsMs);
    return { phase: "skulls", animal: 0, fate: 1 - u, skull: u, dissolveMs: -1, complete: false };
  }
  t -= C.skullsMs;
  return { phase: "dissolve", animal: 0, fate: 0, skull: 1, dissolveMs: t,
    complete: t >= C.disappearSpanMs + C.disappearFadeMs + C.blankMs };
}

export function updateReveal(reveal, dt) {
  if (reveal.complete) return;
  reveal.elapsedMs += Math.max(0, Math.min(dt, 0.05)) * 1000;
  reveal.complete = revealVisualAt(reveal.elapsedMs).complete;
}

export function revealItemAlphas(reveal, item, visual = revealVisualAt(reveal.elapsedMs)) {
  const visible = visual.dissolveMs < 0 ? 1 : 1 - smooth((visual.dissolveMs - item.vanishDelayMs) / REVEAL_CONFIG.disappearFadeMs);
  return { animal: visual.animal, fate: visual.fate, skull: visual.skull * visible };
}

const symbolLayers = new WeakMap();
function symbolSprites(ctx) {
  const owner = ctx.canvas.ownerDocument;
  if (symbolLayers.has(owner)) return symbolLayers.get(owner);
  const sprites = Array.from({ length: 5 }, (_, i) => {
    const canvas = owner.createElement("canvas");
    canvas.width = canvas.height = 128;
    const paint = canvas.getContext("2d");
    paint.translate(64, 64);
    paint.scale(128 / CONFIG.animalDiameter, 128 / CONFIG.animalDiameter);
    paint.fillStyle = COLORS.paper; paint.strokeStyle = COLORS.muted; paint.lineWidth = 1.1;
    paint.beginPath(); paint.arc(0, 0, CONFIG.animalDiameter / 2 - 1, 0, Math.PI * 2); paint.fill(); paint.stroke();
    paint.scale(0.76, 0.76);
    if (i < 4) drawExitIcon(paint, i, 0, 0, COLORS.ink);
    else drawSkull(paint);
    return canvas;
  });
  symbolLayers.set(owner, sprites);
  return sprites;
}

function drawSkull(ctx) {
  // Original, non-graphic outline; a visual metaphor, not a mortality statistic.
  ctx.strokeStyle = COLORS.ink; ctx.fillStyle = COLORS.ink; ctx.lineWidth = 2.4;
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-11, 16); ctx.lineTo(-11, 8);
  ctx.bezierCurveTo(-30, 2, -24, -23, 0, -23);
  ctx.bezierCurveTo(24, -23, 30, 2, 11, 8);
  ctx.lineTo(11, 16); ctx.closePath(); ctx.stroke();
  for (const x of [-9, 9]) { ctx.beginPath(); ctx.arc(x, -3, 4.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(-3, 8); ctx.lineTo(3, 8); ctx.closePath(); ctx.fill();
  for (const x of [-4, 4]) { ctx.beginPath(); ctx.moveTo(x, 11); ctx.lineTo(x, 16); ctx.stroke(); }
}

export function drawReveal(ctx, reveal, animalSprites) {
  const visual = revealVisualAt(reveal.elapsedMs);
  const symbols = symbolSprites(ctx);
  const d = CONFIG.animalDiameter;
  ctx.save();
  for (const item of reveal.items) {
    const alpha = revealItemAlphas(reveal, item, visual);
    if (alpha.animal > 0) {
      ctx.globalAlpha = alpha.animal;
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 1.25;
      ctx.beginPath(); ctx.arc(item.x, item.y, d / 2, 0, Math.PI * 2); ctx.stroke();
      const image = animalSprites.get(item.species);
      if (image?.complete && image.naturalWidth > 0) ctx.drawImage(image, item.x - d * 0.38, item.y - d * 0.38, d * 0.76, d * 0.76);
    }
    for (const [opacity, image] of [[alpha.fate, symbols[item.exitIndex]], [alpha.skull, symbols[4]]]) {
      if (opacity <= 0) continue;
      ctx.globalAlpha = opacity;
      ctx.drawImage(image, item.x - d / 2, item.y - d / 2, d, d);
    }
  }
  ctx.restore();
}
