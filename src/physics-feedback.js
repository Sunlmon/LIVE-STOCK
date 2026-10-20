export const OUTLET_FLASH_MS = 360;

// Read the existing once-only collection event. Rendering neither adds events
// nor runs timers, so a pause/retry cannot duplicate or leave a flash stuck on.
export function getOutletFlash(physics, exitIndex) {
  const events = physics.outletClosures.filter(event => event.exitIndex === exitIndex);
  const last = events.at(-1);
  if (!last) return { intensity: 0, triggers: 0 };
  const elapsed = physics.elapsedMs - last.startedAtMs;
  if (elapsed < 0 || elapsed >= OUTLET_FLASH_MS - 1e-6) return { intensity: 0, triggers: events.length };
  const t = elapsed / OUTLET_FLASH_MS;
  const intensity = t < 0.15 ? Math.sin(t / 0.15 * Math.PI / 2) : (1 - (t - 0.15) / 0.85) ** 2;
  return { intensity, triggers: events.length };
}
