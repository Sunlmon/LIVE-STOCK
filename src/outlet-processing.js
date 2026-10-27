// Presentation-only timing and geometry. Never chooses an outlet or changes a body.
export const OUTLET_TIMING = Object.freeze({ arriveMs: 180, transformMs: 300,
  formedMs: 80, openMs: 180, dropMs: 320, closeMs: 240 });
export const OUTLET_TOTAL_MS = Object.values(OUTLET_TIMING).reduce((sum, ms) => sum + ms, 0);
const clamp = t => Math.max(0, Math.min(1, t));
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };

export function outletVisualAt(elapsedMs) {
  const C = OUTLET_TIMING;
  let t = Math.max(0, elapsedMs);
  const visual = { phase: "arrive", travel: smooth(t / C.arriveMs), transform: 0,
    gate: 0, drop: 0, complete: false };
  if (t < C.arriveMs) return visual;
  t -= C.arriveMs; visual.travel = 1; visual.phase = "transform";
  visual.transform = smooth(t / C.transformMs);
  if (t < C.transformMs) return visual;
  t -= C.transformMs; visual.transform = 1; visual.phase = "formed";
  if (t < C.formedMs) return visual;
  t -= C.formedMs; visual.phase = "open"; visual.gate = smooth(t / C.openMs);
  if (t < C.openMs) return visual;
  t -= C.openMs; visual.gate = 1; visual.phase = "drop";
  // An accelerating fall, not a physical trajectory assigned to a live animal.
  visual.drop = clamp(t / C.dropMs) ** 2;
  if (t < C.dropMs) return visual;
  t -= C.dropMs; visual.drop = 1; visual.phase = "close";
  visual.gate = 1 - smooth(t / C.closeMs);
  if (t < C.closeMs) return visual;
  return { ...visual, phase: "done", gate: 0, complete: true };
}

export function activeOutletProcess(physics, exitIndex) {
  return physics.outletClosures.find(event => event.exitIndex === exitIndex && !event.complete) ?? null;
}

export function hasPendingOutletProcesses(physics) {
  return physics.outletClosures.some(event => !event.complete);
}

export function outletPose(event, exit, elapsedMs) {
  const visual = outletVisualAt(elapsedMs - event.startedAtMs);
  const x = (exit.left + exit.right) / 2;
  const angle = Math.atan2(Math.sin(event.fromAngle), Math.cos(event.fromAngle));
  return { ...visual, x: event.fromX + (x - event.fromX) * visual.travel,
    y: event.fromY + (1006 - event.fromY) * visual.travel + 90 * visual.drop,
    angle: angle * (1 - visual.travel) };
}
