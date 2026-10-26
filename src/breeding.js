import { CONFIG } from "./config.js";
import { createAnimal, getAnimalCenter } from "./animals.js";

export function getBreedingTiming(waveNumber, random = Math.random) {
  const factor = CONFIG.breedIntervalDecay ** Math.max(0, waveNumber - 1);
  const baseIntervalMs = Math.max(CONFIG.breedIntervalMinMs, CONFIG.breedIntervalMs * factor);
  // Sample once per scheduled wave, not once per animation frame. At the floor
  // keep a little upward variation rather than becoming perfectly periodic.
  const jitter = 1 + (random() * 2 - 1) * CONFIG.breedIntervalJitter;
  return {
    intervalMs: Math.max(CONFIG.breedIntervalMinMs, baseIntervalMs * jitter),
    recoveryMs: Math.max(CONFIG.breedingRecoveryMinMs, CONFIG.breedingRecoveryMs * factor),
  };
}

export function beginBreedingPulse(state) {
  if (state.mode !== "active" || state.pendingBirthAt !== null || state.elapsedMs < state.breedingBusyUntil) return false;
  // Every animal present at the start is eligible, regardless of growth state.
  // Use a snapshot so this wave's own newborns cannot recursively join its queue.
  const parents = [...state.animals];
  const waveNumber = state.breedRound + 1;
  const capacity = getPopulationLimit(state) - state.animals.length;
  if (parents.length === 0 || capacity <= 0) return false;

  const ramp = Math.min(1, Math.max(0, state.elapsedMs / CONFIG.breedingRampMs));
  const parentFraction = CONFIG.breedingParentFraction +
    (CONFIG.breedingParentFractionMax - CONFIG.breedingParentFraction) * ramp;
  let parentCount = Math.max(1, Math.ceil(parents.length * parentFraction));
  if (waveNumber <= CONFIG.warmupParentRanges.length) {
    const [minParents, maxParents] = CONFIG.warmupParentRanges[waveNumber - 1];
    parentCount = randomInt(minParents, maxParents);
  }
  const isStaggeredWave = waveNumber >= CONFIG.staggeredWaveFirst &&
    waveNumber <= CONFIG.staggeredWaveLast;
  if (isStaggeredWave) {
    // Do not reduce the scheduled sources just because only a few places are
    // free right now: adoptions can free more places during this same wave.
    // The live per-litter capacity check stops at this round's sampled limit.
    parentCount = Math.max(CONFIG.staggeredWaveMinParents, parentCount);
  }
  if (parentCount < 1) return false;
  state.pendingParents = selectSparseParents(parents, Math.min(parentCount, parents.length));
  state.pendingParentIndex = 0;
  state.breedRound = waveNumber;
  state.waveParentsStarted = 0;
  const tailMs = (CONFIG.litterMax - 1) * CONFIG.birthStaggerMs + CONFIG.childSpreadMs;
  const timing = getBreedingTiming(waveNumber);
  // Shorten the scheduling window, never the offspring's continuous movement.
  // Keep the final litter's full animation and a recovery gap before the next wave.
  const staggeredDurationMs = Math.min(CONFIG.staggeredWaveDurationMs,
    Math.max(tailMs, timing.intervalMs - timing.recoveryMs));
  const parentSpanMs = isStaggeredWave
    ? Math.max(0, staggeredDurationMs - tailMs)
    : Math.min(CONFIG.parentBirthSpanMs, (state.pendingParents.length - 1) * CONFIG.parentBirthStaggerMs,
      Math.max(0, timing.intervalMs - timing.recoveryMs - tailMs));
  const waveDurationMs = parentSpanMs + tailMs;
  state.pendingParentSpacingMs = parentSpanMs / Math.max(1, state.pendingParents.length - 1);
  state.pendingWaveStartedAt = state.elapsedMs;
  state.breedingBusyUntil = state.elapsedMs + waveDurationMs;
  state.nextBreedAt = state.elapsedMs + Math.max(
    timing.intervalMs,
    waveDurationMs + timing.recoveryMs,
  );
  // Each litter will emerge from a living source, then displace nearby circles.
  state.pendingBirthAt = state.elapsedMs;
  return true;
}

