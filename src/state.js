import { CONFIG } from "./config.js";
import { SPECIES, createAnimal } from "./animals.js";
import { isScreenSaturated, getBreedingTiming, samplePopulationLimit } from "./breeding.js";

export function createState() {
  return {
    mode: "intro",
    animals: [],
    particles: [],
    adoptedCount: 0,
    populationLimit: null,
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
    capacityConfirmed: false,
    lastHudUpdateAt: 0,
    density: 0,
    physics: null,
    stageOneSnapshot: [],
    stageOneSummary: null,
    physicsRepresentatives: [],
    physicalOutcomes: [],
    simulatedFates: [],
    reveal: null,
  };
}

export function startRound(state, { populationRandom = Math.random } = {}) {
  state.physics?.dispose();
  state.physics = null;
  state.stageOneSnapshot = [];
  state.stageOneSummary = null;
  state.physicsRepresentatives = [];
  state.physicalOutcomes = [];
  state.simulatedFates = [];
  state.reveal = null;
  state.mode = "active";
  state.animals = createInitialPopulation();
  state.populationLimit = samplePopulationLimit(populationRandom);
  state.particles = [];
  state.adoptedCount = 0;
  state.elapsedMs = 0;
  state.nextBreedAt = getBreedingTiming(1).intervalMs;
  state.breedRound = 0;
  state.breedingBusyUntil = 0;
  state.waveParentsStarted = 0;
  state.pendingWaveStartedAt = 0;
  state.pendingParentSpacingMs = 0;
  state.pendingParents = [];
  state.pendingParentIndex = 0;
  state.pendingBirthAt = null;
  state.capacityConfirmed = false;
  state.lastHudUpdateAt = 0;
  state.density = 0;
}

export function beginStageOneFinish(state) {
  if (state.mode !== "active" || !isScreenSaturated(state)) return false;
  // Latch once: falling density during redistribution must not re-enable input.
  state.mode = "finishing";
  return true;
}

export function isStageOneFinishReady(state) {
  return state.mode === "finishing" && state.pendingBirthAt === null &&
    state.pendingParents.length === 0 &&
    !state.animals.some(animal => animal.birth && !animal.birth.complete);
}

export function beginCapacityNotice(state) {
  // Keep the existing active-state development preview, but never skip a live
  // final wave when entering from the real finishing state.
  if (state.mode !== "active" && !isStageOneFinishReady(state)) return false;
  state.mode = "capacity";
  state.capacityConfirmed = false;
  return true;
}

export function confirmCapacityNotice(state) {
  if (state.mode !== "capacity" || state.capacityConfirmed) return false;
  state.capacityConfirmed = true;
  return true;
}

export function captureStageOne(state) {
  // Copy only stable individual data, not animation references to other animals.
  state.stageOneSnapshot = Object.freeze(state.animals.map(({ species, x, y, phase }) =>
    Object.freeze({ species, x, y, phase }),
  ));
  state.stageOneSummary = Object.freeze({ adoptedCount: state.adoptedCount, elapsedMs: state.elapsedMs,
    populationLimit: state.populationLimit });
  const candidates = [...state.stageOneSnapshot];
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  state.physicsRepresentatives = candidates.slice(0, 4);
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
