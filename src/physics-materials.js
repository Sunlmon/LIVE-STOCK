import { COLORS, PHYSICS_LAYOUT as L, PHYSICS_CONFIG as P, PHYSICS_PALETTE as M } from "./config.js";

const layers = new WeakMap();
const metal = { light: "#c4c4bd", mid: M.silver, dark: "#999b95", edge: "#81837c" };

function gradient(ctx, x, y, w, h, colors) {
  const paint = ctx.createLinearGradient(x, y, x + w, y + h);
  colors.forEach((color, i) => paint.addColorStop(i / (colors.length - 1), color));
  return paint;
}
function rect(ctx, x, y, w, h, radius = 0) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
}
function polygon(ctx, vertices) {
  ctx.beginPath();
  vertices.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y));
  ctx.closePath();
}
function shadow(ctx, alpha = 0.14, blur = 5, y = 3) {
  ctx.shadowColor = `rgba(45,44,41, ${alpha})`;
  ctx.shadowBlur = blur; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = y;
}
function noShadow(ctx) { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }

// Fixed metal parts are rasterized once per presentation scale, not every frame.
// The cache belongs to a stage state and disappears with it; no Matter body changes.
export function drawMachineSurface(ctx, physics) {
  const matrix = ctx.getTransform?.();
  const density = Math.max(1, Math.min(2, Math.ceil(Math.hypot(matrix?.a ?? 1, matrix?.b ?? 0) * 4) / 4));
  let layer = layers.get(physics);
  if (!layer || layer.density !== density) {
    const canvas = ctx.canvas?.ownerDocument?.createElement("canvas");
    if (!canvas) { paintSurface(ctx, physics); return; }
    const left = L.frameLeft - 12, top = L.frameTop - 12;
    const width = L.frameWidth + 24, height = L.frameHeight + 24;
    canvas.width = Math.ceil(width * density); canvas.height = Math.ceil(height * density);
    const paint = canvas.getContext("2d");
    paint.setTransform(density, 0, 0, density, -left * density, -top * density);
    paintSurface(paint, physics);
    layer = { canvas, left, top, width, height, density };
    layers.set(physics, layer);
  }
  ctx.drawImage(layer.canvas, layer.left, layer.top, layer.width, layer.height);
}