export function advanceBreedingPulse(state) {
  const parents = state.pendingParents;
  if (parents.length === 0) return finishBreedingPulse(state);
  if (state.elapsedMs < state.pendingBirthAt) return false;

  const targetCount = getPopulationLimit(state);
  const end = Math.min(
    state.pendingParentIndex + CONFIG.breedingParentsPerFrame,
    parents.length,
  );

  while (state.pendingParentIndex < end && state.animals.length < targetCount) {
    const parentIndex = state.pendingParentIndex;
    const dueAt = state.pendingWaveStartedAt + parentIndex * state.pendingParentSpacingMs;
    if (state.elapsedMs < dueAt) break;
    const parent = parents[parentIndex];
    state.pendingParentIndex += 1;
    if (!state.animals.includes(parent)) continue;

    // Newborns are absent from this snapshot, so they cannot breed in this pulse.
    const origin = getAnimalCenter(parent, state.elapsedMs);
    const availableForLitter = targetCount - state.animals.length;
    // The final 1–3 remaining places may form a smaller last litter. Otherwise
    // the scene could otherwise strand itself just below this round's limit.
    const litterSize = randomInt(Math.min(CONFIG.litterMin, availableForLitter),
      Math.min(CONFIG.litterMax, availableForLitter));
    const rotation = Math.random() * Math.PI * 2;
    const destinations = [];
    state.waveParentsStarted += 1;
    for (let litterIndex = 0; litterIndex < litterSize; litterIndex += 1) {
      if (state.animals.length >= targetCount) break;
      const angle = rotation + (Math.PI * 2 * litterIndex) / litterSize + randomBetween(-0.2, 0.2);
      const point = chooseBirthPoint(origin, angle, state.animals, destinations);
      destinations.push(point);
      state.animals.push(createAnimal(parent.species, origin.x, origin.y, {
        parent,
        fromX: origin.x,
        fromY: origin.y,
        toX: point.x,
        toY: point.y,
        arc: randomBetween(-CONFIG.birthArcPx, CONFIG.birthArcPx),
        delayMs: litterIndex * CONFIG.birthStaggerMs,
      }));
    }
  }

  if (state.animals.length >= targetCount) {
    state.pendingParentIndex = parents.length;
  }

  if (state.pendingParentIndex >= parents.length) return finishBreedingPulse(state);
  state.pendingBirthAt = state.pendingWaveStartedAt + state.pendingParentIndex * state.pendingParentSpacingMs;
  return false;
}

function finishBreedingPulse(state) {
  state.pendingParents = [];
  state.pendingParentIndex = 0;
  state.pendingBirthAt = null;
  return true;
}

export function measureDensity(animals) {
  if (animals.length === 0) return 0;
  const reach = CONFIG.animalDiameter * CONFIG.fillReachFactor;
  const reachSquared = reach * reach;
  const columns = Math.ceil(CONFIG.logicalWidth / CONFIG.fillSampleSpacing);
  const playHeight = CONFIG.logicalHeight - CONFIG.safeTop - CONFIG.safeBottom;
  const rows = Math.ceil(playHeight / CONFIG.fillSampleSpacing);
  const bucketColumns = Math.ceil(CONFIG.logicalWidth / reach) + 2;
  const buckets = new Map();
  for (const animal of animals) {
    const key = Math.floor(animal.y / reach) * bucketColumns + Math.floor(animal.x / reach);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(animal);
  }

  let covered = 0;
  // Sample the entire playable area. Several stacked icons cover it only once.
  for (let row = 0; row < rows; row += 1) {
    const y = CONFIG.safeTop + ((row + 0.5) * playHeight) / rows;
    for (let column = 0; column < columns; column += 1) {
      const x = ((column + 0.5) * CONFIG.logicalWidth) / columns;
      const cellX = Math.floor(x / reach);
      const cellY = Math.floor(y / reach);
      let occupied = false;
      for (let dx = -1; dx <= 1 && !occupied; dx += 1) {
        for (let dy = -1; dy <= 1 && !occupied; dy += 1) {
          const neighbors = buckets.get((cellY + dy) * bucketColumns + cellX + dx);
          if (!neighbors) continue;
          occupied = neighbors.some((animal) => (animal.x - x) ** 2 + (animal.y - y) ** 2 <= reachSquared);
        }
      }
      if (occupied) covered += 1;
    }
  }
  return covered / (columns * rows);
}

