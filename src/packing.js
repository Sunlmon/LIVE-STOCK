import { CONFIG } from "./config.js";

let visitOffset = 0;

// A local position solver for stage one; no rigid-body engine is needed here.
// Spatial buckets avoid testing every circle against every other circle.
export function resolveAnimalPacking(animals, dt) {
  if (dt <= 0 || animals.length === 0) return;
  const limits = getLimits();
  const budgets = {
    startX: new Float64Array(animals.length),
    startY: new Float64Array(animals.length),
    maxStep: CONFIG.packingPushSpeed * dt,
  };

  for (let index = 0; index < animals.length; index += 1) {
    if (!isActive(animals[index])) continue;
    keepInside(animals[index], limits);
    budgets.startX[index] = animals[index].x;
    budgets.startY[index] = animals[index].y;
  }
  if (animals.length < 2) return;
  // Rotate constraint priority so the same edge contacts cannot spend the
  // movement budget first forever and trap newer circles underneath them.
  visitOffset = (visitOffset + Math.max(1, Math.floor(animals.length * 0.618))) % animals.length;

  // Contact-only correction leaves compact islands beside large empty areas.
  // A gentle wider pressure lets those islands expand into the available room.
  spreadIntoFreeSpace(animals, dt, budgets, limits);

  for (let iteration = 0; iteration < CONFIG.packingIterations; iteration += 1) {
    const buckets = buildBuckets(animals, limits.distance);
    let hasOverlap = false;
    visitNeighbors(animals, buckets, limits.distance, (a, b, i, j) => {
      if (sharesBirthSource(a, b)) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      const overlap = limits.distance - distance;
      if (overlap <= CONFIG.packingTolerance) return;
      hasOverlap = true;

      // Exact coincident centers need a stable direction, rather than jitter.
      const angle = (i * 2.3999632297 + j * 0.7548776662) % (Math.PI * 2);
      const nx = distance > 0.0001 ? dx / distance : Math.cos(angle);
      const ny = distance > 0.0001 ? dy / distance : Math.sin(angle);
      const weightA = mobility(a);
      const weightB = mobility(b);
      const correction = overlap * CONFIG.packingRelaxation;
      const shareA = weightA / (weightA + weightB);
      push(a, -nx, -ny, correction * shareA, budgets, i, limits);
      push(b, nx, ny, correction * (1 - shareA), budgets, j, limits);
    }, visitOffset);
    if (!hasOverlap) break;
  }
}

function spreadIntoFreeSpace(animals, dt, budgets, limits) {
  const reach = limits.distance * CONFIG.packingSpreadFactor;
  const buckets = buildBuckets(animals, reach);
  visitNeighbors(animals, buckets, reach, (a, b, i, j) => {
    if (sharesBirthSource(a, b)) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    if (distance < limits.distance - CONFIG.packingTolerance || distance >= reach) return;
    const pressure = Math.min(1, (reach - distance) / (reach - limits.distance));
    const correction = CONFIG.packingSpreadSpeed * dt * pressure;
    const shareA = mobility(a) / (mobility(a) + mobility(b));
    push(a, -dx / distance, -dy / distance, correction * shareA, budgets, i, limits);
    push(b, dx / distance, dy / distance, correction * (1 - shareA), budgets, j, limits);
  }, visitOffset);
}

export function isPackingSettled(animals, includeGap = true) {
  const distance = CONFIG.animalDiameter + CONFIG.animalGap;
  const clearance = (includeGap ? distance : CONFIG.animalDiameter) - CONFIG.packingTolerance;
  const buckets = buildBuckets(animals, distance);
  let settled = true;
  visitNeighbors(animals, buckets, distance, (a, b) => {
    if (Math.hypot(b.x - a.x, b.y - a.y) < clearance - 0.00001) {
      settled = false;
    }
  });
  return settled;
}

function isActive(animal) {
  return !animal.birth || animal.birth.complete || animal.birth.started;
}

function sharesBirthSource(a, b) {
  const emergingA = a.birth && !a.birth.complete && a.birth.progress < 0.3;
  const emergingB = b.birth && !b.birth.complete && b.birth.progress < 0.3;
  // Brief source overlap is intentional: babies must visibly emerge from a body.
  if (emergingA && a.birth.parent === b) return true;
  if (emergingB && b.birth.parent === a) return true;
  return Boolean(
    emergingA && emergingB && a.birth.parent && a.birth.parent === b.birth.parent,
  );
}

function mobility(animal) {
  // Emerging children drive the displacement; surrounding animals yield first.
  return animal.birth && !animal.birth.complete ? CONFIG.packingBirthMobility : 1;
}

function getLimits() {
  const distance = CONFIG.animalDiameter + CONFIG.animalGap;
  const radius = distance / 2;
  return {
    distance,
    minX: radius,
    maxX: CONFIG.logicalWidth - radius,
    minY: CONFIG.safeTop + radius,
    maxY: CONFIG.logicalHeight - CONFIG.safeBottom - radius,
  };
}

function keepInside(animal, limits) {
  animal.x = Math.min(limits.maxX, Math.max(limits.minX, animal.x));
  animal.y = Math.min(limits.maxY, Math.max(limits.minY, animal.y));
}

function push(animal, nx, ny, distance, budgets, index, limits) {
  if (distance <= 0) return;
  const dx = animal.x + nx * distance - budgets.startX[index];
  const dy = animal.y + ny * distance - budgets.startY[index];
  const travel = Math.hypot(dx, dy);
  const scale = travel > budgets.maxStep ? budgets.maxStep / travel : 1;
  // Bound the visible per-frame displacement, not the accumulated internal
  // corrections. Contacts can then rebalance without starving later pairs.
  animal.x = budgets.startX[index] + dx * scale;
  animal.y = budgets.startY[index] + dy * scale;
  keepInside(animal, limits);
}

function buildBuckets(animals, cellSize) {
  const buckets = new Map();
  const columns = Math.ceil(CONFIG.logicalWidth / cellSize) + 2;
  for (let index = 0; index < animals.length; index += 1) {
    const animal = animals[index];
    if (!isActive(animal)) continue;
    const key = Math.floor(animal.y / cellSize) * columns + Math.floor(animal.x / cellSize);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(index);
  }
  return buckets;
}

function visitNeighbors(animals, buckets, cellSize, visit, startIndex = 0) {
  const columns = Math.ceil(CONFIG.logicalWidth / cellSize) + 2;
  for (let cursor = 0; cursor < animals.length; cursor += 1) {
    const index = (startIndex + cursor) % animals.length;
    const a = animals[index];
    if (!isActive(a)) continue;
    const column = Math.floor(a.x / cellSize);
    const row = Math.floor(a.y / cellSize);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const neighbors = buckets.get((row + dy) * columns + column + dx);
        if (!neighbors) continue;
        for (const otherIndex of neighbors) {
          if (otherIndex > index) visit(a, animals[otherIndex], index, otherIndex);
        }
      }
    }
  }
}