function paintSurface(ctx, physics) {
  ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
  const x = L.frameLeft, y = L.frameTop, w = L.frameWidth, h = L.frameHeight;
  shadow(ctx, 0.12, 9, 4);
  ctx.fillStyle = "#a5a4a1";
  rect(ctx, x, y + 4, w, h - 4, 9); ctx.fill();
  noShadow(ctx);
  ctx.fillStyle = gradient(ctx, x, y, w * 0.2, h, ["#cbc9c2", M.body, "#bcbab3"]);
  rect(ctx, x, y, w, h - 4, 8); ctx.fill();
  ctx.strokeStyle = "#a1a09d"; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = "rgba(254,253,250,0.4)";
  rect(ctx, x + 1.5, y + 1.5, w - 3, h - 7, 7); ctx.stroke();

  // Recessed working bed, with a quiet inner lip rather than a glossy face.
  ctx.fillStyle = "#a9a8a5";
  rect(ctx, x + 16, y + 16, w - 32, h - 34, 3); ctx.fill();
  ctx.fillStyle = gradient(ctx, x, y + 20, 0, h, ["#e3e2df", "#e8e7e4", "#dcdbd8"]);
  rect(ctx, x + 20, y + 20, w - 40, h - 42, 2); ctx.fill();
  ctx.strokeStyle = "rgba(76,75,72,0.18)"; ctx.stroke();
  ctx.strokeStyle = "rgba(254,253,250,0.6)";
  ctx.beginPath(); ctx.moveTo(x + 22, y + h - 22); ctx.lineTo(x + w - 22, y + h - 22); ctx.stroke();

  for (const lane of physics.lanes) {
    ctx.fillStyle = gradient(ctx, lane.left, 0, lane.right - lane.left, 0,
      ["rgba(65,64,61,0.11)", "rgba(238,237,234,0.35)", "rgba(65,64,61,0.07)"]);
    ctx.fillRect(lane.left, L.dividerTop, lane.right - lane.left, 168);
  }
  ctx.fillStyle = "#dedbd1";
  ctx.fillRect(L.partitionX + 10, L.partitionTop, L.launchChannelWidth, L.floorY - L.partitionTop);
  for (const body of physics.walls) drawMetalBody(ctx, body);
  for (const pin of physics.pins) drawPin(ctx, pin);

  // Just four small flush fasteners; no decorative screw pattern.
  for (const px of [x + 10, x + w - 10]) for (const py of [y + 10, y + h - 12]) {
    ctx.fillStyle = "#adaca9"; ctx.strokeStyle = "#91908d"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(px, py, 2.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(254,253,250,0.7)";
    ctx.beginPath(); ctx.moveTo(px - 1, py - 1); ctx.lineTo(px + 1, py - 1); ctx.stroke();
  }
  // Keep the upper baffles free of the former rectangular acrylic overlay.
  acrylic(ctx, P.launchX - L.launchChannelWidth / 2 + 1, 408, L.launchChannelWidth - 2, 422);
  ctx.restore();
}

function drawMetalBody(ctx, body) {
  const graphite = ["baffle", "deflector"].includes(body.plugin.kind);
  ctx.save();
  if (body.plugin.kind === "piston-stop") {
    // Rear carriage stop: one flush face behind the ball, never side clamps.
    ctx.fillStyle = M.body; ctx.strokeStyle = "rgba(98,98,88,0.2)"; ctx.lineWidth = 0.7;
    polygon(ctx, body.vertices); ctx.fill(); ctx.stroke(); ctx.restore(); return;
  }
  // The translated side face/shadow is optical depth. The top face always
  // follows the actual collision polygon exactly.
  ctx.translate(1.5, 2.5); ctx.fillStyle = graphite ? "#282724" : "#908f8c";
  polygon(ctx, body.vertices); ctx.fill(); ctx.translate(-1.5, -2.5);
  shadow(ctx, 0.12, 3, 2);
  ctx.fillStyle = gradient(ctx, body.bounds.min.x, body.bounds.min.y,
    body.plugin.width > body.plugin.height ? 0 : body.plugin.width, body.plugin.height,
    graphite ? ["#41423c", M.graphite, "#30312c"] : [metal.light, metal.mid, metal.dark]);
  polygon(ctx, body.vertices); ctx.fill(); noShadow(ctx);
  ctx.strokeStyle = graphite ? "#282724" : metal.edge; ctx.lineWidth = 1; ctx.stroke();
  const a = body.vertices[0], b = body.vertices[1];
  ctx.strokeStyle = graphite ? "rgba(234,233,230,0.22)" : "rgba(254,253,250,0.45)";
  ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(a.x + 0.6, a.y + 0.6); ctx.lineTo(b.x - 0.6, b.y + 0.6); ctx.stroke();
  ctx.restore();
}

function drawPin(ctx, pin) {
  const { x, y } = pin.position, r = pin.circleRadius;
  ctx.save(); shadow(ctx, 0.2, 3, 2);
  const fill = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, 0, x, y, r);
  fill.addColorStop(0, "#d7d7cf"); fill.addColorStop(0.58, M.silver); fill.addColorStop(1, "#969991");
  ctx.fillStyle = fill; ctx.strokeStyle = "#747370"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); noShadow(ctx); ctx.stroke();
  ctx.strokeStyle = "rgba(254,253,250,0.45)";
  ctx.beginPath(); ctx.arc(x, y, r - 1.5, -2.8, -0.7); ctx.stroke();
  ctx.strokeStyle = "rgba(65,64,61,0.12)"; ctx.lineWidth = 0.65;
  for (const dy of [-3, 0, 3]) { ctx.beginPath(); ctx.moveTo(x - 5, y + dy); ctx.lineTo(x + 5, y + dy); ctx.stroke(); }
  ctx.fillStyle = "#8e8d8a";
  ctx.beginPath(); ctx.arc(x, y + 0.3, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function acrylic(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = gradient(ctx, x, y, w, h, ["rgba(255,254,251,0.13)", "rgba(81,80,77,0.035)"]);
  rect(ctx, x, y, w, h, 3); ctx.fill();
  ctx.strokeStyle = "rgba(254,253,250,0.65)"; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.strokeStyle = "rgba(87,86,83,0.16)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + w + 1.5, y + 3); ctx.lineTo(x + w + 1.5, y + h + 1.5); ctx.lineTo(x + 3, y + h + 1.5); ctx.stroke();
  ctx.strokeStyle = "rgba(254,253,250,0.22)";
  ctx.beginPath(); ctx.moveTo(x + 10, y + h * 0.6); ctx.lineTo(x + Math.min(w - 10, 100), y + 10); ctx.stroke();
  ctx.restore();
}

export function drawOutletPlate(ctx, exit, flash) {
  const x = exit.left + 7, y = 983, w = exit.right - exit.left - 14;
  ctx.save();
  ctx.fillStyle = "#a7a6a3"; rect(ctx, x, y, w, 57, 3); ctx.fill();
  ctx.fillStyle = "#b2b1a9";
  rect(ctx, x + 1, y + 2, w - 2, 54, 2); ctx.fill();
  // A brief collection pulse, not a persistent active/closed face or collider.
  ctx.save(); rect(ctx, x + 2, y + 3, w - 4, 51, 2); ctx.clip();
  if (flash.intensity > 0) {
    ctx.globalAlpha = flash.intensity * 0.42;
    ctx.fillStyle = M.amber;
    ctx.fillRect(x + 2, y + 3, w - 4, 51);
  }
  ctx.restore();
  ctx.strokeStyle = "#cbc9bf";
  ctx.lineWidth = 1.2;
  rect(ctx, x + 2, y + 2, w - 4, 53, 2); ctx.stroke();
  ctx.strokeStyle = "#a1a09d";
  ctx.beginPath(); ctx.moveTo(x + 8, y + 53); ctx.lineTo(x + w - 8, y + 53); ctx.stroke();
  ctx.restore();
}

export function drawMetalBall(ctx, image, body, diameter) {
  const r = diameter / 2;
  ctx.save(); ctx.translate(body.position.x, body.position.y); ctx.rotate(body.angle);
  shadow(ctx, 0.22, 4, 2);
  ctx.fillStyle = gradient(ctx, -r, -r, diameter * 0.3, diameter, ["#d3d3cb", M.silver, "#999c94"]);
  ctx.strokeStyle = "#61605d"; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); noShadow(ctx); ctx.stroke();
  ctx.strokeStyle = "rgba(254,253,250,0.45)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, r - 1.7, -2.8, -0.45); ctx.stroke();
  ctx.fillStyle = COLORS.paper;
  ctx.beginPath(); ctx.arc(0, 0, r - 3.5, 0, Math.PI * 2); ctx.fill();
  if (image?.complete && image.naturalWidth > 0) {
    const size = diameter * 0.78;
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
  }
  ctx.restore();
}

