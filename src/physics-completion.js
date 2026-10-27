import { hasPendingOutletProcesses } from "./outlet-processing.js";
import { PHYSICS_CONFIG } from "./config.js";

export const COMPLETION_TIMING = Object.freeze({ machineFadeMs: 450, textFadeMs: 350 });
const clamp = t => Math.max(0, Math.min(1, t));
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };

export function completionVisualAt(elapsedMs) {
  const C = COMPLETION_TIMING, t = Math.max(0, elapsedMs);
  const visibleFrom = C.machineFadeMs + C.textFadeMs;
  return {
    machineAlpha: 1 - smooth(t / C.machineFadeMs),
    textAlpha: smooth((t - C.machineFadeMs) / C.textFadeMs),
    phase: t < C.machineFadeMs ? "machine-out" : t < visibleFrom ? "text-in" : "ready",
    ready: t >= visibleFrom,
  };
}

export function beginPhysicsCompletion(state) {
  const physics = state.physics?.state;
  if (state.mode !== "physics" || physics?.status !== "complete" || physics.active ||
    physics.launched !== PHYSICS_CONFIG.totalShots || physics.resolved !== PHYSICS_CONFIG.totalShots ||
    hasPendingOutletProcesses(physics)) return false;
  state.mode = "physics-complete";
  state.physicsCompletion = { elapsedMs: 0, confirmed: false };
  return true;
}

export function updatePhysicsCompletion(state, dt, hidden = false) {
  if (state.mode !== "physics-complete" || !state.physicsCompletion || hidden) return false;
  const fullAt = COMPLETION_TIMING.machineFadeMs + COMPLETION_TIMING.textFadeMs;
  state.physicsCompletion.elapsedMs = Math.min(fullAt,
    state.physicsCompletion.elapsedMs + Math.max(0, Number.isFinite(dt) ? dt * 1000 : 0));
  return completionVisualAt(state.physicsCompletion.elapsedMs).ready;
}

export function confirmPhysicsCompletion(state) {
  const completion = state.physicsCompletion;
  if (state.mode !== "physics-complete" || !completion || completion.confirmed ||
    !completionVisualAt(completion.elapsedMs).ready) return false;
  completion.confirmed = true;
  return true;
}
