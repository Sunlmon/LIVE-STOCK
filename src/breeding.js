import { CONFIG } from "./config.js";
import { createAnimal, getAnimalCenter } from "./animals.js";

export function beginBreedingPulse(state) {
  const parents = state.animals.slice();
  if (parents.length === 0) return;

  state.pendingParents = parents;
  state.pendingBirthAt = state.elapsedMs + CONFIG.birthAnimationMs;
  for (const parent of parents) parent.pulse = 0;
}

export function completeBreedingPulse(state) {
  const parents = state.pendingParents;
  if (parents.length === 0) {
    state.pendingParents = [];
    state.pendingBirthAt = null;
    return 0;
  }

  const occupancy = buildOccupancy(state.animals);
  let births = 0;

  for (const parent of parents) {
    if (state.animals.length >= CONFIG.maxAnimals) break;
    if (!state.animals.includes(parent)) continue;

    // Newborns are absent from this snapshot, so they cannot breed in this pulse.
    const origin = getAnimalCenter(parent, state.elapsedMs);
    const litterSize = randomInt(CONFIG.litterMin, CONFIG.litterMax);
    for (let litterIndex = 0; litterIndex < litterSize; litterIndex += 1) {
      if (state.animals.length >= CONFIG.maxAnimals) break;
      const point = chooseBirthPoint(parent, occupancy);
      state.animals.push(createAnimal(parent.species, point.x, point.y, {
        fromX: origin.x,
        fromY: origin.y,
      }));
      addToOccupancy(occupancy, point.x, point.y);
      births += 1;
    }
    parent.pulse = -1;
  }

  state.pendingParents = [];
  state.pendingBirthAt = null;
  return births;
}

export function measureDensity(animals) {
  if (animals.length === 0) return 0;
  const occupancy = buildOccupancy(animals);
  let occupied = 0;
  for (const count of occupancy.values()) {
    if (count > 0) occupied += 1;
  }
  const columns = Math.ceil(CONFIG.logicalWidth / CONFIG.densityCellSize);
  const rows = Math.ceil((CONFIG.logicalHeight - CONFIG.safeTop - CONFIG.safeBottom) / CONFIG.densityCellSize);
  return Math.min(1, occupied / (columns * rows));
}

export function isScreenSaturated(state) {
  return (
    state.animals.length >= CONFIG.maxAnimals ||
    state.animals.length >= CONFIG.saturationAnimalCount ||
    state.density >= CONFIG.saturationDensity
  );
}

function buildOccupancy(animals) {
  const occupancy = new Map();
  for (const animal of animals) addToOccupancy(occupancy, animal.x, animal.y);
  return occupancy;
}

function addToOccupancy(occupancy, x, y) {
  const cell = cellFor(x, y);
  occupancy.set(cell, (occupancy.get(cell) ?? 0) + 1);
}

function cellFor(x, y) {
  const column = Math.floor(x / CONFIG.densityCellSize);
  const row = Math.floor((y - CONFIG.safeTop) / CONFIG.densityCellSize);
  return `${column}:${row}`;
}

function chooseBirthPoint(parent, occupancy) {
  const minX = CONFIG.animalDiameter / 2;
  const maxX = CONFIG.logicalWidth - minX;
  const minY = CONFIG.safeTop + CONFIG.animalDiameter / 2;
  const maxY = CONFIG.logicalHeight - CONFIG.safeBottom - CONFIG.animalDiameter / 2;
  let best = { x: parent.x, y: parent.y };
  let bestCrowding = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < CONFIG.birthPlacementAttempts; attempt += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = randomBetween(CONFIG.birthSpreadMin, CONFIG.birthSpreadMax);
    const point = {
      x: clamp(parent.x + Math.cos(angle) * distance, minX, maxX),
      y: clamp(parent.y + Math.sin(angle) * distance, minY, maxY),
    };
    const crowding = neighborhoodCrowding(point.x, point.y, occupancy);
    if (crowding < bestCrowding) {
      best = point;
      bestCrowding = crowding;
      if (crowding === 0) break;
    }
  }

  return best;
}

function neighborhoodCrowding(x, y, occupancy) {
  const column = Math.floor(x / CONFIG.densityCellSize);
  const row = Math.floor((y - CONFIG.safeTop) / CONFIG.densityCellSize);
  let total = 0;
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      total += occupancy.get(`${column + dx}:${row + dy}`) ?? 0;
    }
  }
  return total;
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
