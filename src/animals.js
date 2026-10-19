import { CONFIG } from "./config.js";
import { resolveAnimalPacking } from "./packing.js";

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;
const outline = (body) => svg(`<g fill="none" stroke="#282A27" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${body}</g>`);
const eyes = (y, spread = 12) => `<g fill="#282A27" stroke="none"><circle cx="${50 - spread}" cy="${y}" r="2.7"/><circle cx="${50 + spread}" cy="${y}" r="2.7"/></g>`;
const littleMuzzle = (y) => `<path d="M46 ${y}Q50 ${y - 4} 54 ${y}Q53 ${y + 4} 50 ${y + 5}Q47 ${y + 4} 46 ${y}Z" fill="#282A27" stroke="none"/><path d="M50 ${y + 5}V${y + 9}M50 ${y + 9}Q45 ${y + 14} 41 ${y + 9}M50 ${y + 9}Q55 ${y + 14} 59 ${y + 9}" stroke-width="3.4"/>`;

// Rounded, original monoline faces inspired by the user's reference sheet.
// The circle, colour palette and Canvas sprite-loading mechanism stay shared.
export const SPECIES = Object.freeze([
  {
    key: "cat",
    label: "猫",
    svg: outline(`
      <path d="M25 35Q20 24 23 15Q33 13 41 25Q50 22 59 25Q67 13 77 15Q80 24 75 35C84 44 86 56 80 69C75 81 63 86 50 86C37 86 25 81 20 69C14 56 16 44 25 35Z" fill="#F1EFE8"/>
      <path d="M28 24 34 29M72 24 66 29M25 58 14 56M25 66 14 68M75 58 86 56M75 66 86 68" stroke-width="3.5"/>
      ${eyes(49)}${littleMuzzle(59)}
    `),
  },
  {
    key: "dog",
    label: "狗",
    svg: outline(`
      <path d="M31 27C21 19 10 28 13 43L18 57Q23 64 29 55M69 27C79 19 90 28 87 43L82 57Q77 64 71 55" fill="#F1EFE8"/>
      <path d="M28 32Q32 20 50 20Q68 20 72 32L77 55C79 75 66 87 50 87C34 87 21 75 23 55Z" fill="#F1EFE8"/>
      ${eyes(48)}
      <ellipse cx="50" cy="66" rx="14" ry="12" stroke-width="3.5"/>
      <path d="M45 59Q50 55 55 59Q55 65 50 65Q45 65 45 59Z" fill="#282A27" stroke="none"/>
      <path d="M50 65V73M50 70Q45 75 41 70M50 70Q55 75 59 70" stroke-width="3.3"/>
    `),
  },
  {
    key: "rabbit",
    label: "兔子",
    svg: outline(`
      <path d="M33 42C25 26 25 9 32 8C40 7 45 24 44 40M56 40C55 24 60 7 68 8C75 9 75 26 67 42" fill="#F1EFE8"/>
      <path d="M33 20Q33 27 37 35M67 20Q67 27 63 35" stroke-width="3.3"/>
      <ellipse cx="50" cy="63" rx="29" ry="24" fill="#F1EFE8"/>
      ${eyes(56, 11)}${littleMuzzle(66)}
      <path d="M24 65 13 62M24 72 13 74M76 65 87 62M76 72 87 74" stroke-width="3.3"/>
    `),
  },
  {
    key: "hamster",
    label: "仓鼠",
    svg: outline(`
      <circle cx="29" cy="28" r="8.5" fill="#F1EFE8"/><circle cx="71" cy="28" r="8.5" fill="#F1EFE8"/>
      <path d="M25 43C25 30 36 23 50 23C64 23 75 30 75 43C86 46 91 57 86 68C82 80 66 87 50 87C34 87 18 80 14 68C9 57 14 46 25 43Z" fill="#F1EFE8"/>
      ${eyes(47, 11)}
      <path d="M29 57C19 54 17 68 29 73M71 57C81 54 83 68 71 73" stroke-width="3.2"/>
      <path d="M46 56Q50 52 54 56Q52 60 50 61Q48 60 46 56Z" fill="#282A27" stroke="none"/>
      <path d="M50 61V64M50 64Q46 68 42 64M50 64Q54 68 58 64" stroke-width="3.2"/>
      <path d="M47 67V72Q50 74 53 72V67M50 68V73" stroke-width="2.7"/>
    `),
  },
  {
    key: "bird",
    label: "鹦鹉",
    svg: outline(`
      <path d="M31 69C19 60 18 41 28 28C38 16 55 15 68 23C78 30 81 41 77 52L71 69C62 83 43 86 31 69Z" fill="#F1EFE8"/>
      <path d="M49 25C36 25 29 36 31 49C34 62 47 68 61 61" stroke-width="3.2"/>
      <circle cx="51" cy="39" r="7.2" stroke-width="3"/>
      <circle cx="51" cy="39" r="2.8" fill="#282A27" stroke="none"/>
      <path d="M65 42C74 32 88 38 88 49C88 59 81 68 75 69C81 59 76 53 66 54Z" fill="#F1EFE8"/>
      <path d="M66 55Q73 61 73 69Q63 69 59 61" fill="#F1EFE8" stroke-width="3.5"/>
      <path d="M34 75Q34 83 28 88L49 85Q61 84 69 76" fill="#F1EFE8" stroke-width="4"/>
    `),
  },
  {
    key: "goldfish",
    label: "金鱼",
    svg: outline(`
      <path d="M30 46C18 31 9 34 13 48Q17 54 13 60C9 75 18 78 30 62Z" fill="#F1EFE8"/>
      <path d="M48 32Q46 18 57 20L68 33M48 77Q46 89 57 87L68 76" fill="#F1EFE8"/>
      <path d="M27 54C27 39 41 29 58 30C75 31 85 41 86 54C85 69 74 79 58 79C41 80 27 70 27 54Z" fill="#F1EFE8"/>
      <circle cx="69" cy="48" r="3.1" fill="#282A27" stroke="none"/>
      <path d="M79 61Q76 65 72 62M58 44Q51 54 58 64M44 48Q34 54 44 60" stroke-width="3.3"/>
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
