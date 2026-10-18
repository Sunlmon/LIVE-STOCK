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
    pendingParents: [],
    pendingBirthAt: null,
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
  state.pendingParents = [];
  state.pendingBirthAt = null;
  state.lastHudUpdateAt = 0;
  state.density = 0;
}

function createInitialPopulation() {
  const animals = [];
  const minX = CONFIG.animalDiameter;
  const maxX = CONFIG.logicalWidth - CONFIG.animalDiameter;
  const minY = CONFIG.safeTop;
  const maxY = CONFIG.logicalHeight - CONFIG.safeBottom;

  for (const species of SPECIES) {
    for (let index = 0; index < CONFIG.initialPerSpecies; index += 1) {
      animals.push(
        createAnimal(
          species.key,
          randomBetween(minX, maxX),
          randomBetween(minY, maxY),
        ),
      );
    }
  }

  return animals;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
