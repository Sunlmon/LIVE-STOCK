import { CONFIG } from "./config.js";
import { resolveAnimalPacking } from "./packing.js";

// Approved preview selection: B for five species; A for the parrot.
// Self-contained SVGs are shared by the cover, Canvas sprites and side motifs.
const outline = (variant, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" data-icon-variant="${variant}"><g fill="#F1EFE8" stroke="#343530" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;

export const SPECIES = Object.freeze([
  {
    key: "cat",
    label: "猫",
    svg: outline("b-cat", `
      <path d="m25 39-3-27 21 17q7-2 14 0l21-17-3 27q9 11 1 27Q66 81 50 88Q34 81 24 66q-8-16 1-27Z" /><path d="m28 25 8 8m36-8-8 8M27 56 9 51m17 12-18 1m20 6-17 8m62-22 18-5m-17 12 18 1m-20 6 17 8" stroke-width="3.7" /><circle cx="39" cy="48" r="2.9" fill="#343530" stroke="none" /><circle cx="61" cy="48" r="2.9" fill="#343530" stroke="none" /><path d="m45 59 5 5 5-5Z" fill="#343530" stroke="none" /><path d="M50 64v6m0 0q-5 7-10 1m10-1q5 7 10 1" stroke-width="3.4" />
    `),
  },
  {
    key: "dog",
    label: "狗",
    svg: outline("b-dog", `
      <path d="M30 25C20 19 10 28 11 40L12 64Q19 77 29 64M70 25C80 19 90 28 89 40L88 64Q81 77 71 64" /><path d="M28 34Q28 23 50 23Q72 23 72 34L77 59Q80 83 65 86H35Q20 83 23 59Z" /><circle cx="36" cy="46" r="2.8" fill="#343530" stroke="none" /><circle cx="64" cy="46" r="2.8" fill="#343530" stroke="none" /><path d="M29 63Q29 54 50 54Q71 54 71 63v4Q71 78 50 79Q29 78 29 67Z" stroke-width="3.6" /><path d="M42 57Q50 53 58 57Q58 66 50 67Q42 66 42 57Z" fill="#343530" stroke="none" /><path d="M50 67v5m0 0q-6 5-11 0m11 0q6 5 11 0" stroke-width="3.3" />
    `),
  },
  {
    key: "rabbit",
    label: "兔子",
    svg: outline("b-rabbit", `
      <path d="M35 49C22 23 25 6 32 6Q42 7 45 46M55 46Q58 7 68 6C75 6 78 23 65 49" /><path d="m33 20 6 21m28-21-6 21" stroke-width="3.3" /><path d="M50 45Q29 45 29 64Q30 88 50 92Q70 88 71 64Q71 45 50 45Z" /><circle cx="40" cy="60" r="2.8" fill="#343530" stroke="none" /><circle cx="60" cy="60" r="2.8" fill="#343530" stroke="none" /><path d="m46 70 4 4 4-4Z" fill="#343530" stroke="none" /><path d="M50 74v5m-5 0v5h10v-5m-5 0v5" stroke-width="3" />
    `),
  },
  {
    key: "hamster",
    label: "仓鼠",
    svg: outline("b-hamster", `
      <circle cx="29" cy="29" r="6.8" /><circle cx="71" cy="29" r="6.8" /><path d="M25 43Q26 26 50 27Q74 26 75 43C93 44 96 63 86 76Q75 89 50 89Q25 89 14 76C4 63 7 44 25 43Z" /><circle cx="39" cy="47" r="2.9" fill="#343530" stroke="none" /><circle cx="61" cy="47" r="2.9" fill="#343530" stroke="none" /><path d="M29 57Q17 57 20 69Q22 77 32 76M71 57Q83 57 80 69Q78 77 68 76" stroke-width="3.4" /><path d="M46 56Q50 53 54 56q0 5-4 6-4-1-4-6Z" fill="#343530" stroke="none" /><path d="M50 62v4m0 0q-5 6-10 0m10 0q5 6 10 0m-13 6v6h6v-6" stroke-width="3.1" />
    `),
  },
  {
    key: "bird",
    label: "鹦鹉",
    svg: outline("a-parrot", `
      <path d="M30 73C17 63 18 39 29 27Q43 12 64 22Q78 29 76 43L69 66Q64 77 52 79L33 87l3-13Z" /><path d="M34 22q-2-7 5-10l5 9" /><path d="M62 40Q78 31 88 42Q94 55 76 67Q80 54 63 52Z" /><path d="M64 54q10 6 7 14l-10-5" stroke-width="3.3" /><path d="M43 29Q29 38 35 53Q40 65 54 64" stroke-width="3.2" /><circle cx="48" cy="39" r="3.4" fill="#343530" stroke="none" />
    `),
  },
  {
    key: "goldfish",
    label: "金鱼",
    svg: outline("b-goldfish", `
      <path d="M32 46 9 28Q13 41 17 51Q13 63 9 76L32 59Z" /><path d="M43 33 52 18 65 33m-21 39 12 15 12-16" /><path d="M27 52C36 33 50 28 64 33Q82 39 91 52Q82 67 64 72C50 77 36 71 27 52Z" /><path d="M62 39Q54 52 62 66m-16-20-8 6 8 6" stroke-width="3.5" /><circle cx="75" cy="47" r="3.2" fill="#343530" stroke="none" />
    `),
  },
]);

export const SPECIES_BY_KEY = new Map(SPECIES.map((species) => [species.key, species]));

export function createAnimal(species, x, y, birthOrigin = null) {
  return {
    species,
    x,
    y,
    phase: Math.random() * Math.PI * 2,
    pulse: null,
    birth: birthOrigin
      ? {
        ...birthOrigin,
        offsetX: (birthOrigin.toX ?? x) - birthOrigin.fromX,
        offsetY: (birthOrigin.toY ?? y) - birthOrigin.fromY,
        elapsedMs: 0,
        progress: 0,
        started: false,
        complete: false,
      }
      : null,
  };
}

export async function loadAnimalSprites() {
  const entries = await Promise.all(
    SPECIES.map(async (species) => {
      const image = new Image();
      image.decoding = "async";
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(species.svg)}`;
      await image.decode();
      return [species.key, image];
    }),
  );

  return new Map(entries);
}

export function getAnimalCenter(animal, elapsedMs) {
  // Rendering and clicking share the current, collision-adjusted position.
  return { x: animal.x, y: animal.y };
}

export function getAnimalScale(animal, elapsedMs) {
  // Reproduction changes position only; every animal keeps its normal size.
  return 1;
}

export function updateAnimalAnimations(animals, dt) {
  for (const animal of animals) {
    if (animal.birth && !animal.birth.complete) {
      const birth = animal.birth;
      birth.elapsedMs += dt * 1000;
      if (!birth.started) {
        // A delayed child follows its parent until its own emergence starts.
        const source = birth.parent ?? { x: birth.fromX, y: birth.fromY };
        animal.x = source.x;
        animal.y = source.y;
        birth.fromX = source.x;
        birth.fromY = source.y;
        const radius = (CONFIG.animalDiameter + CONFIG.animalGap) / 2;
        birth.toX = Math.min(CONFIG.logicalWidth - radius, Math.max(radius, source.x + birth.offsetX));
        birth.toY = Math.min(CONFIG.logicalHeight - CONFIG.safeBottom - radius, Math.max(CONFIG.safeTop + radius, source.y + birth.offsetY));
        if (birth.elapsedMs <= (birth.delayMs ?? 0)) continue;
        birth.started = true;
      }
      const previous = getBirthGuide(birth);
      birth.progress = getBirthProgress(animal);
      const next = getBirthGuide(birth);
      // Apply guide movement as a delta, preserving any displacement from neighbors.
      animal.x += next.x - previous.x;
      animal.y += next.y - previous.y;
      if (birth.progress >= 1) {
        birth.complete = true;
        birth.parent = null;
      }
    }
  }
  resolveAnimalPacking(animals, dt);
}

function getBirthGuide(birth) {
  const travel = getBirthTravelProgress(birth.progress);
  const dx = birth.toX - birth.fromX;
  const dy = birth.toY - birth.fromY;
  const distance = Math.hypot(dx, dy) || 1;
  const arc = (birth.arc ?? 0) * Math.sin(Math.PI * birth.progress) ** 2;
  return {
    x: birth.fromX + dx * travel - (dy / distance) * arc,
    y: birth.fromY + dy * travel + (dx / distance) * arc,
  };
}

function getBirthProgress(animal) {
  const delayMs = animal.birth.delayMs ?? 0;
  const progress = (animal.birth.elapsedMs - delayMs) / CONFIG.childSpreadMs;
  return Math.min(1, Math.max(0, progress));
}

function getBirthTravelProgress(progress) {
  // Start and finish at rest; a lightly damped spring gives a small landing bounce.
  const damping = 6;
  const frequency = 8;
  const springAt = (time) =>
    1 - Math.exp(-damping * time) * (
      Math.cos(frequency * time) + (damping / frequency) * Math.sin(frequency * time)
    );
  const easedTime = progress * progress * (3 - 2 * progress);
  return springAt(easedTime) / springAt(1);
}

export function findAnimalAt(animals, x, y, elapsedMs) {
  const radius = CONFIG.animalDiameter / 2;
  // Match canvas draw order: settled animals are drawn over newborns, so test
  // that foreground layer first and never adopt an obscured animal by mistake.
  for (let pass = 0; pass < 2; pass += 1) {
    for (let index = animals.length - 1; index >= 0; index -= 1) {
      const animal = animals[index];
      const inFlight = animal.birth && !animal.birth.complete;
      if ((pass === 0) === Boolean(inFlight)) continue;

      const center = getAnimalCenter(animal, elapsedMs);
      const hitRadius = radius * getAnimalScale(animal, elapsedMs) + 2;
      const dx = x - center.x;
      const dy = y - center.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) return index;
    }
  }
  return -1;
}