export function isScreenSaturated(state) {
  // Density remains a visual meter, not an early exit at 450–500 animals.
  return state.animals.length >= getPopulationLimit(state);
}

export function samplePopulationLimit(random = Math.random) {
  const target = Math.min(CONFIG.stageOneEndMax, CONFIG.stageOneEndMin +
    Math.floor(Math.max(0, Math.min(1, random())) * (CONFIG.stageOneEndMax - CONFIG.stageOneEndMin + 1)));
  return getPopulationLimit({ populationLimit: target });
}

export function getPopulationLimit(state) {
  // A geometry-based safety limit is separate from the visual fullness decision.
  const spacing = CONFIG.animalDiameter + CONFIG.animalGap;
  const area = CONFIG.logicalWidth * (CONFIG.logicalHeight - CONFIG.safeTop - CONFIG.safeBottom);
  const packedCircleArea = Math.PI * (spacing / 2) ** 2;
  return Math.min(CONFIG.maxAnimals, state?.populationLimit ?? CONFIG.stageOneEndMax,
    Math.floor((area * CONFIG.packingAreaLimit) / packedCircleArea));
}

function selectSparseParents(animals, count) {
  const radius = CONFIG.breedingDensityRadius;
  const candidates = animals.map((animal) => ({
    animal,
    score: crowdingAt(animal, animals, radius) + Math.random() * 0.05,
    selected: false,
  }));
  const selected = [];
  while (selected.length < count) {
    let best = null;
    for (const candidate of candidates) {
      if (!candidate.selected && (!best || candidate.score < best.score)) best = candidate;
    }
    if (!best) break;
    best.selected = true;
    selected.push(best.animal);
    // Spread the planned sources too, not just the animals already on screen.
    for (const candidate of candidates) {
      const distanceSquared = (candidate.animal.x - best.animal.x) ** 2 +
        (candidate.animal.y - best.animal.y) ** 2;
      const proximity = Math.max(0, 1 - distanceSquared / radius ** 2);
      candidate.score += proximity ** 2 * CONFIG.breedingSourceSeparation;
    }
  }
  return selected;
}

function crowdingAt(point, animals, radius) {
  let score = 0;
  const radiusSquared = radius ** 2;
  for (const animal of animals) {
    if (animal === point) continue;
    const distanceSquared = (animal.x - point.x) ** 2 + (animal.y - point.y) ** 2;
    if (distanceSquared >= radiusSquared) continue;
    score += (1 - distanceSquared / radiusSquared) ** 2;
  }
  return score;
}

function chooseBirthPoint(parent, angle, animals, destinations) {
  const minDistance = CONFIG.animalDiameter + CONFIG.animalGap;
  const minX = minDistance / 2;
  const maxX = CONFIG.logicalWidth - minDistance / 2;
  const minY = CONFIG.safeTop + minDistance / 2;
  const maxY = CONFIG.logicalHeight - CONFIG.safeBottom - minDistance / 2;

  let best = null;
  let bestScore = Infinity;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const direction = angle + (attempt - 2) * 0.3;
    const distance = randomBetween(Math.max(CONFIG.birthSpreadMin, minDistance * 1.05), CONFIG.birthSpreadMax);
    let dx = Math.cos(direction) * distance;
    let dy = Math.sin(direction) * distance;
    // Reflect at the edge, while retaining the parent's actual birth origin.
    if (parent.x + dx < minX || parent.x + dx > maxX) dx = -dx;
    if (parent.y + dy < minY || parent.y + dy > maxY) dy = -dy;
    const point = {
      x: clamp(parent.x + dx, minX, maxX),
      y: clamp(parent.y + dy, minY, maxY),
    };
    const score = crowdingAt(point, animals, minDistance * 1.6) +
      crowdingAt(point, destinations, minDistance * 1.5) * 2;
    if (score < bestScore) {
      best = point;
      bestScore = score;
    }
  }
  return best;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