export function drawMechanicalLauncher(ctx, physics) {
  const pistonY = physics.piston.position.y;
  const pull = ["pulling", "flight", "returned"].includes(physics.status) ?
    Math.max(-16, Math.min(P.maxPull, (pistonY - P.pistonRestY) * P.maxPull / P.maxSpringCompression)) : 0;
  const handleY = P.handleY + pull;
  ctx.save();
  shadow(ctx, 0.1, 5, 2);
  ctx.fillStyle = M.launcher;
  ctx.strokeStyle = "#a7a6a3"; ctx.lineWidth = 1;
  rect(ctx, P.handleX - 31, P.handleY - 42, 62, P.maxPull + 84, 4); ctx.fill(); noShadow(ctx); ctx.stroke();
  ctx.fillStyle = "rgba(66,65,62,0.08)";
  rect(ctx, P.handleX - 8, P.handleY - 21, 16, P.maxPull + 42, 6); ctx.fill();
  ctx.fillStyle = "#d1cdc1";
  ctx.fillRect(P.handleX - 29, P.handleY + P.minPull, 58, P.maxPull - P.minPull + 38);

  // Two-stroke silver connecting rod, driven by the existing physical piston.
  ctx.strokeStyle = "#8d8c89"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(P.handleX, handleY + 20); ctx.lineTo(P.handleX, 1015); ctx.stroke();
  ctx.strokeStyle = "#e5e4e1"; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.strokeStyle = "#8c8b88"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(P.launchX + P.pistonWidth / 2, pistonY); ctx.lineTo(P.handleX - 44, pistonY); ctx.stroke();
  ctx.strokeStyle = "#e5e4e1"; ctx.lineWidth = 0.9; ctx.stroke();
  drawMetalBody(ctx, { ...physics.piston, plugin: { width: P.pistonWidth, height: 14, kind: "piston" } });

  const startY = pistonY + 8, span = 1020 - startY;
  ctx.beginPath(); ctx.moveTo(P.launchX, startY);
  for (let i = 0; i < 8; i++) {
    const y = startY + span * i / 8, step = span / 8;
    ctx.bezierCurveTo(P.launchX + 34, y + step * 0.28, P.launchX - 34, y + step * 0.72, P.launchX, y + step);
  }
  ctx.strokeStyle = "#83827f"; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = "#e4e3e0"; ctx.lineWidth = 1.1; ctx.stroke();

  for (let i = 0; i <= 16; i++) {
    const y = P.handleY + P.maxPull * i / 16;
    ctx.strokeStyle = y >= P.handleY + P.minPull ? M.amber : "#a9a8a5"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(P.handleX + 53, y); ctx.lineTo(P.handleX + (i % 2 ? 60 : 66), y); ctx.stroke();
  }
  ctx.strokeStyle = M.amber; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(P.handleX + 50, P.handleY + P.minPull); ctx.lineTo(P.handleX + 70, P.handleY + P.minPull); ctx.stroke();

  const armed = physics.status === "pulling" && physics.pull >= P.minPull;
  shadow(ctx, 0.18, 4, 3);
  ctx.fillStyle = gradient(ctx, 0, handleY - P.handleHeight / 2, 0, P.handleHeight,
    ["#c5c5bd", "#b8b9b1", M.silver]);
  ctx.strokeStyle = "#757471"; ctx.lineWidth = 1.3;
  rect(ctx, P.handleX - P.handleWidth / 2, handleY - P.handleHeight / 2, P.handleWidth, P.handleHeight, 4);
  ctx.fill(); noShadow(ctx); ctx.stroke();
  ctx.strokeStyle = "rgba(254,253,250,0.4)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(P.handleX - 39, handleY - 19); ctx.lineTo(P.handleX + 39, handleY - 19); ctx.stroke();
  const releaseGlow = physics.status === "flight" && physics.active &&
    physics.elapsedMs - physics.active.launchedAtMs < 220;
  ctx.strokeStyle = armed || releaseGlow ? M.amber : "#73726f"; ctx.lineWidth = 2;
  for (const dx of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(P.handleX + dx, handleY - 8); ctx.lineTo(P.handleX + dx, handleY + 8); ctx.stroke(); }
  ctx.fillStyle = COLORS.muted; ctx.font = '12px "Consolas", monospace'; ctx.textAlign = "center";
  ctx.fillText("PULL", P.handleX, P.handleY - 57);
  ctx.strokeStyle = "#797875"; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(P.handleX, P.handleY - 42); ctx.lineTo(P.handleX, P.handleY - 25);
  ctx.moveTo(P.handleX - 4, P.handleY - 30); ctx.lineTo(P.handleX, P.handleY - 25); ctx.lineTo(P.handleX + 4, P.handleY - 30); ctx.stroke();
  ctx.restore();
}
