import { CONFIG } from "./config.js";

const silhouetteStart = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">';
const silhouetteEnd = "</svg>";

const svg = (body) => `${silhouetteStart}${body}${silhouetteEnd}`;

export const SPECIES = Object.freeze([
  {
    key: "cat",
    label: "猫",
    svg: svg('<path d="M20 42 22 12 42 29Q50 26 58 29L78 12 80 43Q87 52 84 66 79 86 50 88 21 86 16 66 13 53 20 42Z" fill="#282A27"/><path d="M25 39 25 21 40 34M75 39 75 21 60 34" fill="none" stroke="#F1EFE8" stroke-width="3" stroke-linecap="round"/><ellipse cx="37" cy="54" rx="3" ry="4" fill="#F1EFE8"/><ellipse cx="63" cy="54" rx="3" ry="4" fill="#F1EFE8"/><path d="M46 65Q50 69 54 65M50 68V73M50 73Q45 78 41 73M50 73Q55 78 59 73" fill="none" stroke="#F1EFE8" stroke-width="2.7" stroke-linecap="round"/>'),
  },
  {
    key: "dog",
    label: "狗",
    svg: svg('<path d="M22 36Q8 25 13 48L19 68Q23 79 34 71L40 67Q50 71 60 67L66 71Q77 79 81 68L87 48Q92 25 78 36L70 42Q61 35 50 35 39 35 30 42Z" fill="#282A27"/><path d="M24 42Q17 38 19 52L23 63Q27 67 33 60M76 42Q83 38 81 52L77 63Q73 67 67 60" fill="#BDBDB4"/><ellipse cx="38" cy="53" rx="3" ry="4" fill="#F1EFE8"/><ellipse cx="62" cy="53" rx="3" ry="4" fill="#F1EFE8"/><ellipse cx="50" cy="66" rx="7" ry="5" fill="#F1EFE8"/><path d="M46 65Q50 62 54 65" fill="none" stroke="#282A27" stroke-width="2"/>'),
  },
  {
    key: "rabbit",
    label: "兔子",
    svg: svg('<path d="M32 44Q23 20 28 8 31 1 37 9L48 39M68 44Q77 20 72 8 69 1 63 9L52 39" fill="#282A27"/><path d="M33 36Q28 15 32 11L45 40M67 36Q72 15 68 11L55 40" fill="none" stroke="#BDBDB4" stroke-width="3" stroke-linecap="round"/><path d="M20 53Q24 34 50 34 76 34 80 53 84 78 64 87L50 91 36 87Q16 78 20 53Z" fill="#282A27"/><ellipse cx="38" cy="57" rx="3" ry="4" fill="#F1EFE8"/><ellipse cx="62" cy="57" rx="3" ry="4" fill="#F1EFE8"/><path d="M47 68Q50 65 53 68L50 72Z" fill="#D6A34F"/><path d="M50 72V77M50 77Q45 81 41 77M50 77Q55 81 59 77" fill="none" stroke="#F1EFE8" stroke-width="2.5" stroke-linecap="round"/>'),
  },
  {
    key: "hamster",
    label: "仓鼠",
    svg: svg('<path d="M24 39Q20 25 32 21 41 19 45 30M76 39Q80 25 68 21 59 19 55 30" fill="#282A27"/><path d="M18 55Q18 34 50 33 82 34 82 55 83 82 59 88L50 90 41 88Q17 82 18 55Z" fill="#282A27"/><path d="M27 65Q31 56 41 60L47 68 43 77Q32 80 27 72ZM73 65Q69 56 59 60L53 68 57 77Q68 80 73 72Z" fill="#BDBDB4"/><circle cx="38" cy="52" r="2.8" fill="#F1EFE8"/><circle cx="62" cy="52" r="2.8" fill="#F1EFE8"/><path d="M47 66Q50 63 53 66 53 71 50 72 47 71 47 66Z" fill="#D6A34F"/><path d="M50 72V76" stroke="#F1EFE8" stroke-width="2.5" stroke-linecap="round"/>'),
  },
  {
    key: "bird",
    label: "鸟",
    svg: svg('<path d="M18 71Q23 38 53 31 69 27 79 38L94 43 80 52Q78 77 54 84 34 90 18 71Z" fill="#282A27"/><path d="M50 33Q49 15 64 10L68 27" fill="#282A27"/><path d="M30 69Q47 48 70 48 59 67 38 77Z" fill="#BDBDB4"/><path d="M78 40 96 44 79 50Z" fill="#D6A34F"/><circle cx="70" cy="39" r="3" fill="#F1EFE8"/><path d="M17 75 5 88 32 82" fill="none" stroke="#282A27" stroke-width="5" stroke-linejoin="round"/>'),
  },
  {
    key: "goldfish",
    label: "金鱼",
    svg: svg('<path d="M31 50Q17 35 8 26 9 44 20 50 9 56 8 74 20 65 31 51Z" fill="#282A27"/><path d="M36 42Q45 27 57 25L56 41Q69 39 79 48L94 50 80 56Q68 65 56 59L57 76Q43 72 36 58Z" fill="#282A27"/><path d="M45 39Q52 34 60 34M45 62Q52 67 60 67" fill="none" stroke="#BDBDB4" stroke-width="3" stroke-linecap="round"/><path d="M76 48Q68 54 76 58" fill="none" stroke="#F1EFE8" stroke-width="2.5"/><circle cx="68" cy="47" r="2.8" fill="#F1EFE8"/><path d="M48 47Q53 50 48 53M39 47Q44 50 39 53" fill="none" stroke="#F1EFE8" stroke-width="2" stroke-linecap="round"/><path d="M35 48Q29 50 35 54" fill="none" stroke="#D6A34F" stroke-width="3"/>'),
  },
]);

export const SPECIES_BY_KEY = new Map(SPECIES.map((species) => [species.key, species]));

export function createAnimal(species, x, y) {
  return {
    species,
    x,
    y,
    phase: Math.random() * Math.PI * 2,
    pulse: 0,
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
  const seconds = elapsedMs / 1000;
  return {
    x: animal.x + Math.sin(seconds * 0.57 + animal.phase) * 1.1,
    y: animal.y + Math.sin(seconds * 1.5 + animal.phase) * 1.9,
  };
}

export function getAnimalScale(animal, elapsedMs) {
  const idle = 1 + Math.sin(elapsedMs / 1000 * 1.5 + animal.phase) * 0.018;
  const compression = Math.sin(animal.pulse * Math.PI) * 0.16;
  return idle * (1 - compression);
}

export function updateAnimalAnimations(animals, dt) {
  for (const animal of animals) {
    animal.pulse = Math.max(0, animal.pulse - dt / 0.54);
  }
}

export function findAnimalAt(animals, x, y, elapsedMs) {
  const radius = CONFIG.animalDiameter / 2;
  for (let index = animals.length - 1; index >= 0; index -= 1) {
    const animal = animals[index];
    const center = getAnimalCenter(animal, elapsedMs);
    const hitRadius = radius * getAnimalScale(animal, elapsedMs) + 2;
    const dx = x - center.x;
    const dy = y - center.y;
    if (dx * dx + dy * dy <= hitRadius * hitRadius) return index;
  }
  return -1;
}
