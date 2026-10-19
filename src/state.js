import { CONFIG } from "./config.js";
import { SPECIES, createAnimal } from "./animals.js";

export function createState() {
  return {
    mode: "intro",
    animals: [],
    particles: [],
    adoptedCount: 0,
    elapsedMs: 0,
    nextBreedAt: CONFIG.breedIntervalMs,
    breedRound: 0,
    breedingBusyUntil: 0,
    waveParentsStarted: 0,
    pendingWaveStartedAt: 0,
    pendingParentSpacingMs: 0,
    pendingParents: [],
    pendingParentIndex: 0,
    pendingBirthAt: null,
    saturationPendingAt: null,
    lastHudUpdateAt: 0,
    density: 0,
  };
}

export function startRound(state) {
  state.mode = "active";
  state.animals = createInitialPopulation();
  state.particles = [];
  state.adoptedCount = 0;
  state.elapsedMs = 0;
  state.nextBreedAt = CONFIG.breedIntervalMs;
  state.breedRound = 0;
  state.breedingBusyUntil = 0;
  state.waveParentsStarted = 0;
  state.pendingWaveStartedAt = 0;
  state.pendingParentSpacingMs = 0;
  state.pendingParents = [];
  state.pendingParentIndex = 0;
  state.pendingBirthAt = null;
  state.saturationPendingAt = null;
  state.lastHudUpdateAt = 0;
  state.density = 0;
}

function createInitialPopulation() {
  const animals = [];
  const minDistance = CONFIG.animalDiameter + CONFIG.animalGap;
  const minX = minDistance / 2;
  const maxX = CONFIG.logicalWidth - minDistance / 2;
  const minY = CONFIG.safeTop + minDistance / 2;
  const maxY = CONFIG.logicalHeight - CONFIG.safeBottom - minDistance / 2;

  for (let index = 0; index < CONFIG.initialPopulation; index += 1) {
    const species = SPECIES[index % SPECIES.length];
    let point = null;
    for (let attempt = 0; attempt < 500 && !point; attempt += 1) {
      const candidate = {
        x: randomBetween(minX, maxX),
        y: randomBetween(minY, maxY),
      };
      if (animals.every((animal) => distanceSquared(animal, candidate) >= minDistance ** 2)) {
        point = candidate;
      }
    }
    if (point) animals.push(createAnimal(species.key, point.x, point.y));
  }

  return animals;
}

function distanceSquared(a, b) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
