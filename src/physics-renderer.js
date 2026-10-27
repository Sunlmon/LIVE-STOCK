import { COLORS, PHYSICS_CONFIG as P } from "./config.js";
import { SPECIES } from "./animals.js";
import { drawMachineSurface, drawOutletPlate, drawOutletGate, drawMetalBall, drawMechanicalLauncher } from "./physics-materials.js";
import { getOutletFlash } from "./physics-feedback.js";
import { activeOutletProcess, outletPose } from "./outlet-processing.js";

export function drawPhysicsStage(ctx, physics, sprites) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  drawMachineSurface(ctx, physics);
  for (const exit of physics.exits) {
    const x = (exit.left + exit.right) / 2;
    const event = activeOutletProcess(physics, exit.index);
    const pose = event ? outletPose(event, exit, physics.elapsedMs) : null;
    drawOutletPlate(ctx, exit, getOutletFlash(physics, exit.index));
    // The existing symbol is the rear-wall mark and the processed animal's target.
    ctx.save();
    ctx.globalAlpha *= pose ? (pose.phase === "close" ? 1 - pose.gate : 1 - pose.travel) : 1;
    drawExitIcon(ctx, exit.index, x, 1006, "#b8bcb0"); ctx.restore();
    if (event) drawOutletProcess(ctx, event, exit, pose, sprites);
    drawOutletGate(ctx, exit, pose?.gate ?? 0);
  }
  drawMechanicalLauncher(ctx, physics);
  if (physics.active) {
    const { body, species } = physics.active;
    drawMetalBall(ctx, sprites.get(species), body, P.animalDiameter);
  }
  // Four waiting positions: these are preview icons, not extra physical animals.
  for (let i = 0; i < P.totalShots; i++) {
    const x = P.handleX - 20 + (i % 2) * 40;
    const y = 590 + Math.floor(i / 2) * 44;
    ctx.strokeStyle = i < physics.launched ? COLORS.line : COLORS.ink;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke();
    if (i < physics.resolved) {
      ctx.fillStyle = COLORS.line; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

export function drawOutletProcess(ctx, event, exit, pose, sprites) {
  if (pose.complete || pose.phase === "close") return;
  ctx.save();
  // The removed animal is now only a picture inside its actual detected outlet.
  ctx.beginPath(); ctx.rect(exit.left + 8, exit.y, exit.right - exit.left - 16, 63); ctx.clip();
  const animal = () => drawMetalBall(ctx, sprites.get(event.species),
    { position: { x: pose.x, y: pose.y }, angle: pose.angle }, P.animalDiameter);
  const symbol = () => drawExitIcon(ctx, event.exitIndex, pose.x, pose.y, "#eceee2");
  if (pose.transform === 0) animal();
  else if (pose.transform === 1) symbol();
  else {
    // A travelling conversion front, with an 8px feather at the boundary.
    // Shapes share a centre and are never crossfaded wholesale or swapped abruptly.
    const top = pose.y - 28, bottom = pose.y + 28;
    const edge = top - 4 + (bottom - top + 8) * pose.transform;
    const slice = (from, to, alpha, paint) => {
      if (to <= from || alpha <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(exit.left, from, exit.right - exit.left, to - from); ctx.clip();
      ctx.globalAlpha *= alpha; paint(); ctx.restore();
    };
    slice(top, Math.min(bottom, edge - 4), 1, symbol);
    slice(Math.max(top, edge + 4), bottom, 1, animal);
    for (let band = 0; band < 8; band++) {
      const from = Math.max(top, edge - 4 + band), to = Math.min(bottom, edge - 3 + band);
      const animalAlpha = (band + 0.5) / 8;
      slice(from, to, animalAlpha, animal); slice(from, to, 1 - animalAlpha, symbol);
    }
  }
  ctx.restore();
}

export function drawPhysicsDecorations(ctx, sprites, elapsedMs, positions) {
  // Decorative cover motifs only: no colliders, targets or population counts.
  ctx.save();
  ctx.globalAlpha *= 0.5;
  for (const [i, species] of SPECIES.entries()) {
    const { x, y, diameter } = positions[i];
    const floatY = Math.sin(elapsedMs / 1400 + i * 1.7) * Math.min(6, diameter * 0.035);
    drawAnimal(ctx, sprites.get(species.key), x, y + floatY, 0, diameter);
  }
  ctx.restore();
}

function drawAnimal(ctx, image, x, y, angle, diameter) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = COLORS.paper; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(0, 0, diameter / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (image?.complete && image.naturalWidth > 0) {
    const size = diameter * 0.82;
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
  }
  ctx.restore();
}

export function drawExitIcon(ctx, index, x, y, color) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = 2.8;
  ctx.beginPath();
  if (index === 0) {
    ctx.setLineDash([6, 6]);
    ctx.moveTo(-24, 15); ctx.lineTo(-10, 0); ctx.lineTo(3, 6); ctx.lineTo(25, -15);
  } else if (index === 1) {
    ctx.arc(0, 0, 19, -0.8, 1.9); ctx.moveTo(-13, 14); ctx.arc(0, 0, 19, 2.3, 5.1);
    ctx.moveTo(-7, -23); ctx.lineTo(-3, -14);
  } else if (index === 2) {
    ctx.moveTo(-23, -12); ctx.lineTo(7, -12); ctx.lineTo(24, 0); ctx.lineTo(7, 12); ctx.lineTo(-23, 12); ctx.closePath();
    ctx.moveTo(15, 0); ctx.arc(13, 0, 2, 0, Math.PI * 2);
    for (const p of [-16, -10, -3, 3]) { ctx.moveTo(p, -7); ctx.lineTo(p, 7); }
  } else {
    ctx.arc(0, 0, 19, -0.6, 2.5); ctx.moveTo(-15, 10); ctx.lineTo(-21, 13); ctx.lineTo(-23, 4);
    ctx.moveTo(-15, -12); ctx.arc(0, 0, 19, 3.8, 6.8);
    ctx.moveTo(16, -9); ctx.lineTo(22, -12); ctx.lineTo(24, -3);
  }
  ctx.stroke(); ctx.restore();
}
